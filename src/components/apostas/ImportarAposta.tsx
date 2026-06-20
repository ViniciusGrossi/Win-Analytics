import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apostasService } from "@/services/apostas";
import { bookiesService } from "@/services/bookies";
import type { Bookie } from "@/types/betting";
import { supabase } from "@/integrations/supabase/client";
import { ScanOverlay } from "./ScanOverlay";
import {
  Upload, ImageIcon, Zap, Star, Gift, X, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TORNEIOS, TIPOS_APOSTA, TURBO_OPTIONS } from "@/lib/apostas-constants";

const SUPABASE_URL = "https://cjlvcjfuntfbdrrkigwh.supabase.co";

const STATIC_TIPOS = [...TIPOS_APOSTA];

const turboOptions = [...TURBO_OPTIONS];

const formSchema = z.object({
  casa_de_apostas: z.string().min(1, "Casa é obrigatória"),
  tipo_aposta: z.string().min(1, "Tipo é obrigatório"),
  valor_apostado: z.number({ invalid_type_error: "Valor obrigatório" }).min(0),
  odd: z.number({ invalid_type_error: "Odd obrigatória" }).min(1.01, "Odd mínima 1.01"),
  bonus: z.number().min(0).default(0),
  turbo: z.number().min(0).default(0),
  is_super_odd: z.boolean().default(false),
  partida: z.string().optional(),
  torneio: z.string().optional(),
  categoria: z.string().optional(),
  data: z.string().min(1, "Data é obrigatória"),
  detalhes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const REQUIRED_FIELDS: (keyof FormData)[] = ["casa_de_apostas", "tipo_aposta", "valor_apostado", "odd", "data"];

interface ExtractedData {
  casa_de_apostas: string | null;
  tipo_aposta: string | null;
  is_super_odd: boolean | null;
  valor_apostado: number | null;
  odd: number | null;
  bonus: number | null;
  turbo: number | null;
  partida: string | null;
  torneio: string | null;
  categoria: string | null;
  data: string | null;
  detalhes: string | null;
}

interface ImportarApostaProps {
  onSuccess: () => void;
  sharedImage?: File | null;
}

type Step = "upload" | "scanning" | "review" | "done";

export function ImportarAposta({ onSuccess, sharedImage }: ImportarApostaProps) {
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [existingTipos, setExistingTipos] = useState<string[]>([]);
  const [existingTorneios, setExistingTorneios] = useState<string[]>([]);
  const [existingCategorias, setExistingCategorias] = useState<string[]>([]);
  const [isSuperOdd, setIsSuperOdd] = useState(false);
  const [selectedTurbo, setSelectedTurbo] = useState(0);
  const [hasBonus, setHasBonus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      casa_de_apostas: "",
      tipo_aposta: "",
      valor_apostado: undefined as any,
      odd: undefined as any,
      bonus: 0,
      turbo: 0,
      is_super_odd: false,
      partida: "",
      torneio: "",
      categoria: "",
      data: format(new Date(), "yyyy-MM-dd"),
      detalhes: "",
    },
  });

  useEffect(() => {
    bookiesService.list().then(setBookies).catch(console.error);
    apostasService.list({ limit: 1000 }).then(({ data }) => {
      const tipos = [...new Set(data.map(a => a.tipo_aposta).filter(Boolean))] as string[];
      const torneios = [...new Set(data.map(a => a.torneio).filter(Boolean))] as string[];
      const categorias = [...new Set(
        data.flatMap(a => a.categoria ? a.categoria.split(",").map(c => c.trim()) : [])
      )].filter(Boolean);
      setExistingTipos(tipos);
      setExistingTorneios(torneios.sort());
      setExistingCategorias(categorias.sort());
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (sharedImage) handleFile(sharedImage);
  }, [sharedImage]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem (PNG, JPG, WEBP)", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleExtract = async () => {
    if (!imageFile) return;
    setStep("scanning");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-bet-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type,
          torneios: [...TORNEIOS],
          casas: bookies.map(b => b.name),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Falha na extração");

      const data: ExtractedData = result.data;

      const missing = new Set<string>();
      REQUIRED_FIELDS.forEach((field) => {
        const val = data[field as keyof ExtractedData];
        if (val === null || val === undefined || val === "") missing.add(field);
      });
      setMissingFields(missing);

      // Normaliza tipo_aposta para os valores canônicos
      const tipoNorm = normalizeTipo(data.tipo_aposta);

      form.reset({
        casa_de_apostas: data.casa_de_apostas || "",
        tipo_aposta: tipoNorm || data.tipo_aposta || "",
        valor_apostado: data.valor_apostado ?? undefined,
        odd: data.odd ?? undefined,
        bonus: data.bonus ?? 0,
        turbo: data.turbo ?? 0,
        is_super_odd: data.is_super_odd ?? false,
        partida: data.partida || "",
        torneio: data.torneio || "",
        categoria: data.categoria || "",
        data: data.data || format(new Date(), "yyyy-MM-dd"),
        detalhes: data.detalhes || "",
      });

      setIsSuperOdd(data.is_super_odd ?? false);
      setSelectedTurbo(data.turbo ?? 0);
      setHasBonus((data.bonus ?? 0) > 0);
      setStep("review");
    } catch (error) {
      toast({ title: "Erro na extração", description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
      setStep("upload");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const bookie = bookies.find((b) => b.name === data.casa_de_apostas);
      const bookieBalance = bookie?.balance ?? 0;

      await apostasService.create(
        {
          categoria: data.categoria || "",
          tipo_aposta: data.tipo_aposta,
          casa_de_apostas: data.casa_de_apostas,
          valor_apostado: data.valor_apostado,
          odd: data.odd,
          bonus: hasBonus ? data.bonus : 0,
          turbo: selectedTurbo,
          is_super_odd: isSuperOdd,
          detalhes: data.detalhes,
          partida: data.partida,
          torneio: data.torneio,
          data: data.data,
        },
        bookieBalance,
        hasBonus
      );

      toast({ title: "Aposta criada!", description: "Importação concluída com sucesso" });
      setStep("done");
      onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setImageFile(null);
    setImagePreview(null);
    setMissingFields(new Set());
    form.reset();
    setIsSuperOdd(false);
    setSelectedTurbo(0);
    setHasBonus(false);
  };

  // Opções de tipo: estáticos + existentes sem duplicatas
  const tiposOptions = [...new Set([...STATIC_TIPOS, ...existingTipos])];

  const isMissing = (field: string) => missingFields.has(field);
  const clearMissing = (field: string) => setMissingFields(s => { const n = new Set(s); n.delete(field); return n; });

  return (
    <div className="space-y-6">
      {/* datalists para autocomplete */}
      <datalist id="dl-torneios">
        {existingTorneios.map(t => <option key={t} value={t} />)}
      </datalist>
      <datalist id="dl-categorias">
        {existingCategorias.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="dl-casas">
        {bookies.map(b => <option key={b.name} value={b.name} />)}
      </datalist>

      <AnimatePresence mode="wait">
        {/* ── UPLOAD ── */}
        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                "hover:border-primary hover:bg-primary/5",
                imagePreview ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              )}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Solte a imagem aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — aceita compartilhamento direto do celular</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">Arraste ou selecione</span>
                  </div>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

            {imagePreview && (
              <Button onClick={handleExtract} className="w-full" size="lg">
                <Zap className="h-4 w-4 mr-2" /> Extrair Dados da Aposta
              </Button>
            )}
          </motion.div>
        )}

        {/* ── SCANNING ── */}
        {step === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center">
            {imagePreview && (
              <div className="relative inline-block w-full max-w-sm mx-auto">
                <img src={imagePreview} alt="Escaneando" className="w-full rounded-lg object-contain max-h-64 opacity-80" />
                <ScanOverlay active={true} />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">Analisando aposta com IA...</span>
            </div>
            <p className="text-sm text-muted-foreground">Extraindo dados via Llama 3.2 Vision</p>
          </motion.div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">

            {/* Thumbnail + status */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              {imagePreview && (
                <img src={imagePreview} alt="Aposta" className="h-16 w-12 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Extração concluída</span>
                </div>
                {missingFields.size > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs">{missingFields.size} campo(s) em vermelho — preencha antes de criar</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs px-2 flex-shrink-0">
                <X className="h-3 w-3 mr-1" /> Nova
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

                {/* Tipo + Data */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="tipo_aposta" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(isMissing("tipo_aposta") && "text-red-500")}>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); clearMissing("tipo_aposta"); }}>
                        <FormControl>
                          <SelectTrigger className={cn(isMissing("tipo_aposta") && "border-red-500")}>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="data" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(isMissing("data") && "text-red-500")}>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field}
                          className={cn(isMissing("data") && "border-red-500")}
                          onChange={(e) => { field.onChange(e); if (e.target.value) clearMissing("data"); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Super Odd — entre Tipo e Casa */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                  isSuperOdd ? "border-amber-500/50 bg-amber-500/5" : "border-border"
                )}>
                  <span className={cn("text-sm font-medium flex items-center gap-2", isSuperOdd && "text-amber-500")}>
                    <Star className={cn("h-4 w-4", isSuperOdd && "fill-amber-500 text-amber-500")} />
                    Super Odd
                  </span>
                  <Button type="button" size="sm"
                    variant={isSuperOdd ? "default" : "outline"}
                    className={cn("h-7 text-xs", isSuperOdd && "bg-amber-500 hover:bg-amber-600 border-amber-500")}
                    onClick={() => setIsSuperOdd(!isSuperOdd)}>
                    {isSuperOdd ? "Sim" : "Não"}
                  </Button>
                </div>

                {/* Casa de Apostas */}
                <FormField control={form.control} name="casa_de_apostas" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(isMissing("casa_de_apostas") && "text-red-500")}>
                      Casa de Apostas
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Bet365"
                        list="dl-casas"
                        {...field}
                        className={cn(isMissing("casa_de_apostas") && "border-red-500 focus-visible:ring-red-500")}
                        onChange={(e) => { field.onChange(e); if (e.target.value) clearMissing("casa_de_apostas"); }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Valor + Odd */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="valor_apostado" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(isMissing("valor_apostado") && "text-red-500")}>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00"
                          {...field} value={field.value ?? ""}
                          onChange={(e) => { field.onChange(e.target.value ? parseFloat(e.target.value) : undefined); if (e.target.value) clearMissing("valor_apostado"); }}
                          className={cn(isMissing("valor_apostado") && "border-red-500")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="odd" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(isMissing("odd") && "text-red-500")}>Odd</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00"
                          {...field} value={field.value ?? ""}
                          onChange={(e) => { field.onChange(e.target.value ? parseFloat(e.target.value) : undefined); if (e.target.value) clearMissing("odd"); }}
                          className={cn(isMissing("odd") && "border-red-500")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Partida */}
                <FormField control={form.control} name="partida" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasil x Argentina" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                {/* Torneio + Categoria — com datalist de valores existentes */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="torneio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Torneio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Champions League" list="dl-torneios" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="categoria" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Resultado" list="dl-categorias" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                {/* Detalhes */}
                <FormField control={form.control} name="detalhes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes da Aposta</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Brasil vence e ambas marcam" rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                {/* Bônus */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium flex items-center gap-1.5 w-24">
                    <Gift className="h-3.5 w-3.5" /> Bônus
                  </span>
                  <Button type="button" size="sm" variant={hasBonus ? "default" : "outline"}
                    className="h-7 text-xs" onClick={() => setHasBonus(!hasBonus)}>
                    {hasBonus ? "Sim" : "Não"}
                  </Button>
                  {hasBonus && (
                    <FormField control={form.control} name="bonus" render={({ field }) => (
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Valor bônus"
                          className="h-7 text-xs w-32"
                          {...field} value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                      </FormControl>
                    )} />
                  )}
                </div>

                {/* Turbo */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium flex items-center gap-1.5 w-24">
                    <Zap className="h-3.5 w-3.5" /> Turbo
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {turboOptions.map((opt) => (
                      <Button key={opt.value} type="button" size="sm"
                        variant={selectedTurbo === opt.value ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setSelectedTurbo(opt.value)}>
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                    : <><CheckCircle2 className="h-4 w-4 mr-2" /> Criar Aposta</>}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-lg">Aposta criada!</p>
              <p className="text-sm text-muted-foreground">Importação via IA concluída com sucesso</p>
            </div>
            <Button onClick={reset} variant="outline">Importar outra aposta</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function normalizeTipo(raw: string | null): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("simples") || lower === "1") return "Simples";
  if (lower.includes("dupla") || lower === "2") return "Dupla";
  if (lower.includes("tripla") || lower === "3") return "Tripla";
  if (lower.includes("múltipla") || lower.includes("multipla") || lower.includes("multi") || parseInt(lower) >= 4) return "Múltipla";
  return raw;
}
