import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apostasService } from "@/services/apostas";
import type { Aposta, SeriesData } from "@/types/betting";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useFilterStore } from "@/store/useFilterStore";
import { 
  useDashboardMetrics, 
  usePerformanceMetrics, 
  useRiskMetrics,
  useOddsMetrics,
  useTemporalMetrics 
} from "@/hooks/useAnalysisMetrics";
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
  Medal
} from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);

const CHART_COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

export default function Analises() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const { startDate, endDate, casa, tipo, resetFilters } = useFilterStore();

  // Hooks de métricas
  const dashboardMetrics = useDashboardMetrics(apostas);
  const performanceMetrics = usePerformanceMetrics(apostas);
  const riskMetrics = useRiskMetrics(apostas);
  const oddsMetrics = useOddsMetrics(apostas);
  const temporalMetrics = useTemporalMetrics(apostas);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        casa: casa || undefined,
        tipo: tipo || undefined,
      };

      const [apostasData, seriesData] = await Promise.all([
        apostasService.list(params),
        apostasService.series(params),
      ]);

      setApostas(apostasData.data);
      setSeries(seriesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dados para gráficos
  const equityCurveData = (() => {
    const sorted = [...apostas]
      .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
      .sort((a, b) => dayjs(a.data).diff(dayjs(b.data)));
    
    let acumuladoInvestido = 0;
    let acumuladoSaldo = 0;

    return sorted.map(a => {
      acumuladoInvestido += a.valor_apostado || 0;
      acumuladoSaldo += a.valor_final || 0;
      const retorno = acumuladoInvestido > 0 ? (acumuladoSaldo / acumuladoInvestido) * 100 : 0;

      return {
        data: dayjs(a.data).format('DD/MM'),
        retorno,
        saldo: acumuladoSaldo,
        investido: acumuladoInvestido,
      };
    });
  })();

  const lucroMensalData = (() => {
    const porMes = apostas
      .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
      .reduce((acc, a) => {
        const mes = dayjs(a.data).format('MMM/YY');
        if (!acc[mes]) acc[mes] = { investido: 0, lucro: 0 };
        acc[mes].investido += a.valor_apostado || 0;
        acc[mes].lucro += a.valor_final || 0;
        return acc;
      }, {} as Record<string, { investido: number; lucro: number }>);

    return Object.entries(porMes).map(([mes, data]) => ({
      mes,
      lucro: data.lucro,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
    }));
  })();

  const valoresApostadosData = (() => {
    const faixas = [
      { label: '0-50', min: 0, max: 50 },
      { label: '51-100', min: 51, max: 100 },
      { label: '101-200', min: 101, max: 200 },
      { label: '201-500', min: 201, max: 500 },
      { label: '500+', min: 501, max: Infinity },
    ];

    return faixas.map(faixa => ({
      faixa: faixa.label,
      count: apostas.filter(a => 
        (a.valor_apostado || 0) >= faixa.min && (a.valor_apostado || 0) <= faixa.max
      ).length,
    }));
  })();

  const tipoApostaData = (() => {
    const porTipo = apostas
      .filter(a => a.tipo_aposta && a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
      .reduce((acc, a) => {
        const tipo = a.tipo_aposta || 'Outros';
        if (!acc[tipo]) acc[tipo] = { investido: 0, lucro: 0 };
        acc[tipo].investido += a.valor_apostado || 0;
        acc[tipo].lucro += a.valor_final || 0;
        return acc;
      }, {} as Record<string, { investido: number; lucro: number }>);

    return Object.entries(porTipo).map(([tipo, data]) => ({
      name: tipo,
      value: data.lucro,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
    }));
  })();

  const performancePorCasaData = (() => {
    const porCasa = apostas
      .filter(a => a.casa_de_apostas && a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
      .reduce((acc, a) => {
        const casa = a.casa_de_apostas || 'Outros';
        if (!acc[casa]) acc[casa] = { 
          investido: 0, 
          lucro: 0, 
          apostas: 0, 
          vitorias: 0,
          odds: [] as number[] 
        };
        acc[casa].investido += a.valor_apostado || 0;
        acc[casa].lucro += a.valor_final || 0;
        acc[casa].apostas += 1;
        if (a.resultado === 'Ganhou') acc[casa].vitorias += 1;
        if (a.odd) acc[casa].odds.push(a.odd);
        return acc;
      }, {} as Record<string, { investido: number; lucro: number; apostas: number; vitorias: number; odds: number[] }>);

    return Object.entries(porCasa).map(([casa, data]) => ({
      casa,
      lucro: data.lucro,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
      taxaAcerto: data.apostas > 0 ? (data.vitorias / data.apostas) * 100 : 0,
      apostas: data.apostas,
      oddMedia: data.odds.length > 0 ? data.odds.reduce((s, o) => s + o, 0) / data.odds.length : 0,
    })).sort((a, b) => b.roi - a.roi);
  })();

  const categoriaData = (() => {
    const apostasComCategoria = apostas.filter(a => 
      a.categoria && 
      a.resultado && 
      ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado)
    );

    const porCategoria = apostasComCategoria.reduce((acc, a) => {
      const categorias = (a.categoria || '').split(/[,;]/).map(c => c.trim()).filter(Boolean);
      
      categorias.forEach(cat => {
        if (!acc[cat]) acc[cat] = { 
          investido: 0, 
          lucro: 0, 
          apostas: 0, 
          vitorias: 0,
          odds: [] as number[] 
        };
        acc[cat].investido += a.valor_apostado || 0;
        acc[cat].lucro += a.valor_final || 0;
        acc[cat].apostas += 1;
        if (a.resultado === 'Ganhou') acc[cat].vitorias += 1;
        if (a.odd) acc[cat].odds.push(a.odd);
      });

      return acc;
    }, {} as Record<string, { investido: number; lucro: number; apostas: number; vitorias: number; odds: number[] }>);

    return Object.entries(porCategoria)
      .filter(([, data]) => data.apostas >= 3)
      .map(([categoria, data]) => ({
        categoria,
        lucro: data.lucro,
        roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
        taxaAcerto: data.apostas > 0 ? (data.vitorias / data.apostas) * 100 : 0,
        apostas: data.apostas,
        oddMedia: data.odds.length > 0 ? data.odds.reduce((s, o) => s + o, 0) / data.odds.length : 0,
      }))
      .sort((a, b) => b.lucro - a.lucro);
  })();

  const oddsRangeData = (() => {
    const faixas = [
      { label: '1.0-1.5', min: 1.0, max: 1.5 },
      { label: '1.5-2.0', min: 1.5, max: 2.0 },
      { label: '2.0-3.0', min: 2.0, max: 3.0 },
      { label: '3.0+', min: 3.0, max: Infinity },
    ];

    const apostasResolvidas = apostas.filter(a => 
      a.odd &&
      a.resultado && 
      ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado)
    );

    return faixas.map(faixa => {
      const apostasNaFaixa = apostasResolvidas.filter(a => 
        (a.odd || 0) >= faixa.min && (a.odd || 0) < faixa.max
      );

      const investido = apostasNaFaixa.reduce((s, a) => s + (a.valor_apostado || 0), 0);
      const lucro = apostasNaFaixa.reduce((s, a) => s + (a.valor_final || 0), 0);
      const vitorias = apostasNaFaixa.filter(a => a.resultado === 'Ganhou').length;

      return {
        faixa: faixa.label,
        taxaAcerto: apostasNaFaixa.length > 0 ? (vitorias / apostasNaFaixa.length) * 100 : 0,
        roi: investido > 0 ? (lucro / investido) * 100 : 0,
        count: apostasNaFaixa.length,
      };
    });
  })();

  const performanceDiaSemanaData = (() => {
    const porDia = apostas
      .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
      .reduce((acc, a) => {
        const dia = dayjs(a.data).format('dddd');
        if (!acc[dia]) acc[dia] = { lucro: 0, apostas: 0 };
        acc[dia].lucro += a.valor_final || 0;
        acc[dia].apostas += 1;
        return acc;
      }, {} as Record<string, { lucro: number; apostas: number }>);

    const diasOrdem = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

    return diasOrdem.map(dia => ({
      dia: dia.charAt(0).toUpperCase() + dia.slice(1, 3),
      lucro: porDia[dia]?.lucro || 0,
      apostas: porDia[dia]?.apostas || 0,
    }));
  })();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Análises Avançadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Insights profundos sobre suas apostas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            Online
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={resetFilters} variant="ghost" size="sm">
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="casas">Casas</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="odds">Odds</TabsTrigger>
          <TabsTrigger value="risco">Risco</TabsTrigger>
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
          <TabsTrigger value="padroes">Padrões</TabsTrigger>
        </TabsList>

        {/* ABA 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Investido"
              value={formatCurrency(dashboardMetrics.totalInvestido)}
              icon={DollarSign}
              trend={dashboardMetrics.totalInvestidoVariacao}
              description={`${dashboardMetrics.totalInvestidoVariacao > 0 ? '+' : ''}${formatPercentage(dashboardMetrics.totalInvestidoVariacao)} vs período anterior`}
            />
            <KPICard
              title="ROI"
              value={formatPercentage(dashboardMetrics.roi)}
              icon={Percent}
              description={dashboardMetrics.roiStatus}
              variant={dashboardMetrics.roiStatus === 'Excelente' ? 'success' : dashboardMetrics.roiStatus === 'Positivo' ? 'warning' : 'destructive'}
            />
            <KPICard
              title="Lucro/Prejuízo"
              value={formatCurrency(dashboardMetrics.lucroTotal)}
              icon={TrendingUp}
              description={`Maior ganho: ${formatCurrency(dashboardMetrics.maiorGanho.valor)}`}
              variant={dashboardMetrics.lucroTotal > 0 ? 'success' : 'destructive'}
            />
            <KPICard
              title="Taxa de Acerto"
              value={formatPercentage(dashboardMetrics.taxaAcerto)}
              icon={Target}
              description={dashboardMetrics.taxaStatus}
              variant={dashboardMetrics.taxaStatus === 'Excelente' ? 'success' : dashboardMetrics.taxaStatus === 'Bom' ? 'warning' : 'destructive'}
            />
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Evolução do Retorno Acumulado
                  <InfoTooltip 
                    title="Equity Curve"
                    description="Mostra a evolução percentual do seu retorno acumulado ao longo do tempo"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={equityCurveData}>
                    <defs>
                      <linearGradient id="colorRetorno" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatPercentage(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="retorno" 
                      stroke={CHART_COLORS[0]} 
                      fillOpacity={1} 
                      fill="url(#colorRetorno)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução do Lucro Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={lucroMensalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="lucro" fill={CHART_COLORS[0]} name="Lucro (R$)" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke={CHART_COLORS[1]} name="ROI (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Apostas</span>
                  <span className="font-semibold">{dashboardMetrics.totalApostas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apostas/Dia</span>
                  <span className="font-semibold">{dashboardMetrics.apostasPorDia.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias Ativos</span>
                  <span className="font-semibold">{dashboardMetrics.diasAtivos}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Odds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odd Média</span>
                  <span className="font-semibold">{dashboardMetrics.oddMedia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odd Mais Alta</span>
                  <span className="font-semibold">{dashboardMetrics.oddMaisAlta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odd Mais Baixa</span>
                  <span className="font-semibold">{dashboardMetrics.oddMaisBaixa.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Sequências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maior Seq. Vitórias</span>
                  <span className="font-semibold text-green-600">{dashboardMetrics.maiorSequenciaVitorias}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maior Seq. Derrotas</span>
                  <span className="font-semibold text-red-600">{dashboardMetrics.maiorSequenciaDerrotas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sequência Atual</span>
                  <span className={`font-semibold ${dashboardMetrics.sequenciaAtual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardMetrics.sequenciaAtual > 0 ? `+${dashboardMetrics.sequenciaAtual}` : dashboardMetrics.sequenciaAtual}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuições */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Valores Apostados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={valoresApostadosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lucratividade por Tipo de Aposta</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={tipoApostaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tipoApostaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardMetrics.roi >= 5 && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Excelente Performance!</strong> Seu ROI de {formatPercentage(dashboardMetrics.roi)} está acima da média.
                    </AlertDescription>
                  </Alert>
                )}
                {dashboardMetrics.taxaAcerto >= 60 && (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Alta Precisão!</strong> Taxa de acerto de {formatPercentage(dashboardMetrics.taxaAcerto)} é excelente.
                    </AlertDescription>
                  </Alert>
                )}
                {dashboardMetrics.apostasPorDia > 3 && (
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Alto Volume!</strong> Média de {dashboardMetrics.apostasPorDia.toFixed(1)} apostas por dia.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: PERFORMANCE */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Yield"
              value={formatPercentage(performanceMetrics.yield)}
              icon={Percent}
              description="Retorno sobre investimento"
            />
            <KPICard
              title="Consistência ROI"
              value={formatPercentage(performanceMetrics.consistenciaROI)}
              icon={TrendingUpDown}
              description="Meses lucrativos"
            />
            <KPICard
              title="Strike Rate (Odds Altas)"
              value={formatPercentage(performanceMetrics.strikeRateOddsAltas)}
              icon={Target}
              description="Acerto em odds > 2.0"
            />
            <KPICard
              title="Apostas/Mês"
              value={performanceMetrics.apostasPorMes.toFixed(1)}
              icon={Calendar}
              description="Média mensal"
            />
          </div>

          {/* Análise Temporal */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor Mês</p>
                  <p className="text-2xl font-bold">{performanceMetrics.melhorMes.mes}</p>
                  <p className="text-sm text-green-600">ROI: {formatPercentage(performanceMetrics.melhorMes.roi)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pior Mês</p>
                  <p className="text-2xl font-bold">{performanceMetrics.piorMes.mes}</p>
                  <p className="text-sm text-red-600">ROI: {formatPercentage(performanceMetrics.piorMes.roi)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ROI Mês Atual</p>
                  <p className={`text-2xl font-bold ${performanceMetrics.roiMesAtual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(performanceMetrics.roiMesAtual)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Otimização */}
          <Card>
            <CardHeader>
              <CardTitle>Otimização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Odd Ótima
                    <InfoTooltip 
                      title="Faixa de Odd Ideal"
                      description="Faixa de odds com melhor ROI (mínimo 5 apostas)"
                    />
                  </p>
                  <p className="text-xl font-bold">{performanceMetrics.oddOtima.faixa}</p>
                  <p className="text-sm text-green-600">ROI: {formatPercentage(performanceMetrics.oddOtima.roi)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Volume Ideal</p>
                  <p className="text-xl font-bold">{formatCurrency(performanceMetrics.volumeIdeal)}</p>
                  <p className="text-sm text-muted-foreground">Por mês</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ROI Projetado</p>
                  <p className="text-xl font-bold">{formatPercentage(performanceMetrics.roiProjetado)}</p>
                  <p className="text-sm text-muted-foreground">Na odd ótima</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eficiência */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Precisão</p>
                  <p className="text-2xl font-bold">{formatPercentage(performanceMetrics.precisao)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recall</p>
                  <p className="text-2xl font-bold">{formatPercentage(performanceMetrics.recall)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">F1-Score</p>
                  <p className="text-2xl font-bold">{formatPercentage(performanceMetrics.f1Score)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Avançados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Sharpe Ratio
                    <InfoTooltip 
                      title="Sharpe Ratio"
                      description="Retorno médio dividido pelo desvio padrão. Quanto maior, melhor o risco-retorno."
                    />
                  </p>
                  <p className="text-2xl font-bold">{performanceMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Sortino Ratio
                    <InfoTooltip 
                      title="Sortino Ratio"
                      description="Similar ao Sharpe, mas considera apenas a volatilidade negativa."
                    />
                  </p>
                  <p className="text-2xl font-bold">{performanceMetrics.sortinoRatio.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Calmar Ratio
                    <InfoTooltip 
                      title="Calmar Ratio"
                      description="ROI dividido pelo máximo drawdown. Mede retorno vs risco de grandes perdas."
                    />
                  </p>
                  <p className="text-2xl font-bold">{performanceMetrics.calmarRatio.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Win/Loss Ratio</p>
                  <p className="text-2xl font-bold">{performanceMetrics.winLossRatio.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Performance (ROI Mensal)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lucroMensalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatPercentage(value)}
                    />
                    <Line type="monotone" dataKey="roi" stroke={CHART_COLORS[0]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Casa de Apostas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performancePorCasaData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="casa" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="lucro" fill={CHART_COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 3: CASAS DE APOSTAS */}
        <TabsContent value="casas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabela Comparativa de Casas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Casa</th>
                      <th className="text-right p-2">Apostas</th>
                      <th className="text-right p-2">Taxa Acerto</th>
                      <th className="text-right p-2">ROI</th>
                      <th className="text-right p-2">Lucro</th>
                      <th className="text-right p-2">Odd Média</th>
                      <th className="text-center p-2">Avaliação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performancePorCasaData.map((casa, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{casa.casa}</td>
                        <td className="text-right p-2">{casa.apostas}</td>
                        <td className="text-right p-2">{formatPercentage(casa.taxaAcerto)}</td>
                        <td className={`text-right p-2 ${casa.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(casa.roi)}
                        </td>
                        <td className={`text-right p-2 ${casa.lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(casa.lucro)}
                        </td>
                        <td className="text-right p-2">{casa.oddMedia.toFixed(2)}</td>
                        <td className="text-center p-2">
                          <div className="flex justify-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const stars = Math.round((casa.roi + 100) / 40);
                              return (
                                <Medal 
                                  key={i} 
                                  className={`w-4 h-4 ${i < Math.min(5, Math.max(1, stars)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Casa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performancePorCasaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="casa" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="lucro" fill={CHART_COLORS[0]}>
                      {performancePorCasaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.lucro > 0 ? CHART_COLORS[0] : CHART_COLORS[3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI por Casa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performancePorCasaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="casa" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => formatPercentage(value)}
                    />
                    <Bar dataKey="roi" fill={CHART_COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Volume vs Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    dataKey="apostas" 
                    name="Volume" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Número de Apostas', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="taxaAcerto" 
                    name="Taxa" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Taxa de Acerto (%)', angle: -90, position: 'left' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter name="Casas" data={performancePorCasaData} fill={CHART_COLORS[2]} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: CATEGORIAS */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Categoria Mais Lucrativa</p>
                  <p className="text-xl font-bold">{categoriaData[0]?.categoria || '—'}</p>
                  <p className="text-sm text-green-600">
                    {categoriaData[0] ? formatCurrency(categoriaData[0].lucro) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor Taxa de Acerto</p>
                  <p className="text-xl font-bold">
                    {categoriaData.length > 0
                      ? categoriaData.reduce((max, c) => c.taxaAcerto > max.taxaAcerto ? c : max).categoria
                      : '—'}
                  </p>
                  <p className="text-sm text-green-600">
                    {categoriaData.length > 0
                      ? formatPercentage(categoriaData.reduce((max, c) => c.taxaAcerto > max.taxaAcerto ? c : max).taxaAcerto)
                      : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor ROI</p>
                  <p className="text-xl font-bold">
                    {categoriaData.length > 0
                      ? categoriaData.reduce((max, c) => c.roi > max.roi ? c : max).categoria
                      : '—'}
                  </p>
                  <p className="text-sm text-green-600">
                    {categoriaData.length > 0
                      ? formatPercentage(categoriaData.reduce((max, c) => c.roi > max.roi ? c : max).roi)
                      : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tabela de Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-right p-2">Apostas</th>
                      <th className="text-right p-2">Taxa Acerto</th>
                      <th className="text-right p-2">ROI</th>
                      <th className="text-right p-2">Lucro</th>
                      <th className="text-right p-2">Odd Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriaData.map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{cat.categoria}</td>
                        <td className="text-right p-2">{cat.apostas}</td>
                        <td className="text-right p-2">{formatPercentage(cat.taxaAcerto)}</td>
                        <td className={`text-right p-2 ${cat.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(cat.roi)}
                        </td>
                        <td className={`text-right p-2 ${cat.lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cat.lucro)}
                        </td>
                        <td className="text-right p-2">{cat.oddMedia.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={categoriaData.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="lucro" fill={CHART_COLORS[0]} name="Lucro (R$)" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke={CHART_COLORS[1]} name="ROI (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Apostas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoriaData.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categoria, percent }: any) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="apostas"
                    >
                      {categoriaData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 5: ANÁLISE DE ODDS */}
        <TabsContent value="odds" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Value Bets"
              value={formatPercentage(oddsMetrics.valueBets)}
              icon={Target}
              description="Apostas com ROI > 10%"
            />
            <KPICard
              title="Acerto Odds Baixas"
              value={formatPercentage(oddsMetrics.acertoOddsBaixas)}
              icon={TrendingDown}
              description="Odds entre 1.0 e 1.5"
            />
            <KPICard
              title="Acerto Odds Altas"
              value={formatPercentage(oddsMetrics.acertoOddsAltas)}
              icon={TrendingUp}
              description="Odds acima de 3.0"
            />
            <KPICard
              title="Odd Média Vencedora"
              value={oddsMetrics.oddMediaVencedora.toFixed(2)}
              icon={Trophy}
              description="Média das odds ganhas"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sweet Spot de Odds</CardTitle>
              <CardDescription>
                Faixa de odds com melhor desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Faixa Ideal</p>
                  <p className="text-3xl font-bold text-green-600">{oddsMetrics.sweetSpot.faixa}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className="text-3xl font-bold">{formatPercentage(oddsMetrics.sweetSpot.roi)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                  <p className="text-3xl font-bold">{formatPercentage(oddsMetrics.sweetSpot.taxa)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relação Odd vs Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={oddsRangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="taxaAcerto" fill={CHART_COLORS[0]} name="Taxa Acerto (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke={CHART_COLORS[1]} name="ROI (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiência por Faixa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {oddsRangeData.map((faixa, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{faixa.faixa}</span>
                      <span className="text-sm font-bold">{formatPercentage(faixa.taxaAcerto)}</span>
                    </div>
                    <Progress value={faixa.taxaAcerto} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{faixa.count} apostas</span>
                      <span>ROI: {formatPercentage(faixa.roi)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timing Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{oddsMetrics.timingInsight}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 6: ANÁLISE DE RISCO */}
        <TabsContent value="risco" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Max Drawdown"
              value={formatPercentage(riskMetrics.maxDrawdown)}
              icon={TrendingDown}
              description="Maior queda"
              variant="destructive"
            />
            <KPICard
              title="Volatilidade"
              value={formatPercentage(riskMetrics.volatilidade)}
              icon={Activity}
              description="Desvio padrão"
            />
            <KPICard
              title="Score de Risco"
              value={riskMetrics.scoreRisco.toFixed(0)}
              icon={Shield}
              description="0-100 (menor é melhor)"
            />
            <KPICard
              title="Kelly %"
              value={formatPercentage(riskMetrics.kellyPercentual)}
              icon={Percent}
              description="% recomendado da banca"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Drawdown</CardTitle>
              <CardDescription>Evolução das quedas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={riskMetrics.drawdownSeries}>
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[3]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS[3]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => formatPercentage(value)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke={CHART_COLORS[3]} 
                    fillOpacity={1} 
                    fill="url(#colorDrawdown)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Value at Risk (95%)
                    <InfoTooltip 
                      title="VaR 95%"
                      description="Em 95% dos casos, suas perdas não excedem esse valor"
                    />
                  </p>
                  <p className="text-2xl font-bold">{formatPercentage(riskMetrics.valueAtRisk)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Expected Shortfall
                    <InfoTooltip 
                      title="Expected Shortfall"
                      description="Perda média quando excede o VaR"
                    />
                  </p>
                  <p className="text-2xl font-bold">{formatPercentage(riskMetrics.expectedShortfall)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recovery Time</p>
                  <p className="text-2xl font-bold">{riskMetrics.recoveryTime} dias</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Risk-Adjusted Return</p>
                  <p className="text-2xl font-bold">{formatPercentage(riskMetrics.riskAdjustedReturn)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 7: ANÁLISE TEMPORAL */}
        <TabsContent value="temporal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor Dia da Semana</p>
                  <p className="text-xl font-bold">{temporalMetrics.melhorDia.dia}</p>
                  <p className="text-sm text-green-600">{formatCurrency(temporalMetrics.melhorDia.lucro)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor Horário</p>
                  <p className="text-xl font-bold">
                    {temporalMetrics.melhorHorario ? `${temporalMetrics.melhorHorario.hora}h` : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {temporalMetrics.melhorHorario ? formatCurrency(temporalMetrics.melhorHorario.lucro) : 'Sem dados'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Melhor Mês do Ano</p>
                  <p className="text-xl font-bold">{temporalMetrics.melhorMes.mes}</p>
                  <p className="text-sm text-green-600">{formatPercentage(temporalMetrics.melhorMes.roi)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Dias Consecutivos</p>
                  <p className="text-xl font-bold">{temporalMetrics.diasConsecutivos}</p>
                  <p className="text-sm text-muted-foreground">De atividade</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={performanceDiaSemanaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="lucro" fill={CHART_COLORS[0]} name="Lucro (R$)" />
                    <Line yAxisId="right" type="monotone" dataKey="apostas" stroke={CHART_COLORS[1]} name="Apostas" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lucroMensalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="lucro" stroke={CHART_COLORS[0]} name="Lucro (R$)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Heatmap Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Heatmap de Performance Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-13 gap-2 min-w-max">
                  <div className="font-semibold text-sm p-2">Ano</div>
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(mes => (
                    <div key={mes} className="font-semibold text-sm p-2 text-center">{mes}</div>
                  ))}
                  
                  {Array.from(new Set(temporalMetrics.heatmapMensal.map(h => h.ano))).map(ano => (
                    <>
                      <div key={ano} className="font-semibold text-sm p-2">{ano}</div>
                      {Array.from({ length: 12 }, (_, i) => {
                        const data = temporalMetrics.heatmapMensal.find(h => h.ano === ano && h.mes === i);
                        const roi = data?.roi || 0;
                        const bgColor = roi > 5 ? 'bg-green-500/20' : roi > 0 ? 'bg-yellow-500/20' : roi < 0 ? 'bg-red-500/20' : 'bg-muted';
                        
                        return (
                          <div 
                            key={i} 
                            className={`p-2 rounded text-center text-sm ${bgColor} cursor-pointer hover:opacity-80 transition-opacity`}
                            title={data ? `${formatPercentage(roi)} - ${formatCurrency(data.lucro)}` : 'Sem dados'}
                          >
                            {data ? formatPercentage(roi) : '—'}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 8: PADRÕES & TENDÊNCIAS */}
        <TabsContent value="padroes" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta aba está em desenvolvimento e incluirá análises de consistência, momentum, ciclos e padrões de bônus.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
