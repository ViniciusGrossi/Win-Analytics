// CORS com allowlist — substitui o antigo "Access-Control-Allow-Origin: *".
// A autorização de verdade é feita pelo x-session-token (ver _shared/auth.ts);
// o CORS aqui é defesa em profundidade contra chamadas cross-site do navegador.

const STATIC_ALLOWED = [
  "http://localhost:8080",
  "http://localhost:5173",
];

function envAllowed(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function isAllowed(origin: string): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.includes(origin)) return true;
  if (envAllowed().includes(origin)) return true;
  // Deploys Vercel do projeto (produção + previews): win-analytics*.vercel.app
  if (/^https:\/\/win-analytics[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  return false;
}

/**
 * Monta os headers de CORS refletindo a Origin só se ela estiver na allowlist.
 * Origens não permitidas recebem a origem primária (produção), fazendo o
 * navegador bloquear a resposta.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = isAllowed(origin)
    ? origin
    : (envAllowed()[0] ?? "https://win-analytics.vercel.app");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-session-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
