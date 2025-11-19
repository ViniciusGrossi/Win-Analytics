import { supabase } from "@/integrations/supabase/client";
import type { Aposta, ApostaFormData, KPIData, SeriesData, ResultadoType } from "@/types/betting";
import dayjs from "dayjs";

export interface ListParams {
  startDate?: string;
  endDate?: string;
  casa?: string;
  tipo?: string;
  resultado?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const apostasService = {
  async list(params: ListParams = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("aposta")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("data", { ascending: false });

    if (params.startDate) {
      query = query.gte("data", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("data", params.endDate);
    }
    if (params.casa) {
      query = query.eq("casa_de_apostas", params.casa);
    }
    if (params.tipo) {
      query = query.eq("tipo_aposta", params.tipo);
    }
    if (params.resultado) {
      query = query.eq("resultado", params.resultado);
    }
    if (params.search) {
      query = query.or(`partida.ilike.%${params.search}%,detalhes.ilike.%${params.search}%`);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as Aposta[], count: count || 0 };
  },

  async create(dto: ApostaFormData, bookieBalance: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    if (bookieBalance < dto.valor_apostado) {
      throw new Error("Saldo insuficiente na casa de apostas");
    }

    // Inserir aposta
    const { data: aposta, error: apostaError } = await supabase
      .from("aposta")
      .insert({
        ...dto,
        user_id: user.id,
        resultado: "Pendente",
        valor_final: 0,
      })
      .select()
      .single();

    if (apostaError) throw apostaError;

    const { error: balanceError } = await supabase
      .from("bookies")
      .update({ 
        balance: bookieBalance - dto.valor_apostado,
        last_update: new Date().toISOString()
      })
      .eq("name", dto.casa_de_apostas);

    if (balanceError) throw balanceError;

    return aposta as Aposta;
  },

  async setResult(
    id: number,
    resultado: ResultadoType,
    apostaData: Aposta,
    cashoutValue?: number
  ) {
    let valor_final = 0;
    let updateBalance = 0;

    if (resultado === "Ganhou") {
      const lucroBase = (apostaData.valor_apostado || 0) * ((apostaData.odd || 1) - 1);
      const lucroBonus = (apostaData.bonus || 0) * ((apostaData.odd || 1) - 1);
      const turbo = apostaData.turbo || 0;
      const isPercentTurbo = turbo > 0 && turbo <= 1;
      const turboProfit = isPercentTurbo ? (lucroBase + lucroBonus) * turbo : turbo;
      const lucroTotal = (lucroBase + lucroBonus) + turboProfit;
      valor_final = lucroTotal;
      updateBalance = (apostaData.valor_apostado || 0) + lucroTotal;
    } else if (resultado === "Perdeu") {
      valor_final = -(apostaData.valor_apostado || 0);
      updateBalance = 0;
    } else if (resultado === "Cancelado") {
      valor_final = 0;
      updateBalance = (apostaData.valor_apostado || 0);
    } else if (resultado === "Cashout" && cashoutValue) {
      valor_final = cashoutValue - (apostaData.valor_apostado || 0);
      updateBalance = cashoutValue;
    }

    // Atualizar aposta
    const { error: apostaError } = await supabase
      .from("aposta")
      .update({ resultado, valor_final })
      .eq("id", id);

    if (apostaError) throw apostaError;

    // Atualizar saldo se necessário
    if (updateBalance > 0 && apostaData.casa_de_apostas) {
      const { data: bookie } = await supabase
        .from("bookies")
        .select("balance")
        .eq("name", apostaData.casa_de_apostas)
        .single();

      if (bookie) {
        await supabase
          .from("bookies")
          .update({ 
            balance: (bookie.balance || 0) + updateBalance,
            last_update: new Date().toISOString()
          })
          .eq("name", apostaData.casa_de_apostas);
      }
    }
  },

  async kpis(params: ListParams = {}): Promise<KPIData> {
    const { data } = await this.list(params);

    const resolvidas = data.filter((a) => 
      a.resultado && ["Ganhou", "Perdeu", "Cancelado", "Cashout"].includes(a.resultado)
    );

    const totalApostado = data.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    const lucro = resolvidas.reduce((sum, a) => sum + (a.valor_final || 0), 0);
    const ganhas = resolvidas.filter((a) => a.resultado === "Ganhou").length;
    const taxaAcerto = resolvidas.length > 0 ? (ganhas / resolvidas.length) * 100 : 0;
    const roi = totalApostado > 0 ? (lucro / totalApostado) * 100 : 0;

    return {
      totalApostado,
      lucro,
      roi,
      taxaAcerto,
      totalApostas: data.length,
      apostasPendentes: data.filter((a) => a.resultado === "Pendente").length,
    };
  },

  async series(params: ListParams = {}): Promise<SeriesData[]> {
    const { data } = await this.list(params);

    const byDate = data.reduce((acc, aposta) => {
      if (!aposta.data) return acc;
      const date = dayjs(aposta.data).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = { lucro: 0, apostas: 0 };
      }
      if (aposta.resultado && ["Ganhou", "Perdeu", "Cancelado", "Cashout"].includes(aposta.resultado)) {
        acc[date].lucro += aposta.valor_final || 0;
      }
      acc[date].apostas += 1;
      return acc;
    }, {} as Record<string, { lucro: number; apostas: number }>);

    return Object.entries(byDate)
      .map(([date, stats]) => ({
        date,
        lucro: (stats as { lucro: number; apostas: number }).lucro,
        apostas: (stats as { lucro: number; apostas: number }).apostas,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  
  async update(id: number, dto: Partial<ApostaFormData>) {
    const { data, error } = await supabase
      .from("aposta")
      .update(dto)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Aposta;
  },

  async remove(id: number) {
    const { error } = await supabase
      .from("aposta")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
