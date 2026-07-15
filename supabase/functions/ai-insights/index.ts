import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient, getUserIdFromToken } from "../_shared/auth.ts";
import { callOpenAIText, callGroqText, extractJson } from "../_shared/ai-providers.ts";

serve(async (req) => {
    const cors = corsHeaders(req);
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }

    try {
        // 1. Autenticação: user_id vem SEMPRE do token, nunca do corpo.
        const supabase = serviceClient();
        const user_id = await getUserIdFromToken(req, supabase);
        if (!user_id) {
            return new Response(JSON.stringify({ error: "Não autenticado" }), {
                status: 401,
                headers: { ...cors, "Content-Type": "application/json" },
            });
        }

        // 2. Get Input Params
        const { deep_analysis } = await req.json();

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

        // 4. API Keys
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        const groqApiKey = Deno.env.get("GROQ_API_KEY");

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

        const jobs: { call: () => Promise<Response>; label: string }[] = [];
        if (openaiApiKey) jobs.push({ call: () => callOpenAIText(systemPrompt, openaiApiKey), label: "OpenAI" });
        if (groqApiKey) jobs.push({ call: () => callGroqText(systemPrompt, groqApiKey), label: "Groq" });
        if (jobs.length === 0) throw new Error("Nenhuma chave de IA configurada (OPENAI_API_KEY / GROQ_API_KEY)");

        const attempts: string[] = [];
        let rawContent = "";
        for (const job of jobs) {
            const response = await job.call();
            if (!response.ok) {
                attempts.push(`${job.label}: erro ${response.status}`);
                continue;
            }
            const result = await response.json();
            rawContent = result.choices?.[0]?.message?.content ?? "";
            if (rawContent) break;
            attempts.push(`${job.label}: resposta vazia`);
        }

        if (!rawContent) throw new Error(`Falha ao gerar análise:\n${attempts.join("\n")}`);

        const data = extractJson(rawContent);
        if (!data) throw new Error("Resposta da IA não veio em JSON válido");

        return new Response(JSON.stringify(data), {
            headers: { ...cors, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("ai-insights error:", error);
        return new Response(JSON.stringify({ error: "Não foi possível gerar os insights." }), {
            status: 500,
            headers: { ...cors, "Content-Type": "application/json" },
        });
    }
});
