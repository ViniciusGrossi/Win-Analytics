import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatPercentage, formatCurrency } from "@/lib/utils";
import {
    Percent,
    TrendingUpDown,
    Target,
    Calendar,
} from "lucide-react";
import type { PerformanceMetrics, ExposureMetrics } from "@/hooks/useAnalysisMetrics";

interface PerformanceTabProps {
    performanceMetrics: PerformanceMetrics;
    exposureMetrics: ExposureMetrics;
}

export function PerformanceTab({
    performanceMetrics,
    exposureMetrics,
}: PerformanceTabProps) {
    return (
        <div className="space-y-6">
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
                <KPICard
                    title="Correlação Stake vs Retorno"
                    value={exposureMetrics.stakeReturnCorrelation.toFixed(2)}
                    icon={TrendingUpDown}
                    description="Relação entre valor apostado e retorno em %"
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
                            </p>
                            <p className="text-2xl font-bold">{performanceMetrics.calmarRatio.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Win/Loss Ratio
                            </p>
                            <p className="text-2xl font-bold">{performanceMetrics.winLossRatio.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
