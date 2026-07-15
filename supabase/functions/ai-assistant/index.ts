import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient, getUserIdFromToken } from "../_shared/auth.ts";
import { extractJson } from "../_shared/ai-providers.ts";

// ── Analytics Engine ──────────────────────────────────────────────────────────

interface Bet {
  id: number;
  data: string;
  tipo_aposta: string;
  categoria: string;
  casa_de_apostas: string;
  torneio: string;
  valor_apostado: number;
  odd: number;
  bonus: number;
  turbo: number;
  is_super_odd: boolean;
  resultado: string;
  valor_final: number;
  detalhes: string;
  partida: string;
}

interface DimStat {
  count: number;
  ganhou: number;
  perdeu: number;
  totalApostado: number;
  lucro: number;
}

function betLucro(b: Bet): number {
  if (b.resultado === "Ganhou") return b.valor_final ?? 0;
  if (b.resultado === "Perdeu") return -(b.valor_apostado ?? 0);
  if (b.resultado === "Cashout") return (b.valor_final ?? 0) - (b.valor_apostado ?? 0);
  return 0;
}

function statRoi(s: DimStat): string {
  if (s.totalApostado === 0) return "0%";
  return ((s.lucro / s.totalApostado) * 100).toFixed(1) + "%";
}

function statWinRate(s: DimStat): string {
  const r = s.ganhou + s.perdeu;
  if (r === 0) return "0%";
  return ((s.ganhou / r) * 100).toFixed(1) + "%";
}

function groupBy(bets: Bet[], key: keyof Bet): Record<string, DimStat> {
  const acc: Record<string, DimStat> = {};
  for (const b of bets) {
    const k = String(b[key] || "Sem dados");
    if (!acc[k]) acc[k] = { count: 0, ganhou: 0, perdeu: 0, totalApostado: 0, lucro: 0 };
    acc[k].count++;
    acc[k].totalApostado += b.valor_apostado ?? 0;
    acc[k].lucro += betLucro(b);
    if (b.resultado === "Ganhou") acc[k].ganhou++;
    if (b.resultado === "Perdeu") acc[k].perdeu++;
  }
  return acc;
}

function topN(stats: Record<string, DimStat>, n = 8) {
  return Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([nome, s]) => ({
      nome,
      apostas: s.count,
      lucro: "R$ " + s.lucro.toFixed(2),
      roi: statRoi(s),
      winRate: statWinRate(s),
    }));
}

function oddBucket(odd: number): string {
  if (odd < 1.5) return "< 1.50";
  if (odd < 2.0) return "1.50 – 2.00";
  if (odd < 3.0) return "2.00 – 3.00";
  if (odd < 5.0) return "3.00 – 5.00";
  return "> 5.00";
}

function computeAnalytics(bets: Bet[], bookies: { name: string; balance: number }[]) {
  const resolved = bets.filter(b => ["Ganhou", "Perdeu", "Cashout"].includes(b.resultado));
  const pending = bets.filter(b => b.resultado === "Pendente");

  const totalApostado = resolved.reduce((s, b) => s + (b.valor_apostado ?? 0), 0);
  const totalLucro = resolved.reduce((s, b) => s + betLucro(b), 0);
  const ganhou = resolved.filter(b => b.resultado === "Ganhou").length;
  const geralStat: DimStat = {
    count: resolved.length, ganhou, perdeu: resolved.length - ganhou, totalApostado, lucro: totalLucro,
  };

  // Dimension breakdowns
  const byCategoria = groupBy(resolved, "categoria");
  const byTorneio = groupBy(resolved, "torneio");
  const byTipo = groupBy(resolved, "tipo_aposta");
  const byCasa = groupBy(resolved, "casa_de_apostas");

  // Odd bucket breakdown
  const byOdd: Record<string, DimStat> = {};
  for (const b of resolved) {
    const k = oddBucket(b.odd ?? 1);
    if (!byOdd[k]) byOdd[k] = { count: 0, ganhou: 0, perdeu: 0, totalApostado: 0, lucro: 0 };
    byOdd[k].count++;
    byOdd[k].totalApostado += b.valor_apostado ?? 0;
    byOdd[k].lucro += betLucro(b);
    if (b.resultado === "Ganhou") byOdd[k].ganhou++;
    if (b.resultado === "Perdeu") byOdd[k].perdeu++;
  }

  // Day of week
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const byDay: Record<string, DimStat> = {};
  for (const b of resolved) {
    if (!b.data) continue;
    const day = dayNames[new Date(b.data + "T12:00:00").getDay()];
    if (!byDay[day]) byDay[day] = { count: 0, ganhou: 0, perdeu: 0, totalApostado: 0, lucro: 0 };
    byDay[day].count++;
    byDay[day].totalApostado += b.valor_apostado ?? 0;
    byDay[day].lucro += betLucro(b);
    if (b.resultado === "Ganhou") byDay[day].ganhou++;
    if (b.resultado === "Perdeu") byDay[day].perdeu++;
  }

  // Feature comparisons
  function featureStat(list: Bet[]): { apostas: number; roi: string; lucro: string; winRate: string } {
    const s: DimStat = {
      count: list.length,
      ganhou: list.filter(b => b.resultado === "Ganhou").length,
      perdeu: list.filter(b => b.resultado === "Perdeu").length,
      totalApostado: list.reduce((s, b) => s + (b.valor_apostado ?? 0), 0),
      lucro: list.reduce((s, b) => s + betLucro(b), 0),
    };
    return { apostas: s.count, roi: statRoi(s), lucro: "R$ " + s.lucro.toFixed(2), winRate: statWinRate(s) };
  }

  // Weekly trend — last 8 weeks
  const now = new Date();
  const weeklyTrend = [];
  for (let w = 7; w >= 0; w--) {
    const from = new Date(now); from.setDate(from.getDate() - (w + 1) * 7);
    const to = new Date(now); to.setDate(to.getDate() - w * 7);
    const wb = resolved.filter(b => { const d = new Date(b.data); return d >= from && d < to; });
    if (wb.length > 0) {
      weeklyTrend.push({
        semana: `W-${w === 0 ? "atual" : w}`,
        apostas: wb.length,
        lucro: "R$ " + wb.reduce((s, b) => s + betLucro(b), 0).toFixed(2),
      });
    }
  }

  // Current streak
  let streak = 0, streakType = "";
  for (const b of [...bets].sort((a, z) => new Date(z.data).getTime() - new Date(a.data).getTime())) {
    if (!["Ganhou", "Perdeu"].includes(b.resultado)) continue;
    if (streak === 0) { streakType = b.resultado; streak = 1; }
    else if (b.resultado === streakType) streak++;
    else break;
  }

  // Longest streaks
  let maxWin = 0, maxLoss = 0, curW = 0, curL = 0;
  for (const b of [...bets].sort((a, z) => new Date(a.data).getTime() - new Date(z.data).getTime())) {
    if (b.resultado === "Ganhou") { curW++; curL = 0; maxWin = Math.max(maxWin, curW); }
    else if (b.resultado === "Perdeu") { curL++; curW = 0; maxLoss = Math.max(maxLoss, curL); }
  }

  // Last 25 bets for recent context
  const recent = bets.slice(0, 50).map(b => ({
    data: b.data, partida: b.partida, tipo: b.tipo_aposta, categoria: b.categoria,
    torneio: b.torneio, casa: b.casa_de_apostas, valor: b.valor_apostado,
    odd: b.odd, resultado: b.resultado, lucro: betLucro(b).toFixed(2),
  }));

  return {
    kpis: {
      totalApostas: bets.length,
      resolvidas: resolved.length,
      pendentes: pending.length,
      totalApostado: "R$ " + totalApostado.toFixed(2),
      lucroTotal: "R$ " + totalLucro.toFixed(2),
      roi: statRoi(geralStat),
      winRate: statWinRate(geralStat),
      oddMedia: resolved.length ? (resolved.reduce((s, b) => s + (b.odd ?? 0), 0) / resolved.length).toFixed(2) : "0",
      stakeMedia: resolved.length ? "R$ " + (totalApostado / resolved.length).toFixed(2) : "0",
    },
    bancas: bookies.map(bk => ({ casa: bk.name, saldo: "R$ " + bk.balance.toFixed(2) })),
    streakAtual: streak > 0 ? `${streak} ${streakType === "Ganhou" ? "vitórias" : "derrotas"} consecutivas` : "Sem streak",
    maiorSequenciaVitorias: maxWin,
    maiorSequenciaDerrotas: maxLoss,
    porCategoria: topN(byCategoria),
    porTorneio: topN(byTorneio),
    porTipoAposta: topN(byTipo),
    porCasa: topN(byCasa),
    porFaixaOdd: Object.entries(byOdd)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([faixa, s]) => ({ faixa, apostas: s.count, roi: statRoi(s), winRate: statWinRate(s), lucro: "R$ " + s.lucro.toFixed(2) })),
    porDiaSemana: Object.entries(byDay)
      .map(([dia, s]) => ({ dia, apostas: s.count, roi: statRoi(s), lucro: "R$ " + s.lucro.toFixed(2) })),
    comparativos: {
      turbo: {
        comTurbo: featureStat(resolved.filter(b => (b.turbo ?? 0) > 0)),
        semTurbo: featureStat(resolved.filter(b => !(b.turbo ?? 0))),
      },
      bonus: {
        comBonus: featureStat(resolved.filter(b => (b.bonus ?? 0) > 0)),
        semBonus: featureStat(resolved.filter(b => !(b.bonus ?? 0))),
      },
      superOdd: {
        comSuperOdd: featureStat(resolved.filter(b => b.is_super_odd)),
        semSuperOdd: featureStat(resolved.filter(b => !b.is_super_odd)),
      },
    },
    tendenciaSemanal: weeklyTrend,
    ultimas25Apostas: recent,
  };
}

// ── Provider calls (NVIDIA primary, Groq fallback) ──────────────────────────────

type ChatMessage = { role: string; content: string };

async function callNvidia(messages: ChatMessage[], modelConfig: Record<string, unknown>, apiKey: string) {
  return fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages, ...modelConfig }),
    signal: AbortSignal.timeout(30000),
  });
}

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function callGroq(messages: ChatMessage[], apiKey: string) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.3, max_tokens: 4096 }),
    signal: AbortSignal.timeout(30000),
  });
}

// ── Edge Function ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const supabase = serviceClient();
    const user_id = await getUserIdFromToken(req, supabase);
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { message, history = [], modelMode = "fast" } = await req.json();

    const [{ data: allBets }, { data: bookies }] = await Promise.all([
      supabase.from("aposta").select("*").eq("user_id", user_id).order("data", { ascending: false }).limit(2000),
      supabase.from("bookies").select("name, balance").eq("user_id", user_id),
    ]);

    const analytics = computeAnalytics((allBets ?? []) as Bet[], bookies ?? []);

    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    const systemPrompt = `Você é o **Win Analytics AI**, analista especializado em apostas esportivas. Tem acesso completo aos dados do usuário calculados em tempo real.

MISSÃO: Identificar padrões nos dados, apontar ineficiências, indicar onde apostar mais e onde cortar. Ser proativo — não espere o usuário perguntar algo óbvio.

DADOS ANALÍTICOS (tempo real):
${JSON.stringify(analytics, null, 2)}

DIRETRIZES:
- Baseie TODAS as análises nos dados acima. Zero invenção de números.
- Quando detectar padrão negativo, cite os números exatos e dê ação concreta.
- Quando detectar padrão positivo, sugira como amplificar.
- Uso obrigatório de Markdown: tabelas para comparações, negrito em métricas.
- Sempre mencione que apostas envolvem risco, mas sem repetir a cada resposta.
- Português do Brasil. Tom direto e técnico.

FORMATO OBRIGATÓRIO (JSON puro, sem markdown ao redor):
{"reply":"resposta completa em markdown","suggestedQuestions":["pergunta 1","pergunta 2","pergunta 3"]}`;

    const recentHistory = (history as { role: string; content: string }[]).slice(-8);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: message },
    ];

    const modelConfig = modelMode === "deep"
      ? {
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          max_tokens: 16384,
          temperature: 1,
          top_p: 0.95,
          chat_template_kwargs: { enable_thinking: true },
          reasoning_budget: 16384,
        }
      : {
          model: "meta/llama-3.3-70b-instruct",
          max_tokens: 1024,
          temperature: 0.2,
          top_p: 0.7,
        };

    const jobs: { call: () => Promise<Response>; label: string }[] = [];
    if (nvidiaApiKey) jobs.push({ call: () => callNvidia(messages, modelConfig, nvidiaApiKey), label: `NVIDIA (${modelMode})` });
    if (groqApiKey) jobs.push({ call: () => callGroq(messages, groqApiKey), label: "Groq" });
    if (jobs.length === 0) throw new Error("Nenhuma chave de IA configurada (NVIDIA_API_KEY / GROQ_API_KEY)");

    const attempts: string[] = [];
    let rawContent = "";
    for (const job of jobs) {
      try {
        const response = await job.call();
        if (!response.ok) {
          const err = await response.text();
          attempts.push(`${job.label}: erro ${response.status} — ${err.slice(0, 200)}`);
          continue;
        }
        const data = await response.json();
        rawContent = data.choices?.[0]?.message?.content ?? "";
        if (rawContent) break;
        attempts.push(`${job.label}: resposta vazia`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        attempts.push(`${job.label}: ${msg.includes("aborted") ? "timeout (30s)" : msg}`);
      }
    }

    if (!rawContent) throw new Error(`Falha ao gerar resposta:\n${attempts.join("\n")}`);

    const parsed = extractJson<{ reply: string; suggestedQuestions: string[] }>(rawContent)
      ?? { reply: rawContent, suggestedQuestions: [] };

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Loga o detalhe no servidor, mas não vaza mensagem de provider/upstream ao cliente.
    console.error("ai-assistant error:", error);
    return new Response(JSON.stringify({ error: "Falha ao gerar a resposta. Tente novamente." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
