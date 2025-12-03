import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, TrendingDown, ClipboardList, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/dashboard/KPICard";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { DistributionChart } from "@/components/dashboard/DistributionChart";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData, SeriesData } from "@/types/betting";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo, setStartDate, setEndDate, resetFilters } = useFilterStore();

  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpisData, seriesData, apostas] = await Promise.all([
        apostasService.kpis({ startDate, endDate, casa, tipo }),
        apostasService.series({ startDate, endDate, casa, tipo }),
        apostasService.list({ startDate, endDate, casa, tipo }),
      ]);
      
      setKpis(kpisData);
      setSeries(seriesData);

      const statusCount = apostas.data.reduce((acc, aposta) => {
        const status = aposta.resultado || "Pendente";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setDistribution(
        Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col sm:flex-row gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu desempenho</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start", !startDate && "text-muted-foreground")}
                >
                  {startDate ? format(new Date(startDate), "PPP", { locale: ptBR }) : "Data inicial"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(d) => d && setStartDate(format(d, "yyyy-MM-dd"))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start", !endDate && "text-muted-foreground")}
                >
                  {endDate ? format(new Date(endDate), "PPP", { locale: ptBR }) : "Data final"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(d) => d && setEndDate(format(d, "yyyy-MM-dd"))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="ghost" onClick={resetFilters}>Limpar</Button>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total Apostado"
              value={kpis ? formatCurrency(kpis.totalApostado) : "-"}
              icon={DollarSign}
              isLoading={isLoading}
              delay={0}
            />
            <KPICard
              title="Lucro"
              value={kpis ? formatCurrency(kpis.lucro) : "-"}
              icon={kpis && kpis.lucro >= 0 ? TrendingUp : TrendingDown}
              isLoading={isLoading}
              delay={0.1}
            />
            <KPICard
              title="ROI"
              value={kpis ? formatPercentage(kpis.roi) : "-"}
              icon={Target}
              isLoading={isLoading}
              delay={0.2}
            />
            <KPICard
              title="Taxa de Acerto"
              value={kpis ? formatPercentage(kpis.taxaAcerto) : "-"}
              icon={Target}
              isLoading={isLoading}
              delay={0.3}
            />
            <KPICard
              title="Total Apostas"
              value={kpis ? kpis.totalApostas : "-"}
              icon={ClipboardList}
              isLoading={isLoading}
              delay={0.4}
            />
            <KPICard
              title="Pendentes"
              value={kpis ? kpis.apostasPendentes : "-"}
              icon={Clock}
              isLoading={isLoading}
              delay={0.5}
            />
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <LucroChart data={series} isLoading={isLoading} />
            <DistributionChart data={distribution} isLoading={isLoading} />
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
