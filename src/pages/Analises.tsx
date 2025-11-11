import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { SeriesData } from "@/types/betting";

export default function Analises() {
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [byCasa, setByCasa] = useState<{ name: string; lucro: number }[]>([]);
  const [byTipo, setByTipo] = useState<{ name: string; lucro: number }[]>([]);
  const [oddSeries, setOddSeries] = useState<{ date: string; odd: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo } = useFilterStore();

  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [seriesData, apostas] = await Promise.all([
        apostasService.series({ startDate, endDate, casa, tipo }),
        apostasService.list({ startDate, endDate, casa, tipo }),
      ]);

      setSeries(seriesData);

      // Lucro por casa
      const casaStats = apostas.data.reduce((acc, a) => {
        if (!a.casa_de_apostas) return acc;
        if (!acc[a.casa_de_apostas]) acc[a.casa_de_apostas] = 0;
        acc[a.casa_de_apostas] += a.valor_final || 0;
        return acc;
      }, {} as Record<string, number>);

      setByCasa(
        Object.entries(casaStats)
          .map(([name, lucro]) => ({ name, lucro }))
          .sort((a, b) => b.lucro - a.lucro)
      );

      // Lucro por tipo
      const tipoStats = apostas.data.reduce((acc, a) => {
        if (!a.tipo_aposta) return acc;
        if (!acc[a.tipo_aposta]) acc[a.tipo_aposta] = 0;
        acc[a.tipo_aposta] += a.valor_final || 0;
        return acc;
      }, {} as Record<string, number>);

      setByTipo(
        Object.entries(tipoStats)
          .map(([name, lucro]) => ({ name, lucro }))
          .sort((a, b) => b.lucro - a.lucro)
      );

      // Média de odds por período
      const oddsByDate = apostas.data.reduce((acc, a) => {
        if (!a.data || !a.odd) return acc;
        const date = a.data.toString();
        if (!acc[date]) acc[date] = { total: 0, count: 0 };
        acc[date].total += a.odd;
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      setOddSeries(
        Object.entries(oddsByDate)
          .map(([date, stats]) => ({
            date: date.substring(0, 10),
            odd: stats.total / stats.count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    } catch (error) {
      console.error("Erro ao carregar análises:", error);
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
          <h1 className="text-4xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground mt-1">Insights e estatísticas detalhadas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="roi" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roi">ROI & Lucro</TabsTrigger>
          <TabsTrigger value="casa">Por Casa</TabsTrigger>
          <TabsTrigger value="tipo">Por Tipo</TabsTrigger>
          <TabsTrigger value="odds">Análise de Odds</TabsTrigger>
        </TabsList>

        <TabsContent value="roi">
          <LucroChart data={series} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="casa">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <Card className="p-6 glass-effect">
              <h3 className="text-lg font-semibold mb-4">Lucro por Casa de Apostas</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={byCasa}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="lucro" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tipo">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <Card className="p-6 glass-effect">
              <h3 className="text-lg font-semibold mb-4">Lucro por Tipo de Aposta</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={byTipo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="lucro" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="odds">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <Card className="p-6 glass-effect">
              <h3 className="text-lg font-semibold mb-4">Evolução da Odd Média</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={oddSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <Line
                    type="monotone"
                    dataKey="odd"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
