import { supabase } from "@/integrations/supabase/client";
import type { Bookie } from "@/types/betting";

export const bookiesService = {
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("bookies")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Bookie[];
  },

  async getByName(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("bookies")
      .select("*")
      .eq("name", name)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data as Bookie;
  },

  async updateBalance(id: number, newBalance: number) {
    const { error } = await supabase
      .from("bookies")
      .update({ 
        balance: newBalance,
        last_update: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  },

  async create(name: string, initialBalance: number = 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("bookies")
      .insert({ name, balance: initialBalance, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Bookie;
  },
};
