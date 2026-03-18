import { memo } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  isLoading?: boolean;
  delay?: number;
  subtitle?: string;
  description?: string;
  variant?: string;
}

export const KPICard = memo(({ title, value, icon: Icon, trend, isLoading, delay = 0, subtitle, description, variant }: KPICardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-20 mb-4" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest group-hover:text-gold-400/80 transition-colors uppercase">{title}</p>
            <div className="w-10 h-10 rounded-full bg-gold-500/5 border border-gold-500/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-gold-500/30 group-hover:bg-gold-500/10 hover-glow">
              <Icon className="h-5 w-5 text-gold-500/70 group-hover:text-gold-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl sm:text-3xl font-light tracking-tight text-white group-hover:text-gold-gradient transition-all duration-500">
              {value}
            </h3>
            {trend !== undefined && (
              <p className={`text-xs font-mono flex items-center gap-1 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-current/10 border border-current/20">
                  {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                </span>
              </p>
            )}
            {subtitle && (
              <p className="text-[11px] text-gray-500 font-light italic mt-2">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
