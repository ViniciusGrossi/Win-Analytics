import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export const aiExtractionSettingsService = {
  async get(): Promise<string> {
    const user = authService.getSession();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("ai_extraction_settings")
      .select("custom_instructions")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data?.custom_instructions ?? "";
  },

  async save(instructions: string): Promise<void> {
    const user = authService.getSession();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("ai_extraction_settings")
      .upsert(
        { user_id: user.id, custom_instructions: instructions, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    if (error) throw error;
  },
};
