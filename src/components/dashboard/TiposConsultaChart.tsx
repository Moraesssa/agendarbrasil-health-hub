
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const tiposConsulta = [
  { tipo: "Consulta Regular", valor: 45, cor: "#3b82f6" },
  { tipo: "Retorno", valor: 30, cor: "#10b981" },
  { tipo: "Emergência", valor: 15, cor: "#ef4444" },
  { tipo: "Telemedicina", valor: 10, cor: "#8b5cf6" }
];

const chartConfig = {
  consultas: {
    label: "Consultas",
    color: "#3b82f6",
  },
};

export function TiposConsultaChart() {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Activity className="h-5 w-5 text-green-600" />
          Tipos de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tiposConsulta}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="valor"
                stroke="none"
              >
                {tiposConsulta.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-medium">{data.tipo}</p>
                        <p className="text-sm text-gray-600">{data.valor}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {tiposConsulta.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.cor }}
              />
              <span className="text-sm text-gray-600">{item.tipo}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
