import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

        // Get the authorization header from the request
        const authHeader = req.headers.get('Authorization');

        console.log("Auth Header present:", !!authHeader);
        if (authHeader) {
            console.log("Auth Header length:", authHeader.length);
            // Log first few chars to verify it's a Bearer token (don't log full token)
            console.log("Auth Header start:", authHeader.substring(0, 15) + "...");
        } else {
            throw new Error('No authorization header passed');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: authHeader },
            },
        });

        // 2. Get User
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("Auth error details:", userError);
            throw new Error(`Auth error: ${userError.message}`);
        }

        if (!user) {
            throw new Error("User not found");
        }

        console.log("User authenticated:", user.id);

        // 3. Fetch Betting Data (Context)
        // Fetch up to 1000 bets for comprehensive analysis
        const { data: allBets, error: betsError } = await supabase
            .from("aposta")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false })
            .limit(1000);

        if (betsError) {
            console.error("Error fetching bets:", betsError);
            throw betsError;
        }

        // Fetch bookies (for balance context)
        const { data: bookies, error: bookiesError } = await supabase
            .from("bookies")
            .select("name, balance")
            .eq("user_id", user.id);

        if (bookiesError) {
            console.error("Error fetching bookies:", bookiesError);
            throw bookiesError;
        }

        // Calculate comprehensive KPIs from all bets
        const totalBets = allBets?.length || 0;
        const winningBets = allBets?.filter((b) => b.resultado === "Ganhou").length || 0;
        const winRate = totalBets > 0 ? ((winningBets / totalBets) * 100).toFixed(1) : "0";

        let totalProfit = 0;
        allBets?.forEach(bet => {
            if (bet.resultado === "Ganhou") {
                totalProfit += (bet.valor_final || 0) - (bet.valor_apostado || 0);
            } else if (bet.resultado === "Perdeu") {
                totalProfit -= (bet.valor_apostado || 0);
            }
        });

        // 4. Initialize OpenAI
        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            console.error("OPENAI_API_KEY not found");
            throw new Error("OpenAI API Key not configured");
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        // 5. Construct System Prompt
        const systemPrompt = `
      Você é o "Wager Art AI", um analista de apostas esportivas profissional e pessoal.
      
      DADOS DO USUÁRIO (Contexto Completo):
      - Total de Bancas (Saldo Atual): ${bookies?.map(b => `${b.name}: R$${b.balance}`).join(", ")}
      - Performance Geral (${totalBets} apostas no histórico):
        - Taxa de Acerto: ${winRate}%
        - Lucro/Prejuízo Total: R$ ${totalProfit.toFixed(2)}
      
      HISTÓRICO COMPLETO (até 1000 apostas mais recentes - JSON):
      ${JSON.stringify(allBets?.map(b => ({
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
      1. Você tem acesso a TODO o histórico de apostas do usuário (até 1000 apostas). Use esses dados para análises profundas.
      2. Analise os dados acima para responder. NÃO invente dados. Se precisar de informações específicas, pergunte ao usuário.
      3. Seja direto, profissional mas encorajador.
      4. Identifique padrões ao longo do tempo: tendências, categorias mais lucrativas, horários ideais, etc.
      5. Se o usuário estiver perdendo muito, sugira gestão de banca e cautela.
      6. Forneça insights acionáveis baseados em estatísticas reais.
      7. Responda sempre em Markdown formatado.
      8. Se o usuário perguntar algo não relacionado a apostas, gentilmente recuse e volte ao foco.
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
