
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
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Activity className="h-5 w-5 text-green-600" />
          Tipos de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tiposConsulta}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
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
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-medium text-gray-800">{data.tipo}</p>
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
        <div className="grid grid-cols-2 gap-3 mt-6">
          {tiposConsulta.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: item.cor }}
              />
              <span className="text-sm text-gray-700 font-medium">{item.tipo}</span>
              <span className="text-xs text-gray-500 ml-auto">{item.valor}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
