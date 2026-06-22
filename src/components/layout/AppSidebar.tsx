import { Home, ClipboardList, CheckCircle2, BarChart3, Wallet, Bot, Settings, LogOut, Download } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  { title: "Dashboard",     url: "/",            icon: Home },
  { title: "Apostas",       url: "/apostas",      icon: ClipboardList },
  { title: "Resultados",    url: "/resultados",   icon: CheckCircle2 },
  { title: "Análises",      url: "/analises",     icon: BarChart3 },
  { title: "Banca",         url: "/banca",        icon: Wallet },
  { title: "Assistente IA", url: "/assistente",   icon: Bot },
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
          {/* Logo */}
          <div
            className="flex items-center gap-3 px-5 py-7 group cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg overflow-hidden",
              "border border-[rgba(212,175,55,0.2)]",
              "flex items-center justify-center",
              "transition-all duration-300",
              "group-hover:border-[rgba(212,175,55,0.45)] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.15)]"
            )}>
              <img src="/logo.png" alt="Win Analytics" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm tracking-[0.12em] text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                WIN ANALYTICS
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">
                Pro
              </span>
            </div>
          </div>

          <SidebarGroupLabel className="px-5 mb-1 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">
            Navegação
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-muted-foreground hover:text-white hover:bg-white/5",
                        "group/item"
                      )}
                      activeClassName={cn(
                        "bg-[rgba(212,175,55,0.08)] text-[#D4AF37]",
                        "border-l-2 border-[#D4AF37]",
                        "pl-[calc(0.75rem-2px)]",
                        "shadow-[inset_0_0_20px_rgba(212,175,55,0.04)]",
                        "hover:bg-[rgba(212,175,55,0.1)]"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom section */}
      <div className="mt-auto border-t border-white/5 p-3 space-y-1">
        <Button
          onClick={handleInstallClick}
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.06)] h-9 text-sm"
          size="sm"
        >
          <Download className="h-4 w-4 shrink-0" />
          Instalar App
        </Button>
        <Button
          onClick={() => navigate("/configuracoes")}
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 h-9 text-sm"
          size="sm"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configurações
        </Button>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/8 h-9 text-sm"
          size="sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </Button>
      </div>
    </Sidebar>
  );
}
