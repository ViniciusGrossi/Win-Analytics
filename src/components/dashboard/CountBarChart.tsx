import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface CountBarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  isLoading?: boolean;
}

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f97316", "#ef4444", "#a78bfa"];

export function CountBarChart({ data, title, isLoading }: CountBarChartProps) {
  if (isLoading) return <Skeleton className="h-[260px] w-full" />;

  return (
    <Card className="p-4 glass-effect">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
