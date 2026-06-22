import { memo } from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export const KPICard = memo(({ title, value, icon: Icon, trend, isLoading, delay = 0, subtitle }: KPICardProps) => {
  if (isLoading) {
    return (
      <Card className="border-white/5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-20 rounded shimmer" />
            <div className="w-10 h-10 rounded-full shimmer" />
          </div>
          <div className="h-8 w-28 rounded shimmer mb-2" />
          <div className="h-3 w-14 rounded shimmer" />
        </CardContent>
      </Card>
    );
  }

  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn(
        "relative overflow-hidden group border-white/5 shadow-xl",
        "hover:-translate-y-1 transition-all duration-400",
        "bg-gradient-to-br from-[rgba(17,24,39,0.85)] to-[rgba(10,15,22,0.95)]",
        "hover:border-[rgba(212,175,55,0.12)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_32px_rgba(212,175,55,0.06)]"
      )}>
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,175,55,0.04)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex items-start justify-between mb-5">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em] group-hover:text-[rgba(212,175,55,0.7)] transition-colors duration-300">
              {title}
            </p>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.1)]",
              "transition-all duration-400",
              "group-hover:bg-[rgba(212,175,55,0.1)] group-hover:border-[rgba(212,175,55,0.25)] group-hover:scale-110"
            )}>
              <Icon className="h-4 w-4 text-[rgba(212,175,55,0.6)] group-hover:text-[rgba(212,175,55,0.9)] transition-colors duration-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl font-light tracking-tight text-white group-hover:text-[#D4AF37] transition-colors duration-300">
              {value}
            </h3>

            {trend !== undefined && (
              <div className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full border",
                trendPositive
                  ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/15"
                  : "text-red-400 bg-red-500/8 border-red-500/15"
              )}>
                {trendPositive
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}

            {subtitle && (
              <p className="text-[11px] text-muted-foreground/60 font-light italic">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

KPICard.displayName = "KPICard";
