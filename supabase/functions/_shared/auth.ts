import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/** Client com service role — usado após validar o token, nunca antes. */
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

/**
 * Extrai o user_id do token de sessão custom (header `x-session-token`),
 * validado no banco por `verify_session_token`.
 *
 * IMPORTANTE: esta é a ÚNICA fonte confiável de identidade nas edge functions.
 * Nunca confie em `user_id` vindo do corpo da requisição — ele é spoofável.
 *
 * @returns o user_id (uuid) ou `null` se o token faltar/for inválido/expirado.
 */
export async function getUserIdFromToken(
  req: Request,
  supabase: SupabaseClient,
): Promise<string | null> {
  const token = req.headers.get("x-session-token") ?? "";
  if (!token) return null;
  const { data, error } = await supabase.rpc("verify_session_token", { p_token: token });
  if (error) return null;
  return (data as string | null) ?? null;
}
