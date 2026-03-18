import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/5 backdrop-glass px-6 transition-all shadow-xl"
    >
      <SidebarTrigger className="text-gray-400 hover:text-gold-400 transition-colors" />
      <div className="flex-1" />
      {user && (
        <span className="text-xs font-mono text-gray-500 hidden sm:inline hover-glow cursor-default">
          {user.email}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-full text-gray-400 hover:text-gold-400 hover:bg-white/5"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.header>
  );
}
