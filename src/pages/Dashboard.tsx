import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, TrendingDown, ClipboardList, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/dashboard/KPICard";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { DistributionChart } from "@/components/dashboard/DistributionChart";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData, SeriesData } from "@/types/betting";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import { ApostasStats } from "@/components/apostas/ApostasStats";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([]);
  const [lastApostas, setLastApostas] = useState<any[]>([]);
  const [casaStats, setCasaStats] = useState<Record<string, any>>({});
  const [tipoStats, setTipoStats] = useState<Record<string, any>>({});
  const [casaCounts, setCasaCounts] = useState<{ name: string; value: number }[]>([]);
  const [tipoCounts, setTipoCounts] = useState<{ name: string; value: number }[]>([]);
  const [topCasaByLucro, setTopCasaByLucro] = useState<{ name: string; value: number }[]>([]);
  const [topTipoByLucro, setTopTipoByLucro] = useState<{ name: string; value: number }[]>([]);
  const [casaMetrics, setCasaMetrics] = useState<{ name: string; value: number }[]>([]);
  const [tipoMetrics, setTipoMetrics] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo } = useFilterStore();
  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpisData, seriesData, apostas] = await Promise.all([
        apostasService.kpis({ startDate, endDate, casa, tipo }),
        apostasService.series({ startDate, endDate, casa, tipo }),
        apostasService.list({ startDate, endDate, casa, tipo, limit: 100 }),
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

      // keep last 5 apostas for "Geral" quick view
      setLastApostas((apostas.data || []).slice(0, 5));

      // compute casa aggregation
      const byCasa = (apostas.data || []).reduce((acc, a) => {
        const key = a.casa_de_apostas || "Desconhecida";
        acc[key] = acc[key] || { total: 0, ganhos: 0, perdas: 0, pendentes: 0 };
        acc[key].total += 1;
        if (a.resultado === "Ganhou") acc[key].ganhos += 1;
        else if (a.resultado === "Perdeu") acc[key].perdas += 1;
        else if (!a.resultado || a.resultado === "Pendente") acc[key].pendentes += 1;
        return acc;
      }, {} as Record<string, any>);
      setCasaStats(byCasa);

      // counts array for charts
      const casaCountsArr = Object.entries(byCasa).map(([name, v]) => ({ name, value: v.total }));
      setCasaCounts(casaCountsArr.sort((a, b) => b.value - a.value));

      // compute lucro by casa
      const lucroByCasa = (apostas.data || []).reduce((acc, a) => {
        const key = a.casa_de_apostas || "Desconhecida";
        acc[key] = acc[key] || 0;
        acc[key] += a.valor_final || 0;
        return acc;
      }, {} as Record<string, number>);
      const topCasa = Object.entries(lucroByCasa).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
      setTopCasaByLucro(topCasa);

      // compute win-rate and ROI per casa
      const metricsCasa = Object.entries(byCasa).map(([name, v]) => {
        const ganhar = v.ganhos || 0;
        const total = v.total || 1;
        const taxa = (ganhar / total) * 100;
        // ROI approx: lucro / total apostado (we don't have total apostado per casa here easily) -> use lucroByCasa / total
        const roi = (lucroByCasa[name] || 0) / (total || 1);
        return { name, value: taxa };
      }).sort((a,b) => b.value - a.value).slice(0,5);
      setCasaMetrics(metricsCasa);

      // compute tipo aggregation
      const byTipo = (apostas.data || []).reduce((acc, a) => {
        const key = a.tipo_aposta || "Desconhecido";
        acc[key] = acc[key] || { total: 0, ganhos: 0, perdas: 0, pendentes: 0 };
        acc[key].total += 1;
        if (a.resultado === "Ganhou") acc[key].ganhos += 1;
        else if (a.resultado === "Perdeu") acc[key].perdas += 1;
        else if (!a.resultado || a.resultado === "Pendente") acc[key].pendentes += 1;
        return acc;
      }, {} as Record<string, any>);
      setTipoStats(byTipo);

      const tipoCountsArr = Object.entries(byTipo).map(([name, v]) => ({ name, value: v.total }));
      setTipoCounts(tipoCountsArr.sort((a, b) => b.value - a.value));

      const lucroByTipo = (apostas.data || []).reduce((acc, a) => {
        const key = a.tipo_aposta || "Desconhecido";
        acc[key] = acc[key] || 0;
        acc[key] += a.valor_final || 0;
        return acc;
      }, {} as Record<string, number>);
      const topTipo = Object.entries(lucroByTipo).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
      setTopTipoByLucro(topTipo);

      const metricsTipo = Object.entries(byTipo).map(([name, v]) => {
        const ganhar = v.ganhos || 0;
        const total = v.total || 1;
        const taxa = (ganhar / total) * 100;
        return { name, value: taxa };
      }).sort((a,b) => b.value - a.value).slice(0,5);
      setTipoMetrics(metricsTipo);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu desempenho</p>
        </div>
      </motion.div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="casa">Por Casa</TabsTrigger>
          <TabsTrigger value="tipo">Por Tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          <div className="grid gap-4 md:grid-cols-2">
            <LucroChart data={series} isLoading={isLoading} />
            <DistributionChart data={distribution} isLoading={isLoading} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-effect">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Últimas 5 Apostas</h3>
                <ApostasTable data={lastApostas} isLoading={isLoading} />
              </CardContent>
            </Card>

            <Card className="glass-effect col-span-2">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Estatísticas Gerenciais</h3>
                <ApostasStats apostas={lastApostas} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="casa">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <CountBarChart data={casaCounts} title="Apostas por Casa" isLoading={isLoading} />
            </div>

            <div className="space-y-4">
              <TopItemsList items={topCasaByLucro} title="Top Casas por Lucro" />
              <Card className="glass-effect">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">Resumo</h3>
                  <ul className="text-sm space-y-1">
                    {(Object.entries(casaStats) as [string, any][]).map(([name, v]) => (
                      <li key={name} className="flex justify-between">
                        <span className="truncate max-w-[70%]">{name}</span>
                        <span className="text-muted-foreground">{v.total} apostas</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tipo">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <CountBarChart data={tipoCounts} title="Apostas por Tipo" isLoading={isLoading} />
            </div>

            <div className="space-y-4">
              <TopItemsList items={topTipoByLucro} title="Top Tipos por Lucro" />
              <Card className="glass-effect">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">Resumo</h3>
                  <ul className="text-sm space-y-1">
                    {(Object.entries(tipoStats) as [string, any][]).map(([name, v]) => (
                      <li key={name} className="flex justify-between">
                        <span className="truncate max-w-[70%]">{name}</span>
                        <span className="text-muted-foreground">{v.total} apostas</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="text-sm space-y-1">
                    {(Object.entries(tipoStats) as [string, any][]).map(([name, v]) => (
                      <li key={name} className="flex justify-between">
                        <span className="truncate max-w-[70%]">{name}</span>
                        <span className="text-muted-foreground">{v.total} apostas</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
