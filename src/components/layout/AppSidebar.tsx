import { Home, ClipboardList, CheckCircle2, BarChart3, Wallet, Bot, Settings, LogOut, Download } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Apostas", url: "/apostas", icon: ClipboardList },
  { title: "Resultados", url: "/resultados", icon: CheckCircle2 },
  { title: "Análises", url: "/analises", icon: BarChart3 },
  { title: "Banca", url: "/banca", icon: Wallet },
  { title: "Assistente IA", url: "/assistente", icon: Bot },
];

export function AppSidebar() {
  const { isInstallable, installPWA } = usePWA();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleInstallClick = async () => {
    if (!isInstallable) {
      toast.info("O app já está instalado ou não está disponível para instalação neste navegador.");
      return;
    }
    await installPWA();
    toast.success("App instalado com sucesso!");
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold px-4 py-6">
            Wager<span className="text-primary">Art</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-accent"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-4 border-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto border-t border-border p-4 space-y-2">
        <Button 
          onClick={handleInstallClick}
          variant="default" 
          className="w-full justify-start gap-3" 
          size="sm"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm">Instalar App</span>
        </Button>
        <Button 
          onClick={() => navigate("/configuracoes")}
          variant="ghost" 
          className="w-full justify-start gap-3" 
          size="sm"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Configurações</span>
        </Button>
        <Button 
          onClick={handleSignOut}
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" 
          size="sm"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sair</span>
        </Button>
      </div>
    </Sidebar>
  );
}
