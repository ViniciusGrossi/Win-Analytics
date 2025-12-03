import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { InfoTooltip } from "@/components/analysis/InfoTooltip";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Line,
} from "recharts";
import {
    TrendingUp,
    Target,
    DollarSign,
    Percent,
    Activity,
    Zap,
    Trophy,
    Medal
} from "lucide-react";
import { CHART_COLORS } from "@/lib/constants";
import type { DashboardMetrics } from "@/hooks/useAnalysisMetrics";
import { AIInsights } from "@/components/analysis/AIInsights";


interface DashboardTabProps {
    metrics: DashboardMetrics;
    equityCurveData: any[];
    lucroMensalData: any[];
    valoresApostadosData: any[];
    tipoApostaData: any[];
}

export function DashboardTab({
    metrics,
    equityCurveData,
    lucroMensalData,
    valoresApostadosData,
    tipoApostaData,
}: DashboardTabProps) {
    return (
        <div className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Investido"
                    value={formatCurrency(metrics.totalInvestido)}
                    icon={DollarSign}
                    trend={metrics.totalInvestidoVariacao}
                    description={`${metrics.totalInvestidoVariacao > 0 ? '+' : ''}${formatPercentage(metrics.totalInvestidoVariacao)} vs período anterior`}
                />
                <KPICard
                    title="ROI"
                    value={formatPercentage(metrics.roi)}
                    icon={Percent}
                    description={metrics.roiStatus}
                    variant={metrics.roiStatus === 'Excelente' ? 'success' : metrics.roiStatus === 'Positivo' ? 'warning' : 'destructive'}
                />
                <KPICard
                    title="Lucro/Prejuízo"
                    value={formatCurrency(metrics.lucroTotal)}
                    icon={TrendingUp}
                    description={`Maior ganho: ${formatCurrency(metrics.maiorGanho.valor)}`}
                    variant={metrics.lucroTotal > 0 ? 'success' : 'destructive'}
                />
                <KPICard
                    title="Taxa de Acerto"
                    value={formatPercentage(metrics.taxaAcerto)}
                    icon={Target}
                    description={metrics.taxaStatus}
                    variant={metrics.taxaStatus === 'Excelente' ? 'success' : metrics.taxaStatus === 'Bom' ? 'warning' : 'destructive'}
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
                                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
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
                            <span className="font-semibold">{metrics.totalApostas}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Apostas/Dia</span>
                            <span className="font-semibold">{metrics.apostasPorDia.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Dias Ativos</span>
                            <span className="font-semibold">{metrics.diasAtivos}</span>
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
                            <span className="font-semibold">{metrics.oddMedia.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Odd Mais Alta</span>
                            <span className="font-semibold">{metrics.oddMaisAlta.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Odd Mais Baixa</span>
                            <span className="font-semibold">{metrics.oddMaisBaixa.toFixed(2)}</span>
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
                            <span className="font-semibold text-green-600">{metrics.maiorSequenciaVitorias}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Maior Seq. Derrotas</span>
                            <span className="font-semibold text-red-600">{metrics.maiorSequenciaDerrotas}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sequência Atual</span>
                            <span className={`font-semibold ${metrics.sequenciaAtual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.sequenciaAtual > 0 ? `+${metrics.sequenciaAtual}` : metrics.sequenciaAtual}
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
                                    {tipoApostaData.map((entry: any, index: number) => (
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

            {/* AI-Generated Insights */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        Insights Inteligentes
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Análises automáticas geradas por IA baseadas no seu desempenho
                    </p>
                </CardHeader>
                <CardContent>
                    <AIInsights />
                </CardContent>
            </Card>
        </div>
    );
}
