import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { apostasService } from "@/services/apostas";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import { CreateApostaDialog } from "@/components/apostas/CreateApostaDialog";
import { ApostasFilters } from "@/components/apostas/ApostasFilters";
import { ApostasStats } from "@/components/apostas/ApostasStats";
import type { Aposta, ResultadoType } from "@/types/betting";

export default function Apostas() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ResultadoType | "Todos">("Todos");
  const [selectedCasa, setSelectedCasa] = useState<string>("Todas");

  useEffect(() => {
    loadApostas();
  }, []);

  const loadApostas = async () => {
    setIsLoading(true);
    try {
      const { data } = await apostasService.list({});
      setApostas(data);
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const casasDisponiveis = useMemo(() => {
    const casas = new Set(apostas.map((a) => a.casa_de_apostas).filter(Boolean));
    return Array.from(casas) as string[];
  }, [apostas]);

  const apostasFiltradas = useMemo(() => {
    return apostas.filter((aposta) => {
      const matchStatus = selectedStatus === "Todos" || aposta.resultado === selectedStatus;
      const matchCasa = selectedCasa === "Todas" || aposta.casa_de_apostas === selectedCasa;
      return matchStatus && matchCasa;
    });
  }, [apostas, selectedStatus, selectedCasa]);

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col sm:flex-row gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Apostas</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gerencie todas as suas apostas</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={loadApostas} size="default" variant="outline" className="gap-2 flex-1 sm:flex-initial">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button onClick={() => setDialogOpen(true)} size="default" className="gap-2 flex-1 sm:flex-initial">
            <Plus className="h-4 w-4" />
            Nova Aposta
          </Button>
        </div>
      </motion.div>

      <ApostasStats apostas={apostas} />

      <div className="space-y-4">
        <ApostasFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedCasa={selectedCasa}
          onCasaChange={setSelectedCasa}
          casasDisponiveis={casasDisponiveis}
        />

  <ApostasTable data={apostasFiltradas} isLoading={isLoading} onReload={loadApostas} />
      </div>

      <CreateApostaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadApostas}
      />
    </div>
  );
}
