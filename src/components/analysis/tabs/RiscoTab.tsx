import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from "recharts";
import {
    TrendingDown,
    TrendingUp,
    Activity,
    Shield,
    Percent
} from "lucide-react";
import { formatPercentage } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { InfoTooltip } from "@/components/analysis/InfoTooltip";

interface RiscoTabProps {
    riskMetrics: any;
    advancedRisk: any;
    CHART_COLORS: string[];
}

export function RiscoTab({ riskMetrics, advancedRisk, CHART_COLORS }: RiscoTabProps) {
    return (
        <div className="space-y-6">
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
                <KPICard
                    title="Ulcer Index"
                    value={formatPercentage(advancedRisk.ulcerIndex)}
                    icon={TrendingDown}
                    description="Intensidade de drawdown ao longo do tempo"
                />
                <KPICard
                    title="MAR Ratio"
                    value={advancedRisk.marRatio.toFixed(2)}
                    icon={TrendingUp}
                    description="Retorno vs maior drawdown"
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
                                    <stop offset="5%" stopColor={CHART_COLORS[3]} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={CHART_COLORS[3]} stopOpacity={0} />
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
        </div>
    );
}
