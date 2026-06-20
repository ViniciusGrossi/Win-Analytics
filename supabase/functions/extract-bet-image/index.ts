import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um extrator de dados de apostas esportivas. Analise a imagem de um comprovante/ticket de aposta e extraia os dados em JSON.

Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "casa_de_apostas": "nome da casa (ex: Bet365, Betano, Sportingbet)",
  "tipo_aposta": "Simples | Dupla | Tripla | Múltipla (baseado no número de seleções: 1=Simples, 2=Dupla, 3=Tripla, 4+=Múltipla)",
  "is_super_odd": true ou false (true se houver destaque especial, badge 'Super Odd', 'Odd Boost' ou similar),
  "valor_apostado": número (valor em reais apostado, sem símbolo),
  "odd": número (odd total/combinada da aposta),
  "bonus": número (0 se não for bônus; valor em reais se for aposta com bônus/freebet),
  "turbo": número (0 se sem turbo; caso contrário o valor decimal do boost, ex: 0.25 para +25%),
  "partida": "Times ou evento (ex: Brasil x Argentina)",
  "torneio": "Nome da competição (ex: Champions League, Copa do Brasil)",
  "categoria": "Categoria da aposta (ex: Resultado, Gols, Escanteios, Ambas Marcam)",
  "data": "YYYY-MM-DD (data da aposta, hoje se não encontrar)",
  "detalhes": "Descrição completa da seleção (ex: Brasil vence e ambas as equipes marcam)"
}

Regras:
- tipo_aposta: conte o número de seleções/eventos na aposta. 1=Simples, 2=Dupla, 3=Tripla, 4 ou mais=Múltipla
- is_super_odd: true apenas se houver indicação clara de super odd, boost especial ou odd melhorada
- bonus: 0 se for aposta com dinheiro real. Se indicar freebet, bônus ou saldo bônus, coloque o valor
- turbo: 0 se não houver boost. Se houver "+25%", coloque 0.25; "+30%" = 0.30; "+50%" = 0.50
- Para campos não encontrados na imagem, use null
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
