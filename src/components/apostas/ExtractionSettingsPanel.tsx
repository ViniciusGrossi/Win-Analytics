import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SECTION_ORDER, SECTION_RULES } from "@shared/extraction-rules";

interface ExtractionSettingsPanelProps {
  geral: string;
  sections: Record<string, string>;
  onGeralChange: (v: string) => void;
  onSectionChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
}

const PLACEHOLDER: Partial<Record<(typeof SECTION_ORDER)[number], string>> = {
  geral: "Regras que valem para toda a extração. Ex: tratar valor em USD como R$.",
  odd: "Ex: a odd às vezes aparece dentro de um círculo no topo direito.",
  valor_apostado: "Ex: nesta casa o valor apostado fica embaixo, em cinza.",
  is_super_odd: "Ex: badge 'SUPER' rosa no canto = super odd.",
  categoria: "Ex: se tiver linha de escanteio, incluir 'Escanteios'.",
};

export function ExtractionSettingsPanel({
  geral,
  sections,
  onGeralChange,
  onSectionChange,
  onSave,
  saving,
}: ExtractionSettingsPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ajuste como a IA lê cada campo. A regra base do sistema fica visível; seu comando é somado a ela.
      </p>

      <Accordion type="single" collapsible className="w-full">
        {SECTION_ORDER.map((key) => {
          const value = key === "geral" ? geral : sections[key] ?? "";
          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  {SECTION_RULES[key].titulo}
                  {value.trim() && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="ajustado" />}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {key !== "geral" && (
                  <p className="text-xs text-muted-foreground rounded-md bg-muted/40 p-2 leading-relaxed">
                    {SECTION_RULES[key].regra}
                  </p>
                )}
                <Textarea
                  rows={3}
                  value={value}
                  placeholder={PLACEHOLDER[key] ?? "Comando para este campo (opcional)"}
                  onChange={(e) =>
                    key === "geral" ? onGeralChange(e.target.value) : onSectionChange(key, e.target.value)
                  }
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Button onClick={onSave} disabled={saving} className="w-full" size="sm">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar configuração"}
      </Button>
    </div>
  );
}
