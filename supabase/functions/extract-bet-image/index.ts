import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function buildPrompt(torneios: string[], casas: string[], currentDate: string): string {
  const currentYear = currentDate.split("-")[0];
  const torneiosList = torneios.length > 0
    ? `TORNEIOS DISPONÍVEIS NO SISTEMA (use exatamente um destes valores ou null se não corresponder a nenhum):
${torneios.map(t => `  - "${t}"`).join("\n")}`
    : "";

  const casasList = casas.length > 0
    ? `CASAS DE APOSTAS CADASTRADAS NO SISTEMA (use exatamente um destes nomes se identificar a casa, ou o nome que aparecer na imagem):
${casas.map(c => `  - "${c}"`).join("\n")}`
    : "";

  return `Você é um extrator especializado de dados de apostas esportivas brasileiras. Analise a imagem de um comprovante/ticket de aposta e extraia os dados em JSON.

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
- tipo_aposta: conte seleções/eventos. 1=Simples, 2=Dupla, 3=Tripla, 4+=Múltipla
- torneio: OBRIGATÓRIO usar um dos valores da lista acima se a competição corresponder. Ex: "English Premier League"/"EPL"/"PL" → "Premier League". "UEFA Champions League" → "Champions League". TURBINACO não é torneio — é um produto da Betnacional; extraia a competição real ou retorne null. Se não corresponder a nenhum da lista, retorne null
- casa_de_apostas: se a casa estiver na lista cadastrada, use o nome EXATO da lista. Se não estiver, use o nome que aparecer na imagem ou identifique pelos padrões visuais. TURBINACO e eventos com "(BN)" indicam Betnacional
- data: extraia dia e mês da imagem. Para o ANO, use SEMPRE ${currentYear} exceto se um ano diferente estiver claramente impresso na imagem E fizer sentido (ex: aposta futura). Se só vir "HH:MM" ou "DD/MM" sem ano, use ${currentYear}
- valor_apostado: valor em REAIS (R$) que o usuário pagou/apostou. Vem rotulado como "Valor", "Aposta", "Stake", "R$", "Valor da Aposta". É SEMPRE acompanhado de símbolo monetário (R$). NUNCA confunda com a odd (que é um número decimal sem R$). Exemplo: se a imagem mostra "R$ 20,00" ao lado de "Valor da Aposta" e "3.00" ao lado de "Odd", então valor_apostado=20, odd=3
- odd: multiplicador decimal SEM símbolo monetário (ex: 1.50, 2.30, 3.00). Vem rotulado como "Odd", "Cota", "@ 3.00". Verificação cruzada: valor_apostado × odd ≈ "Potencial ganho" ou "Retorno". Se valor_apostado=20 e odd=3, potencial=60. Se não bater, revise os dois campos
- is_super_odd: true se houver badge/destaque de Super Odd, Odd Boost, Odd Melhorada, Aposta Especial, ou prefixo TURBINACO (produto de Super Odds da Betnacional)
- bonus: 0 para dinheiro real. Valor se indicar Freebet, Bônus, Saldo Bônus, Aposta Grátis
- turbo: 0 se não houver boost. "+25%" → 0.25, "+30%" → 0.30, "+50%" → 0.50
- categoria: array com TODAS as categorias da aposta, usando APENAS valores da lista: ["Resultado","Finalizacoes","Escanteios","HT","FT","Gols","Chance Dupla","Chutes ao Gol","Ambas Marcam","Sofrer Falta","Cometer Falta","Cartoes","Defesas","Tiros livres","Tiros de Meta","Laterais","Desarmes","Impedimentos","Handicap","Outros"]. Ex: combinada "Ambas Marcam + Mais de 2 Gols" → ["Ambas Marcam","Gols"]. Se não corresponder a nenhum, retorne ["Outros"]. NUNCA retorne string, sempre array
- Para campos não encontrados, use null
- Responda APENAS com o JSON, sem markdown, sem explicações`;
}

const MODELS = {
  "90b": "meta/llama-3.2-90b-vision-instruct",
  "11b": "meta/llama-3.2-11b-vision-instruct",
} as const;

async function callNvidia(
  model: string,
  systemPrompt: string,
  imageBase64: string,
  mimeType: string,
  apiKey: string,
) {
  return fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: "text", text: "Extraia os dados desta aposta esportiva e retorne o JSON." },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaApiKey) throw new Error("NVIDIA_API_KEY não configurada");

    const { imageBase64, mimeType = "image/jpeg", torneios = [], casas = [], currentDate, model } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 é obrigatório");

    const today = currentDate || new Date().toISOString().split("T")[0];
    const systemPrompt = buildPrompt(torneios as string[], casas as string[], today);

    // Se usuário escolheu modelo específico, usa direto; senão auto com fallback
    const modelsToTry: string[] = model
      ? [model === "11b" ? MODELS["11b"] : MODELS["90b"]]
      : [MODELS["90b"], MODELS["11b"]];

    let lastError = "";
    let usedModel = "";

    for (const m of modelsToTry) {
      const response = await callNvidia(m, systemPrompt, imageBase64, mimeType, nvidiaApiKey);

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${m} → ${response.status}: ${errorText}`;
        continue;
      }

      const nvidiaData = await response.json();
      const rawContent = nvidiaData.choices?.[0]?.message?.content ?? "";

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `${m} → JSON inválido: ${rawContent.slice(0, 200)}`;
        continue;
      }

      const extracted = JSON.parse(jsonMatch[0]);
      usedModel = m;

      return new Response(JSON.stringify({ data: extracted, raw: rawContent, model: usedModel }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Todos os modelos falharam. Último erro: ${lastError}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
