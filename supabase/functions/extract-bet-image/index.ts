import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient, getUserIdFromToken } from "../_shared/auth.ts";
import { callNvidiaVision, callOpenAIVision, callGroqVision, extractJson } from "../_shared/ai-providers.ts";
import { composeRules, SECTION_RULES } from "../_shared/extraction-rules.ts";

// Limite do payload base64 da imagem (~8 MB de base64 ≈ ~6 MB de imagem).
const MAX_IMAGE_BASE64_LEN = 8_000_000;

const VISUAL_PATTERNS = `IDENTIFICAÇÃO VISUAL DE CASAS DE APOSTAS (suas casas cadastradas em destaque):

CASAS CADASTRADAS NO SISTEMA (prioridade máxima na identificação):
- Bet 365: fundo #121313 (quase preto), elementos e destaques em verde escuro (#00572d), logo "bet365" em branco. Interface densa com muitas odds em colunas
- Betano: fundo branco ou escuro com laranja vibrante #FF3C07 como cor primária, logo "betano" em laranja, botões laranja com texto branco
- Betfair: fundo #1E1E1E (escuro), destaques em amarelo dourado #FFB80C, logo "Betfair" ou "Betfair Exchange" em amarelo. Layout de exchange com back/lay
- Bet MGM: fundo #1C1D20 (escuro), detalhes dour/champanhe #BDA679, logo "BetMGM" com leão MGM. Interface premium minimalista
- Betnacional: fundo azul marinho profundo #0B1429 e #13213C, shades em #2E323D, logo "betnacional" ou "betnacional.com.br" em branco. Produto TURBINACO = aposta especial da Betnacional. Eventos com prefixo "(BN)" = Betnacional
- KTO: fundo preto #000000 com vermelho vivo #DA0006 como cor de destaque, logo "KTO" em vermelho e branco. Tipografia limpa e moderna
- Sporting Bet: fundo branco #FFFFFF com azul #035C8E como cor primária, logo "sportingbet" em azul. Interface clara e limpa

OUTRAS CASAS COMUNS (caso apareçam em prints):
- Stake: fundo dark cinza (#1a2c38), detalhes verde, logo "Stake"
- 1xBet: azul (#1a4a8a), interface densa, muito texto, logo "1xBET"
- Estrela Bet: gradiente roxo-rosa, estrela no logo
- Blaze: fundo preto com chamas vermelhas-laranja, logo "Blaze"
- Superbet: vermelho/bordô (#c0392b), logo "Superbet"
- Pixbet: roxo/lilás, logo "pixbet"`;

export function buildPrompt(
  torneios: string[],
  casas: string[],
  currentDate: string,
  geralInstruction?: string,
  sectionInstructions?: Record<string, string>,
): string {
  const currentYear = currentDate.split("-")[0];
  const torneiosList = torneios.length > 0
    ? `TORNEIOS DISPONÍVEIS NO SISTEMA (use exatamente um destes valores ou null se não corresponder a nenhum):
${torneios.map(t => `  - "${t}"`).join("\n")}`
    : "";

  const casasList = casas.length > 0
    ? `CASAS DE APOSTAS CADASTRADAS NO SISTEMA (use exatamente um destes nomes se identificar a casa, ou o nome que aparecer na imagem):
${casas.map(c => `  - "${c}"`).join("\n")}`
    : "";

  return `${SECTION_RULES.geral.regra}

Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "casa_de_apostas": "nome da casa",
  "tipo_aposta": "Simples | Dupla | Tripla | Múltipla",
  "is_super_odd": true ou false,
  "valor_apostado": número,
  "odd": número,
  "bonus": número,
  "turbo": número,
  "partida": "Times ou evento",
  "torneio": "Nome exato da competição conforme lista do sistema",
  "categoria": ["Categoria1", "Categoria2"],
  "data": "YYYY-MM-DD",
  "detalhes": "Descrição completa da seleção"
}

${torneiosList}

${casasList}

${VISUAL_PATTERNS}

DATA ATUAL DO SISTEMA: ${currentDate} (ano ${currentYear})

REGRAS DE EXTRAÇÃO:
${composeRules(sectionInstructions ?? {})}${geralInstruction?.trim() ? `

INSTRUÇÕES PERSONALIZADAS DO USUÁRIO (seguir sempre, têm prioridade sobre o padrão acima quando conflitar):
${geralInstruction.trim()}` : ""}`;
}

const NVIDIA_MODELS = {
  "11b": "meta/llama-3.2-11b-vision-instruct",
} as const;

function describeFailure(status: number, errorText: string): string {
  if (status === 429) return "limite de requisições atingido (429)";
  if (status === 402) return "sem créditos/cota esgotada (402)";
  if (status === 401 || status === 403) return "chave inválida ou sem permissão";
  if (errorText.toLowerCase().includes("insufficient_quota")) return "sem créditos/cota esgotada";
  if (errorText.toLowerCase().includes("rate limit")) return "limite de requisições atingido";
  return `erro ${status}: ${errorText.slice(0, 150)}`;
}

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Autenticação: exige token de sessão válido (protege o custo de IA de abuso anônimo).
    const supabase = serviceClient();
    const user_id = await getUserIdFromToken(req, supabase);
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    const { imageBase64, mimeType = "image/jpeg", torneios = [], casas = [], currentDate, model, customInstructions, sectionInstructions } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 é obrigatório");
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_BASE64_LEN) {
      return new Response(JSON.stringify({ error: "Imagem muito grande. Envie um print menor." }), {
        status: 413,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const today = currentDate || new Date().toISOString().split("T")[0];
    const systemPrompt = buildPrompt(
      torneios as string[],
      casas as string[],
      today,
      customInstructions as string | undefined,
      sectionInstructions as Record<string, string> | undefined,
    );

    type Job =
      | { provider: "nvidia"; modelId: string; label: string }
      | { provider: "openai"; label: string }
      | { provider: "groq"; label: string };

    let jobs: Job[];
    if (model === "gpt4o") {
      jobs = [{ provider: "openai", label: "OpenAI (gpt-4o-mini)" }];
    } else if (model === "11b") {
      jobs = [{ provider: "nvidia", modelId: NVIDIA_MODELS["11b"], label: "NVIDIA 11B" }];
    } else if (model === "groq") {
      jobs = [{ provider: "groq", label: "Groq (Llama 4 Scout)" }];
    } else {
      // auto: NVIDIA 11B → Groq → OpenAI
      jobs = [
        { provider: "nvidia", modelId: NVIDIA_MODELS["11b"], label: "NVIDIA 11B" },
        { provider: "groq", label: "Groq (Llama 4 Scout)" },
        { provider: "openai", label: "OpenAI (gpt-4o-mini)" },
      ];
    }

    const attempts: string[] = [];
    let usedModel = "";

    for (const job of jobs) {
      const apiKey = job.provider === "nvidia" ? nvidiaApiKey : job.provider === "groq" ? groqApiKey : openaiApiKey;
      if (!apiKey) {
        attempts.push(`${job.label}: chave não configurada`);
        continue;
      }

      try {
        let response: Response;
        if (job.provider === "nvidia") {
          response = await callNvidiaVision(job.modelId, systemPrompt, imageBase64, mimeType, apiKey);
        } else if (job.provider === "groq") {
          response = await callGroqVision(systemPrompt, imageBase64, mimeType, apiKey);
        } else {
          response = await callOpenAIVision(systemPrompt, imageBase64, mimeType, apiKey);
        }

        if (!response.ok) {
          const errorText = await response.text();
          attempts.push(`${job.label}: ${describeFailure(response.status, errorText)}`);
          continue;
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content ?? "";

        const extracted = extractJson(rawContent);
        if (!extracted) {
          attempts.push(`${job.label}: resposta sem JSON válido`);
          continue;
        }

        usedModel = job.label;

        return new Response(JSON.stringify({ data: extracted, raw: rawContent, model: usedModel }), {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (e) {
        attempts.push(`${job.label}: ${e instanceof Error ? e.message : "erro inesperado"}`);
        continue;
      }
    }

    // Detalhe das tentativas fica só no log do servidor (não vaza texto de provider ao cliente).
    console.error("extract-bet-image: todos os modelos falharam:", attempts.join(" | "));
    return new Response(JSON.stringify({ error: "Não foi possível extrair a imagem. Tente outro print ou outro modelo." }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 502,
    });
  } catch (error) {
    console.error("extract-bet-image error:", error);
    return new Response(JSON.stringify({ error: "Não foi possível extrair a imagem. Tente novamente." }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
