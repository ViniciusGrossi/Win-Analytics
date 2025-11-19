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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { bookiesService } from "@/services/bookies";
import { apostasService } from "@/services/apostas";
import type { Bookie, ApostaFormData } from "@/types/betting";
import { formatCurrency, cn } from "@/lib/utils";
import { CalendarIcon, TrendingUp, Wallet, Zap, Gift, Info, X, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const formSchema = z.object({
  categoria: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  tipo_aposta: z.string().min(1, "Tipo de aposta é obrigatório"),
  casa_de_apostas: z.string().min(1, "Casa de apostas é obrigatória"),
  valor_apostado: z.number().min(0, "Valor não pode ser negativo"),
  odd: z.number().min(1.01, "Odd mínima é 1.01"),
  bonus: z.number().min(0).default(0),
  turbo: z.number().min(0).default(0),
  detalhes: z.string().optional(),
  partida: z.string().optional(),
  torneio: z.string().optional(),
  data: z.date({ required_error: "Data é obrigatória" }),
}).refine((data) => {
  // Pelo menos um dos dois deve ser maior que 0: valor apostado ou bônus
  return data.valor_apostado > 0 || data.bonus > 0;
}, {
  message: "Informe um valor apostado ou bônus",
  path: ["bonus"], // Colocar o erro no campo de bônus ao invés de valor_apostado
});

type FormData = z.infer<typeof formSchema>;

interface CreateApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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
  "Outros"
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
  "Süper Lig (Turquia)"
];

const turboOptions = [
  { label: "Sem Turbo", value: 0 },
  { label: "+25%", value: 0.25 },
  { label: "+30%", value: 0.30 },
  { label: "+50%", value: 0.50 },
];

export function CreateApostaDialog({ open, onOpenChange, onSuccess }: CreateApostaDialogProps) {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasBonus, setHasBonus] = useState(false);
  const [selectedTurbo, setSelectedTurbo] = useState(0);
  const [bookieOpen, setBookieOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: [],
      tipo_aposta: "",
      casa_de_apostas: "",
      valor_apostado: 0,
      odd: undefined as any,
      bonus: 0,
      turbo: 0,
      detalhes: "",
      partida: "",
      torneio: "",
    },
  });

  const valorApostado = form.watch("valor_apostado") || 0;
  const odd = form.watch("odd") || 1;
  const bonus = form.watch("bonus") || 0;
  const turbo = form.watch("turbo") || 0;
  
  // Calcular lucro base (do dinheiro real) e lucro do bônus separadamente
  const lucroBase = valorApostado * (odd - 1);
  const lucroBonus = bonus * (odd - 1);
  const lucroTotal = lucroBase + lucroBonus;
  
  // Turbo aplica sobre o lucro total
  const turboProfit = lucroTotal * turbo;
  
  // Lucro potencial total
  const lucroPotencial = lucroTotal + turboProfit;
  
  // Retorno potencial = valor apostado + lucro total + turbo
  const retornoPotencial = valorApostado + lucroPotencial;

  useEffect(() => {
    if (open) {
      loadBookies();
    }
  }, [open]);

  useEffect(() => {
    form.setValue("turbo", turbo);
  }, [turbo]);

  const loadBookies = async () => {
    try {
      const data = await bookiesService.list();
      setBookies(data);
    } catch (error) {
      console.error("Erro ao carregar casas:", error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedBookie) {
      toast({ title: "Erro", description: "Selecione uma casa de apostas", variant: "destructive" });
      return;
    }

    // Validação de saldo: apenas o valor apostado (não bônus) deve ser descontado
    if (data.valor_apostado > (selectedBookie.balance || 0)) {
      toast({ 
        title: "Saldo Insuficiente", 
        description: `Você possui apenas ${formatCurrency(selectedBookie.balance || 0)} na ${selectedBookie.name}`,
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const apostaData: ApostaFormData = {
        categoria: data.categoria.join(", "), // Converte array para string separada por vírgula
        tipo_aposta: data.tipo_aposta,
        casa_de_apostas: data.casa_de_apostas,
        valor_apostado: data.valor_apostado,
        odd: data.odd,
        bonus: hasBonus ? data.bonus : 0,
        turbo: turbo,
        detalhes: data.detalhes,
        partida: data.partida,
        torneio: data.torneio,
        data: format(data.data, "yyyy-MM-dd"),
      };

      await apostasService.create(apostaData, selectedBookie.balance || 0, hasBonus);

      // Animação de sucesso
      const element = document.querySelector('[role="dialog"]');
      if (element) {
        element.classList.add('animate-[scale-in_0.2s_ease-out]');
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({ title: "Sucesso!", description: "Aposta criada com sucesso" });
      form.reset();
      setHasBonus(false);
      setSelectedTurbo(0);
      setCategorySearch("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Log detalhado para facilitar diagnóstico em desenvolvimento
      // e apresentar a mensagem de erro ao usuário quando disponível.
      // Algumas respostas do Supabase retornam um objeto com `message`.
      // Mostramos isso no toast e no console para rastrear o problema.
      // eslint-disable-next-line no-console
      console.error("Erro ao criar aposta:", error);
      const errMsg = (error as any)?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Erro ao criar aposta";
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preview do Retorno Potencial - Fixo no topo */}
            <AnimatePresence>
              {valorApostado > 0 && odd > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Retorno Potencial</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {formatCurrency(retornoPotencial)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {valorApostado > 0 && (
                      <div className="flex justify-between">
                        <span>Valor apostado:</span>
                        <span className="text-foreground font-semibold">{formatCurrency(valorApostado)}</span>
                      </div>
                    )}
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
                    {valorApostado > 0 && (
                      <div className="flex justify-between">
                        <span>ROI:</span>
                        <span className="text-foreground font-bold">{((lucroPotencial / valorApostado) * 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[400px]">
                            <CommandInput 
                              placeholder="Buscar categoria..." 
                              value={categorySearch}
                              onValueChange={setCategorySearch}
                            />
                            <CommandList className="max-h-[320px] overflow-y-auto">
                              <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                              <CommandGroup>
                                {filteredCategorias.map((cat) => (
                                  <CommandItem
                                    key={cat}
                                    value={cat}
                                    onSelect={() => {
                                      const currentValue = field.value || [];
                                      const newValue = currentValue.includes(cat)
                                        ? currentValue.filter((v) => v !== cat)
                                        : [...currentValue, cat];
                                      field.onChange(newValue);
                                    }}
                                    className="flex items-center space-x-2 cursor-pointer"
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
                                    <span className="flex-1">{cat}</span>
                                    {field.value?.includes(cat) && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
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
                        {tiposAposta.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
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
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar casa de apostas..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma casa encontrada.</CommandEmpty>
                          <CommandGroup>
                            {bookies.map((bookie) => (
                              <CommandItem
                                key={bookie.id}
                                value={bookie.name}
                                onSelect={() => {
                                  field.onChange(bookie.name);
                                  setSelectedBookie(bookie);
                                  setBookieOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === bookie.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center justify-between w-full">
                                  <span>{bookie.name}</span>
                                  <span className="text-xs text-muted-foreground ml-4">
                                    {formatCurrency(bookie.balance || 0)}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedBookie && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Saldo disponível: {formatCurrency(selectedBookie.balance || 0)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="0.00"
                        {...field}
                        value={field.value === 0 ? "0" : field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar torneio..." />
                          <CommandList>
                            <CommandEmpty>Nenhum torneio encontrado.</CommandEmpty>
                            <CommandGroup>
                              {torneios.map((torneio) => (
                                <CommandItem
                                  key={torneio}
                                  value={torneio}
                                  onSelect={() => {
                                    field.onChange(torneio);
                                    setTournamentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === torneio ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {torneio}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
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
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detalhes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes da Aposta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Ambos marcam, Over 2.5 gols..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Aposta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
