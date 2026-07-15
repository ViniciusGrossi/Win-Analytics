import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apostasService } from "@/services/apostas";
import type { Bookie, Aposta, ApostaFormData } from "@/types/betting";
import { formatCurrency } from "@/lib/utils";
import { ApostaForm, type ApostaFormValues } from "./ApostaForm";

interface EditApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aposta: Aposta | null;
  onSuccess: () => void;
}

export function EditApostaDialog({ open, onOpenChange, aposta, onSuccess }: EditApostaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!aposta) return null;

  const handleSubmit = async (data: ApostaFormValues, selectedBookie: Bookie | null) => {
    if (!selectedBookie) return;
    setIsLoading(true);
    try {
      const dto: ApostaFormData = {
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

      await apostasService.update(aposta.id, dto);
      toast({ title: "Atualizado", description: "Aposta atualizada com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar aposta:", error);
      const errMsg = (error as { message?: string })?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao atualizar aposta";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apostasService.remove(aposta.id);
      toast({ title: "Excluído", description: "Aposta removida com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir aposta:", error);
      const errMsg = (error as { message?: string })?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao excluir aposta";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const categoriaArray = aposta.categoria ? aposta.categoria.split(",").map(c => c.trim()).filter(Boolean) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Aposta</DialogTitle>
          <DialogDescription>Altere os dados da aposta ou exclua-a</DialogDescription>
        </DialogHeader>

        {open && (
          <ApostaForm
            key={aposta.id}
            defaultValues={{
              categoria: categoriaArray,
              tipo_aposta: aposta.tipo_aposta || "",
              casa_de_apostas: aposta.casa_de_apostas || "",
              valor_apostado: aposta.valor_apostado ?? undefined,
              odd: aposta.odd ?? undefined,
              bonus: aposta.bonus || 0,
              turbo: aposta.turbo || 0,
              is_super_odd: aposta.is_super_odd ?? false,
              detalhes: aposta.detalhes || "",
              partida: aposta.partida || "",
              torneio: aposta.torneio || "",
              data: aposta.data || "",
            }}
            submitLabel="Salvar"
            submittingLabel="Salvando..."
            isSubmitting={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deleteConfirmExtra={
              <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                <div><strong>Partida:</strong> {aposta.partida || "N/A"}</div>
                <div><strong>Valor:</strong> {formatCurrency(aposta.valor_apostado || 0)}</div>
                <div><strong>Odd:</strong> {aposta.odd?.toFixed(2) || "N/A"}</div>
              </div>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
