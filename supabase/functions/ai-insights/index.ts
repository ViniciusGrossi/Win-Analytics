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
        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        // Get the authorization header from the request
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            throw new Error('No authorization header passed');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: authHeader },
            },
        });

        // 2. Get Input Params
        const { user_id, deep_analysis } = await req.json();

        if (!user_id) {
            throw new Error("user_id not found in request body");
        }

        // 3. Fetch Betting Data (Last 300 bets for deeper analysis)
        const limit = deep_analysis ? 300 : 100;
        const { data: recentBets, error: betsError } = await supabase
            .from("aposta")
            .select("*")
            .eq("user_id", user_id)
            .order("data", { ascending: false })
            .limit(limit);

        if (betsError) {
            console.error("Error fetching bets:", betsError);
            throw betsError;
        }

        // Calculate KPIs
        const totalBets = recentBets?.length || 0;
        const winningBets = recentBets?.filter((b) => b.resultado === "Ganhou").length || 0;
        const losingBets = recentBets?.filter((b) => b.resultado === "Perdeu").length || 0;
        const winRate = totalBets > 0 ? ((winningBets / totalBets) * 100).toFixed(1) : "0";

        let totalProfit = 0;
        let totalInvested = 0;
        recentBets?.forEach(bet => {
            totalInvested += bet.valor_apostado || 0;
            if (bet.resultado === "Ganhou") {
                totalProfit += (bet.valor_final || 0) - (bet.valor_apostado || 0);
            } else if (bet.resultado === "Perdeu") {
                totalProfit -= (bet.valor_apostado || 0);
            }
        });

        const roi = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : "0";

        // Grouping for Deep Analysis
        const temporalStats: any = {};
        const oddRangeStats: any = { low: { t: 0, w: 0, p: 0 }, med: { t: 0, w: 0, p: 0 }, high: { t: 0, w: 0, p: 0 } };
        const categoryStats: any = {};

        recentBets?.forEach(bet => {
            // Category
            const cat = bet.categoria || "Outros";
            if (!categoryStats[cat]) categoryStats[cat] = { wins: 0, total: 0, profit: 0 };
            categoryStats[cat].total++;
            
            // Temporal
            const date = new Date(bet.data);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            if (!temporalStats[dayName]) temporalStats[dayName] = { wins: 0, total: 0, profit: 0 };
            temporalStats[dayName].total++;

            // Odds
            const odd = bet.odd || 0;
            let range = "low";
            if (odd > 2.0 && odd <= 3.5) range = "med";
            else if (odd > 3.5) range = "high";
            oddRangeStats[range].t++;

            if (bet.resultado === "Ganhou") {
                const profit = (bet.valor_final || 0) - (bet.valor_apostado || 0);
                categoryStats[cat].wins++;
                categoryStats[cat].profit += profit;
                temporalStats[dayName].wins++;
                temporalStats[dayName].profit += profit;
                oddRangeStats[range].w++;
                oddRangeStats[range].p += profit;
            } else if (bet.resultado === "Perdeu") {
                const loss = (bet.valor_apostado || 0);
                categoryStats[cat].profit -= loss;
                temporalStats[dayName].profit -= loss;
                oddRangeStats[range].p -= loss;
            }
        });

        // 4. Initialize OpenAI
        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) throw new Error("OpenAI API Key not configured");

        const openai = new OpenAI({ apiKey });

        // 5. Construct System Prompt
        const systemPrompt = deep_analysis 
        ? `
        Você é o "Win Analytics Pro Engine", um motor de correlação de padrões para investidores esportivos profissionais.
        Analise os clusters de dados abaixo e identifique 3 padrões ocultos (LEAKS ou OPORTUNIDADES).

        CONTEXTO:
        - Win Rate: ${winRate}% | ROI: ${roi}% | Total: ${totalBets} apostas
        
        CLUSTERS:
        - Categorias: ${JSON.stringify(categoryStats)}
        - Temporal: ${JSON.stringify(temporalStats)}
        - Faixas de Odd (Low <2.0, Med 2.0-3.5, High >3.5): ${JSON.stringify(oddRangeStats)}

        REGRAS:
        1. Identifique correlações entre Dia da Semana, Faixa de Odd e ROI.
        2. Seja extremamente técnico e quantitativo.
        3. Retorne EXATAMENTE 3 padrões no JSON.
        
        FORMATO DE RESPOSTA JSON:
        {
          "patterns": [
            {
              "type": "leak" ou "opportunity",
              "title": "Título Profissional",
              "description": "Explicação técnica da correlação encontrada",
              "impact": "Valor R$ ou % de ROI perdido/ganho",
              "confidence": 0-100
            }
          ],
          "insights": [] // manter compatibilidade com array de insights se necessário
        }
        `
        : `
        Você é o "Win Analytics AI", analista executivo.
        Gere 3 insights curtos e dinâmicos.
        KPIs: ${winRate}% Acerto | R$ ${totalProfit.toFixed(2)} Lucro
        Categorias: ${JSON.stringify(categoryStats)}

        FORMATO JSON:
        {
          "insights": [
             {"title": "...", "description": "...", "emoji": "...", "color": "..."}
          ]
        }
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0].message.content || "{}");

        return new Response(JSON.stringify(data), {
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
