import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, TrendingDown, ClipboardList, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/dashboard/KPICard";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { DistributionChart } from "@/components/dashboard/DistributionChart";
import { useApostasKpis, useApostasSeries, useApostasList } from "@/hooks/useApostasQuery";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { startDate, endDate, casa, tipo, setStartDate, setEndDate, resetFilters } = useFilterStore();
  const params = { startDate, endDate, casa, tipo };

  const kpisQuery = useApostasKpis(params);
  const seriesQuery = useApostasSeries(params);
  const listQuery = useApostasList(params);

  const isLoading = kpisQuery.isLoading || seriesQuery.isLoading || listQuery.isLoading;
  const kpis = kpisQuery.data ?? null;
  const series = seriesQuery.data ?? [];

  const distribution = useMemo(() => {
    const statusCount = (listQuery.data || []).reduce((acc, aposta) => {
      const status = aposta.resultado || "Pendente";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [listQuery.data]);

  const formatDateSafely = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : format(date, "PPP", { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col sm:flex-row gap-4 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 backdrop-glass border border-white/10 rounded-full mb-3 text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] glow-border">
            <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
            Performance Real-time
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-light tracking-tight text-white">
            Relatório <span className="text-gold-gradient font-medium">Executivo</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-light border-l border-gold-500/30 pl-3">Visão geral do seu capital e exposição em mercados esportivos</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start", !startDate && "text-muted-foreground")}
                >
                  {formatDateSafely(startDate) || "Data inicial"}
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
                  {formatDateSafely(endDate) || "Data final"}
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
