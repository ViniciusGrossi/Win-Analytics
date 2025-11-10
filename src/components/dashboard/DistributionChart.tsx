import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DistributionChartProps {
  data: { name: string; value: number }[];
  isLoading?: boolean;
}

const COLORS = {
  Ganhou: "hsl(var(--success))",
  Perdeu: "hsl(var(--destructive))",
  Pendente: "hsl(var(--warning))",
  Cancelado: "hsl(var(--muted))",
  Cashout: "hsl(var(--primary))",
};

export function DistributionChart({ data, isLoading }: DistributionChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card className="p-6 glass-effect">
      <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => {
              const percent = entry.percent || 0;
              return `${entry.name} ${(percent * 100).toFixed(0)}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "hsl(var(--muted))"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
