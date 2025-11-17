import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { bookiesService } from "@/services/bookies";
import { BookieCard } from "@/components/banca/BookieCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { TransactionsHistory } from "@/components/banca/TransactionsHistory";
import { GoalsManager } from "@/components/banca/GoalsManager";
import { BettingUnits } from "@/components/banca/BettingUnits";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, Calendar } from "lucide-react";
import type { Bookie } from "@/types/betting";
import dayjs from "dayjs";

export default function Banca() {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookies();
  }, []);

  const loadBookies = async () => {
    setIsLoading(true);
    try {
      const data = await bookiesService.list();
      const sorted = data.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      setBookies(sorted);
    } catch (error) {
      console.error("Erro ao carregar bookies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = bookies.reduce((sum, b) => sum + (b.balance || 0), 0);
  const maiorCasa = bookies.reduce((max, b) => 
    (b.balance || 0) > (max.balance || 0) ? b : max
  , bookies[0] || { name: "-", balance: 0 });
  
  const maisRecente = bookies.reduce((recent, b) => 
    dayjs(b.last_update).isAfter(dayjs(recent.last_update)) ? b : recent
  , bookies[0] || { last_update: new Date().toISOString() });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Banca</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas casas de apostas</p>
        </div>
      </motion.div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            title="Saldo Total"
            value={formatCurrency(totalBalance)}
            icon={Wallet}
            isLoading={isLoading}
            delay={0}
          />
          <KPICard
            title="Maior Casa"
            value={`${maiorCasa?.name || "-"} (${formatCurrency(maiorCasa?.balance || 0)})`}
            icon={TrendingUp}
            isLoading={isLoading}
            delay={0.1}
          />
          <KPICard
            title="Última Atualização"
            value={maisRecente ? dayjs(maisRecente.last_update).format("DD/MM/YYYY") : "-"}
            icon={Calendar}
            isLoading={isLoading}
            delay={0.2}
          />
        </div>

        <BettingUnits totalBalance={totalBalance} />

        <GoalsManager />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : bookies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookies.map((bookie) => (
              <BookieCard key={bookie.id} bookie={bookie} onUpdate={loadBookies} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma casa de apostas cadastrada
          </div>
        )}

        <TransactionsHistory />
      </div>
    </div>
  );
}
