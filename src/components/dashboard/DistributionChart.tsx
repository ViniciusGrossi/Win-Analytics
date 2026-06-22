import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface DistributionChartProps {
  data: { name: string; value: number }[];
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  Ganhou:    { color: "hsl(var(--success))",     label: "Ganhou" },
  Perdeu:    { color: "hsl(var(--destructive))",  label: "Perdeu" },
  Pendente:  { color: "hsl(var(--warning))",      label: "Pendente" },
  Cancelado: { color: "hsl(var(--muted))",        label: "Cancelado" },
  Cashout:   { color: "hsl(var(--primary))",      label: "Cashout" },
};

const FALLBACK_COLOR = "hsl(var(--muted-foreground))";

export const DistributionChart = memo(({ data, isLoading }: DistributionChartProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (isLoading) {
    return (
      <Card className="p-5 sm:p-6 glass-effect border-white/5">
        <div className="h-4 w-24 rounded shimmer mb-1" />
        <div className="h-3 w-32 rounded shimmer mb-5" />
        <div className="h-[200px] sm:h-[240px] rounded-full w-[200px] sm:w-[240px] mx-auto shimmer" />
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 glass-effect border-white/5">
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em]">Distribuição</p>
        <h3 className="font-display text-base sm:text-lg font-medium text-white mt-0.5">Status das Apostas</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-[180px] sm:h-[200px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={STATUS_CONFIG[entry.name]?.color ?? FALLBACK_COLOR}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  fontFamily: "Inter",
                  fontSize: "12px",
                }}
                formatter={(v: number, name: string) => [
                  `${v} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 shrink-0">
          {data.map((entry) => {
            const cfg = STATUS_CONFIG[entry.name];
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: cfg?.color ?? FALLBACK_COLOR }}
                />
                <span className="text-[11px] text-muted-foreground">{entry.name}</span>
                <span className="text-[11px] font-mono text-white/70 ml-auto pl-2">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});

DistributionChart.displayName = "DistributionChart";
