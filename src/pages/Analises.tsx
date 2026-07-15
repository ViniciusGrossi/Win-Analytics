import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApostasList } from "@/hooks/useApostasQuery";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useFilterStore } from "@/store/useFilterStore";
import { AnalysisFilters } from "@/components/apostas/AnalysisFilters";
import {
  useDashboardMetrics,
  usePerformanceMetrics,
  useRiskMetrics,
  useOddsMetrics,
  useTemporalMetrics,
  usePatternsMetrics,
  useExposureMetrics,
  useEVMetrics,
  useAdvancedRiskMetrics
} from "@/hooks/useAnalysisMetrics";
import { useTurboMetrics } from "@/hooks/useTurboMetrics";
import { InfoTooltip } from "@/components/analysis/InfoTooltip";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpDown,
  Shield,
  Zap,
  Trophy,
  Medal,
  Sparkles
} from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);



import { useChartData } from "@/hooks/useChartData";
import { DashboardTab } from "@/components/analysis/tabs/DashboardTab";
import { PerformanceTab } from "@/components/analysis/tabs/PerformanceTab";
import { CasasTab } from "@/components/analysis/tabs/CasasTab";
import { CategoriasTab } from "@/components/analysis/tabs/CategoriasTab";
import { OddsTab } from "@/components/analysis/tabs/OddsTab";
import { RiscoTab } from "@/components/analysis/tabs/RiscoTab";
import { TemporalTab } from "@/components/analysis/tabs/TemporalTab";
import { PadroesTab } from "@/components/analysis/tabs/PadroesTab";
import { TurboTab } from "@/components/analysis/tabs/TurboTab";
import { MonteCarloTab } from "@/components/analysis/tabs/MonteCarloTab";
import { PatternCorrelationTab } from "@/components/analysis/tabs/PatternCorrelationTab";
import { CHART_COLORS } from "@/lib/constants";

export default function Analises() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    startDate,
    endDate,
    casa,
    tipo,
    resultado,
    mercado,
    oddMin,
    oddMax,
    setStartDate,
    setEndDate,
    setCasa,
    setResultado,
    setMercado,
    setOddMin,
    setOddMax,
    resetFilters
  } = useFilterStore();

  const params = useMemo(() => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    casa: casa && casa !== "Todas" ? casa : undefined,
    tipo: tipo || undefined,
  }), [startDate, endDate, casa, tipo]);

  const listQuery = useApostasList(params);
  const allApostas = listQuery.data ?? [];
  const isLoading = listQuery.isLoading;
  const isFetching = listQuery.isFetching;
  const refetch = () => listQuery.refetch();

  // Filtered apuestas memoized to avoid recalculation on tab switches
  const filteredApostas = useMemo(() => {
    let result = allApostas;

    if (resultado && resultado !== "Todos") {
      result = result.filter(a => a.resultado === resultado);
    }

    if (mercado && mercado !== "Todos") {
      result = result.filter(a =>
        a.detalhes?.toLowerCase().includes(mercado.toLowerCase())
      );
    }

    if (oddMin) {
      const min = parseFloat(oddMin);
      if (!isNaN(min)) result = result.filter(a => (a.odd || 0) >= min);
    }

    if (oddMax) {
      const max = parseFloat(oddMax);
      if (!isNaN(max)) result = result.filter(a => (a.odd || 0) <= max);
    }

    return result;
  }, [allApostas, resultado, mercado, oddMin, oddMax]);

  // Hooks de métricas - Now using memoized filtered apuestas
  const dashboardMetrics = useDashboardMetrics(filteredApostas);
  const performanceMetrics = usePerformanceMetrics(filteredApostas);
  const riskMetrics = useRiskMetrics(filteredApostas);
  const oddsMetrics = useOddsMetrics(filteredApostas);
  const temporalMetrics = useTemporalMetrics(filteredApostas);
  const patternsMetrics = usePatternsMetrics(filteredApostas);
  const exposureMetrics = useExposureMetrics(filteredApostas);
  const evMetrics = useEVMetrics(filteredApostas);
  const advancedRisk = useAdvancedRiskMetrics(filteredApostas);
  const turboMetrics = useTurboMetrics(filteredApostas);

  // Dados para gráficos
  const chartData = useChartData(filteredApostas);

  // Extrair valores únicos para filtros - Memoized
  const casasDisponiveis = useMemo(() => 
    Array.from(new Set(allApostas.map(a => a.casa_de_apostas).filter(Boolean) as string[])).sort()
  , [allApostas]);

  const mercadosDisponiveis = useMemo(() => 
    Array.from(
      new Set(
        allApostas
          .map(a => a.detalhes)
          .filter(Boolean)
          .flatMap(d => d!.split(',').map(m => m.trim()))
      )
    ).sort()
  , [allApostas]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análise de Performance</h2>
          <p className="text-muted-foreground">
            Acompanhe suas métricas e evolução detalhada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <AnalysisFilters
        startDate={startDate}
        endDate={endDate}
        casa={casa}
        resultado={resultado}
        mercado={mercado}
        oddMin={oddMin}
        oddMax={oddMax}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onCasaChange={setCasa}
        onResultadoChange={setResultado}
        onMercadoChange={setMercado}
        onOddMinChange={setOddMin}
        onOddMaxChange={setOddMax}
        onClearFilters={resetFilters}
        casasDisponiveis={casasDisponiveis}
        mercadosDisponiveis={mercadosDisponiveis}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto gap-2 bg-muted/50 p-2">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="casas" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">Casas</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden md:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="odds" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden md:inline">Odds</span>
          </TabsTrigger>
          <TabsTrigger value="risco" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Risco</span>
          </TabsTrigger>
          <TabsTrigger value="temporal" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Temporal</span>
          </TabsTrigger>
          <TabsTrigger value="padroes" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Padrões</span>
          </TabsTrigger>
          <TabsTrigger value="turbo" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden md:inline">Turbo</span>
          </TabsTrigger>
          <TabsTrigger value="montecarlo" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Gestão de Risco</span>
          </TabsTrigger>
          <TabsTrigger value="correlacao" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">Padrões Ocultos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardTab
            metrics={dashboardMetrics}
            equityCurveData={chartData.equityCurveData}
            lucroMensalData={chartData.lucroMensalData}
            valoresApostadosData={chartData.valoresApostadosData}
            tipoApostaData={chartData.tipoApostaData}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab
            performanceMetrics={performanceMetrics}
            exposureMetrics={exposureMetrics}
          />
        </TabsContent>

        <TabsContent value="casas" className="space-y-6">
          <CasasTab performancePorCasaData={chartData.performancePorCasaData} />
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6">
          <CategoriasTab
            categoriaData={chartData.categoriaData}
            CHART_COLORS={CHART_COLORS}
          />
        </TabsContent>

        <TabsContent value="odds" className="space-y-6">
          <OddsTab
            oddsMetrics={oddsMetrics}
            oddsRangeData={chartData.oddsRangeData}
            CHART_COLORS={CHART_COLORS}
          />
        </TabsContent>

        <TabsContent value="risco" className="space-y-6">
          <RiscoTab
            riskMetrics={riskMetrics}
            advancedRisk={advancedRisk}
            CHART_COLORS={CHART_COLORS}
          />
        </TabsContent>

        <TabsContent value="temporal" className="space-y-6">
          <TemporalTab
            temporalMetrics={temporalMetrics}
            performanceDiaSemanaData={chartData.performanceDiaSemanaData}
            lucroMensalData={chartData.lucroMensalData}
            CHART_COLORS={CHART_COLORS}
          />
        </TabsContent>

        <TabsContent value="padroes" className="space-y-6">
          <PadroesTab patternsMetrics={patternsMetrics} />
        </TabsContent>

        <TabsContent value="turbo" className="space-y-6">
          <TurboTab turboMetrics={turboMetrics} />
        </TabsContent>

        <TabsContent value="montecarlo" className="space-y-6">
          <MonteCarloTab apostas={filteredApostas} />
        </TabsContent>

        <TabsContent value="correlacao" className="space-y-6">
          <PatternCorrelationTab apostas={filteredApostas} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
