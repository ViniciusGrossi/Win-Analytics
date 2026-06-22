import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || "Erro desconhecido ao entrar");
      } else {
        toast.success("Acesso autorizado!");
        navigate("/");
      }
    } catch (err) {
      console.error("SignIn Error:", err);
      toast.error("Falha na conexão com o servidor de acesso");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As chaves de acesso não conferem");
      return;
    }

    if (password.length < 6) {
      toast.error("A chave deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message || "Erro ao registrar identidade");
      } else {
        toast.success("Identidade registrada! Prossiga para o login.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("SignUp Error:", err);
      toast.error("Erro crítico na comunicação de registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background elements */}
      <div className="bg-grid opacity-20" />
      <div className="ambient-glow-static" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border border-gold-500/20 mb-6 hover-glow"
          >
            <img src="/logo.png" alt="Win Analytics Logo" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="font-display text-4xl font-light tracking-tight text-white mb-2">
            WIN <span className="text-gold-gradient font-medium italic">ANALYTICS</span>
          </h1>
          <p className="text-gray-500 font-light text-sm uppercase tracking-[0.2em]">Institutional Access Level</p>
        </div>

        <Card className="backdrop-glass border-white/5 shadow-2xl overflow-hidden glow-border">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 mb-8 rounded-xl h-12">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg data-[state=active]:bg-gold-500 data-[state=active]:text-executive-950 data-[state=active]:font-semibold transition-all duration-300"
                >
                  Identificar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-gold-500 data-[state=active]:text-executive-950 data-[state=active]:font-semibold transition-all duration-300"
                >
                  Registrar
                </TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <TabsContent value="signin" className="mt-0">
                  <motion.form 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleSignIn} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-xs uppercase tracking-widest text-gray-500 ml-1">Protocolo Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="nome@dominio.com"
                        className="bg-white/5 border-white/10 focus:border-gold-500/50 h-12 rounded-xl transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <Label htmlFor="signin-password" className="text-xs uppercase tracking-widest text-gray-500">Chave de Acesso</Label>
                            <span className="text-[10px] text-gold-500/50 hover:text-gold-500 cursor-pointer transition-colors">Esqueceu?</span>
                        </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10 focus:border-gold-500/50 h-12 rounded-xl transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl text-lg group" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                            Acessar Dashboard
                            <TrendingUp className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <motion.form 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSignUp} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-xs uppercase tracking-widest text-gray-500 ml-1">Novo Protocolo</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@melhor-email.com"
                        className="bg-white/5 border-white/10 focus:border-gold-500/50 h-12 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs uppercase tracking-widest text-gray-500 ml-1">Definir Chave</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="bg-white/5 border-white/10 focus:border-gold-500/50 h-12 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-xs uppercase tracking-widest text-gray-500 ml-1">Confirmar Chave</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Repita sua chave"
                        className="bg-white/5 border-white/10 focus:border-gold-500/50 h-12 rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" variant="outline" className="w-full h-12 rounded-xl border-gold-500/30 text-gold-500 hover:bg-gold-500/10 group" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                          <span className="flex items-center gap-2">
                             Solicitar Acesso
                             <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          </span>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-gray-600 text-[10px] tracking-[0.3em] uppercase"
        >
          Secure Environment © 2025 WinAnalytics Industrial
        </motion.p>
      </motion.div>
    </div>
  );
}
