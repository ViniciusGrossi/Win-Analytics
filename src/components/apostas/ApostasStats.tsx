import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Percent } from "lucide-react";
import type { Aposta } from "@/types/betting";
import { motion } from "framer-motion";

interface ApostasStatsProps {
  apostas: Aposta[];
}

export function ApostasStats({ apostas }: ApostasStatsProps) {
  const stats = useMemo(() => {
    const finalizadas = apostas.filter((a) => 
      a.resultado && ["Ganhou", "Perdeu", "Cashout"].includes(a.resultado)
    );
    const ganhas = finalizadas.filter((a) => a.resultado === "Ganhou");
    const perdidas = finalizadas.filter((a) => a.resultado === "Perdeu");

    const taxaAcerto = finalizadas.length > 0
      ? (ganhas.length / finalizadas.length) * 100
      : 0;

    const oddMedia = apostas.length > 0
      ? apostas.reduce((sum, a) => sum + (a.odd || 0), 0) / apostas.length
      : 0;

    return {
      totalApostas: apostas.length,
      ganhas: ganhas.length,
      perdidas: perdidas.length,
      taxaAcerto,
      oddMedia,
    };
  }, [apostas]);

  const statCards = [
    {
      label: "Taxa de Acerto",
      value: `${stats.taxaAcerto.toFixed(1)}%`,
      icon: Target,
      color: "text-primary",
      delay: 0,
    },
    {
      label: "Apostas Ganhas",
      value: stats.ganhas.toString(),
      icon: TrendingUp,
      color: "text-green-500",
      delay: 0.1,
    },
    {
      label: "Apostas Perdidas",
      value: stats.perdidas.toString(),
      icon: TrendingDown,
      color: "text-red-500",
      delay: 0.2,
    },
    {
      label: "Odd Média",
      value: stats.oddMedia.toFixed(2),
      icon: Percent,
      color: "text-blue-500",
      delay: 0.3,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {statCards.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stat.delay }}
        >
          <Card className="glass-effect">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                <span className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
