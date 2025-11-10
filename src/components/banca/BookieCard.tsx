import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Edit } from "lucide-react";
import type { Bookie } from "@/types/betting";
import { motion } from "framer-motion";
import dayjs from "dayjs";

interface BookieCardProps {
  bookie: Bookie;
  onEdit?: (bookie: Bookie) => void;
}

export function BookieCard({ bookie, onEdit }: BookieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hover-lift"
    >
      <Card className="p-6 glass-effect">
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
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(bookie)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
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
  );
}
