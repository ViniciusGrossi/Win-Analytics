import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { ResultadoCard } from "@/components/resultados/ResultadoCard";
import type { Aposta, ResultadoType } from "@/types/betting";
import { toast } from "sonner";
import { ApostasTable } from "@/components/apostas/ApostasTable";

export default function Resultados() {
  const [pendentes, setPendentes] = useState<Aposta[]>([]);
  const [historico, setHistorico] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendentesData, historicoData] = await Promise.all([
        apostasService.list({ resultado: "Pendente" }),
        apostasService.list({}),
      ]);
      
      setPendentes(pendentesData.data);
      setHistorico(
        historicoData.data.filter((a) =>
          ["Ganhou", "Perdeu", "Cancelado", "Cashout"].includes(a.resultado || "")
        )
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar apostas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetResult = async (id: number, resultado: ResultadoType, cashoutValue?: number) => {
    try {
      const aposta = [...pendentes, ...historico].find((a) => a.id === id);
      if (!aposta) throw new Error("Aposta não encontrada");

      await apostasService.setResult(id, resultado, aposta, cashoutValue);
      
      toast.success(`Resultado marcado como ${resultado}`);
      await loadData();
    } catch (error) {
      console.error("Erro ao definir resultado:", error);
      toast.error("Erro ao definir resultado");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Resultados</h1>
          <p className="text-muted-foreground mt-1">Registre os resultados das apostas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="pendentes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : pendentes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendentes.map((aposta) => (
                <ResultadoCard
                  key={aposta.id}
                  aposta={aposta}
                  onSetResult={handleSetResult}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma aposta pendente
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <ApostasTable data={historico} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
