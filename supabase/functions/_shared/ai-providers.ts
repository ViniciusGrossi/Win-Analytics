// Chamadas HTTP para os providers de IA (OpenAI/Groq texto e visão) e o
// parsing de JSON da resposta — duplicados antes em ai-insights e
// extract-bet-image. Mantém o comportamento exato de cada function original
// (temperature/response_format/max_tokens não foram unificados entre texto e
// visão — são parâmetros de produto diferentes, não boilerplate).

export const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/** fetch com AbortController — um provider pendurado não pode consumir o wall-clock da edge function. */
export async function fetchWithTimeout(url: string, init: RequestInit, ms = 25_000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── Texto (usado por ai-insights) ──────────────────────────────────────────

export async function callOpenAIText(systemPrompt: string, apiKey: string) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
}

export async function callGroqText(systemPrompt: string, apiKey: string) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
    }),
  });
}

// ── Visão (usado por extract-bet-image) ────────────────────────────────────

function visionMessages(systemPrompt: string, imageBase64: string, mimeType: string, detail?: "high") {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: detail
            ? { url: `data:${mimeType};base64,${imageBase64}`, detail }
            : { url: `data:${mimeType};base64,${imageBase64}` },
        },
        { type: "text", text: "Extraia os dados desta aposta esportiva e retorne o JSON." },
      ],
    },
  ];
}

export async function callNvidiaVision(model: string, systemPrompt: string, imageBase64: string, mimeType: string, apiKey: string) {
  return fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: visionMessages(systemPrompt, imageBase64, mimeType),
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });
}

export async function callOpenAIVision(systemPrompt: string, imageBase64: string, mimeType: string, apiKey: string) {
  return fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: visionMessages(systemPrompt, imageBase64, mimeType, "high"),
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });
}

export async function callGroqVision(systemPrompt: string, imageBase64: string, mimeType: string, apiKey: string) {
  return fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: visionMessages(systemPrompt, imageBase64, mimeType),
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });
}

// ── Parsing ──────────────────────────────────────────────────────────────

/** Extrai o primeiro bloco `{...}` de uma resposta de IA e faz o parse. Retorna null se falhar. */
export function extractJson<T = unknown>(rawContent: string): T | null {
  const match = rawContent.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : rawContent) as T;
  } catch {
    return null;
  }
}
