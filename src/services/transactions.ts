import { supabase } from "@/integrations/supabase/client";
import type { Transaction, TransactionType } from "@/types/betting";

export const transactionsService = {
  async list() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  },

  async create(bookieId: number, amount: number, type: TransactionType, description: string) {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        bookie_id: bookieId,
        amount,
        type,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async listByBookie(bookieId: number) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("bookie_id", bookieId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  },
};
