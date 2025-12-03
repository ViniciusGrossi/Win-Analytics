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

        // 3. Fetch Betting Data (Last 100 bets for faster response)
        const { data: recentBets, error: betsError } = await supabase
            .from("aposta")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false })
            .limit(100);

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

        // Group by category
        const categoryStats: any = {};
        recentBets?.forEach(bet => {
            const category = bet.categoria || "Outros";
            if (!categoryStats[category]) {
                categoryStats[category] = { wins: 0, total: 0, profit: 0 };
            }
            categoryStats[category].total++;
            if (bet.resultado === "Ganhou") {
                categoryStats[category].wins++;
                categoryStats[category].profit += (bet.valor_final || 0) - (bet.valor_apostado || 0);
            } else if (bet.resultado === "Perdeu") {
                categoryStats[category].profit -= (bet.valor_apostado || 0);
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

        // 5. Construct System Prompt for Insights
        const systemPrompt = `
      Você é o "Wager Art AI", um analista de apostas esportivas profissional.
      
      DADOS DO USUÁRIO:
      - Total de Apostas (últimas 100): ${totalBets}
      - Apostas Ganhas: ${winningBets}
      - Apostas Perdidas: ${losingBets}
      - Taxa de Acerto: ${winRate}%
      - ROI: ${roi}%
      - Lucro Total: R$ ${totalProfit.toFixed(2)}
      - Investimento Total: R$ ${totalInvested.toFixed(2)}
      
      PERFORMANCE POR CATEGORIA:
      ${JSON.stringify(categoryStats, null, 2)}
      
      SUAS INSTRUÇÕES:
      1. Gere EXATAMENTE 3 insights curtos, acionáveis e motivadores sobre a performance do usuário
      2. Cada insight deve ter:
         - Um título curto e cativante (máximo 4 palavras)
         - Uma descrição de 1-2 linhas explicando o insight
         - Um emoji relevante
         - Uma cor (success, warning, destructive, primary, purple, ou blue)
      3. Foque em padrões interessantes, conquistas ou áreas de melhoria
      4. Use as cores de forma inteligente:
         - success (verde): para lucros, recordes, boas notícias
         - warning (amarelo): para alertas, tendências de queda
         - destructive (vermelho): para prejuízos, riscos altos
         - purple (roxo): para dicas estratégicas, curiosidades
         - blue (azul claro): para informações neutras
         - primary (azul padrão): para dados gerais
      5. Use dados concretos do histórico
      
      Responda APENAS com um objeto JSON contendo um array "insights" neste formato exato:
      {
        "insights": [
          {
            "title": "Título do Insight",
            "description": "Descrição breve e acionável",
            "emoji": "🚀",
            "color": "success"
          }
        ]
      }
      
      Não adicione nenhum texto antes ou depois do JSON. Apenas o objeto JSON puro.
    `;

        // 6. Call OpenAI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Gere 3 insights inteligentes baseados nos meus dados" },
            ],
            model: "gpt-4o-mini",
            temperature: 0.8,
            response_format: { type: "json_object" }
        });

        const aiResponse = completion.choices[0].message.content;

        // Parse the JSON response
        let insights;
        try {
            const parsed = JSON.parse(aiResponse || "{}");
            insights = parsed.insights || parsed;
            if (!Array.isArray(insights)) {
                insights = [parsed];
            }
        } catch (e) {
            console.error("Failed to parse AI response:", aiResponse);
            // Fallback insights
            insights = [
                {
                    title: "Dados Disponíveis",
                    description: `Você tem ${totalBets} apostas registradas com ${winRate}% de acerto.`,
                    emoji: "📊",
                    color: "primary"
                }
            ];
        }

        return new Response(JSON.stringify({ insights }), {
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
