import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Zap,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import { formatPercentage } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { CHART_COLORS } from "@/lib/constants";

interface TurboTabProps {
    turboMetrics: any;
}

export function TurboTab({ turboMetrics }: TurboTabProps) {
    if (!turboMetrics || !turboMetrics.comTurbo || !turboMetrics.semTurbo) return null;

    const hasValidData = turboMetrics.comTurbo.total > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total com Turbo"
                    value={(turboMetrics.comTurbo?.total ?? 0).toString()}
                    icon={Zap}
                    description="Apostas turbinadas"
                />
                <KPICard
                    title="ROI Turbo"
                    value={formatPercentage(turboMetrics.comTurbo?.roi ?? 0)}
                    icon={TrendingUp}
                    description="Retorno em apostas turbo"
                />
                <KPICard
                    title="Impacto do Turbo"
                    value={formatPercentage(turboMetrics.impactoTurbo ?? 0)}
                    icon={Zap}
                    description="Diferença de ROI vs Normal"
                />
            </div>

            {hasValidData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparativo Turbo vs Normal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Com Turbo
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Taxa Acerto</span>
                                        <span className="font-medium">{formatPercentage(turboMetrics.comTurbo?.taxaAcerto ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ROI</span>
                                        <span className={`font-medium ${(turboMetrics.comTurbo?.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentage(turboMetrics.comTurbo?.roi ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-muted-foreground">Sem Turbo</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Taxa Acerto</span>
                                        <span className="font-medium">{formatPercentage(turboMetrics.semTurbo?.taxaAcerto ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ROI</span>
                                        <span className={`font-medium ${(turboMetrics.semTurbo?.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentage(turboMetrics.semTurbo?.roi ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {hasValidData && turboMetrics.porNivel && turboMetrics.porNivel.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance por Nível de Turbo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {turboMetrics.porNivel.map((nivel: any) => (
                                    <Card key={nivel.nivel} className="bg-muted/50">
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold flex items-center gap-1">
                                                    <Zap className="h-3 w-3 text-yellow-500" />
                                                    {nivel.nivel}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{nivel.total} apostas</span>
                                            </div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">ROI</span>
                                                <span className={`font-bold ${nivel.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {nivel.roi > 0 ? '+' : ''}{formatPercentage(nivel.roi ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Taxa</span>
                                                <span className="font-medium">{formatPercentage(nivel.taxaAcerto ?? 0)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!hasValidData && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Nenhuma aposta com turbo encontrada no período selecionado.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
