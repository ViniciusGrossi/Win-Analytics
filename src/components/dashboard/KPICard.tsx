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

export function KPICard({ title, value, icon: Icon, trend, isLoading, delay = 0, subtitle, description, variant }: KPICardProps) {
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
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </motion.div>
          </div>
          <div className="space-y-1">
            <motion.h3
              className="text-3xl font-bold tracking-tight"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.1, type: "spring" }}
            >
              {value}
            </motion.h3>
            {trend !== undefined && (
              <p className={`text-sm flex items-center gap-1 ${trend >= 0 ? "text-success" : "text-destructive"}`}>
                <span>{trend >= 0 ? "↑" : "↓"}</span>
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
