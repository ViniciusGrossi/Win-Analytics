import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { SECTION_ORDER } from "@shared/extraction-rules";

export interface ExtractionSettings {
  geral: string;
  sections: Record<string, string>; // chaves ⊂ SECTION_ORDER, sem "geral"
}

const SECTION_KEYS = new Set<string>(SECTION_ORDER.filter((k) => k !== "geral"));

/** Mantém só chaves válidas com valor string não-vazio. Descarta o resto (lixo do jsonb, "geral", etc). */
function sanitizeSections(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (SECTION_KEYS.has(k) && typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

export const aiExtractionSettingsService = {
  async get(): Promise<ExtractionSettings> {
    const user = authService.getSession();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("ai_extraction_settings")
      .select("custom_instructions, section_instructions")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return {
      geral: data?.custom_instructions ?? "",
      sections: sanitizeSections(data?.section_instructions),
    };
  },

  async save(settings: ExtractionSettings): Promise<void> {
    const user = authService.getSession();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("ai_extraction_settings")
      .upsert(
        {
          user_id: user.id,
          custom_instructions: settings.geral,
          section_instructions: sanitizeSections(settings.sections),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) throw error;
  },
};
