import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Trophy, X, Ban, DollarSign, Zap, Gift } from "lucide-react";
import type { Aposta } from "@/types/betting";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResultadoCardProps {
  aposta: Aposta;
  onSetResult: (id: number, resultado: string, cashoutValue?: number) => Promise<void>;
}

export function ResultadoCard({ aposta, onSetResult }: ResultadoCardProps) {
  const [showCashout, setShowCashout] = useState(false);
  const [cashoutValue, setCashoutValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResult = async (resultado: string) => {
    setIsLoading(true);
    try {
      await onSetResult(aposta.id, resultado);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashout = async () => {
    const value = parseFloat(cashoutValue);
    if (isNaN(value) || value <= 0) return;
    
    setIsLoading(true);
    try {
      await onSetResult(aposta.id, "Cashout", value);
      setShowCashout(false);
    } finally {
      setIsLoading(false);
    }
  };

  const lucroBase = (aposta.valor_apostado || 0) * Math.max((aposta.odd || 0) - 1, 0);
  const lucroBonus = (aposta.bonus || 0) * Math.max((aposta.odd || 0) - 1, 0);
  const turboRaw = aposta.turbo || 0;
  const turbo = turboRaw > 1 ? turboRaw / 100 : turboRaw;
  const lucroSemTurbo = lucroBase + lucroBonus;
  const potentialProfit = turbo > 0 ? lucroSemTurbo * (1 + turbo) : lucroSemTurbo;
  const potentialReturn = (aposta.valor_apostado || 0) + potentialProfit;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hover-lift"
      >
        <Card className="p-4 glass-effect">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{aposta.partida}</h4>
                  {(aposta.turbo || 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                      <Zap className="h-3 w-3" />
                      <span>+{(aposta.turbo && aposta.turbo > 1 ? aposta.turbo : (aposta.turbo || 0) * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {(aposta.bonus || 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                      <Gift className="h-3 w-3" />
                      <span>{formatCurrency(aposta.bonus || 0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{aposta.detalhes}</p>
              </div>
              <StatusBadge status={(aposta.resultado || "Pendente") as any} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Casa:</span>{" "}
                <span className="font-medium">{aposta.casa_de_apostas}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Data:</span>{" "}
                <span className="font-medium">{formatDate(aposta.data || "")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stake:</span>{" "}
                <span className="font-medium">{formatCurrency(aposta.valor_apostado || 0)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Odd:</span>{" "}
                <span className="font-mono font-semibold text-primary">{aposta.odd?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm mb-3">
                <span className="text-muted-foreground">Retorno potencial:</span>{" "}
                <span className="font-semibold text-success">{formatCurrency(potentialReturn)}</span>
                <span className="text-muted-foreground"> (Lucro: {formatCurrency(potentialProfit)})</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleResult("Ganhou")}
                  disabled={isLoading}
                  className="bg-success hover:bg-success/90"
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Ganhou
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleResult("Perdeu")}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Perdeu
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleResult("Cancelado")}
                  disabled={isLoading}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Cancelado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCashout(true)}
                  disabled={isLoading}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Cashout
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={showCashout} onOpenChange={setShowCashout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Cashout</DialogTitle>
            <DialogDescription>
              Insira o valor que você receberá no cashout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashout-value">Valor do Cashout</Label>
              <Input
                id="cashout-value"
                type="number"
                step="0.01"
                value={cashoutValue}
                onChange={(e) => setCashoutValue(e.target.value)}
                placeholder="0.00"
              />
              {cashoutValue && !isNaN(parseFloat(cashoutValue)) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Lucro: {formatCurrency(parseFloat(cashoutValue) - (aposta.valor_apostado || 0))}
                </p>
              )}
            </div>
            <Button onClick={handleCashout} disabled={isLoading || !cashoutValue} className="w-full">
              Confirmar Cashout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
