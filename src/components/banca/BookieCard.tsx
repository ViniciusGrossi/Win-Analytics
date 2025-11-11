import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";
import type { Bookie } from "@/types/betting";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { TransactionDialog } from "./TransactionDialog";

interface BookieCardProps {
  bookie: Bookie;
  onUpdate: () => void;
}

export function BookieCard({ bookie, onUpdate }: BookieCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hover-lift cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <Card className="p-6 glass-effect transition-all hover:shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{bookie.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Atualizado em {dayjs(bookie.last_update).format("DD/MM/YYYY HH:mm")}
                </p>
              </div>
            </div>
          </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Saldo</span>
            <span className="text-2xl font-bold">{formatCurrency(bookie.balance || 0)}</span>
          </div>

          {bookie.last_deposit && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Último depósito</span>
              <span>{dayjs(bookie.last_deposit).format("DD/MM/YYYY")}</span>
            </div>
          )}

          {bookie.last_withdraw && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Último saque</span>
              <span>{dayjs(bookie.last_withdraw).format("DD/MM/YYYY")}</span>
            </div>
          )}
        </div>
        </Card>
      </motion.div>

      <TransactionDialog
        bookie={bookie}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}
