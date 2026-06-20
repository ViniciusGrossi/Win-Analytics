import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um extrator especializado de dados de apostas esportivas brasileiras. Analise a imagem de um comprovante/ticket de aposta e extraia os dados em JSON.

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
  "torneio": "Nome da competição",
  "categoria": "Categoria da aposta",
  "data": "YYYY-MM-DD",
  "detalhes": "Descrição completa da seleção"
}

IDENTIFICAÇÃO VISUAL DE CASAS DE APOSTAS (use quando o nome não aparecer explicitamente):
- Bet365: fundo verde escuro (#00572d), logo "bet365" em branco, interface densa
- Betano: laranja vibrante (#f06f0c) ou gradiente laranja-vermelho, logo "betano"
- Sportingbet: azul marinho (#003087), logo "sportingbet" ou "Bwin"
- Betfair: azul claro (#003087 ou ciano), logo "Betfair Exchange"
- KTO: azul royal (#1e3a8a), tipografia limpa, logo "KTO"
- Superbet: vermelho/bordô (#c0392b), logo "Superbet"
- Stake: fundo dark cinza (#1a2c38), detalhes verde, logo "Stake"
- 1xBet: azul (#1a4a8a), interface densa, muito texto, logo "1xBET"
- Estrela Bet: gradiente roxo-rosa, estrela no logo, "estrela bet"
- Blaze: fundo preto/escuro com chamas vermelhas-laranja, logo "Blaze"
- Novibet: verde escuro e preto, logo "novibet"
- Vaidebet: vermelho forte, logo "vaidebet", atletas no visual
- Galera.bet: verde e amarelo (cores Brasil), logo "galera.bet"
- Betsson: vermelho, interface europeia, logo "betsson"
- Pinnacle: azul escuro, layout minimalista, logo "Pinnacle"
- Betnacional: verde e branco, logo "betnacional"
- Pixbet: roxo/lilás, logo "pixbet"
- Betpix365: mistura de verde e roxo
- Mr.Jack: preto e dourado, personagem de cartas

REGRAS DE EXTRAÇÃO:
- tipo_aposta: conte seleções/eventos. 1=Simples, 2=Dupla, 3=Tripla, 4+=Múltipla
- is_super_odd: true se houver badge/destaque de Super Odd, Odd Boost, Odd Melhorada, Aposta Especial
- bonus: 0 para dinheiro real. Coloque o valor se indicar Freebet, Bônus, Saldo Bônus, Aposta Grátis
- turbo: 0 se não houver boost. Se "+25%" → 0.25, "+30%" → 0.30, "+50%" → 0.50. Turbo é um multiplicador de lucro, aparece destacado perto da odd
- torneio: use APENAS o nome oficial da competição (ex: "Champions League", "Série A"), não inclua datas, times ou descrições da aposta
- categoria: tipo de mercado da aposta (ex: "Resultado", "Ambas Marcam", "Total de Gols", "Handicap")
- Para campos não encontrados, use null
- Responda APENAS com o JSON, sem markdown, sem explicações`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaApiKey) {
      throw new Error("NVIDIA_API_KEY não configurada");
    }

    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      throw new Error("imageBase64 é obrigatório");
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Extraia os dados desta aposta esportiva e retorne o JSON.",
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error ${response.status}: ${errorText}`);
    }

    const nvidiaData = await response.json();
    const rawContent = nvidiaData.choices?.[0]?.message?.content ?? "";

    // Extrai JSON da resposta (remove possível markdown)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Modelo não retornou JSON válido");
    }

    const extracted = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ data: extracted, raw: rawContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
