import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { bookiesService } from "@/services/bookies";
import { apostasService } from "@/services/apostas";
import type { Bookie, Aposta, ApostaFormData } from "@/types/betting";
import { formatCurrency, cn } from "@/lib/utils";
import { CalendarIcon, Wallet, Zap, Gift, Info, Edit, Trash2, AlertTriangle, X, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  categoria: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
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

const categorias = [
  "Resultado",
  "Finalizacoes",
  "Escanteios",
  "HT",
  "FT",
  "Gols",
  "Chance Dupla",
  "Chutes ao Gol",
  "Ambas Marcam",
  "Faltas",
  "Cartoes",
  "Defesas",
  "Tiros livres",
  "Tiros de Meta",
  "Laterais",
  "Desarmes",
  "Impedimentos",
  "Handicap",
  "Outros",
];

const tiposAposta = ["Simples", "Dupla", "Tripla", "Múltipla", "Super Odd"];

const torneios = [
  "Brasileirao Serie A",
  "Brasileirao Serie B",
  "Champions League",
  "Europa League",
  "Conference League",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A Italia",
  "Ligue 1",
  "Copa do Brasil",
  "Copa Libertadores",
  "Copa Sul-Americana",
  "Liga Portugal",
  "Campeonatos Estaduais",
  "Data Fifa",
  "Championship",
  "FA Cup",
  "Carabao Cup",
  "Copa do Rei",
  "Copa da Alemanha",
  "Coppa Italia",
  "Copa da França",
  "Saudi Pro League",
  "Süper Lig (Turquia)",
];

const turboOptions = [
  { label: "Sem Turbo", value: 0 },
  { label: "+25%", value: 0.25 },
  { label: "+30%", value: 0.30 },
  { label: "+50%", value: 0.50 },
];

interface EditApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aposta: Aposta | null;
  onSuccess: () => void;
}

export function EditApostaDialog({ open, onOpenChange, aposta, onSuccess }: EditApostaDialogProps) {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [bookieSearch, setBookieSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasBonus, setHasBonus] = useState(false);
  const [selectedTurbo, setSelectedTurbo] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookieOpen, setBookieOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: [],
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
    form.setValue("turbo", selectedTurbo);
  }, [selectedTurbo]);

  useEffect(() => {
    if (open) loadBookies();
  }, [open]);

  useEffect(() => {
    if (aposta) {
      // Parse categorias: converte string separada por vírgula para array
      const categoriasArray = aposta.categoria
        ? aposta.categoria.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      form.reset({
        categoria: categoriasArray,
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
        categoria: data.categoria.join(", "), // Converte array para string
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

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const onDelete = async () => {
    if (!aposta) return;
    setShowDeleteDialog(false);
    setIsLoading(true);
    try {
      await apostasService.remove(aposta.id);
      toast({ title: "Excluído", description: "Aposta removida com sucesso" });
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
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Aposta</DialogTitle>
          <DialogDescription>Altere os dados da aposta ou exclua-a</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => {
                  const filteredCategorias = categorias.filter((cat) =>
                    cat.toLowerCase().includes(categorySearch.toLowerCase())
                  );

                  return (
                    <FormItem>
                      <FormLabel>Categorias</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                field.value.length === 0 && "text-muted-foreground"
                              )}
                            >
                              {field.value.length === 0
                                ? "Selecione categorias"
                                : `${field.value.length} selecionada(s)`}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0 z-50"
                          align="start"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <div className="flex flex-col" style={{ maxHeight: '350px', height: '350px' }}>
                            <div className="p-3 border-b flex-shrink-0 bg-popover">
                              <Input
                                placeholder="Buscar categoria..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div
                              className="flex-1 p-2"
                              style={{
                                overflowY: 'scroll',
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y',
                                overscrollBehavior: 'contain',
                                minHeight: 0
                              } as React.CSSProperties}
                              onWheel={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {filteredCategorias.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Nenhuma categoria encontrada.
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {filteredCategorias.map((cat) => (
                                    <div
                                      key={cat}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentValue = field.value || [];
                                        const newValue = currentValue.includes(cat)
                                          ? currentValue.filter((v) => v !== cat)
                                          : [...currentValue, cat];
                                        field.onChange(newValue);
                                      }}
                                      className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none"
                                    >
                                      <Checkbox
                                        checked={field.value?.includes(cat)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          const newValue = checked
                                            ? [...currentValue, cat]
                                            : currentValue.filter((v) => v !== cat);
                                          field.onChange(newValue);
                                        }}
                                      />
                                      <span className="flex-1 text-sm">{cat}</span>
                                      {field.value?.includes(cat) && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.map((cat) => (
                            <Badge
                              key={cat}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cat}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => {
                                  const newValue = field.value.filter((v) => v !== cat);
                                  field.onChange(newValue);
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                        {tiposAposta.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="casa_de_apostas"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Casa de Apostas
                  </FormLabel>
                  <Popover open={bookieOpen} onOpenChange={setBookieOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Selecione a casa"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[300px] p-0"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="flex flex-col" style={{ maxHeight: '350px', height: '350px' }}>
                        <div className="p-3 border-b flex-shrink-0 bg-popover">
                          <Input
                            placeholder="Buscar casa de apostas..."
                            value={bookieSearch}
                            onChange={(e) => setBookieSearch(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div
                          className="flex-1 p-2"
                          style={{
                            overflowY: 'scroll',
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y',
                            overscrollBehavior: 'contain',
                            minHeight: 0
                          } as React.CSSProperties}
                          onWheel={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {(() => {
                            const filteredBookies = bookies.filter((bookie) =>
                              bookie.name.toLowerCase().includes(bookieSearch.toLowerCase())
                            );
                            return filteredBookies.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Nenhuma casa encontrada.
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {filteredBookies.map((bookie) => (
                                  <div
                                    key={bookie.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(bookie.name);
                                      setSelectedBookie(bookie);
                                      setBookieOpen(false);
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none"
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        field.value === bookie.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center justify-between flex-1">
                                      <span className="text-sm">{bookie.name}</span>
                                      <span className="text-xs text-muted-foreground ml-4">
                                        {formatCurrency(bookie.balance || 0)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedBookie && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" /> Saldo disponível: {formatCurrency(selectedBookie.balance || 0)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Flamengo x Palmeiras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="torneio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Torneio</FormLabel>
                    <Popover open={tournamentOpen} onOpenChange={setTournamentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Selecione o torneio"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[300px] p-0"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-col" style={{ maxHeight: '350px', height: '350px' }}>
                          <div className="p-3 border-b flex-shrink-0 bg-popover">
                            <Input
                              placeholder="Buscar torneio..."
                              value={tournamentSearch}
                              onChange={(e) => setTournamentSearch(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div
                            className="flex-1 p-2"
                            style={{
                              overflowY: 'scroll',
                              WebkitOverflowScrolling: 'touch',
                              touchAction: 'pan-y',
                              overscrollBehavior: 'contain',
                              minHeight: 0
                            } as React.CSSProperties}
                            onWheel={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {(() => {
                              const filteredTournaments = torneios.filter((torneio) =>
                                torneio.toLowerCase().includes(tournamentSearch.toLowerCase())
                              );
                              return filteredTournaments.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Nenhum torneio encontrado.
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {filteredTournaments.map((torneio) => (
                                    <div
                                      key={torneio}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        field.onChange(torneio);
                                        setTournamentOpen(false);
                                      }}
                                      className="flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none"
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4",
                                          field.value === torneio ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="text-sm">{torneio}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Aposta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Bônus Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Bônus
                </FormLabel>
                <Button
                  type="button"
                  variant={hasBonus ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHasBonus(!hasBonus)}
                  className="transition-all"
                >
                  {hasBonus ? "Ativado" : "Desativado"}
                </Button>
              </div>

              {hasBonus && (
                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor do bônus"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Turbo Buttons */}
            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Turbo
              </FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {turboOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedTurbo === option.value ? "default" : "outline"}
                    size="default"
                    onClick={() => setSelectedTurbo(option.value)}
                    className={cn(
                      "transition-all font-semibold text-xs sm:text-sm",
                      selectedTurbo === option.value && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Tem certeza que deseja excluir esta aposta? Esta ação não pode ser desfeita.
              {aposta && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <div><strong>Partida:</strong> {aposta.partida || "N/A"}</div>
                  <div><strong>Valor:</strong> {formatCurrency(aposta.valor_apostado || 0)}</div>
                  <div><strong>Odd:</strong> {aposta.odd?.toFixed(2) || "N/A"}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
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
