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
    <Sidebar className="border-r border-white/5 backdrop-glass">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-6 py-8 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-md overflow-hidden border border-gold-500/30 flex items-center justify-center glow-border group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="Win Analytics Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-medium text-lg tracking-wide text-white hover-glow">WIN ANALYTICS</span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-1">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-4 py-3 rounded-md transition-all group hover:bg-white/5"
                      activeClassName="bg-gold-500/10 text-gold-400 font-medium border-l-2 border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    >
                      <item.icon className="h-5 w-5 transition-colors group-hover:text-gold-400" />
                      <span className="group-hover:text-white transition-colors">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto border-t border-white/5 p-4 space-y-2">
        <Button 
          onClick={handleInstallClick}
          variant="outline" 
          className="w-full justify-start gap-3 border-white/10 hover:bg-gold-500/10 hover:text-gold-400 button-sweep" 
          size="sm"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm">Instalar App</span>
        </Button>
        <Button 
          onClick={() => navigate("/configuracoes")}
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5" 
          size="sm"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Configurações</span>
        </Button>
        <Button 
          onClick={handleSignOut}
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10" 
          size="sm"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sair</span>
        </Button>
      </div>
    </Sidebar>
  );
}
