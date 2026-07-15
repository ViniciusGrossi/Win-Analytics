import { useState, useEffect } from "react";
import { authService, CustomUser } from "@/services/authService";

export const useAuth = () => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sessão existente no localStorage. Sem session_token (login anterior à
    // introdução do token), a RLS bloqueia toda leitura — força novo login.
    const sessionUser = authService.getSession();
    if (sessionUser && !sessionUser.session_token) {
      authService.persistSession(null);
      setUser(null);
    } else {
      setUser(sessionUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    const { user: newUser, error } = await authService.signUp(email, password);
    if (!error && newUser) {
      // In this system, we can auto-login or just let them login manually. 
      // The user requested to be sent to login page, so we won't persist session here yet.
      return { error: null };
    }
    return { error: error ? { message: error } : null };
  };

  const signIn = async (email: string, password: string) => {
    const { user: authUser, error } = await authService.signIn(email, password);
    
    if (!error && authUser) {
      setUser(authUser);
      authService.persistSession(authUser);
      return { error: null };
    }
    
    return { error: error ? { message: error } : null };
  };

  const signOut = async () => {
    try {
      setUser(null);
      authService.persistSession(null);
      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error: error as any };
    }
  };

  return {
    user,
    session: user, // Alias for compatibility
    loading,
    signUp,
    signIn,
    signOut,
  };
};
