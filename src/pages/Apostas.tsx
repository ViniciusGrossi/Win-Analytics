import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, ScanLine } from "lucide-react";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import { CreateApostaDialog } from "@/components/apostas/CreateApostaDialog";
import { ApostasFilters } from "@/components/apostas/ApostasFilters";
import { ApostasStats } from "@/components/apostas/ApostasStats";
import { ImportarAposta } from "@/components/apostas/ImportarAposta";
import type { ResultadoType } from "@/types/betting";
import { startOfDay, endOfDay, subDays, isWithinInterval, parseISO } from "date-fns";
import { useApostasList, useInvalidateApostas } from "@/hooks/useApostasQuery";

export default function Apostas() {
  const { data: apostas = [], isLoading, isFetching, refetch } = useApostasList({});
  const invalidateApostas = useInvalidateApostas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"apostas" | "importar">("apostas");
  const [sharedImage, setSharedImage] = useState<File | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ResultadoType | "Todos">("Todos");
  const [selectedCasa, setSelectedCasa] = useState<string>("Todas");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [selectedTorneio, setSelectedTorneio] = useState<string>("Todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    handleShareTarget();
  }, []);

  // Detecta imagem compartilhada via PWA share target
  const handleShareTarget = async () => {
    if (location.pathname !== "/importar") return;
    try {
      // Share target via POST: a imagem chega como form data na URL
      // O service worker intercepta e redireciona para cá com ?shared=1
      const params = new URLSearchParams(location.search);
      if (params.get("shared") === "1") {
        const cache = await caches.open("share-target");
        const response = await cache.match("/shared-image");
        if (response) {
          const blob = await response.blob();
          const file = new File([blob], "shared-image.jpg", { type: blob.type || "image/jpeg" });
          setSharedImage(file);
          await cache.delete("/shared-image");
        }
        setActiveTab("importar");
      } else {
        setActiveTab("importar");
      }
    } catch {
      setActiveTab("importar");
    }
  };

  const casasDisponiveis = useMemo(() => {
    const casas = new Set(apostas.map((a) => a.casa_de_apostas).filter(Boolean));
    return Array.from(casas) as string[];
  }, [apostas]);

  const categoriesAvailable = useMemo(() => {
    const categories = new Set<string>();
    apostas.forEach((a) => {
      if (a.categoria) {
        // Split por vírgula caso tenha múltiplas categorias
        a.categoria.split(',').forEach(cat => {
          categories.add(cat.trim());
        });
      }
    });
    return Array.from(categories).sort();
  }, [apostas]);

  const torneiosAvailable = useMemo(() => {
    const torneios = new Set(apostas.map((a) => a.torneio).filter(Boolean));
    return Array.from(torneios).sort() as string[];
  }, [apostas]);

  const getDateRangeForPeriod = (period: string): { from?: Date; to?: Date } => {
    const now = new Date();
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "last7":
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case "last30":
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case "custom":
        return dateRange;
      default:
        return {};
    }
  };

  const apostasFiltradas = useMemo(() => {
    return apostas.filter((aposta) => {
      // Status filter
      const matchStatus = selectedStatus === "Todos" || aposta.resultado === selectedStatus;

      // Casa filter
      const matchCasa = selectedCasa === "Todas" || aposta.casa_de_apostas === selectedCasa;

      // Category filter
      const matchCategory = selectedCategory === "Todas" ||
        (aposta.categoria && aposta.categoria.split(',').map(c => c.trim()).includes(selectedCategory));

      // Torneio filter
      const matchTorneio = selectedTorneio === "Todos" || aposta.torneio === selectedTorneio;

      // Date filter
      let matchDate = true;
      if (selectedPeriod !== "all") {
        const range = getDateRangeForPeriod(selectedPeriod);
        if (range.from && range.to && aposta.data) {
          try {
            const apostaDate = parseISO(aposta.data);
            matchDate = isWithinInterval(apostaDate, { start: range.from, end: range.to });
          } catch (error) {
            matchDate = true; // Se houver erro no parse, não filtra
          }
        } else if (selectedPeriod === "custom" && !range.from && !range.to) {
          matchDate = true; // Se custom mas sem datas, mostra tudo
        }
      }

      return matchStatus && matchCasa && matchCategory && matchTorneio && matchDate;
    });
  }, [apostas, selectedStatus, selectedCasa, selectedPeriod, selectedCategory, selectedTorneio, dateRange]);

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col sm:flex-row gap-4 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 backdrop-glass border border-white/10 rounded-full mb-3 text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] glow-border">
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
            Ledger Management
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-light tracking-tight text-white">
            Histórico de <span className="text-gold-gradient font-medium">Apostas</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-light border-l border-gold-500/30 pl-3">Controle granular de ordens e bilhetes ativos</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={() => refetch()} variant="outline" className="gap-2 h-11 px-6">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 h-11 px-6">
            <Plus className="h-4 w-4" />
            Nova Aposta
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "apostas" | "importar")}>
        <TabsList className="mb-4">
          <TabsTrigger value="apostas" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Apostas
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-2">
            <ScanLine className="h-4 w-4" />
            Importar via IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apostas" className="space-y-4">
          <ApostasStats apostas={apostasFiltradas} />

          <ApostasFilters
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedCasa={selectedCasa}
            onCasaChange={setSelectedCasa}
            casasDisponiveis={casasDisponiveis}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoriesAvailable={categoriesAvailable}
            selectedTorneio={selectedTorneio}
            onTorneioChange={setSelectedTorneio}
            torneiosAvailable={torneiosAvailable}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <ApostasTable data={apostasFiltradas} isLoading={isLoading} onReload={invalidateApostas} />
        </TabsContent>

        <TabsContent value="importar">
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Importar Aposta via IA</h2>
              <p className="text-sm text-muted-foreground">
                Envie o print da aposta — o modelo extrai todos os dados automaticamente.
              </p>
            </div>
            <ImportarAposta
              onSuccess={() => { invalidateApostas(); setActiveTab("apostas"); }}
              sharedImage={sharedImage}
            />
          </div>
        </TabsContent>
      </Tabs>

      <CreateApostaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={invalidateApostas}
      />
    </div>
  );
}
