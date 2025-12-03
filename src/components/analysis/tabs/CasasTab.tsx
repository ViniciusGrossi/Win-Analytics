import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    ScatterChart,
    Scatter,
    Legend
} from "recharts";
import { Medal, Filter, TrendingUp, Star } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/constants";

interface CasasTabProps {
    performancePorCasaData: any[];
}

type FilterType = 'all' | '5+' | '10+';

export function CasasTab({ performancePorCasaData }: CasasTabProps) {
    const [filter, setFilter] = useState<FilterType>('all');

    // Filter casas based on minimum bet count
    const filteredData = useMemo(() => {
        if (filter === '5+') {
            return performancePorCasaData.filter(casa => casa.apostas >= 5);
        } else if (filter === '10+') {
            return performancePorCasaData.filter(casa => casa.apostas >= 10);
        }
        return performancePorCasaData;
    }, [performancePorCasaData, filter]);

    // Calculate top performers
    const topCasas = useMemo(() => {
        const sorted = [...filteredData].sort((a, b) => b.roi - a.roi);
        return sorted.slice(0, 3);
    }, [filteredData]);

    // Group by market (if data available)
    const melhorMercadoPorCasa = useMemo(() => {
        // This would require market data per casa - placeholder for now
        return filteredData.slice(0, 3).map(casa => ({
            casa: casa.casa,
            melhorMercado: "1X2", // Placeholder
            roiMercado: casa.roi * 1.1 // Placeholder calculation
        }));
    }, [filteredData]);

    return (
        <div className="space-y-6">
            {/* Filter Buttons */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filtrar Casas de Apostas
                            </CardTitle>
                            <CardDescription>
                                Visualize casas com volume mínimo de apostas
                            </CardDescription>
                        </div>
                        <Badge variant="outline">
                            {filteredData.length} {filteredData.length === 1 ? 'casa' : 'casas'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilter('all')}
                            size="sm"
                        >
                            Todas ({performancePorCasaData.length})
                        </Button>
                        <Button
                            variant={filter === '5+' ? 'default' : 'outline'}
                            onClick={() => setFilter('5+')}
                            size="sm"
                        >
                            5+ Apostas ({performancePorCasaData.filter(c => c.apostas >= 5).length})
                        </Button>
                        <Button
                            variant={filter === '10+' ? 'default' : 'outline'}
                            onClick={() => setFilter('10+')}
                            size="sm"
                        >
                            10+ Apostas ({performancePorCasaData.filter(c => c.apostas >= 10).length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Top Casas Metrics */}
            {topCasas.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Top 3 Casas - Melhores Desempenhos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topCasas.map((casa, idx) => (
                                <div key={idx} className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                                            #{idx + 1}
                                        </Badge>
                                        <div className="flex gap-0.5">
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
                                    </div>
                                    <h4 className="font-bold text-lg mb-3">{casa.casa}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">ROI:</span>
                                            <span className={`font-semibold ${casa.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPercentage(casa.roi)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Taxa Acerto:</span>
                                            <span className="font-semibold">{formatPercentage(casa.taxaAcerto)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Lucro:</span>
                                            <span className={`font-semibold ${casa.lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(casa.lucro)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Apostas:</span>
                                            <span className="font-semibold">{casa.apostas}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comparative Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tabela Comparativa de Casas</CardTitle>
                    <CardDescription>
                        Análise detalhada de performance por casa de apostas
                    </CardDescription>
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
                                {filteredData.length > 0 ? (
                                    filteredData.map((casa, idx) => (
                                        <tr key={idx} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{casa.casa}</td>
                                            <td className="text-right p-2">{casa.apostas}</td>
                                            <td className="text-right p-2">{formatPercentage(casa.taxaAcerto ?? 0)}</td>
                                            <td className={`text-right p-2 ${(casa.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPercentage(casa.roi ?? 0)}
                                            </td>
                                            <td className={`text-right p-2 ${(casa.lucro ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(casa.lucro ?? 0)}
                                            </td>
                                            <td className="text-right p-2">{(casa.oddMedia ?? 0).toFixed(2)}</td>
                                            <td className="text-center p-2">
                                                <div className="flex justify-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => {
                                                        const stars = Math.round(((casa.roi ?? 0) + 100) / 40);
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Nenhuma casa encontrada com o filtro selecionado
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
                        <CardTitle>Performance por Casa</CardTitle>
                        <CardDescription>Lucro/Prejuízo por casa de apostas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="casa" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
                                <YAxis stroke="hsl(var(--muted-foreground))" />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="lucro" fill={CHART_COLORS[0]}>
                                    {filteredData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={(entry.lucro ?? 0) > 0 ? CHART_COLORS[0] : CHART_COLORS[3]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>ROI por Casa</CardTitle>
                        <CardDescription>Retorno sobre investimento comparativo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredData} layout="vertical">
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

            {/* Volume vs Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Volume vs Performance</CardTitle>
                    <CardDescription>
                        Relação entre volume de apostas e taxa de acerto
                    </CardDescription>
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
                            <Scatter name="Casas" data={filteredData} fill={CHART_COLORS[2]} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Melhores Mercados por Casa (placeholder) */}
            {melhorMercadoPorCasa.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Melhores Mercados por Casa
                        </CardTitle>
                        <CardDescription>
                            Mercados com melhor desempenho em cada casa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {melhorMercadoPorCasa.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border bg-card">
                                    <h4 className="font-bold mb-2">{item.casa}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Melhor Mercado:</span>
                                            <span className="font-semibold">{item.melhorMercado}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">ROI:</span>
                                            <span className={`font-semibold ${item.roiMercado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPercentage(item.roiMercado)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
