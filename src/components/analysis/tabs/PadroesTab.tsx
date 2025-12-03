import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Activity,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from "lucide-react";
import { formatPercentage, formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { CHART_COLORS } from "@/lib/constants";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

interface PadroesTabProps {
    patternsMetrics: any;
}

export function PadroesTab({ patternsMetrics }: PadroesTabProps) {
    if (!patternsMetrics) return null;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Sequência de Vitórias"
                    value={(patternsMetrics.sequenciaVitorias ?? 0).toString()}
                    icon={TrendingUp}
                    description="Maior sequência positiva"
                />
                <KPICard
                    title="Sequência de Derrotas"
                    value={(patternsMetrics.sequenciaDerrotas ?? 0).toString()}
                    icon={TrendingDown}
                    description="Maior sequência negativa"
                    variant="destructive"
                />
                <KPICard
                    title="Recuperação Média"
                    value={(patternsMetrics.recuperacaoMedia ?? 0).toFixed(1)}
                    icon={RefreshCw}
                    description="Apostas para recuperar loss"
                />
                <KPICard
                    title="Estabilidade"
                    value={formatPercentage(patternsMetrics.estabilidade ?? 0)}
                    icon={Activity}
                    description="Consistência de resultados"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Análise de Sequências</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-muted-foreground">Probabilidade de Vitória após Vitória</span>
                                <span className="font-bold">{formatPercentage(patternsMetrics.probabilidadeVitoriaAposVitoria ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-muted-foreground">Probabilidade de Vitória após Derrota</span>
                                <span className="font-bold">{formatPercentage(patternsMetrics.probabilidadeVitoriaAposDerrota ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-muted-foreground">Média de Apostas por Dia</span>
                                <span className="font-bold">{(patternsMetrics.mediaApostasDia ?? 0).toFixed(1)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Análise por Categoria */}
            {patternsMetrics.categorias && patternsMetrics.categorias.length > 0 && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Análise por Categoria</CardTitle>
                            <CardDescription>Categorias com mais de 10 apostas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-4">Categoria</th>
                                            <th className="text-right py-2 px-4">Apostas</th>
                                            <th className="text-right py-2 px-4">Taxa de Acerto</th>
                                            <th className="text-right py-2 px-4">ROI</th>
                                            <th className="text-right py-2 px-4">Lucro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patternsMetrics.categorias.map((cat: any) => (
                                            <tr key={cat.categoria} className="border-b hover:bg-muted/50">
                                                <td className="py-2 px-4 font-medium">{cat.categoria}</td>
                                                <td className="py-2 px-4 text-right">{cat.total}</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className={cat.taxaAcerto >= 60 ? 'text-green-600' : cat.taxaAcerto >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                        {cat.taxaAcerto.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className={cat.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {cat.roi > 0 ? '+' : ''}{cat.roi.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className={cat.lucro >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                        {formatCurrency(cat.lucro)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gráficos de Categoria */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição por Categoria</CardTitle>
                                <CardDescription>Volume de apostas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={patternsMetrics.categorias.slice(0, 8)}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.categoria}: ${entry.total}`}
                                            outerRadius={80}
                                            fill={CHART_COLORS[0]}
                                            dataKey="total"
                                        >
                                            {patternsMetrics.categorias.slice(0, 8).map((_: any, index: number) => (
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Performance por Categoria</CardTitle>
                                <CardDescription>ROI e Taxa de Acerto</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={patternsMetrics.categorias.slice(0, 6)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis stroke="hsl(var(--muted-foreground))" />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="taxaAcerto" fill={CHART_COLORS[1]} name="Taxa Acerto (%)" />
                                        <Bar dataKey="roi" fill={CHART_COLORS[2]} name="ROI (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Análise de Bônus */}
            {patternsMetrics.bonusMetrics && patternsMetrics.bonusMetrics.total > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Análise de Apostas com Bônus</CardTitle>
                        <CardDescription>Performance com bônus/turbo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total de Apostas</p>
                                <p className="text-2xl font-bold">{patternsMetrics.bonusMetrics.total}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                                <p className={`text-2xl font-bold ${patternsMetrics.bonusMetrics.taxaAcerto >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                    {patternsMetrics.bonusMetrics.taxaAcerto.toFixed(1)}%
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">ROI</p>
                                <p className={`text-2xl font-bold ${patternsMetrics.bonusMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {patternsMetrics.bonusMetrics.roi > 0 ? '+' : ''}{patternsMetrics.bonusMetrics.roi.toFixed(2)}%
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Lucro Total</p>
                                <p className={`text-2xl font-bold ${patternsMetrics.bonusMetrics.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(patternsMetrics.bonusMetrics.lucro)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
