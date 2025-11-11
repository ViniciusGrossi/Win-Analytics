import { supabase } from "@/integrations/supabase/client";
import type { Goal } from "@/types/betting";

export const goalsService = {
  async get() {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as Goal | null;
  },

  async upsert(goal: Partial<Goal>) {
    const existing = await this.get();
    
    if (existing) {
      const { data, error } = await supabase
        .from("goals")
        .update({
          daily_goal: goal.daily_goal,
          monthly_goal: goal.monthly_goal,
          loss_limit: goal.loss_limit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    } else {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          daily_goal: goal.daily_goal || 100,
          monthly_goal: goal.monthly_goal || 2000,
          loss_limit: goal.loss_limit || 200,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    }
  },
};
