import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from "recharts";
import {
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    AlertCircle
} from "lucide-react";
import { formatPercentage } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { InfoTooltip } from "@/components/analysis/InfoTooltip";

interface OddsTabProps {
    oddsMetrics: any;
    oddsRangeData: any[];
    CHART_COLORS: string[];
}

export function OddsTab({ oddsMetrics, oddsRangeData, CHART_COLORS }: OddsTabProps) {
    return (
        <div className="space-y-6">
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
                    <CardTitle className="flex items-center gap-2">Sweet Spot de Odds<InfoTooltip title="Sweet Spot" description="Faixa de odds com melhor combinação de ROI e taxa de acerto" /></CardTitle>
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
                        <CardTitle className="flex items-center gap-2">Relação Odd vs Performance<InfoTooltip title="Odd vs Performance" description="Taxa de acerto e ROI por faixa de odd" /></CardTitle>
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
        </div>
    );
}
