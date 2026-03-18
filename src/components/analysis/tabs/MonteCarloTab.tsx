import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { runMonteCarloSimulation, MonteCarloResult } from "@/utils/monteCarlo";
import type { Aposta } from "@/types/betting";

interface MonteCarloTabProps {
  apostas: Aposta[];
}

export function MonteCarloTab({ apostas }: MonteCarloTabProps) {
  const [stake, setStake] = useState<number>(50);
  const [numBets, setNumBets] = useState<number>(100);
  const [numPaths, setNumPaths] = useState<number>(1000);
  const [bankroll, setBankroll] = useState<number>(1000);
  const [result, setResult] = useState<MonteCarloResult | null>(null);

  // Derive historical stats
  const stats = useMemo(() => {
    const validBets = apostas.filter(a => a.resultado === "Ganhou" || a.resultado === "Perdeu");
    const totalBets = validBets.length;
    if (totalBets === 0) return { winRate: 0.5, averageOdd: 2.0 };

    const wins = validBets.filter(a => a.resultado === "Ganhou").length;
    const winRate = wins / totalBets;

    const totalOdds = validBets.reduce((acc, bet) => acc + (bet.odd || 0), 0);
    const averageOdd = totalOdds / totalBets;

    return { winRate, averageOdd };
  }, [apostas]);

  const runSimulation = () => {
    if (stats.winRate === 0) return;
    
    const simResult = runMonteCarloSimulation({
      initialBankroll: bankroll,
      winRate: Math.max(0.1, stats.winRate), // avoid completely flat lines
      averageOdd: Math.max(1.1, stats.averageOdd),
      stake,
      numBets,
      numPaths,
    });
    setResult(simResult);
  };

  // Run initial simulation
  useEffect(() => {
    if (stats.winRate > 0) {
      runSimulation();
    }
  }, [stats]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (!result) return [];
    
    const data = [];
    for (let i = 0; i <= numBets; i++) {
      const point: any = { step: i, Media: result.averagePath[i] };
      result.paths.forEach((path, pathIndex) => {
        point[`path_${pathIndex}`] = path[i];
      });
      data.push(point);
    }
    return data;
  }, [result, numBets]);

  if (apostas.length < 5) {
    return (
      <Card className="border-muted bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 text-gold-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Dados Insuficientes para Simulação</h3>
          <p className="text-muted-foreground">
            O Simulador de Risco Monte Carlo precisa de pelo menos 5 apostas com resultado definido para calcular sua taxa de acerto e odd média real.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-muted bg-card/30">
          <CardHeader>
            <CardTitle className="text-lg">Parâmetros de Simulação</CardTitle>
            <CardDescription>Ajuste os valores para projetar cenários estatísticos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Histórico Atual</Label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-muted p-2 rounded-md">
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                  <div className="font-mono text-sm">{formatPercentage(stats.winRate * 100)}</div>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <div className="text-[10px] text-muted-foreground">Odd Média</div>
                  <div className="font-mono text-sm">{stats.averageOdd.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Banca Inicial Simulada</Label>
              <Input 
                type="number" 
                value={bankroll} 
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="space-y-3">
              <Label>Unidade (Stake) Fixa</Label>
              <Input 
                type="number" 
                value={stake} 
                onChange={(e) => setStake(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Apostas a Simular: {numBets}</Label>
              </div>
              <Slider
                value={[numBets]}
                onValueChange={(val) => setNumBets(val[0])}
                max={500}
                min={10}
                step={10}
              />
            </div>
            
            <Button onClick={runSimulation} className="w-full gap-2">
              <Play className="h-4 w-4" /> Recalcular Risco
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-destructive/30 bg-destructive/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <TrendingDown className="h-12 w-12 text-destructive" />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-destructive font-medium mb-1">Risco de Ruína (Quebra)</p>
                  <h3 className="text-2xl font-bold font-mono">{result.ruinProbability.toFixed(1)}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chance de zerar a banca em {numBets} apostas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gold-500/30 bg-gold-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <TrendingUp className="h-12 w-12 text-gold-500" />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gold-400 font-medium mb-1">Lucro Médio Esperado</p>
                  <h3 className="text-2xl font-bold font-mono">{formatCurrency(result.expectedProfit)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Projeção matemática (+EV)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-muted bg-card/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Activity className="h-12 w-12" />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Pior / Melhor Cenário</p>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-lg font-bold font-mono text-destructive">{formatCurrency(result.worstCase)}</span>
                    <span className="text-muted-foreground text-xs">até</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(result.bestCase)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-muted bg-card/30">
            <CardHeader>
              <CardTitle>Funil de Probabilidades (Monte Carlo)</CardTitle>
              <CardDescription>
                Projeção de 1.000 caminhos aleatórios (random walks) baseados no seu histórico real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="step" 
                      stroke="#888" 
                      tick={{ fill: '#888' }} 
                      tickFormatter={(val) => `Aposta ${val}`}
                    />
                    <YAxis 
                      stroke="#888" 
                      tick={{ fill: '#888' }}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                      labelFormatter={(label) => `Aposta ${label}`}
                      itemStyle={{ color: '#d4af37' }}
                      formatter={(value: number, name: string) => {
                        if (name === "Media") return [formatCurrency(value), "Caminho Médio Esperado"];
                        return [formatCurrency(value), "Caminho Simulado"];
                      }}
                    />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={bankroll} stroke="#888" strokeDasharray="3 3" />
                    
                    {/* Render visual paths with low opacity */}
                    {result?.paths.map((_, i) => (
                      <Line 
                        key={i} 
                        type="monotone" 
                        dataKey={`path_${i}`} 
                        stroke="#666" 
                        strokeWidth={1} 
                        dot={false} 
                        activeDot={false} 
                        isAnimationActive={false}
                        opacity={0.1}
                      />
                    ))}
                    
                    {/* Render expected path clearly */}
                    <Line 
                      type="monotone" 
                      dataKey="Media" 
                      stroke="#d4af37" 
                      strokeWidth={3} 
                      dot={false} 
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
