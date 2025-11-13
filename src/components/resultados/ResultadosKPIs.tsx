import { useMemo } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency } from "@/lib/utils";
import { Clock, DollarSign, TrendingUp, Target } from "lucide-react";
import type { Aposta } from "@/types/betting";

interface ResultadosKPIsProps {
  apostas: Aposta[];
  isLoading: boolean;
}

export function ResultadosKPIs({ apostas, isLoading }: ResultadosKPIsProps) {
  const metrics = useMemo(() => {
    const pendentes = apostas.filter((a) => 
      a.resultado && ["Ganhou", "Perdeu", "Cashout"].includes(a.resultado)
    );
    const ganhas = pendentes.filter((a) => a.resultado === "Ganhou");
    const perdidas = pendentes.filter((a) => a.resultado === "Perdeu");

    const taxaAcerto = pendentes.length > 0
      ? (ganhas.length / pendentes.length) * 100
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Apostas Pendentes"
        value={metrics.apostasPendentes.toString()}
        icon={Clock}
        isLoading={isLoading}
        delay={0}
      />
      <KPICard
        title="Total Apostado (Pendente)"
        value={formatCurrency(metrics.totalApostadoPendente)}
        icon={DollarSign}
        isLoading={isLoading}
        delay={0.1}
      />
      <KPICard
        title="Retorno Potencial"
        value={formatCurrency(metrics.retornoPotencial)}
        icon={Target}
        isLoading={isLoading}
        delay={0.2}
      />
      <KPICard
        title="Lucro Potencial"
        value={formatCurrency(metrics.lucroPotencial)}
        subtitle={`ROI: ${metrics.roiPotencial.toFixed(2)}%`}
        icon={TrendingUp}
        isLoading={isLoading}
        delay={0.3}
      />
    </div>
  );
}
