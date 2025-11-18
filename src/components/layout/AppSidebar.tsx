import { Home, ClipboardList, CheckCircle2, BarChart3, Wallet, Bot, User, LogOut, Download } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
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

  const handleInstallClick = async () => {
    await installPWA();
    toast.success("App instalado com sucesso!");
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
        {isInstallable && (
          <Button 
            onClick={handleInstallClick}
            variant="default" 
            className="w-full justify-start gap-3" 
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Instalar App</span>
          </Button>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3" size="sm">
          <User className="h-4 w-4" />
          <span className="text-sm">Usuário</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" size="sm">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sair</span>
        </Button>
      </div>
    </Sidebar>
  );
}
