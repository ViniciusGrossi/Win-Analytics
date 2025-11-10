import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import type { Aposta } from "@/types/betting";

export default function Apostas() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo, resultado } = useFilterStore();

  useEffect(() => {
    loadApostas();
  }, [startDate, endDate, casa, tipo, resultado]);

  const loadApostas = async () => {
    setIsLoading(true);
    try {
      const { data } = await apostasService.list({ startDate, endDate, casa, tipo, resultado });
      setApostas(data);
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByStatus = (status?: string) => {
    if (!status) return apostas;
    return apostas.filter((a) => a.resultado === status);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Apostas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas apostas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="todas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="todas">Todas ({apostas.length})</TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({filterByStatus("Pendente").length})
          </TabsTrigger>
          <TabsTrigger value="ganhos">
            Ganhos ({filterByStatus("Ganhou").length})
          </TabsTrigger>
          <TabsTrigger value="perdidos">
            Perdidos ({filterByStatus("Perdeu").length})
          </TabsTrigger>
          <TabsTrigger value="canceladas">
            Canceladas ({filterByStatus("Cancelado").length})
          </TabsTrigger>
          <TabsTrigger value="cashout">
            Cashout ({filterByStatus("Cashout").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <ApostasTable data={apostas} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="pendentes">
          <ApostasTable data={filterByStatus("Pendente")} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="ganhos">
          <ApostasTable data={filterByStatus("Ganhou")} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="perdidos">
          <ApostasTable data={filterByStatus("Perdeu")} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="canceladas">
          <ApostasTable data={filterByStatus("Cancelado")} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="cashout">
          <ApostasTable data={filterByStatus("Cashout")} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
