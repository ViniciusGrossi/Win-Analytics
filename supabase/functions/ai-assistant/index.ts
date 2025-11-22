import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { message } = await req.json();

        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: req.headers.get("Authorization")! },
            },
        });

        // 2. Get User
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("User not authenticated");
        }

        // 3. Fetch Betting Data (Context)
        // Fetch recent bets
        const { data: recentBets, error: betsError } = await supabase
            .from("aposta")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false })
            .limit(20);

        if (betsError) throw betsError;

        // Fetch bookies (for balance context)
        const { data: bookies, error: bookiesError } = await supabase
            .from("bookies")
            .select("name, balance")
            .eq("user_id", user.id);

        if (bookiesError) throw bookiesError;

        // Calculate basic KPIs from recent bets
        const totalBets = recentBets?.length || 0;
        const winningBets = recentBets?.filter((b) => b.resultado === "Ganhou").length || 0;
        const winRate = totalBets > 0 ? ((winningBets / totalBets) * 100).toFixed(1) : "0";

        let totalProfit = 0;
        recentBets?.forEach(bet => {
            if (bet.resultado === "Ganhou") {
                totalProfit += (bet.valor_final || 0) - (bet.valor_apostado || 0);
            } else if (bet.resultado === "Perdeu") {
                totalProfit -= (bet.valor_apostado || 0);
            }
        });

        // 4. Initialize OpenAI
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY"),
        });

        // 5. Construct System Prompt
        const systemPrompt = `
      Você é o "Wager Art AI", um analista de apostas esportivas profissional e pessoal.
      
      DADOS DO USUÁRIO (Contexto Real):
      - Total de Bancas (Saldo): ${bookies?.map(b => `${b.name}: R$${b.balance}`).join(", ")}
      - Performance Recente (Últimas 20 apostas):
        - Taxa de Acerto: ${winRate}%
        - Lucro/Prejuízo Recente: R$ ${totalProfit.toFixed(2)}
      
      HISTÓRICO RECENTE (JSON):
      ${JSON.stringify(recentBets?.map(b => ({
            data: b.data,
            partida: b.partida,
            aposta: b.tipo_aposta,
            categoria: b.categoria,
            valor: b.valor_apostado,
            odd: b.odd,
            resultado: b.resultado,
            lucro: b.resultado === 'Ganhou' ? (b.valor_final - b.valor_apostado) : -b.valor_apostado
        })), null, 2)}

      SUAS INSTRUÇÕES:
      1. Analise os dados acima para responder. NÃO invente dados. Se não souber, diga que precisa de mais histórico.
      2. Seja direto, profissional mas encorajador.
      3. Se o usuário estiver perdendo muito, sugira gestão de banca e cautela.
      4. Identifique padrões: "Notei que você ganha mais em Escanteios" ou "Você perde muito apostando em odds altas".
      5. Responda em Markdown.
      6. Se o usuário perguntar algo não relacionado a apostas, gentilmente recuse e volte ao foco.
    `;

        // 6. Call OpenAI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
            model: "gpt-4o-mini",
            temperature: 0.7,
        });

        const aiResponse = completion.choices[0].message.content;

        return new Response(JSON.stringify({ reply: aiResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
