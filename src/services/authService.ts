import { supabase } from "@/integrations/supabase/client";

export interface CustomUser {
  id: string;
  email: string;
}

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
      localStorage.setItem('win_analytics_auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('win_analytics_auth');
    }
  },

  getSession(): CustomUser | null {
    const session = localStorage.getItem('win_analytics_auth');
    return session ? JSON.parse(session) : null;
  }
};
