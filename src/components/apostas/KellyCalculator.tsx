import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { bookiesService } from "@/services/bookies";

export function KellyCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [bankroll, setBankroll] = useState<number>(0);
  const [odd, setOdd] = useState<number>(2.0);
  const [probability, setProbability] = useState<number>(50);
  
  // Carregar banca real
  useEffect(() => {
    const loadBankroll = async () => {
      try {
        const bookies = await bookiesService.list();
        const totalBalance = bookies.reduce((sum, bookie) => sum + (bookie.balance || 0), 0);
        setBankroll(totalBalance);
      } catch (error) {
        console.error("Erro ao carregar banca:", error);
      }
    };
    
    if (isOpen) {
      loadBankroll();
    }
  }, [isOpen]);
  
  // Calcular probabilidade implícita da odd
  useEffect(() => {
    if (odd >= 1.01) {
      const impliedProbability = (1 / odd) * 100;
      setProbability(Math.round(impliedProbability));
    }
  }, [odd]);
  
  // Critério de Kelly: f = (p*b - (1-p)) / b
  // onde p = probabilidade de vitória, b = odd - 1
  const calculateKelly = () => {
    const p = probability / 100;
    const b = odd - 1;
    const kelly = (p * b - (1 - p)) / b;
    
    // Kelly fracionário (recomendado: 25% do Kelly completo para reduzir volatilidade)
    const fractionalKelly = kelly * 0.25;
    
    return {
      fullKelly: Math.max(0, kelly),
      fractionalKelly: Math.max(0, fractionalKelly),
      fullStake: Math.max(0, bankroll * kelly),
      fractionalStake: Math.max(0, bankroll * fractionalKelly),
    };
  };
  
  const kelly = calculateKelly();
  
  const getRecommendation = () => {
    if (kelly.fullKelly <= 0) {
      return {
        text: "Aposta não recomendada",
        description: "A probabilidade estimada não justifica o risco nessa odd",
        color: "text-destructive",
      };
    }
    
    if (kelly.fullKelly > 0.15) {
      return {
        text: "Oportunidade forte",
        description: "Alta expectativa de valor, mas considere Kelly fracionário",
        color: "text-green-600",
      };
    }
    
    if (kelly.fullKelly > 0.05) {
      return {
        text: "Oportunidade moderada",
        description: "Valor positivo identificado",
        color: "text-yellow-600",
      };
    }
    
    return {
      text: "Oportunidade pequena",
      description: "Valor positivo mínimo",
      color: "text-blue-600",
    };
  };
  
  const recommendation = getRecommendation();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          Calculadora Kelly
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calculadora de Kelly Criterion
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankroll">Banca Total</Label>
              <Input
                id="bankroll"
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                min={0}
                step={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="odd">Odd da Aposta</Label>
              <Input
                id="odd"
                type="number"
                value={odd}
                onChange={(e) => setOdd(Number(e.target.value))}
                min={1.01}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="probability">
                Probabilidade (%)
                <span className="text-xs text-muted-foreground ml-2">
                  Sugerido: {((1 / odd) * 100).toFixed(1)}%
                </span>
              </Label>
              <Input
                id="probability"
                type="number"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
          
          {/* Slider para probabilidade */}
          <div className="space-y-2">
            <Label>Ajuste de Probabilidade: {probability}%</Label>
            <Slider
              value={[probability]}
              onValueChange={(value) => setProbability(value[0])}
              min={0}
              max={100}
              step={1}
            />
          </div>
          
          {/* Resultados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Kelly Completo
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(kelly.fullStake)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(kelly.fullKelly * 100).toFixed(2)}% da banca
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/5 to-background border-green-500/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calculator className="w-4 h-4" />
                  Kelly Fracionário (25%)
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(kelly.fractionalStake)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(kelly.fractionalKelly * 100).toFixed(2)}% da banca
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recomendação */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${recommendation.color}`} />
                <div className="space-y-1">
                  <div className={`font-semibold ${recommendation.color}`}>
                    {recommendation.text}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Informações adicionais */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
            <div className="font-semibold text-sm text-blue-600">
              💡 Sobre o Critério de Kelly
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>Kelly Completo:</strong> Maximiza o crescimento da banca a longo prazo, mas com alta volatilidade</p>
              <p>• <strong>Kelly Fracionário (25%):</strong> Recomendado para reduzir risco e volatilidade</p>
              <p>• <strong>Importante:</strong> A estimativa de probabilidade é subjetiva. Seja conservador!</p>
              <p>• <strong>Nunca aposte mais de 5%:</strong> Mesmo que o Kelly sugira valores maiores</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
