import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, 
  Line, LineChart, ComposedChart, Legend, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area, AreaChart, ReferenceLine, PieChart, Pie, Cell
} from "recharts";
import { ScatterChart, Scatter } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { Aposta, SeriesData } from "@/types/betting";
import dayjs from "dayjs";
import { AlertCircle, TrendingUp, TrendingDown, Target, Activity, Zap, Trophy, BarChart3, Flame, Calendar, Shield, ArrowUp, ArrowDown, Activity as ActivityIcon, Gauge } from "lucide-react";

// Tipos de dados personalizados
interface PerformanceMetrics {
  casa: string;
  roi: number;
  lucro: number;
  taxaAcerto: number;
  apostas: number;
  volatility?: number;
}

interface OddAnalysis {
  range: string;
  won: number;
  lost: number;
  roi: number;
  probability: number;
}

interface MonthlyPerformance {
  month: string;
  roi: number;
  volume: number;
  apostas: number;
  variacao: number;
  lucro: number;
}

interface TimePatterns {
  day: string;
  period: string;
  lucro: number;
  apostas: number;
}

interface RiskMetrics {
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  profitFactor: number;
  winStreakCurrent: number;
  winStreakBest: number;
  lossStreakCurrent: number;
}

export default function Analises() {
  // Estados
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dados por aba - Dashboard
  const [dashboardSeries, setDashboardSeries] = useState<SeriesData[]>([]);
  const [dashboardKpis, setDashboardKpis] = useState<any>({});
  
  // Dados por aba - Casas
  const [byCasa, setByCasa] = useState<{ name: string; lucro: number; apostas: number }[]>([]);
  const [byTipo, setByTipo] = useState<{ name: string; lucro: number }[]>([]);
  const [performanceByHouse, setPerformanceByHouse] = useState<PerformanceMetrics[]>([]);
  const [casasMonthly, setCasasMonthly] = useState<any[]>([]);
  
  // Dados por aba - Categorias
  const [byCategoria, setByCategoria] = useState<{ name: string; lucro: number; apostas: number }[]>([]);
  const [categoriaKpis, setCategoriaKpis] = useState<any>({});
  
  // Dados por aba - Odds
  const [oddAnalysis, setOddAnalysis] = useState<OddAnalysis[]>([]);
  const [oddSeries, setOddSeries] = useState<{ date: string; odd: number }[]>([]);
  const [oddDistribution, setOddDistribution] = useState<any[]>([]);
  
  // Dados por aba - Padrões
  const [timePatterns, setTimePatterns] = useState<TimePatterns[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<any[]>([]);
  
  // Dados por aba - Risco
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0,
    profitFactor: 0,
    winStreakCurrent: 0,
    winStreakBest: 0,
    lossStreakCurrent: 0,
  });
  const [drawdownSeries, setDrawdownSeries] = useState<any[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  
  const { startDate, endDate, casa, tipo } = useFilterStore();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Helper: small numeric utilities
  const sum = (arr: number[]) => arr.reduce((s, v) => s + (v || 0), 0);
  const mean = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

  // KPIs per tab (return array of 4 KPIs)
  const kpisForActiveTab = useMemo(() => {
    // Dashboard KPIs
    if (activeTab === "dashboard") {
      const totalApostado = apostas.reduce((s, a) => s + (a.valor_apostado || 0), 0);
      const resolvidas = apostas.filter((a) => a.resultado && ["Ganhou", "Perdeu", "Cancelado", "Cashout"].includes(a.resultado));
      const lucro = resolvidas.reduce((s, a) => s + (a.valor_final || 0), 0);
      const roi = totalApostado > 0 ? (lucro / totalApostado) * 100 : 0;
      const taxaAcerto = resolvidas.length ? (resolvidas.filter((r) => r.resultado === "Ganhou").length / resolvidas.length) * 100 : 0;
      return [
        { title: "Total Apostado", value: formatCurrency(totalApostado), icon: Activity },
        { title: "Lucro Líquido", value: formatCurrency(lucro), icon: TrendingUp, subtitle: `${resolvidas.filter(r => r.resultado === 'Ganhou').length} ganhas` },
        { title: "ROI", value: formatPercentage(roi), icon: Target },
        { title: "Taxa de Acerto", value: formatPercentage(taxaAcerto), icon: Trophy },
      ];
    }

    // Performance (Casas)
    if (activeTab === "performance") {
      const rois = performanceByHouse.map((h) => h.roi);
      const avgRoi = mean(rois);
      const topRoi = performanceByHouse[0]?.roi || 0;
      const totalApostas = sum(performanceByHouse.map((h) => h.apostas));
      return [
        { title: "Top ROI Casa", value: formatPercentage(topRoi), icon: Trophy },
        { title: "ROI Médio", value: formatPercentage(avgRoi), icon: TrendingUp },
        { title: "Volume (apostas)", value: totalApostas, icon: ActivityIcon },
        { title: "Casas Analisadas", value: performanceByHouse.length, icon: BarChart3 },
      ];
    }

    // Categorias
    if (activeTab === "categorias") {
      const totalApostas = sum(byCategoria.map((c) => c.apostas));
      const totalLucro = sum(byCategoria.map((c) => c.lucro));
      const topCat = byCategoria[0]?.name || "-";
      const roi = totalApostas > 0 ? (totalLucro / totalApostas) * 100 : 0;
      return [
        { title: "Categorias (>=10)", value: byCategoria.length, icon: Flame },
        { title: "Volume (apostas)", value: totalApostas, icon: Activity },
        { title: "Lucro Total", value: formatCurrency(totalLucro), icon: TrendingUp },
        { title: "Top Categoria", value: topCat, icon: BarChart3 },
      ];
    }

    // Odds
    if (activeTab === "odds") {
      const avgOdd = mean(oddSeries.map((o) => o.odd));
      const bestRange = oddAnalysis.sort((a,b)=>b.roi-a.roi)[0];
      return [
        { title: "Odd Média", value: avgOdd ? avgOdd.toFixed(2) : "-", icon: BarChart3 },
        { title: "Melhor Faixa (ROI)", value: bestRange ? formatPercentage(bestRange.roi) : "-", icon: Target },
        { title: "Ganhas (melhor faixa)", value: bestRange ? bestRange.won : 0, icon: Trophy },
        { title: "Faixas Analisadas", value: oddAnalysis.length, icon: Activity },
      ];
    }

    // Risco
    if (activeTab === "risco") {
      // simple approximations based on series
      const returns = series.map((s) => s.lucro || 0);
      const avg = mean(returns);
      const std = Math.sqrt(mean(returns.map(r => Math.pow(r - avg, 2))));
      const sharpe = std > 0 ? (avg / std) * Math.sqrt(Math.max(1, returns.length)) : 0;
      // drawdown
      let peak = 0, cum = 0, maxDD = 0;
      returns.forEach((r) => { cum += r; peak = Math.max(peak, cum); maxDD = Math.min(maxDD, cum - peak); });
      const maxDrawdown = Math.abs(maxDD);
      return [
        { title: "Sharpe (approx)", value: sharpe ? sharpe.toFixed(2) : "-", icon: Gauge },
        { title: "Max Drawdown", value: formatCurrency(maxDrawdown), icon: Shield },
        { title: "Volatilidade", value: formatCurrency(std), icon: TrendingDown },
        { title: "Retorno Médio", value: formatCurrency(avg), icon: TrendingUp },
      ];
    }

    return [];
  }, [activeTab, apostas, performanceByHouse, byCategoria, oddSeries, oddAnalysis, series]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await apostasService.list({ startDate, endDate, casa, tipo });
      setApostas(result.data);

      // Series temporal
      const seriesData = await apostasService.series({ startDate, endDate, casa, tipo });
      setSeries(seriesData);

      // Processar dados
      processarDados(result.data);
    } catch (error) {
      console.error("Erro ao carregar análises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processarDados = (dados: Aposta[]) => {
    // ===== LUCRO POR CASA =====
    const casaStats: Record<string, { lucro: number; apostas: number; valor_apostado: number; odd_total: number; ganhas: number }> = {};
    dados.forEach((a) => {
      if (!a.casa_de_apostas) return;
      if (!casaStats[a.casa_de_apostas]) {
        casaStats[a.casa_de_apostas] = { lucro: 0, apostas: 0, valor_apostado: 0, odd_total: 0, ganhas: 0 };
      }
      casaStats[a.casa_de_apostas].lucro += a.valor_final || 0;
      casaStats[a.casa_de_apostas].apostas += 1;
      casaStats[a.casa_de_apostas].valor_apostado += a.valor_apostado || 0;
      casaStats[a.casa_de_apostas].odd_total += a.odd || 0;
      if (a.resultado === "Ganhou") casaStats[a.casa_de_apostas].ganhas += 1;
    });

    const casasFormatted = Object.entries(casaStats)
      .map(([name, stats]) => ({
        name,
        lucro: stats.lucro,
        apostas: stats.apostas,
      }))
      .sort((a, b) => b.lucro - a.lucro);
    setByCasa(casasFormatted);

    // ===== PERFORMANCE POR CASA (ROI, Taxa Acerto) =====
    const performance: PerformanceMetrics[] = Object.entries(casaStats).map(([casa, stats]) => ({
      casa,
      roi: stats.valor_apostado > 0 ? (stats.lucro / stats.valor_apostado) * 100 : 0,
      lucro: stats.lucro,
      taxaAcerto: stats.apostas > 0 ? (stats.ganhas / stats.apostas) * 100 : 0,
      apostas: stats.apostas,
    }));
    setPerformanceByHouse(performance.sort((a, b) => b.roi - a.roi));

    // ===== LUCRO POR TIPO =====
    const tipoStats: Record<string, number> = {};
    dados.forEach((a) => {
      if (!a.tipo_aposta) return;
      if (!tipoStats[a.tipo_aposta]) tipoStats[a.tipo_aposta] = 0;
      tipoStats[a.tipo_aposta] += a.valor_final || 0;
    });
    const tiposFormatted = Object.entries(tipoStats)
      .map(([name, lucro]) => ({ name, lucro }))
      .sort((a, b) => b.lucro - a.lucro);
    setByTipo(tiposFormatted);

    // ===== LUCRO POR CATEGORIA =====
    const categoriaStats: Record<string, { lucro: number; apostas: number }> = {};
    dados.forEach((a) => {
      if (!a.categoria) return;
      if (!categoriaStats[a.categoria]) categoriaStats[a.categoria] = { lucro: 0, apostas: 0 };
      categoriaStats[a.categoria].lucro += a.valor_final || 0;
      categoriaStats[a.categoria].apostas += 1;
    });
    const categoriasFormatted = Object.entries(categoriaStats)
      .map(([name, stats]) => ({ name, lucro: stats.lucro, apostas: stats.apostas }))
      .sort((a, b) => b.lucro - a.lucro);

    // Filtrar apenas categorias com pelo menos 10 aparições
    const categoriasFiltradas = categoriasFormatted.filter((c) => c.apostas >= 10);
    setByCategoria(categoriasFiltradas);

    // ===== ANÁLISE DE ODDS =====
    const oddRanges: Record<string, { won: number; lost: number; roi_sum: number; prob_sum: number; count: number }> = {
      "1.0-1.5": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "1.5-2.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "2.0-3.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "3.0-5.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "5.0+": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
    };

    dados.forEach((a) => {
      const odd = a.odd || 0;
      const resolvida = ["Ganhou", "Perdeu"].includes(a.resultado || "");
      let range = "5.0+";
      
      if (odd >= 1.0 && odd < 1.5) range = "1.0-1.5";
      else if (odd >= 1.5 && odd < 2.0) range = "1.5-2.0";
      else if (odd >= 2.0 && odd < 3.0) range = "2.0-3.0";
      else if (odd >= 3.0 && odd < 5.0) range = "3.0-5.0";

      if (resolvida) {
        if (a.resultado === "Ganhou") oddRanges[range].won += 1;
        else oddRanges[range].lost += 1;
        
        const roi = (a.valor_final || 0) / (a.valor_apostado || 1);
        oddRanges[range].roi_sum += roi;
        oddRanges[range].prob_sum += 1 / odd;
        oddRanges[range].count += 1;
      }
    });

    const oddAnalysisFormatted = Object.entries(oddRanges)
      .map(([range, stats]) => ({
        range,
        won: stats.won,
        lost: stats.lost,
        roi: stats.count > 0 ? (stats.roi_sum / stats.count) * 100 : 0,
        probability: stats.count > 0 ? (stats.prob_sum / stats.count) * 100 : 0,
      }));
    setOddAnalysis(oddAnalysisFormatted);

    // ===== MÉDIA DE ODDS =====
    const oddsByDate: Record<string, { total: number; count: number }> = {};
    dados.forEach((a) => {
      if (!a.data || !a.odd) return;
      const date = dayjs(a.data).format("YYYY-MM-DD");
      if (!oddsByDate[date]) oddsByDate[date] = { total: 0, count: 0 };
      oddsByDate[date].total += a.odd;
      oddsByDate[date].count += 1;
    });
    const oddSeriesFormatted = Object.entries(oddsByDate)
      .map(([date, stats]) => ({
        date: dayjs(date).format("DD/MM"),
        odd: stats.total / stats.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setOddSeries(oddSeriesFormatted);

    // ===== PERFORMANCE MENSAL =====
    const monthlyStats: Record<string, { lucro: number; apostas: number; valor_apostado: number }> = {};
    dados.forEach((a) => {
      if (!a.data) return;
      const month = dayjs(a.data).format("YYYY-MM");
      if (!monthlyStats[month]) monthlyStats[month] = { lucro: 0, apostas: 0, valor_apostado: 0 };
      monthlyStats[month].lucro += a.valor_final || 0;
      monthlyStats[month].apostas += 1;
      monthlyStats[month].valor_apostado += a.valor_apostado || 0;
    });

    const months = Object.keys(monthlyStats).sort();
    const monthlyFormatted = months.map((month, idx) => {
      const stats = monthlyStats[month];
      const prevMonth = idx > 0 ? monthlyStats[months[idx - 1]] : null;
      const roi = stats.valor_apostado > 0 ? (stats.lucro / stats.valor_apostado) * 100 : 0;
      const prevRoi = prevMonth && prevMonth.valor_apostado > 0 ? (prevMonth.lucro / prevMonth.valor_apostado) * 100 : 0;
      const variacao = prevRoi !== 0 ? ((roi - prevRoi) / Math.abs(prevRoi)) * 100 : 0;

      return {
        month: dayjs(month).format("MMM/YY"),
        roi,
        volume: stats.apostas,
        apostas: stats.apostas,
        variacao,
      };
    });
    setMonthlyPerformance(monthlyFormatted);

    // ===== PADRÕES TEMPORAIS =====
    const timePatternMap: Record<string, { lucro: number; apostas: number }> = {};
    const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
    const periods = ["Madrugada", "Manhã", "Tarde", "Noite"];

    daysOfWeek.forEach((day) => {
      periods.forEach((period) => {
        timePatternMap[`${day}-${period}`] = { lucro: 0, apostas: 0 };
      });
    });

    dados.forEach((a) => {
      if (!a.data) return;
      const date = dayjs(a.data);
      const dayIdx = date.day() === 0 ? 6 : date.day() - 1;
      const hour = date.hour();
      let period = "Madrugada";
      if (hour >= 6 && hour < 12) period = "Manhã";
      else if (hour >= 12 && hour < 18) period = "Tarde";
      else if (hour >= 18 && hour < 24) period = "Noite";

      const key = `${daysOfWeek[dayIdx]}-${period}`;
      if (timePatternMap[key]) {
        timePatternMap[key].lucro += a.valor_final || 0;
        timePatternMap[key].apostas += 1;
      }
    });

    const timePatternFormatted = Object.entries(timePatternMap)
      .map(([key, stats]) => {
        const [day, period] = key.split("-");
        return {
          day: day || "",
          period: period || "",
          lucro: stats.lucro,
          apostas: stats.apostas,
        };
      })
      .filter((x) => x.apostas > 0);
    setTimePatterns(timePatternFormatted);

    // ===== RISK METRICS & DRAWDOWN =====
    // Build time-ordered cumulative series (by date)
    const resolved = dados
      .filter((a) => a.data)
      .sort((a, b) => (a.data || "").localeCompare(b.data || ""));

    let cumulative = 0;
    const cumSeries: { date: string; lucro: number; accumulated: number }[] = [];
    resolved.forEach((a) => {
      const profit = a.valor_final || 0;
      cumulative += profit;
      cumSeries.push({ date: dayjs(a.data).format("YYYY-MM-DD"), lucro: profit, accumulated: cumulative });
    });

    // Drawdown series (absolute) based on cumulative
    let peak = -Infinity;
    const ddSeries = cumSeries.map((p) => {
      peak = Math.max(peak, p.accumulated);
      const drawdown = peak - p.accumulated;
      return { date: p.date, drawdown };
    });
    setDrawdownSeries(ddSeries);

    // Simple risk metrics: sharpe (approx), volatility (std of daily profit), profit factor, streaks
    const profits = cumSeries.map((s) => s.lucro);
    const mean = profits.length ? profits.reduce((s, v) => s + v, 0) / profits.length : 0;
    const variance = profits.length ? profits.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / profits.length : 0;
    const volatility = Math.sqrt(variance);
    const sharpe = volatility > 0 ? (mean / volatility) * Math.sqrt(Math.max(1, profits.length)) : 0;
    const wins = profits.filter((p) => p > 0).reduce((s, v) => s + v, 0);
    const losses = Math.abs(profits.filter((p) => p < 0).reduce((s, v) => s + v, 0));
    const profitFactor = losses > 0 ? wins / losses : wins > 0 ? Infinity : 0;

    // streaks
    let winStreak = 0;
    let bestWin = 0;
    let lossStreak = 0;
    profits.forEach((p) => {
      if (p > 0) {
        winStreak += 1;
        lossStreak = 0;
      } else if (p < 0) {
        lossStreak += 1;
        winStreak = 0;
      } else {
        winStreak = 0;
        lossStreak = 0;
      }
      bestWin = Math.max(bestWin, winStreak);
    });

    setRiskMetrics((r) => ({
      ...r,
      maxDrawdown: Math.max(...ddSeries.map((d) => d.drawdown), 0),
      sharpeRatio: sharpe,
      volatility,
      profitFactor,
      winStreakCurrent: winStreak,
      winStreakBest: bestWin,
      lossStreakCurrent: lossStreak,
    }));

    // Volatility by casa for risk-return scatter
    const casaVolatility: Record<string, number[]> = {};
    dados.forEach((a) => {
      if (!a.casa_de_apostas) return;
      if (!casaVolatility[a.casa_de_apostas]) casaVolatility[a.casa_de_apostas] = [];
      casaVolatility[a.casa_de_apostas].push(a.valor_final || 0);
    });

    const performanceWithVol = performance.map((p) => {
      const vals = casaVolatility[p.casa] || [];
      const m = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      const vVar = vals.length ? vals.reduce((s, v) => s + Math.pow(v - m, 2), 0) / vals.length : 0;
      const vol = Math.sqrt(vVar);
      return { ...p, volatility: vol };
    });
    setPerformanceByHouse(performanceWithVol.sort((a, b) => b.roi - a.roi));
  };

  const handleLoadingState = (skeleton: boolean) => {
    if (skeleton) return <Skeleton className="h-[400px] rounded-lg" />;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Análises Completas</h1>
          <p className="text-muted-foreground mt-1">Dashboard com insights e estatísticas detalhadas</p>
        </div>
      </motion.div>

      {/* Executive Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Resumo Executivo
            </CardTitle>
            <CardDescription>6 insights principais da sua performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {executiveInsights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Alert className={`border-l-4 ${
                    insight.type === "success" ? "border-l-green-500 bg-green-50/50" :
                    insight.type === "error" ? "border-l-red-500 bg-red-50/50" :
                    "border-l-yellow-500 bg-yellow-50/50"
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{insight.text}</AlertDescription>
                  </Alert>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpisForActiveTab.slice(0, 4).map((k, idx) => (
          <div key={k.title}>
            <KPICard
              title={k.title}
              value={k.value}
              icon={k.icon || Activity}
              subtitle={k.subtitle}
              isLoading={isLoading}
              delay={0.15 + idx * 0.05}
            />
          </div>
        ))}
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="dashboard" onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <TabsList className="flex gap-2 overflow-x-auto pb-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 px-3 py-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2 px-3 py-2 text-sm">
            <ActivityIcon className="h-4 w-4 text-accent" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="casas" className="flex items-center gap-2 px-3 py-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Casas</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2 px-3 py-2 text-sm">
            <Flame className="h-4 w-4 text-rose-500" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="odds" className="flex items-center gap-2 px-3 py-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Odds</span>
          </TabsTrigger>
          <TabsTrigger value="risco" className="flex items-center gap-2 px-3 py-2 text-sm">
            <Shield className="h-4 w-4 text-destructive" />
            <span>Risco</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: DASHBOARD ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Evolução Lucro */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <LucroChart data={series} isLoading={isLoading} />
          </motion.div>

          {/* Grid: Lucro por Casa e Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lucro por Casa */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {isLoading ? (
                <Skeleton className="h-[400px] rounded-lg" />
              ) : (
                <Card className="p-6">
                  <CardTitle className="mb-4">Lucro por Casa de Apostas</CardTitle>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={byCasa} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="lucro" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </motion.div>

            {/* Lucro por Tipo */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              {isLoading ? (
                <Skeleton className="h-[400px] rounded-lg" />
              ) : (
                <Card className="p-6">
                  <CardTitle className="mb-4">Lucro por Tipo de Aposta</CardTitle>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={byTipo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="lucro" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Distribuição por Casa (donut) - Dashboard */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Distribuição por Casa (Donut)</CardTitle>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <defs />
                    <Pie data={byCasa} dataKey="lucro" nameKey="name" innerRadius={80} outerRadius={140} paddingAngle={4}>
                      {byCasa.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ===== TAB: PERFORMANCE ===== */}
        <TabsContent value="performance" className="space-y-6">
          {/* Cards de Performance por Casa */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-[200px] rounded-lg" />
                <Skeleton className="h-[200px] rounded-lg" />
                <Skeleton className="h-[200px] rounded-lg" />
              </>
            ) : (
              performanceByHouse.slice(0, 6).map((perf, idx) => {
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "•";
                return (
                  <motion.div
                    key={perf.casa}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                  >
                    <Card className={`border-l-4 ${perf.roi > 0 ? "border-l-green-500" : "border-l-red-500"}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{medal} {perf.casa}</CardTitle>
                          <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${perf.roi > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {formatPercentage(perf.roi)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lucro:</span>
                            <span className="font-semibold">{formatCurrency(perf.lucro)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa Acerto:</span>
                            <span className="font-semibold">{formatPercentage(perf.taxaAcerto)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Apostas:</span>
                            <span className="font-semibold">{perf.apostas}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Lucro Médio por Tipo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Lucro Médio por Tipo de Aposta</CardTitle>
                <ResponsiveContainer width="100%" height={350}>
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
                    <Bar dataKey="lucro" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ===== TAB: CASAS ===== */}
        <TabsContent value="casas" className="space-y-6">
          {/* Ranking com Medalhas */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <CardTitle className="mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Ranking de Casas de Apostas
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-[400px] rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {performanceByHouse.map((casa, idx) => (
                    <motion.div
                      key={casa.casa}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl font-bold w-8">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{casa.casa}</p>
                          <p className="text-xs text-muted-foreground">{casa.apostas} apostas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${casa.roi > 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercentage(casa.roi)}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(casa.lucro)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Radar Chart Comparativo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Comparativo de Casas (Top 5)</CardTitle>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={performanceByHouse.slice(0, 5).map((c) => ({
                    name: c.casa,
                    ROI: Math.max(0, Math.min(100, c.roi + 50)),
                    "Taxa Acerto": c.taxaAcerto,
                    Volume: Math.min(100, (c.apostas / Math.max(...performanceByHouse.map(x => x.apostas))) * 100),
                  }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                    <Radar name="ROI" dataKey="ROI" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                    <Radar name="Taxa Acerto" dataKey="Taxa Acerto" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.25} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ===== TAB: CATEGORIAS ===== */}
        <TabsContent value="categorias" className="space-y-6">
          {/* Lucro por Categoria */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Lucro por Categoria</CardTitle>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={byCategoria} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="lucro" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>

          {/* Tabela de Categorias */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isLoading ? (
              <Skeleton className="h-[300px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Detalhe de Categorias</CardTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                        <th className="text-right py-3 px-4 font-semibold">Apostas</th>
                        <th className="text-right py-3 px-4 font-semibold">Lucro</th>
                        <th className="text-right py-3 px-4 font-semibold">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCategoria.map((cat) => {
                        const roiCalc = apostas
                          .filter((a) => a.categoria === cat.name)
                          .reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
                        const roi = roiCalc > 0 ? (cat.lucro / roiCalc) * 100 : 0;
                        return (
                          <tr key={cat.name} className="border-b border-border/50 hover:bg-accent transition-colors">
                            <td className="py-3 px-4">{cat.name}</td>
                            <td className="text-right py-3 px-4">{cat.apostas}</td>
                            <td className={`text-right py-3 px-4 font-semibold ${cat.lucro > 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(cat.lucro)}
                            </td>
                            <td className="text-right py-3 px-4">{formatPercentage(roi)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ===== TAB: ANÁLISE DE ODDS ===== */}
        <TabsContent value="odds" className="space-y-6">
          {/* Cards de Faixas de Odd */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-[150px] rounded-lg" />
                <Skeleton className="h-[150px] rounded-lg" />
                <Skeleton className="h-[150px] rounded-lg" />
                <Skeleton className="h-[150px] rounded-lg" />
                <Skeleton className="h-[150px] rounded-lg" />
              </>
            ) : (
              oddAnalysis.map((analysis) => (
                <motion.div
                  key={analysis.range}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{analysis.range}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>✅ Ganhas:</span>
                        <span className="font-semibold">{analysis.won}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>❌ Perdidas:</span>
                        <span className="font-semibold">{analysis.lost}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ROI:</span>
                        <span className={`font-semibold ${analysis.roi > 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercentage(analysis.roi)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Prob:</span>
                        <span className="font-semibold">{analysis.probability.toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Distribuição de Odds */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">ROI por Faixa de Odd</CardTitle>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={oddAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatPercentage(value)}
                    />
                    <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>

          {/* Evolução da Odd Média (moved to Odds tab) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {isLoading ? (
              <Skeleton className="h-[320px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Evolução da Odd Média</CardTitle>
                <ResponsiveContainer width="100%" height={300}>
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
          </motion.div>
        </TabsContent>

        {/* ===== TAB: RISCO ===== */}
        <TabsContent value="risco" className="space-y-6">
          {/* Performance Mensal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Performance Mensal</CardTitle>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => typeof value === "number" ? formatPercentage(value) : value}
                    />
                    <Bar yAxisId="left" dataKey="roi" fill="hsl(var(--primary))" name="ROI %" radius={[8, 8, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="volume" stroke="hsl(var(--success))" name="Volume Apostas" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>

              {/* Drawdown ao longo do tempo */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {isLoading ? (
                  <Skeleton className="h-[300px] rounded-lg" />
                ) : (
                  <Card className="p-6">
                    <CardTitle className="mb-4">Drawdown ao Longo do Tempo</CardTitle>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={drawdownSeries}>
                        <defs>
                          <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" fill="url(#ddGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </motion.div>

              {/* Scatter Risk x Return por Casa */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                {isLoading ? (
                  <Skeleton className="h-[300px] rounded-lg" />
                ) : (
                  <Card className="p-6">
                    <CardTitle className="mb-4">Risk x Return (por Casa)</CardTitle>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="volatility" name="Volatility" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="roi" name="ROI %" stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                        />
                        <Scatter name="Casas" data={performanceByHouse.map(p => ({ volatility: p.volatility || 0, roi: p.roi, casa: p.casa }))} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </motion.div>

              {/* Padrões Temporais */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <Card className="p-6">
                <CardTitle className="mb-4">Padrões Temporais (Dia × Período)</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timePatterns.slice(0, 8).map((pattern, idx) => (
                    <motion.div
                      key={`${pattern.day}-${pattern.period}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <p className="font-semibold text-sm">{pattern.day} - {pattern.period}</p>
                      <p className={`text-lg font-bold mt-2 ${pattern.lucro > 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(pattern.lucro)}
                      </p>
                      <p className="text-xs text-muted-foreground">{pattern.apostas} apostas</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
