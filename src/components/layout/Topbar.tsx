import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, { label: string; sub: string }> = {
  "/":            { label: "Dashboard",     sub: "Visão geral" },
  "/apostas":     { label: "Apostas",       sub: "Gestão de apostas" },
  "/resultados":  { label: "Resultados",    sub: "Acompanhamento" },
  "/analises":    { label: "Análises",      sub: "Inteligência" },
  "/banca":       { label: "Banca",         sub: "Gestão de capital" },
  "/assistente":  { label: "Assistente IA", sub: "Analytics inteligente" },
  "/configuracoes":{ label: "Configurações", sub: "Preferências" },
};

export function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? { label: "Win Analytics", sub: "" };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "WA";

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/5 backdrop-glass px-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]"
    >
      <SidebarTrigger className="text-muted-foreground hover:text-[#D4AF37] transition-colors" />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h2 className="font-display text-sm font-medium text-white/90 leading-none truncate">
          {page.label}
        </h2>
        {page.sub && (
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 uppercase tracking-widest">
            {page.sub}
          </p>
        )}
      </div>

      {/* Live indicator */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/3">
        <span className="status-dot-live" />
        <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-[0.15em]">Live</span>
      </div>

      {/* User avatar */}
      {user && (
        <div
          className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.2)] flex items-center justify-center cursor-default select-none"
          title={user.email ?? ""}
        >
          <span className="text-[10px] font-mono font-semibold text-[#D4AF37]">{initials}</span>
        </div>
      )}
    </motion.header>
  );
}
