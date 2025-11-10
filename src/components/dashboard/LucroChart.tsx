import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { SeriesData } from "@/types/betting";
import dayjs from "dayjs";

interface LucroChartProps {
  data: SeriesData[];
  isLoading?: boolean;
}

export function LucroChart({ data, isLoading }: LucroChartProps) {
  const chartData = useMemo(() => {
    let accumulated = 0;
    return data.map((item) => {
      accumulated += item.lucro;
      return {
        date: dayjs(item.date).format("DD/MM"),
        lucro: item.lucro,
        accumulated,
      };
    });
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card className="p-6 glass-effect">
      <h3 className="text-lg font-semibold mb-4">Evolução do Lucro</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="lucroGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area
            type="monotone"
            dataKey="accumulated"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#lucroGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
