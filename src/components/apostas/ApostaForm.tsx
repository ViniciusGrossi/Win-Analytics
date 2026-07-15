import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { Bookie } from "@/types/betting";
import { formatCurrency, cn } from "@/lib/utils";
import { TURBO_OPTIONS } from "@/lib/apostas-constants";
import { TrendingUp, Wallet, Zap, Gift, Info, Trash2, AlertTriangle, X, Check, ChevronsUpDown, Star } from "lucide-react";
import { useApostaFormOptions } from "@/hooks/useApostaFormOptions";

// Fonte única de validação — usada por Create, Edit e Import, para que os
// três caminhos de cadastro de aposta se comportem de forma idêntica.
export const apostaFormSchema = z.object({
  categoria: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  tipo_aposta: z.string().min(1, "Tipo de aposta é obrigatório"),
  casa_de_apostas: z.string().min(1, "Casa de apostas é obrigatória"),
  valor_apostado: z.number({ invalid_type_error: "Valor obrigatório" }).min(0, "Valor não pode ser negativo"),
  odd: z.number({ invalid_type_error: "Odd obrigatória" }).min(1.01, "Odd mínima é 1.01"),
  bonus: z.number().min(0).default(0),
  turbo: z.number().min(0).default(0),
  is_super_odd: z.boolean().default(false),
  detalhes: z.string().optional(),
  partida: z.string().optional(),
  torneio: z.string().optional(),
  data: z.string().min(1, "Data é obrigatória"),
}).refine((data) => data.valor_apostado > 0 || data.bonus > 0, {
  message: "Informe um valor apostado ou bônus",
  path: ["bonus"],
});

export type ApostaFormValues = z.infer<typeof apostaFormSchema>;

const turboOptions = [...TURBO_OPTIONS];

interface ApostaFormProps {
  defaultValues?: Partial<ApostaFormValues>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting?: boolean;
  onSubmit: (data: ApostaFormValues, selectedBookie: Bookie | null) => Promise<void> | void;
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  /** Resumo opcional (partida/valor/odd) mostrado no diálogo de confirmação de exclusão. */
  deleteConfirmExtra?: React.ReactNode;
  /** Campos que uma extração por IA não conseguiu preencher — ficam com destaque vermelho até serem tocados. */
  missingFields?: Set<string>;
  onFieldFilled?: (field: string) => void;
}

const emptyDefaults: ApostaFormValues = {
  categoria: [],
  tipo_aposta: "",
  casa_de_apostas: "",
  valor_apostado: undefined as unknown as number,
  odd: undefined as unknown as number,
  bonus: 0,
  turbo: 0,
  is_super_odd: false,
  detalhes: "",
  partida: "",
  torneio: "",
  data: "",
};

export function ApostaForm({
  defaultValues,
  submitLabel,
  submittingLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
  onDelete,
  isDeleting = false,
  deleteConfirmExtra,
  missingFields,
  onFieldFilled,
}: ApostaFormProps) {
  const { bookies, tiposOptions, torneiosOptions, categoriasOptions } = useApostaFormOptions();

  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [bookieSearch, setBookieSearch] = useState("");
  const [hasBonus, setHasBonus] = useState((defaultValues?.bonus ?? 0) > 0);
  const [isSuperOdd, setIsSuperOdd] = useState(defaultValues?.is_super_odd ?? false);
  const [selectedTurbo, setSelectedTurbo] = useState(defaultValues?.turbo ?? 0);
  const [bookieOpen, setBookieOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [oddInputs, setOddInputs] = useState<string[]>(
    defaultValues?.odd ? [String(defaultValues.odd)] : [""]
  );

  const form = useForm<ApostaFormValues>({
    resolver: zodResolver(apostaFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  // Sincroniza o form quando defaultValues muda (ex: troca de aposta no Edit, ou nova extração no Import).
  useEffect(() => {
    if (!defaultValues) return;
    form.reset({ ...emptyDefaults, ...defaultValues });
    setHasBonus((defaultValues.bonus ?? 0) > 0);
    setIsSuperOdd(defaultValues.is_super_odd ?? false);
    setSelectedTurbo(defaultValues.turbo ?? 0);
    setOddInputs([defaultValues.odd ? String(defaultValues.odd) : ""]);
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const bookie = bookies.find((b) => b.name === form.getValues("casa_de_apostas"));
    setSelectedBookie(bookie ?? null);
  }, [bookies, form]);

  useEffect(() => {
    form.setValue("turbo", selectedTurbo);
  }, [selectedTurbo, form]);

  const computedOdd = oddInputs.reduce((acc, v) => {
    const n = parseFloat(v);
    return isFinite(n) && n > 1 ? acc * n : acc;
  }, 1);

  useEffect(() => {
    form.setValue("odd", computedOdd > 1 ? parseFloat(computedOdd.toFixed(2)) : (undefined as unknown as number), { shouldValidate: false });
    if (computedOdd > 1) clearMissing("odd");
  }, [oddInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  const isMissing = (field: string) => missingFields?.has(field) ?? false;
  const clearMissing = (field: string) => onFieldFilled?.(field);

  const valorApostado = form.watch("valor_apostado") || 0;
  const odd = form.watch("odd") || 1;
  const bonus = hasBonus ? (form.watch("bonus") || 0) : 0;

  const lucroBase = valorApostado * (odd - 1);
  const lucroBonus = bonus * (odd - 1);
  const lucroTotal = lucroBase + lucroBonus;
  const turboProfit = lucroTotal * selectedTurbo;
  const lucroPotencial = lucroTotal + turboProfit;
  const retornoPotencial = valorApostado + lucroPotencial;

  const handleSubmit = async (data: ApostaFormValues) => {
    if (!selectedBookie) {
      toast({ title: "Erro", description: "Selecione uma casa de apostas", variant: "destructive" });
      return;
    }
    if (data.valor_apostado > (selectedBookie.balance || 0)) {
      toast({
        title: "Saldo Insuficiente",
        description: `Você possui apenas ${formatCurrency(selectedBookie.balance || 0)} na ${selectedBookie.name}`,
        variant: "destructive",
      });
      return;
    }
    await onSubmit(
      { ...data, bonus: hasBonus ? data.bonus : 0, turbo: selectedTurbo, is_super_odd: isSuperOdd },
      selectedBookie
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {valorApostado > 0 && odd > 1 && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Retorno Potencial</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-1">{formatCurrency(retornoPotencial)}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Valor apostado:</span>
                <span className="text-foreground font-semibold">{formatCurrency(valorApostado)}</span>
              </div>
              {bonus > 0 && (
                <div className="flex justify-between">
                  <span>Bônus:</span>
                  <span className="text-foreground font-semibold">{formatCurrency(bonus)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Lucro base:</span>
                <span className="text-green-600 font-semibold">{formatCurrency(lucroTotal)}</span>
              </div>
              {turboProfit > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>+ Lucro do turbo:</span>
                  <span className="font-semibold">{formatCurrency(turboProfit)}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between">
                <span>Lucro:</span>
                <span className="text-foreground font-bold">{formatCurrency(lucroPotencial)}</span>
              </div>
              <div className="flex justify-between">
                <span>ROI:</span>
                <span className="text-foreground font-bold">{((lucroPotencial / valorApostado) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <FormField control={form.control} name="categoria" render={({ field }) => {
            const filtered = categoriasOptions.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
            return (
              <FormItem>
                <FormLabel>Categorias</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", field.value.length === 0 && "text-muted-foreground")}>
                        {field.value.length === 0 ? "Selecione categorias" : `${field.value.length} selecionada(s)`}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="flex flex-col" style={{ maxHeight: "350px", height: "350px" }}>
                      <div className="p-3 border-b flex-shrink-0 bg-popover">
                        <Input placeholder="Buscar categoria..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="h-9" />
                      </div>
                      <div className="flex-1 p-2" style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain", minHeight: 0 } as React.CSSProperties}
                        onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                        {filtered.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</div>
                        ) : (
                          <div className="space-y-1">
                            {filtered.map((cat) => (
                              <div key={cat} onClick={(e) => {
                                e.stopPropagation();
                                const cur = field.value || [];
                                field.onChange(cur.includes(cat) ? cur.filter(v => v !== cat) : [...cur, cat]);
                                clearMissing("categoria");
                              }} className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none">
                                <Checkbox checked={field.value?.includes(cat)} onCheckedChange={(checked) => {
                                  const cur = field.value || [];
                                  field.onChange(checked ? [...cur, cat] : cur.filter(v => v !== cat));
                                  clearMissing("categoria");
                                }} />
                                <span className="flex-1 text-sm">{cat}</span>
                                {field.value?.includes(cat) && <Check className="h-4 w-4 text-primary" />}
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
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => field.onChange(field.value.filter(v => v !== cat))} />
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            );
          }} />

          <FormField control={form.control} name="tipo_aposta" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMissing("tipo_aposta") && "text-red-500")}>Tipo de Aposta</FormLabel>
              <Select onValueChange={(v) => { field.onChange(v); clearMissing("tipo_aposta"); }} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(isMissing("tipo_aposta") && "border-red-500")}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex items-center justify-between">
          <FormLabel className="flex items-center gap-2">
            <Star className="h-4 w-4" /> Super Odd
          </FormLabel>
          <Button type="button" variant={isSuperOdd ? "default" : "outline"} size="sm" onClick={() => setIsSuperOdd(!isSuperOdd)} className="transition-all">
            {isSuperOdd ? "Ativada" : "Desativada"}
          </Button>
        </div>

        <FormField control={form.control} name="casa_de_apostas" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className={cn("flex items-center gap-2", isMissing("casa_de_apostas") && "text-red-500")}>
              <Wallet className="h-4 w-4" /> Casa de Apostas
            </FormLabel>
            <Popover open={bookieOpen} onOpenChange={setBookieOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground", isMissing("casa_de_apostas") && "border-red-500")}>
                    {field.value || "Selecione a casa"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="flex flex-col" style={{ maxHeight: "350px", height: "350px" }}>
                  <div className="p-3 border-b flex-shrink-0 bg-popover">
                    <Input placeholder="Buscar casa de apostas..." value={bookieSearch} onChange={(e) => setBookieSearch(e.target.value)} className="h-9" />
                  </div>
                  <div className="flex-1 p-2" style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain", minHeight: 0 } as React.CSSProperties}
                    onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    {(() => {
                      const filteredBookies = bookies.filter((b) => b.name.toLowerCase().includes(bookieSearch.toLowerCase()));
                      return filteredBookies.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma casa encontrada.</div>
                      ) : (
                        <div className="space-y-1">
                          {filteredBookies.map((bookie) => (
                            <div key={bookie.id} onClick={(e) => {
                              e.stopPropagation();
                              field.onChange(bookie.name);
                              setSelectedBookie(bookie);
                              setBookieOpen(false);
                              clearMissing("casa_de_apostas");
                            }} className="flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none">
                              <Check className={cn("h-4 w-4", field.value === bookie.name ? "opacity-100" : "opacity-0")} />
                              <div className="flex items-center justify-between flex-1">
                                <span className="text-sm">{bookie.name}</span>
                                <span className="text-xs text-muted-foreground ml-4">{formatCurrency(bookie.balance || 0)}</span>
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
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="valor_apostado" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMissing("valor_apostado") && "text-red-500")}>Valor Apostado (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field}
                  value={field.value ?? ""}
                  onChange={(e) => { field.onChange(e.target.value ? parseFloat(e.target.value) : undefined); if (e.target.value) clearMissing("valor_apostado"); }}
                  className={cn(isMissing("valor_apostado") && "border-red-500")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="odd" render={() => (
            <FormItem>
              <FormLabel className={cn(isMissing("odd") && "text-red-500")}>Odd</FormLabel>
              <div className="space-y-1.5">
                {oddInputs.map((val, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <Input type="number" step="0.01" placeholder={oddInputs.length > 1 ? `Seleção ${i + 1}` : "Ex: 2.50"}
                      value={val}
                      onChange={(e) => { const next = [...oddInputs]; next[i] = e.target.value; setOddInputs(next); }}
                      className={cn("flex-1 min-w-0", isMissing("odd") && i === 0 && !val && "border-red-500")} />
                    {oddInputs.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0"
                        onClick={() => setOddInputs(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => setOddInputs(prev => [...prev, ""])}>
                  + Adicionar odd
                </Button>
                {oddInputs.filter(v => parseFloat(v) > 1).length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Odd total: <span className="font-medium text-foreground">{computedOdd.toFixed(2)}</span>
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="partida" render={({ field }) => (
            <FormItem>
              <FormLabel>Partida</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Flamengo x Palmeiras" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="torneio" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Torneio</FormLabel>
              <Popover open={tournamentOpen} onOpenChange={setTournamentOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                      {field.value || "Selecione o torneio"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <div className="flex flex-col" style={{ maxHeight: "350px", height: "350px" }}>
                    <div className="p-3 border-b flex-shrink-0 bg-popover">
                      <Input placeholder="Buscar torneio..." value={tournamentSearch} onChange={(e) => setTournamentSearch(e.target.value)} className="h-9" />
                    </div>
                    <div className="flex-1 p-2" style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain", minHeight: 0 } as React.CSSProperties}
                      onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      {(() => {
                        const filtered = torneiosOptions.filter((t) => t.toLowerCase().includes(tournamentSearch.toLowerCase()));
                        return filtered.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">Nenhum torneio encontrado.</div>
                        ) : (
                          <div className="space-y-1">
                            {filtered.map((t) => (
                              <div key={t} onClick={(e) => { e.stopPropagation(); field.onChange(t); setTournamentOpen(false); }}
                                className="flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer select-none">
                                <Check className={cn("h-4 w-4", field.value === t ? "opacity-100" : "opacity-0")} />
                                <span className="text-sm">{t}</span>
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
          )} />
        </div>

        <FormField control={form.control} name="data" render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(isMissing("data") && "text-red-500")}>Data da Aposta</FormLabel>
            <FormControl>
              <Input type="date" {...field}
                className={cn(isMissing("data") && "border-red-500")}
                onChange={(e) => { field.onChange(e); if (e.target.value) clearMissing("data"); }} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="detalhes" render={({ field }) => (
          <FormItem>
            <FormLabel>Detalhes da Aposta</FormLabel>
            <FormControl>
              <Textarea placeholder="Ex: Ambos marcam, Over 2.5 gols..." rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="flex items-center gap-2">
              <Gift className="h-4 w-4" /> Bônus
            </FormLabel>
            <Button type="button" variant={hasBonus ? "default" : "outline"} size="sm" onClick={() => setHasBonus(!hasBonus)} className="transition-all">
              {hasBonus ? "Ativado" : "Desativado"}
            </Button>
          </div>
          {hasBonus && (
            <FormField control={form.control} name="bonus" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Valor do bônus" {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        <div className="space-y-3">
          <FormLabel className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Turbo
          </FormLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {turboOptions.map((option) => (
              <Button key={option.value} type="button" variant={selectedTurbo === option.value ? "default" : "outline"}
                onClick={() => setSelectedTurbo(option.value)}
                className={cn("transition-all font-semibold text-xs sm:text-sm", selectedTurbo === option.value && "ring-2 ring-primary ring-offset-2")}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
          {onDelete && (
            <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isSubmitting || isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          )}
        </div>
      </form>

      {onDelete && (
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
                {deleteConfirmExtra}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setShowDeleteDialog(false); onDelete(); }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Form>
  );
}
