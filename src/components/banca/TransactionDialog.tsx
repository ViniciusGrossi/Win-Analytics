import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from "lucide-react";
import { transactionsService } from "@/services/transactions";
import { bookiesService } from "@/services/bookies";
import type { Bookie } from "@/types/betting";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface TransactionDialogProps {
  bookie: Bookie;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransactionDialog({ bookie, open, onOpenChange, onSuccess }: TransactionDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTransaction = async (type: "deposit" | "withdraw") => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast({ title: "Erro", description: "Valor inválido", variant: "destructive" });
      return;
    }

    if (type === "withdraw" && value > (bookie.balance || 0)) {
      toast({ title: "Erro", description: "Saldo insuficiente", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const newBalance = type === "deposit" 
        ? (bookie.balance || 0) + value 
        : (bookie.balance || 0) - value;

      await transactionsService.create(bookie.id, value, type, description || `${type === "deposit" ? "Depósito" : "Saque"} na ${bookie.name}`);
      await bookiesService.updateBalance(bookie.id, newBalance);

      toast({ title: "Sucesso", description: `${type === "deposit" ? "Depósito" : "Saque"} realizado com sucesso` });
      setAmount("");
      setDescription("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao processar transação", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bookie.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Saldo atual: {formatCurrency(bookie.balance || 0)}
          </p>
        </DialogHeader>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">
              <Plus className="h-4 w-4 mr-2" />
              Depósito
            </TabsTrigger>
            <TabsTrigger value="withdraw">
              <Minus className="h-4 w-4 mr-2" />
              Saque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Valor</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit-desc">Descrição (opcional)</Label>
              <Textarea
                id="deposit-desc"
                placeholder="Ex: Depósito inicial, recarga..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleTransaction("deposit")}
              disabled={isLoading}
              className="w-full"
            >
              Confirmar Depósito
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Valor</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                max={bookie.balance || 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-desc">Descrição (opcional)</Label>
              <Textarea
                id="withdraw-desc"
                placeholder="Ex: Saque para conta bancária..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleTransaction("withdraw")}
              disabled={isLoading}
              className="w-full"
              variant="destructive"
            >
              Confirmar Saque
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
