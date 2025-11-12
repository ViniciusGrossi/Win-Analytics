import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { bookiesService } from "@/services/bookies";
import { apostasService } from "@/services/apostas";
import type { Bookie, Aposta, ApostaFormData } from "@/types/betting";
import { formatCurrency, cn } from "@/lib/utils";
import { CalendarIcon, Wallet, Zap, Gift, Info, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  tipo_aposta: z.string().min(1, "Tipo de aposta é obrigatório"),
  casa_de_apostas: z.string().min(1, "Casa de apostas é obrigatória"),
  valor_apostado: z.number().min(0.01, "Valor mínimo é R$ 0,01"),
  odd: z.number().min(1.01, "Odd mínima é 1.01"),
  bonus: z.number().min(0).default(0),
  turbo: z.number().min(0).default(0),
  detalhes: z.string().optional(),
  partida: z.string().optional(),
  torneio: z.string().optional(),
  data: z.date({ required_error: "Data é obrigatória" }),
});

type FormData = z.infer<typeof formSchema>;

interface EditApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aposta: Aposta | null;
  onSuccess: () => void;
}

export function EditApostaDialog({ open, onOpenChange, aposta, onSuccess }: EditApostaDialogProps) {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBonus, setHasBonus] = useState(false);
  const [selectedTurbo, setSelectedTurbo] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: "",
      tipo_aposta: "",
      casa_de_apostas: "",
      valor_apostado: undefined as any,
      odd: undefined as any,
      bonus: 0,
      turbo: 0,
      detalhes: "",
      partida: "",
      torneio: "",
      data: undefined as any,
    },
  });

  useEffect(() => {
    if (open) loadBookies();
  }, [open]);

  useEffect(() => {
    if (aposta) {
      form.reset({
        categoria: aposta.categoria || "",
        tipo_aposta: aposta.tipo_aposta || "",
        casa_de_apostas: aposta.casa_de_apostas || "",
        valor_apostado: aposta.valor_apostado || undefined as any,
        odd: aposta.odd || undefined as any,
        bonus: aposta.bonus || 0,
        turbo: aposta.turbo || 0,
        detalhes: aposta.detalhes || "",
        partida: aposta.partida || "",
        torneio: aposta.torneio || "",
        data: aposta.data ? new Date(aposta.data) : undefined as any,
      });
      setHasBonus(Boolean(aposta.bonus && aposta.bonus > 0));
      setSelectedTurbo(aposta.turbo || 0);
    }
  }, [aposta]);

  const loadBookies = async () => {
    try {
      const data = await bookiesService.list();
      setBookies(data);
      if (aposta) {
        const b = data.find((bb) => bb.name === aposta.casa_de_apostas);
        setSelectedBookie(b || null);
      }
    } catch (error) {
      console.error("Erro ao carregar casas:", error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!aposta) return;
    if (!selectedBookie) {
      toast({ title: "Erro", description: "Selecione uma casa de apostas", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const dto: ApostaFormData = {
        categoria: data.categoria,
        tipo_aposta: data.tipo_aposta,
        casa_de_apostas: data.casa_de_apostas,
        valor_apostado: data.valor_apostado,
        odd: data.odd,
        bonus: hasBonus ? data.bonus : 0,
        turbo: selectedTurbo,
        detalhes: data.detalhes,
        partida: data.partida,
        torneio: data.torneio,
        data: format(data.data, "yyyy-MM-dd"),
      };

      await apostasService.update(aposta.id, dto);
      toast({ title: "Atualizado", description: "Aposta atualizada com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao atualizar aposta:", error);
      const errMsg = (error as any)?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao atualizar aposta";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!aposta) return;
    const confirmed = window.confirm("Tem certeza que deseja excluir esta aposta?");
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await apostasService.remove(aposta.id);
      toast({ title: "Excluído", description: "Aposta removida" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao excluir aposta:", error);
      const errMsg = (error as any)?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao excluir aposta";
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!aposta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Aposta</DialogTitle>
          <DialogDescription>Altere os dados da aposta ou exclua-a</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Resultado">Resultado</SelectItem>
                        <SelectItem value="Gols">Gols</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_aposta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Aposta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Simples">Simples</SelectItem>
                        <SelectItem value="Dupla">Dupla</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_apostado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Apostado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Digite o valor"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odd</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Digite a odd"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
