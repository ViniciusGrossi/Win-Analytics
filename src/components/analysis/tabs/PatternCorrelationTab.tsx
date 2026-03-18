import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingDown, TrendingUp, AlertCircle, Sparkles, Binary } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { Aposta } from "@/types/betting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PatternCorrelationTabProps {
  apostas: Aposta[];
}

interface Pattern {
  type: "leak" | "opportunity";
  title: string;
  description: string;
  impact: string;
  confidence: number;
}

export function PatternCorrelationTab({ apostas }: PatternCorrelationTabProps) {
  const { session } = useAuth();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isCrunshing, setIsCrunshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePatterns = async () => {
    if (!session?.id) return;
    setIsCrunshing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { 
          user_id: session.id,
          deep_analysis: true 
        }
      });

      if (error) throw error;

      if (data?.patterns) {
        setPatterns(data.patterns);
      } else {
        // Fallback for empty results
        setPatterns([]);
      }
    } catch (err) {
      console.error("Erro na análise de padrões:", err);
      setError("Não foi possível processar a análise avançada.");
    } finally {
      setIsCrunshing(false);
    }
  };

  useEffect(() => {
    if (apostas.length >= 10 && patterns.length === 0) {
      analyzePatterns();
    }
  }, [apostas]);

  if (apostas.length < 10) {
    return (
      <Card className="border-muted bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Binary className="h-10 w-10 text-gold-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Motor de Correlações Desativado</h3>
          <p className="text-muted-foreground">
            O motor de correlação avançado requer pelo menos 10 apostas registradas para identificar padrões matemáticos significativos no seu comportamento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-500" />
            Padrões Analíticos e Correlações
          </h3>
          <p className="text-sm text-muted-foreground">
            Machine Learning buscando vazamentos e oportunidades invisíveis nos seus dados.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={analyzePatterns} 
          disabled={isCrunshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCrunshing ? 'animate-spin' : ''}`} />
          Recalcular Padrões
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {patterns.map((pattern, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`border-l-4 h-full bg-card/40 ${
                pattern.type === "leak" ? "border-l-destructive" : "border-l-emerald-500"
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-semibold">{pattern.title}</CardTitle>
                    <Badge variant={pattern.type === "leak" ? "destructive" : "secondary"}>
                      {pattern.confidence}% Confiança
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pattern.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Impacto Provedado</span>
                    <span className={`text-sm font-bold ${
                      pattern.type === "leak" ? "text-destructive" : "text-emerald-400"
                    }`}>
                      {pattern.impact}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isCrunshing && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-gold-500" />
          <p className="text-muted-foreground animate-pulse text-sm">
            Correlacionando dados de apostas, horários e mercados...
          </p>
        </div>
      )}

      {patterns.length === 0 && !isCrunshing && !error && (
        <Card className="border-dashed border-muted bg-transparent">
          <CardContent className="h-40 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Clique em "Recalcular" para iniciar a varredura quantitativa.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
