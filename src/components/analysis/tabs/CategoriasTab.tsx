import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
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
    ComposedChart
} from "recharts";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";

interface CategoriasTabProps {
    categoriaData: any[];
    CHART_COLORS: string[];
}

export function CategoriasTab({ categoriaData, CHART_COLORS }: CategoriasTabProps) {
    const melhorTaxa = categoriaData.length > 0
        ? categoriaData.reduce((max, c) => (c.taxaAcerto ?? 0) > (max.taxaAcerto ?? 0) ? c : max)
        : null;

    const melhorROI = categoriaData.length > 0
        ? categoriaData.reduce((max, c) => (c.roi ?? 0) > (max.roi ?? 0) ? c : max)
        : null;

    const maiorVolume = categoriaData.length > 0
        ? categoriaData.reduce((max, c) => (c.apostas ?? 0) > (max.apostas ?? 0) ? c : max)
        : null;

    const categoriasAtivas = categoriaData.length;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Categoria Mais Lucrativa"
                    value={categoriaData[0]?.categoria || '—'}
                    icon={Trophy}
                    description={categoriaData[0] ? formatCurrency(categoriaData[0].lucro ?? 0) : '—'}
                />
                <KPICard
                    title="Melhor Taxa de Acerto"
                    value={melhorTaxa ? formatPercentage(melhorTaxa.taxaAcerto ?? 0) : '—'}
                    icon={Target}
                    description={melhorTaxa?.categoria || '—'}
                />
                <KPICard
                    title="Melhor ROI"
                    value={melhorROI ? formatPercentage(melhorROI.roi ?? 0) : '—'}
                    icon={TrendingUp}
                    description={melhorROI?.categoria || '—'}
                />
                <KPICard
                    title="Categorias Ativas"
                    value={categoriasAtivas.toString()}
                    icon={Award}
                    description="Total de categorias"
                />
            </div>

            {/* Comprehensive Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Análise Detalhada de Categorias</CardTitle>
                    <CardDescription>
                        Performance completa por categoria de apostas
                    </CardDescription>
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
                                    <th className="text-center p-2">Tendência</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoriaData.length > 0 ? (
                                    categoriaData.map((cat, idx) => (
                                        <tr key={idx} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{cat.categoria}</td>
                                            <td className="text-right p-2">{cat.apostas ?? 0}</td>
                                            <td className="text-right p-2">
                                                {formatPercentage(cat.taxaAcerto ?? 0)}
                                            </td>
                                            <td className={`text-right p-2 ${(cat.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPercentage(cat.roi ?? 0)}
                                            </td>
                                            <td className={`text-right p-2 ${(cat.lucro ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(cat.lucro ?? 0)}
                                            </td>
                                            <td className="text-right p-2">{(cat.oddMedia ?? 0).toFixed(2)}</td>
                                            <td className="text-center p-2">
                                                <Badge variant={(cat.roi ?? 0) > 5 ? "default" : (cat.roi ?? 0) > 0 ? "secondary" : "destructive"}>
                                                    {(cat.roi ?? 0) > 5 ? '📈 Excelente' : (cat.roi ?? 0) > 0 ? '→ Estável' : '📉 Baixo'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Nenhuma categoria encontrada
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Performance por Categoria</CardTitle>
                        <CardDescription>Lucro e ROI comparativo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={categoriaData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
                                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                                    formatter={(value: number, name: string) => [
                                        name === 'ROI (%)' ? formatPercentage(value) : formatCurrency(value),
                                        name
                                    ]}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="lucro" fill={CHART_COLORS[0]} name="Lucro (R$)" />
                                <Line yAxisId="right" type="monotone" dataKey="roi" stroke={CHART_COLORS[1]} name="ROI (%)" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição de Apostas</CardTitle>
                        <CardDescription>Volume por categoria (top 8)</CardDescription>
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

            {/* Top 5 Categories Detailed */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Categorias - Análise Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoriaData.slice(0, 5).map((cat, idx) => (
                            <div key={idx} className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold">{cat.categoria}</h4>
                                    <Badge variant="outline">#{idx + 1}</Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Apostas:</span>
                                        <span className="font-semibold">{cat.apostas ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Taxa Acerto:</span>
                                        <span className="font-semibold">{formatPercentage(cat.taxaAcerto ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ROI:</span>
                                        <span className={`font-semibold ${(cat.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentage(cat.roi ?? 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lucro:</span>
                                        <span className={`font-semibold ${(cat.lucro ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(cat.lucro ?? 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Odd Média:</span>
                                        <span className="font-semibold">{(cat.oddMedia ?? 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
