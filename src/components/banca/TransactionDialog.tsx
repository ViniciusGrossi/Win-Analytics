import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Minus, RefreshCw, ArrowRightLeft, Gift, Settings, HelpCircle, Trash2, TrendingUp } from "lucide-react";
import { transactionsService } from "@/services/transactions";
import { bookiesService } from "@/services/bookies";
import type { Bookie, TransactionType } from "@/types/betting";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface TransactionDialogProps {
  bookie: Bookie;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const transactionTypes = [
  {
    value: 'recarga' as TransactionType,
    label: 'Recarga',
    icon: Plus,
    description: 'Adicionar dinheiro na banca',
    tooltip: 'Use quando você adicionar um valor na banca, como depósito via PIX ou transferência bancária',
    color: 'text-green-600',
  },
  {
    value: 'saque' as TransactionType,
    label: 'Saque',
    icon: Minus,
    description: 'Retirar dinheiro da banca',
    tooltip: 'Use quando você retirar dinheiro da banca para sua conta bancária',
    color: 'text-red-600',
  },
  {
    value: 'transferencia' as TransactionType,
    label: 'Transferência',
    icon: ArrowRightLeft,
    description: 'Mover entre bancas',
    tooltip: 'Use quando você transferir dinheiro de uma banca para outra',
    color: 'text-blue-600',
  },
  {
    value: 'bonus' as TransactionType,
    label: 'Bônus',
    icon: Gift,
    description: 'Bônus recebido',
    tooltip: 'Use quando receber bônus da casa de apostas (cashback, promoções, etc)',
    color: 'text-purple-600',
  },
  {
    value: 'outros_esportes' as TransactionType,
    label: 'Esportes',
    icon: TrendingUp,
    description: 'Ganhos em outros esportes',
    tooltip: 'Use quando ganhar apostas em outros esportes (NBA, NFL, etc) e quiser adicionar o lucro sem registrar a aposta no sistema',
    color: 'text-orange-600',
  },
];

export function TransactionDialog({ bookie, open, onOpenChange, onSuccess }: TransactionDialogProps) {
  const [amount, setAmount] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTransaction = async (type: TransactionType) => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast({ title: "Erro", description: "Valor inválido", variant: "destructive" });
      return;
    }

    if (type === 'saque' && value > (bookie.balance || 0)) {
      toast({ title: "Erro", description: "Saldo insuficiente", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      let newBalanceValue = bookie.balance || 0;

      // Calcula o novo saldo baseado no tipo
      if (type === 'recarga' || type === 'bonus' || type === 'outros_esportes') {
        newBalanceValue += value;
      } else if (type === 'saque' || type === 'transferencia') {
        newBalanceValue -= value;
      }

      // Gera descrição padrão se não fornecida
      const finalDescription = description || `${getTypeName(type)} na ${bookie.name}`;

      await transactionsService.create(bookie.id, value, type, finalDescription);
      await bookiesService.updateBalance(bookie.id, newBalanceValue);

      toast({
        title: "Sucesso",
        description: `${getTypeName(type)} ${type === 'saque' || type === 'transferencia' ? 'realizado' : 'realizada'} com sucesso`
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao processar transação", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjust = async () => {
    const value = parseFloat(newBalance);
    if (isNaN(value) || value < 0) {
      toast({ title: "Erro", description: "Valor inválido", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const difference = value - (bookie.balance || 0);
      const finalDescription = description || `Ajuste manual de saldo - ${bookie.name}`;

      // Registra o ajuste como transação
      await transactionsService.create(bookie.id, Math.abs(difference), 'ajuste', finalDescription);
      await bookiesService.updateBalance(bookie.id, value);

      toast({
        title: "Sucesso",
        description: "Saldo ajustado com sucesso"
      });

      resetForm();
      setShowAdjust(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao ajustar saldo", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setNewBalance("");
    setDescription("");
  };

  const getTypeName = (type: TransactionType): string => {
    const found = transactionTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await bookiesService.delete(bookie.id);
      toast({
        title: "Sucesso",
        description: "Casa de apostas excluída com sucesso"
      });
      setShowDeleteConfirm(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir casa de apostas", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <DialogTitle>{bookie.name}</DialogTitle>
              <DialogDescription>
                Saldo atual: <span className="font-bold text-foreground">{formatCurrency(bookie.balance || 0)}</span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!showAdjust ? (
          <>
            <Tabs defaultValue="recarga" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {transactionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <TooltipProvider key={type.value}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value={type.value} className="flex items-center gap-1">
                            <Icon className={`h-4 w-4 ${type.color}`} />
                            <span className="hidden sm:inline">{type.label}</span>
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{type.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </TabsList>

              {transactionTypes.map((type) => (
                <TabsContent key={type.value} value={type.value} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${type.value}-amount`}>Valor (R$)</Label>
                    <Input
                      id={`${type.value}-amount`}
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="0.01"
                      min="0"
                      max={type.value === 'saque' || type.value === 'transferencia' ? bookie.balance || 0 : undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${type.value}-desc`}>Descrição (opcional)</Label>
                    <Textarea
                      id={`${type.value}-desc`}
                      placeholder={`Ex: ${type.description}`}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => handleTransaction(type.value)}
                    disabled={isLoading}
                    className="w-full"
                    variant={type.value === 'saque' || type.value === 'transferencia' ? 'destructive' : 'default'}
                  >
                    Confirmar {type.label}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdjust(true)}
                className="w-full flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Ajuste Manual de Saldo
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 ml-auto text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Use apenas para corrigir erros ou discrepâncias no saldo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Use esta opção apenas para corrigir erros ou discrepâncias no saldo.
                  Para transações normais, use as opções acima.
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-balance">Novo Saldo (R$)</Label>
              <Input
                id="new-balance"
                type="number"
                placeholder={formatCurrency(bookie.balance || 0)}
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                step="0.01"
                min="0"
              />
              {newBalance && !isNaN(parseFloat(newBalance)) && (
                <p className="text-sm text-muted-foreground">
                  Diferença: {formatCurrency(parseFloat(newBalance) - (bookie.balance || 0))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-desc">Motivo do Ajuste</Label>
              <Textarea
                id="adjust-desc"
                placeholder="Ex: Correção de valor lançado incorretamente"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdjust(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={isLoading || !newBalance}
                className="flex-1"
                variant="secondary"
              >
                Confirmar Ajuste
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Casa de Apostas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{bookie.name}</strong>?
              <br />
              Esta ação não pode ser desfeita e todas as transações relacionadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
