import { useMemo, memo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { SeriesData } from "@/types/betting";
import dayjs from "dayjs";

interface LucroChartProps {
  data: SeriesData[];
  isLoading?: boolean;
}

export const LucroChart = memo(({ data, isLoading }: LucroChartProps) => {
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
    return (
      <Card className="p-6 glass-effect border-white/5">
        <div className="h-4 w-36 rounded shimmer mb-1" />
        <div className="h-3 w-24 rounded shimmer mb-5" />
        <div className="h-[240px] sm:h-[280px] rounded shimmer" />
      </Card>
    );
  }

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1]?.accumulated >= 0;
  const lineColor = isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))";

  return (
    <Card className="p-5 sm:p-6 glass-effect border-white/5">
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em]">Evolução</p>
        <h3 className="font-display text-base sm:text-lg font-medium text-white mt-0.5">Lucro Acumulado</h3>
      </div>
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lucroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "Inter" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "Inter" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrency(v).replace("R$ ", "")}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                fontFamily: "Inter",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
              itemStyle={{ color: lineColor }}
              formatter={(v: number) => [formatCurrency(v), "Acumulado"]}
            />
            <Area
              type="monotone"
              dataKey="accumulated"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#lucroGradient)"
              dot={false}
              activeDot={{ r: 4, fill: lineColor, stroke: "hsl(var(--card))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

LucroChart.displayName = "LucroChart";
