import { supabase } from "@/integrations/supabase/client";

export interface CustomUser {
  id: string;
  email: string;
  /** JWT de sessão emitido por authenticate_custom_user/create_custom_user (RPC). */
  session_token?: string;
}

const AUTH_KEY = "win_analytics_auth";

export const authService = {
  async signIn(email: string, password: string): Promise<{ user?: CustomUser; error?: string }> {
    const { data, error } = await (supabase.rpc as any)('authenticate_custom_user', {
      p_email: email,
      p_password: password,
    });

    if (error) return { error: error.message };
    if (!data) return { error: "Erro na autenticação" };
    if (data.error) return { error: data.error };

    return { user: data };
  },

  async signUp(email: string, password: string): Promise<{ user?: CustomUser; error?: string }> {
    const { data, error } = await (supabase.rpc as any)('create_custom_user', {
      p_email: email,
      p_password: password,
    });

    if (error) return { error: error.message };
    if (!data) return { error: "Erro ao criar usuário" };
    if (data.error) return { error: data.error };

    return { user: data };
  },

  persistSession(user: CustomUser | null) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  },

  getSession(): CustomUser | null {
    const session = localStorage.getItem(AUTH_KEY);
    return session ? JSON.parse(session) : null;
  },

  /** Token de sessão para o header x-session-token (RLS + edge functions). */
  getToken(): string | null {
    return this.getSession()?.session_token ?? null;
  }
};
