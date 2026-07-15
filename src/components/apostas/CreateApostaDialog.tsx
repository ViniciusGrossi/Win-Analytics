import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apostasService } from "@/services/apostas";
import type { Bookie, ApostaFormData } from "@/types/betting";
import { ApostaForm, type ApostaFormValues } from "./ApostaForm";

interface CreateApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateApostaDialog({ open, onOpenChange, onSuccess }: CreateApostaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ApostaFormValues, selectedBookie: Bookie | null) => {
    if (!selectedBookie) return;
    setIsLoading(true);
    try {
      const apostaData: ApostaFormData = {
        categoria: data.categoria.join(", "),
        tipo_aposta: data.tipo_aposta,
        casa_de_apostas: data.casa_de_apostas,
        valor_apostado: data.valor_apostado,
        odd: data.odd,
        bonus: data.bonus,
        turbo: data.turbo,
        is_super_odd: data.is_super_odd,
        detalhes: data.detalhes,
        partida: data.partida,
        torneio: data.torneio,
        data: data.data,
      };

      await apostasService.create(apostaData, selectedBookie.balance || 0, data.bonus > 0);

      toast({ title: "Sucesso!", description: "Aposta criada com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar aposta:", error);
      const errMsg = (error as { message?: string })?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao criar aposta";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nova Aposta</DialogTitle>
          <DialogDescription>
            Preencha os dados da sua aposta e acompanhe o retorno potencial
          </DialogDescription>
        </DialogHeader>

        {/* Montar só quando aberto: garante formulário limpo a cada abertura, sem reset manual. */}
        {open && (
          <ApostaForm
            submitLabel="Criar Aposta"
            submittingLabel="Criando..."
            isSubmitting={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
