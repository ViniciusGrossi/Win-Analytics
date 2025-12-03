import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    ComposedChart
} from "recharts";
import { Calendar, Clock, CalendarDays } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { InfoTooltip } from "@/components/analysis/InfoTooltip";

interface TemporalTabProps {
    temporalMetrics: any;
    performanceDiaSemanaData: any[];
    lucroMensalData: any[];
    CHART_COLORS: string[];
}

export function TemporalTab({ temporalMetrics, performanceDiaSemanaData, lucroMensalData, CHART_COLORS }: TemporalTabProps) {
    if (!temporalMetrics) return null;
    return (
        <div className="space-y-6">
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
                        <CardTitle className="flex items-center gap-2">Performance por Dia da Semana<InfoTooltip title="Dia da Semana" description="Lucro e volume de apostas por dia" /></CardTitle>
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
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Line type="monotone" dataKey="lucro" stroke={CHART_COLORS[0]} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap Mensal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Heatmap de Performance Mensal<InfoTooltip title="Heatmap" description="ROI e lucro por mês ao longo dos anos" /></CardTitle>
                    <CardDescription>Visualize sua performance mês a mês ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        {/* Preparar dados agrupados por ano */}
                        {(() => {
                            const anosMeses = temporalMetrics.heatmapMensal.reduce((acc: any, h: any) => {
                                if (!acc[h.ano]) acc[h.ano] = {};
                                acc[h.ano][h.mes] = h;
                                return acc;
                            }, {} as Record<number, Record<number, any>>);

                            const anos = Object.keys(anosMeses).map(Number).sort((a, b) => b - a);
                            const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                            if (anos.length === 0) {
                                return (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Nenhum dado disponível ainda</p>
                                        <p className="text-sm mt-2">Continue apostando para ver o heatmap</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6 px-2 sm:px-4">
                                    {anos.map(ano => (
                                        <div key={ano} className="space-y-3">
                                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {ano}
                                            </h4>

                                            <div className="grid grid-cols-12 gap-2">
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mesData = anosMeses[ano]?.[i];
                                                    const roi = mesData?.roi || 0;
                                                    const lucro = mesData?.lucro || 0;

                                                    // Definir cor baseada no ROI
                                                    let bgColor = 'bg-muted/50';
                                                    let textColor = 'text-muted-foreground';
                                                    let borderColor = 'border-muted';

                                                    if (mesData) {
                                                        if (roi >= 10) {
                                                            bgColor = 'bg-green-500/30 hover:bg-green-500/40';
                                                            textColor = 'text-green-700 dark:text-green-400';
                                                            borderColor = 'border-green-500/50';
                                                        } else if (roi >= 5) {
                                                            bgColor = 'bg-green-500/20 hover:bg-green-500/30';
                                                            textColor = 'text-green-600 dark:text-green-300';
                                                            borderColor = 'border-green-500/30';
                                                        } else if (roi > 0) {
                                                            bgColor = 'bg-yellow-500/20 hover:bg-yellow-500/30';
                                                            textColor = 'text-yellow-700 dark:text-yellow-400';
                                                            borderColor = 'border-yellow-500/30';
                                                        } else if (roi < 0) {
                                                            bgColor = 'bg-red-500/20 hover:bg-red-500/30';
                                                            textColor = 'text-red-700 dark:text-red-400';
                                                            borderColor = 'border-red-500/30';
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`
                                    relative group p-3 rounded-lg border-2 transition-all duration-200
                                    ${bgColor} ${borderColor}
                                    ${mesData ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'opacity-50'}
                                  `}
                                                            title={mesData
                                                                ? `${mesesNomes[i]}/${ano}\nROI: ${roi.toFixed(2)}%\nLucro: ${formatCurrency(lucro)}`
                                                                : `${mesesNomes[i]}/${ano}\nSem dados`
                                                            }
                                                        >
                                                            {/* Nome do mês */}
                                                            <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
                                                                {mesesNomes[i]}
                                                            </div>

                                                            {/* ROI ou vazio */}
                                                            <div className={`text-center font-bold text-sm ${textColor}`}>
                                                                {mesData ? `${roi > 0 ? '+' : ''}${roi.toFixed(1)}%` : '—'}
                                                            </div>

                                                            {/* Tooltip detalhado no hover */}
                                                            {mesData && (
                                                                <div className="
                                      absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                      hidden group-hover:block z-10
                                      bg-popover border border-border rounded-lg shadow-lg p-3
                                      min-w-[200px]
                                    ">
                                                                    <div className="text-sm space-y-1">
                                                                        <div className="font-semibold border-b pb-1 mb-2">
                                                                            {mesesNomes[i]} {ano}
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">ROI:</span>
                                                                            <span className={`font-semibold ${textColor}`}>
                                                                                {roi > 0 ? '+' : ''}{roi.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Lucro:</span>
                                                                            <span className={`font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                {formatCurrency(lucro)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {/* Seta do tooltip */}
                                                                    <div className="
                                        absolute top-full left-1/2 -translate-x-1/2
                                        border-8 border-transparent border-t-popover
                                      " />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Legenda */}
                                    <div className="flex items-center justify-center gap-6 pt-4 border-t">
                                        <div className="text-sm text-muted-foreground">Legenda:</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-green-500/30 border-2 border-green-500/50" />
                                            <span className="text-sm">ROI ≥ 10%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-green-500/20 border-2 border-green-500/30" />
                                            <span className="text-sm">ROI 5-10%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-yellow-500/20 border-2 border-yellow-500/30" />
                                            <span className="text-sm">ROI 0-5%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-red-500/20 border-2 border-red-500/30" />
                                            <span className="text-sm">ROI &lt; 0%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-muted/50 border-2 border-muted" />
                                            <span className="text-sm">Sem dados</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
