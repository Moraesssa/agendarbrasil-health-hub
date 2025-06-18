
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const consultasSemanais = [
  { dia: "Seg", consultas: 12, receita: 3600 },
  { dia: "Ter", consultas: 15, receita: 4500 },
  { dia: "Qua", consultas: 18, receita: 5400 },
  { dia: "Qui", consultas: 14, receita: 4200 },
  { dia: "Sex", consultas: 16, receita: 4800 },
  { dia: "Sáb", consultas: 8, receita: 2400 },
  { dia: "Dom", consultas: 5, receita: 1500 }
];

const chartConfig = {
  consultas: {
    label: "Consultas",
    color: "#3b82f6",
  },
  receita: {
    label: "Receita (R$)",
    color: "#10b981",
  },
};

export function ConsultasChart() {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Consultas da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consultasSemanais}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="consultas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
