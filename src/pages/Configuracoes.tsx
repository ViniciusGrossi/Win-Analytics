import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Moon, Sun, User, Mail, Shield, Bot, Loader2 } from "lucide-react";
import { aiExtractionSettingsService } from "@/services/aiExtractionSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Configuracoes() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notificacoes, setNotificacoes] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [extractionInstructions, setExtractionInstructions] = useState("");
  const [savingExtractionInstructions, setSavingExtractionInstructions] = useState(false);

  useEffect(() => {
    aiExtractionSettingsService.get().then(setExtractionInstructions).catch(() => {});
  }, []);

  const handleSaveExtractionInstructions = async () => {
    setSavingExtractionInstructions(true);
    try {
      await aiExtractionSettingsService.save(extractionInstructions);
      toast.success("Regras de extração salvas!");
    } catch (error) {
      toast.error("Erro ao salvar regras: " + (error instanceof Error ? error.message : "erro desconhecido"));
    } finally {
      setSavingExtractionInstructions(false);
    }
  };

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSavePreferences = () => {
    toast.success("Preferências salvas com sucesso!");
  };

  const handleChangePassword = async (values: z.infer<typeof passwordSchema>) => {
    try {
      // Primeiro, verificamos a senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: values.currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Se a senha atual está correta, atualizamos para a nova
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        toast.error("Erro ao alterar senha: " + updateError.message);
        return;
      }

      toast.success("Senha alterada com sucesso!");
      setIsPasswordDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao alterar senha");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>
              Informações da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-id">ID do Usuário</Label>
              <Input
                id="user-id"
                value={user?.id || ""}
                disabled
                className="bg-muted font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar tema escuro
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas preferências de notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre apostas
                </p>
              </div>
              <Switch
                checked={notificacoes}
                onCheckedChange={setNotificacoes}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Receber dicas e novidades
                </p>
              </div>
              <Switch
                checked={emailMarketing}
                onCheckedChange={setEmailMarketing}
              />
            </div>
            <Button onClick={handleSavePreferences} className="w-full">
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Alterar Senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua senha atual e a nova senha desejada
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite sua senha atual" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite a nova senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirme a nova senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Alterar Senha
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full" disabled>
              Autenticação em Dois Fatores
            </Button>
            <p className="text-xs text-muted-foreground">
              Autenticação em dois fatores em breve
            </p>
          </CardContent>
        </Card>

        {/* Regras de Extração de IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Ensinar a IA
            </CardTitle>
            <CardDescription>
              Regras que a IA deve sempre seguir ao ler o print de uma aposta. Mesma configuração usada na Importação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Exemplos:</p>
              <p>"A casa 'Estrela Bet' deve ser registrada como 'EstrelaBet'"</p>
              <p>"Nunca marque categoria 'Outros' se a partida tiver escanteios"</p>
            </div>
            <Textarea
              value={extractionInstructions}
              onChange={(e) => setExtractionInstructions(e.target.value)}
              placeholder="Ex: sempre usar o nome completo do torneio, nunca abreviar nomes de times..."
              rows={5}
            />
            <Button onClick={handleSaveExtractionInstructions} disabled={savingExtractionInstructions} className="w-full">
              {savingExtractionInstructions ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Regras"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
