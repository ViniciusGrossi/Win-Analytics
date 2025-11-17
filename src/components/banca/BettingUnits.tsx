import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BettingUnitsProps {
  totalBalance: number;
}

export function BettingUnits({ totalBalance }: BettingUnitsProps) {
  // 1 unidade = 2% da banca total
  const unidade = totalBalance * 0.02;

  const units = [
    { multiplier: 0.25, label: "0.25 unidades" },
    { multiplier: 0.5, label: "0.5 unidades" },
    { multiplier: 0.75, label: "0.75 unidades" },
    { multiplier: 1, label: "1 unidade" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Unidades de Aposta</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            1 unidade = 2% da banca
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {units.map((unit, index) => (
            <motion.div
              key={unit.multiplier}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="group relative overflow-hidden bg-card hover:bg-accent/50 border-2 border-primary/20 hover:border-primary/40 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="text-sm text-muted-foreground mb-2 font-medium">
                  {unit.label}
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(unidade * unit.multiplier)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(unit.multiplier * 2).toFixed(2)}% da banca
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {totalBalance === 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 Adicione saldo às suas casas de apostas para calcular as unidades
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
