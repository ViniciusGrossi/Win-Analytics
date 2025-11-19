import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { bookiesService } from "@/services/bookies";
import { BookieCard } from "@/components/banca/BookieCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { TransactionsHistory } from "@/components/banca/TransactionsHistory";
import { GoalsManager } from "@/components/banca/GoalsManager";
import { BettingUnits } from "@/components/banca/BettingUnits";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, Calendar, Plus } from "lucide-react";
import type { Bookie } from "@/types/betting";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Banca() {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateBookie = async () => {
    const name = newName.trim();
    const balance = parseFloat(initialBalance || "0");
    if (!name) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da casa de apostas", variant: "destructive" });
      return;
    }
    if (isNaN(balance) || balance < 0) {
      toast({ title: "Saldo inválido", description: "Informe um saldo inicial válido", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await bookiesService.create(name, balance);
      toast({ title: "Sucesso", description: "Casa de apostas criada" });
      setCreateOpen(false);
      setNewName("");
      setInitialBalance("");
      await loadBookies();
    } catch (error) {
      console.error("Erro ao criar casa:", error);
      const errMsg = (error as any)?.message || "Erro ao criar casa de apostas";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsCreating(false);
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
    <div className="space-y-6 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col sm:flex-row gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Banca</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas casas de apostas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Casa
          </Button>
        </div>
      </motion.div>

      <div className="space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : bookies.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle>Nova Casa de Apostas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookie-name">Nome da Casa</Label>
              <Input
                id="bookie-name"
                placeholder="Ex: Bet365"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookie-balance">Saldo Inicial (R$)</Label>
              <Input
                id="bookie-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={isCreating}>Cancelar</Button>
              <Button className="flex-1" onClick={handleCreateBookie} disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
