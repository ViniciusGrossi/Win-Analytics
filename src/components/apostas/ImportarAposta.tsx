import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apostasService } from "@/services/apostas";
import { bookiesService } from "@/services/bookies";
import { aiExtractionSettingsService } from "@/services/aiExtractionSettings";
import type { Bookie } from "@/types/betting";
import { supabase } from "@/integrations/supabase/client";
import { ScanOverlay } from "./ScanOverlay";
import { ApostaForm, type ApostaFormValues } from "./ApostaForm";
import {
  Upload, ImageIcon, Zap, X, CheckCircle2, AlertCircle, Loader2, Settings, ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TORNEIOS } from "@/lib/apostas-constants";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const REQUIRED_FIELDS: (keyof ApostaFormValues)[] = ["casa_de_apostas", "tipo_aposta", "valor_apostado", "odd", "data"];

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
  categoria: string[] | string | null;
  data: string | null;
  detalhes: string | null;
}

interface ImportarApostaProps {
  onSuccess: () => void;
  sharedImage?: File | null;
}

type Step = "upload" | "scanning" | "review" | "done";

interface QueueItem {
  file: File;
  preview: string;
}

export function ImportarAposta({ onSuccess, sharedImage }: ImportarApostaProps) {
  const [step, setStep] = useState<Step>("upload");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [extractedDefaults, setExtractedDefaults] = useState<Partial<ApostaFormValues> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"auto" | "90b" | "11b" | "gpt4o" | "groq">("auto");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guarda o que a IA extraiu (pós-normalização) para detectar correções do usuário no review.
  const lastExtractedRef = useRef<{ casa_de_apostas: string; torneio: string } | null>(null);

  const imagePreview = queue[currentIndex]?.preview ?? null;

  useEffect(() => {
    bookiesService.list().then(setBookies).catch(console.error);
    aiExtractionSettingsService.get().then(setCustomInstructions).catch(console.error);
  }, []);

  useEffect(() => {
    if (sharedImage) handleFiles([sharedImage]);
  }, [sharedImage]);

  const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem (PNG, JPG, WEBP)", variant: "destructive" });
      return;
    }
    const items = await Promise.all(imageFiles.map(async (file) => ({ file, preview: await readAsDataUrl(file) })));
    setQueue(prev => [...prev, ...items]);
  }, []);

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const saveInstructions = async () => {
    setSavingInstructions(true);
    try {
      await aiExtractionSettingsService.save(customInstructions);
      toast({ title: "Instruções salvas" });
      setSettingsOpen(false);
    } catch (error) {
      toast({ title: "Erro ao salvar", description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
    } finally {
      setSavingInstructions(false);
    }
  };

  const handleExtract = async (indexOverride?: number) => {
    const idx = indexOverride ?? currentIndex;
    const item = queue[idx];
    if (!item) return;
    setExtractError(null);
    setStep("scanning");
    try {
      const base64 = item.preview.split(",")[1];

      // invoke passa pelo client global (injeta x-session-token) e envia a apikey correta.
      const { data: result, error: fnError } = await supabase.functions.invoke("extract-bet-image", {
        body: {
          imageBase64: base64,
          mimeType: item.file.type,
          torneios: [...TORNEIOS],
          casas: bookies.map(b => b.name),
          currentDate: format(new Date(), "yyyy-MM-dd"),
          ...(selectedModel !== "auto" ? { model: selectedModel } : {}),
          ...(customInstructions.trim() ? { customInstructions: customInstructions.trim() } : {}),
        },
      });

      if (fnError) {
        // Em status não-2xx o invoke marca erro; tenta ler a mensagem do corpo.
        let msg = "Falha na extração";
        try {
          const body = await (fnError as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* mantém msg padrão */ }
        throw new Error(msg);
      }
      if (result?.error) throw new Error(result.error);

      const data: ExtractedData = result.data;

      const missing = new Set<string>();
      REQUIRED_FIELDS.forEach((field) => {
        const val = data[field as keyof ExtractedData];
        if (val === null || val === undefined || val === "") missing.add(field);
      });
      setMissingFields(missing);

      const tipoNorm = normalizeTipo(data.tipo_aposta);
      const torneioNorm = normalizeTorneio(data.torneio);
      const partidaNorm = normalizePartida(data.partida);

      lastExtractedRef.current = {
        casa_de_apostas: data.casa_de_apostas || "",
        torneio: torneioNorm,
      };

      // Normaliza categoria: IA pode retornar array ou string
      const rawCat = data.categoria;
      const categoriaArray: string[] = Array.isArray(rawCat)
        ? rawCat.filter(Boolean)
        : typeof rawCat === "string" && rawCat
          ? rawCat.split(",").map(c => c.trim()).filter(Boolean)
          : [];

      setExtractedDefaults({
        casa_de_apostas: data.casa_de_apostas || "",
        tipo_aposta: tipoNorm || data.tipo_aposta || "",
        valor_apostado: data.valor_apostado ?? undefined,
        odd: data.odd ?? undefined,
        bonus: data.bonus ?? 0,
        turbo: data.turbo ?? 0,
        is_super_odd: data.is_super_odd ?? false,
        partida: partidaNorm,
        torneio: torneioNorm,
        categoria: categoriaArray,
        data: data.data || format(new Date(), "yyyy-MM-dd"),
        detalhes: data.detalhes || "",
      });

      setStep("review");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setExtractError(message);
      toast({ title: "Erro na extração", description: message, variant: "destructive" });
      setStep("upload");
    }
  };

  const advanceQueue = () => {
    const next = currentIndex + 1;
    if (next < queue.length) {
      setCurrentIndex(next);
      handleExtract(next);
    } else {
      setStep("done");
      onSuccess();
    }
  };

  const saveLearnedRule = async (rule: string) => {
    try {
      const updated = customInstructions.trim() ? `${customInstructions.trim()}\n${rule}` : rule;
      await aiExtractionSettingsService.save(updated);
      setCustomInstructions(updated);
      toast({ title: "Regra salva", description: "A IA vai considerar isso nas próximas extrações" });
    } catch (error) {
      toast({ title: "Erro ao salvar regra", description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
    }
  };

  const onSubmit = async (data: ApostaFormValues, selectedBookie: Bookie | null) => {
    if (!selectedBookie) return;
    setIsSubmitting(true);
    try {
      await apostasService.create(
        {
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
        },
        selectedBookie.balance || 0,
        data.bonus > 0
      );

      toast({ title: "Aposta criada!", description: "Importação concluída com sucesso" });

      // Detecta correção do usuário sobre o que a IA extraiu e oferece virar regra permanente.
      const extracted = lastExtractedRef.current;
      if (extracted) {
        const corrections: string[] = [];
        if (extracted.casa_de_apostas && data.casa_de_apostas && extracted.casa_de_apostas !== data.casa_de_apostas) {
          corrections.push(`Quando a IA identificar a casa "${extracted.casa_de_apostas}", deve considerar "${data.casa_de_apostas}"`);
        }
        if (extracted.torneio && data.torneio && extracted.torneio !== data.torneio) {
          corrections.push(`Quando a IA identificar o torneio "${extracted.torneio}", deve considerar "${data.torneio}"`);
        }
        if (corrections.length > 0) {
          const rule = corrections.join(". ");
          toast({
            title: "Notei uma correção",
            description: "Quer ensinar essa regra pra IA não errar de novo?",
            action: (
              <ToastAction altText="Salvar regra" onClick={() => saveLearnedRule(rule)}>
                Salvar regra
              </ToastAction>
            ),
          });
        }
      }

      setImportedCount(c => c + 1);
      advanceQueue();
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipCurrent = () => advanceQueue();

  const reset = () => {
    setStep("upload");
    setQueue([]);
    setCurrentIndex(0);
    setImportedCount(0);
    setMissingFields(new Set());
    setExtractError(null);
    setExtractedDefaults(undefined);
  };

  const clearMissing = (field: string) => setMissingFields(s => { const n = new Set(s); n.delete(field); return n; });

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* ── UPLOAD ── */}
        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            {extractError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha na extração</AlertTitle>
                <AlertDescription className="whitespace-pre-line text-xs">{extractError}</AlertDescription>
              </Alert>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                "hover:border-primary hover:bg-primary/5",
                queue.length > 0 ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              )}
            >
              {queue.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {queue.map((item, i) => (
                    <div key={i} className="relative">
                      <img src={item.preview} alt={`Aposta ${i + 1}`} className="h-20 w-full object-cover rounded-lg" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-1">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Solte as imagens aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — pode selecionar várias de uma vez</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">Arraste ou selecione</span>
                  </div>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) handleFiles(Array.from(e.target.files)); e.target.value = ""; }} />

            {queue.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1.5 justify-center items-center flex-wrap">
                  {(["auto", "90b", "11b", "gpt4o", "groq"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedModel(m)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        selectedModel === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {m === "auto" ? "⚡ Auto" : m === "90b" ? "🎯 90B" : m === "11b" ? "🚀 11B" : m === "gpt4o" ? "🤖 GPT-4o" : "🐐 Groq"}
                    </button>
                  ))}
                  <button type="button" onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all text-xs font-medium"
                    title="Ensinar regras de extração para a IA">
                    <Settings className="h-3.5 w-3.5" />
                    Ensinar a IA
                  </button>
                </div>
                <Button onClick={() => { setCurrentIndex(0); handleExtract(0); }} className="w-full" size="lg">
                  <Zap className="h-4 w-4 mr-2" /> Extrair Dados ({queue.length} {queue.length > 1 ? "imagens" : "imagem"})
                </Button>
              </div>
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
            {queue.length > 1 && (
              <p className="text-sm text-muted-foreground">Imagem {currentIndex + 1} de {queue.length}</p>
            )}
          </motion.div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">

            {/* Thumbnail + status */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              {imagePreview && (
                <button type="button" onClick={() => setImageModalOpen(true)}
                  className="relative flex-shrink-0 cursor-zoom-in group">
                  <img src={imagePreview} alt="Aposta" className="h-16 w-12 object-cover rounded" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded flex items-center justify-center transition-colors">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Extração concluída</span>
                </div>
                {queue.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-0.5">Imagem {currentIndex + 1} de {queue.length}</p>
                )}
                {missingFields.size > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs">{missingFields.size} campo(s) em vermelho — preencha antes de criar</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {queue.length > 1 && currentIndex + 1 < queue.length && (
                  <Button variant="ghost" size="sm" onClick={skipCurrent} className="h-7 text-xs px-2">
                    Pular
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs px-2">
                  <X className="h-3 w-3 mr-1" /> Nova
                </Button>
              </div>
            </div>

            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Imagem da aposta</DialogTitle>
                </DialogHeader>
                {imagePreview && (
                  <img src={imagePreview} alt="Aposta em tamanho real" className="w-full rounded-lg object-contain max-h-[75vh]" />
                )}
              </DialogContent>
            </Dialog>

            <ApostaForm
              defaultValues={extractedDefaults}
              missingFields={missingFields}
              onFieldFilled={clearMissing}
              submitLabel="Criar Aposta"
              submittingLabel="Criando..."
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
            />
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
              <p className="font-semibold text-lg">
                {importedCount} de {queue.length} aposta{queue.length > 1 ? "s" : ""} importada{importedCount > 1 ? "s" : ""}!
              </p>
              <p className="text-sm text-muted-foreground">Importação via IA concluída</p>
            </div>
            <Button onClick={reset} variant="outline">Importar mais apostas</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ensinar a IA</DialogTitle>
            <DialogDescription>
              Regras que a IA deve sempre seguir ao ler o print de uma aposta — corrigem comportamentos fora do padrão. Aplicadas em toda extração, com prioridade sobre o padrão do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Exemplos:</p>
            <p>"A casa 'Estrela Bet' deve ser registrada como 'EstrelaBet'"</p>
            <p>"Nunca marque categoria 'Outros' se a partida tiver escanteios"</p>
            <p>"Aposta em criptomoeda: tratar valor em USD como se fosse R$"</p>
          </div>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: sempre usar o nome completo do torneio, nunca abreviar nomes de times..."
            rows={6}
          />
          <Button onClick={saveInstructions} disabled={savingInstructions} className="w-full">
            {savingInstructions ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Instruções"}
          </Button>
        </DialogContent>
      </Dialog>
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

// Padrão do produto: separador de partida é sempre "x" (vs/versus/× → x).
// Rede de segurança client-side — o prompt já instrui o modelo a fazer isso.
function normalizePartida(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/\s+(vs\.?|versus|×)\s+/gi, " x ").trim();
}

function normalizeTorneio(raw: string | null): string {
  if (!raw) return "";
  const lower = raw.toLowerCase().trim();

  // TURBINACO é produto da Betnacional, não é torneio — ignorar
  if (lower.startsWith("turbinaco")) return "";

  // Exact match (case-insensitive)
  const exact = TORNEIOS.find(t => t.toLowerCase() === lower);
  if (exact) return exact;

  if (lower.includes("premier") || lower === "epl" || lower === "pl") return "Premier League";
  if (lower.includes("champions")) return "Champions League";
  if (lower.includes("europa league")) return "Europa League";
  if (lower.includes("conference")) return "Conference League";
  if (lower.includes("brasileirao") && (lower.includes("serie a") || lower.includes("série a"))) return "Brasileirao Serie A";
  if (lower.includes("brasileirao") && (lower.includes("serie b") || lower.includes("série b"))) return "Brasileirao Serie B";
  if (lower.includes("libertadores")) return "Copa Libertadores";
  if (lower.includes("sul-americana") || lower.includes("sudamericana")) return "Copa Sul-Americana";
  if (lower.includes("copa do brasil")) return "Copa do Brasil";
  if (lower.includes("bundesliga")) return "Bundesliga";
  if (lower.includes("la liga") || lower.includes("laliga")) return "La Liga";
  if (lower.includes("ligue 1")) return "Ligue 1";
  if ((lower.includes("serie a") || lower.includes("série a")) && (lower.includes("ital") || lower.includes("it"))) return "Serie A Italia";
  if (lower.includes("copa do mundo") || lower.includes("world cup") || lower.includes("fifa world")) return "Copa do Mundo FIFA";
  if (lower.includes("fa cup")) return "FA Cup";
  if (lower.includes("carabao")) return "Carabao Cup";
  if (lower.includes("championship")) return "Championship";
  if (lower.includes("liga portugal") || lower.includes("primeira liga")) return "Liga Portugal";
  if (lower.includes("saudi") || lower.includes("roshn")) return "Saudi Pro League";
  if (lower.includes("super lig") || lower.includes("süper lig") || lower.includes("turquia")) return "Süper Lig (Turquia)";
  if (lower.includes("copa do rei") || lower.includes("copa del rey")) return "Copa do Rei";
  if (lower.includes("dfb") || lower.includes("pokal") || lower.includes("copa da alemanha")) return "Copa da Alemanha";
  if (lower.includes("coppa italia")) return "Coppa Italia";
  if (lower.includes("coupe de france") || lower.includes("copa da fran")) return "Copa da França";
  if (lower.includes("estadual")) return "Campeonatos Estaduais";
  if (lower.includes("nations league") || lower.includes("data fifa") || lower.includes("international")) return "Data Fifa";

  // Sem correspondência → usuário seleciona manualmente
  return "";
}
