import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp,
    Target,
    DollarSign,
    Zap,
    Trophy,
    Medal,
    AlertCircle,
    Lightbulb,
    TrendingDown,
    Activity
} from "lucide-react";

interface AIInsight {
    title: string;
    description: string;
    emoji: string;
    color: "success" | "warning" | "destructive" | "primary" | "purple" | "blue";
}

const iconMap: Record<string, any> = {
    "🚀": TrendingUp,
    "🎯": Target,
    "💰": DollarSign,
    "⚡": Zap,
    "🏆": Trophy,
    "🥇": Medal,
    "⚠️": AlertCircle,
    "💡": Lightbulb,
    "📉": TrendingDown,
    "📊": Activity,
};

const colorClasses = {
    success: {
        border: "border-emerald-500/20",
        bg: "bg-emerald-500/5",
        hoverBorder: "hover:border-emerald-500/40",
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        titleColor: "text-emerald-700 dark:text-emerald-300",
        dividerColor: "border-emerald-500/20",
    },
    primary: {
        border: "border-blue-500/20",
        bg: "bg-blue-500/5",
        hoverBorder: "hover:border-blue-500/40",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400",
        titleColor: "text-blue-700 dark:text-blue-300",
        dividerColor: "border-blue-500/20",
    },
    warning: {
        border: "border-amber-500/20",
        bg: "bg-amber-500/5",
        hoverBorder: "hover:border-amber-500/40",
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-600 dark:text-amber-400",
        titleColor: "text-amber-700 dark:text-amber-300",
        dividerColor: "border-amber-500/20",
    },
    destructive: {
        border: "border-red-500/20",
        bg: "bg-red-500/5",
        hoverBorder: "hover:border-red-500/40",
        iconBg: "bg-red-500/20",
        iconColor: "text-red-600 dark:text-red-400",
        titleColor: "text-red-700 dark:text-red-300",
        dividerColor: "border-red-500/20",
    },
    purple: {
        border: "border-purple-500/20",
        bg: "bg-purple-500/5",
        hoverBorder: "hover:border-purple-500/40",
        iconBg: "bg-purple-500/20",
        iconColor: "text-purple-600 dark:text-purple-400",
        titleColor: "text-purple-700 dark:text-purple-300",
        dividerColor: "border-purple-500/20",
    },
    blue: {
        border: "border-sky-500/20",
        bg: "bg-sky-500/5",
        hoverBorder: "hover:border-sky-500/40",
        iconBg: "bg-sky-500/20",
        iconColor: "text-sky-600 dark:text-sky-400",
        titleColor: "text-sky-700 dark:text-sky-300",
        dividerColor: "border-sky-500/20",
    },
};

export function AIInsights() {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('ai-insights', {
                body: {},
            });

            if (error) throw error;

            setInsights(data.insights || []);
        } catch (error) {
            console.error("Erro ao carregar insights:", error);
            setError("Não foi possível carregar os insights. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (insights.length === 0) {
        return (
            <Card className="border-muted">
                <CardContent className="p-6 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                        Nenhum insight disponível no momento. Continue apostando para gerar análises!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
                {insights.map((insight, index) => {
                    const Icon = iconMap[insight.emoji] || Activity;
                    const colors = colorClasses[insight.color] || colorClasses.primary;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                className={`border-2 ${colors.border} ${colors.bg} ${colors.hoverBorder} hover:shadow-lg transition-all duration-300 cursor-pointer group h-full`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-lg ${colors.iconBg} group-hover:scale-110 transition-transform`}
                                        >
                                            <Icon className={`h-5 w-5 ${colors.iconColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4
                                                className={`font-semibold ${colors.titleColor} mb-1 flex items-center gap-2`}
                                            >
                                                {insight.title}
                                                <span className="text-xl">{insight.emoji}</span>
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {insight.description}
                                            </p>
                                            <div className={`mt-3 pt-3 border-t ${colors.dividerColor}`}>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Análise gerada por IA
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
