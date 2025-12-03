import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { ResultadoCard } from "@/components/resultados/ResultadoCard";
import { ResultadosKPIs } from "@/components/resultados/ResultadosKPIs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Aposta, ResultadoType } from "@/types/betting";
import { toast } from "@/hooks/use-toast";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Resultados() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCasa, setFilterCasa] = useState<string>("todas");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"data" | "valor" | "odd">("data");

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
      toast({ title: "Erro", description: "Erro ao carregar apostas", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const apostasPendentes = useMemo(() => {
    let filtered = apostas.filter((aposta) => aposta.resultado === "Pendente");

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.partida?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.detalhes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.torneio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por casa
    if (filterCasa !== "todas") {
      filtered = filtered.filter((a) => a.casa_de_apostas === filterCasa);
    }

    // Filtro por tipo
    if (filterTipo !== "todos") {
      filtered = filtered.filter((a) => a.tipo_aposta === filterTipo);
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === "data") {
        return new Date(b.data || "").getTime() - new Date(a.data || "").getTime();
      } else if (sortBy === "valor") {
        return (b.valor_apostado || 0) - (a.valor_apostado || 0);
      } else {
        return (b.odd || 0) - (a.odd || 0);
      }
    });

    return filtered;
  }, [apostas, searchTerm, filterCasa, filterTipo, sortBy]);

  const casasDisponiveis = useMemo(() => {
    const casas = new Set(apostas.map((a) => a.casa_de_apostas).filter(Boolean));
    return Array.from(casas) as string[];
  }, [apostas]);

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set(apostas.map((a) => a.tipo_aposta).filter(Boolean));
    return Array.from(tipos) as string[];
  }, [apostas]);

  const hasFilters = searchTerm || filterCasa !== "todas" || filterTipo !== "todos";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCasa("todas");
    setFilterTipo("todos");
  };

  const handleSetResult = async (id: number, resultado: ResultadoType, cashoutValue?: number) => {
    try {
      const aposta = apostas.find((a) => a.id === id);
      if (!aposta) throw new Error("Aposta não encontrada");

      await apostasService.setResult(id, resultado, aposta, cashoutValue);
      
      toast({ title: "Sucesso", description: `Resultado marcado como ${resultado}` });
      await loadApostas();
    } catch (error) {
      console.error("Erro ao definir resultado:", error);
      toast({ title: "Erro", description: "Erro ao definir resultado", variant: "destructive" });
    }
  };

  // Estatísticas rápidas das apostas pendentes
  // Estatísticas rápidas das apostas pendentes
  const pendenteStats = useMemo(() => {
    const total = apostasPendentes.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    
    // Cálculo correto: turbo aplicado sobre o lucro
    const retornoPotencial = apostasPendentes.reduce((sum, a) => {
      const retornoBase = (a.valor_apostado || 0) * (a.odd || 1);
      const bonus = a.bonus || 0;
      const turbo = a.turbo || 0; // Turbo já calculado corretamente
      return sum + retornoBase + bonus + turbo;
    }, 0);
    
    const oddMedia = apostasPendentes.length > 0
      ? apostasPendentes.reduce((sum, a) => sum + (a.odd || 0), 0) / apostasPendentes.length
      : 0;

    return { total, retornoPotencial, oddMedia, quantidade: apostasPendentes.length };
  }, [apostasPendentes]);

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Resultados</h1>
          <p className="text-muted-foreground mt-1">Confirme os resultados das apostas pendentes</p>
        </div>
      </motion.div>

      <ResultadosKPIs apostas={apostas} isLoading={isLoading} />

      {/* Quick Stats Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 glass-effect">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Apostas Pendentes</p>
              <p className="text-2xl font-bold text-primary">{pendenteStats.quantidade}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Apostado</p>
              <p className="text-2xl font-bold">{formatCurrency(pendenteStats.total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Retorno Potencial</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(pendenteStats.retornoPotencial)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Odd Média</p>
              <p className="text-2xl font-bold text-primary">{pendenteStats.oddMedia.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filtros e Busca */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filtros e Busca</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar partida, torneio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCasa} onValueChange={setFilterCasa}>
              <SelectTrigger>
                <SelectValue placeholder="Casa de apostas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as casas</SelectItem>
                {casasDisponiveis.map((casa) => (
                  <SelectItem key={casa} value={casa}>
                    {casa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de aposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposDisponiveis.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data">Data (mais recente)</SelectItem>
                <SelectItem value="valor">Valor (maior)</SelectItem>
                <SelectItem value="odd">Odd (maior)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {apostasPendentes.length} {apostasPendentes.length === 1 ? "aposta encontrada" : "apostas encontradas"}
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Lista de Apostas Pendentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {apostasPendentes.length === 0 ? "Nenhuma aposta pendente" : "Apostas Pendentes"}
          </h2>
          {apostasPendentes.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Mostrando {apostasPendentes.length} {apostasPendentes.length === 1 ? "aposta" : "apostas"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : apostasPendentes.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {apostasPendentes.map((aposta, index) => (
              <motion.div
                key={aposta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ResultadoCard
                  aposta={aposta}
                  onSetResult={handleSetResult}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center glass-effect">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-1">Nenhuma aposta pendente</p>
                <p className="text-sm text-muted-foreground">
                  {hasFilters 
                    ? "Tente ajustar os filtros de busca"
                    : "Todas as apostas foram resolvidas ou não há apostas cadastradas"}
                </p>
              </div>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-2">
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
