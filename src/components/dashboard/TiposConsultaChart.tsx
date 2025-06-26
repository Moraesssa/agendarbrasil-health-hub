
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  tipo: string;
  valor: number;
  cor: string;
}

interface TiposConsultaChartProps {
  data: ChartData[] | null;
  loading: boolean;
}

export function TiposConsultaChart({ data, loading }: TiposConsultaChartProps) {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-fit">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
          <Activity className="h-5 w-5 text-green-600" />
          Tipos de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full mx-auto" />
          </div>
        ) : (
          <div className="h-[280px] w-full">
            {(data && data.length > 0) ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="valor"
                        stroke="none"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const chartData = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-medium text-gray-800">{chartData.tipo}</p>
                                <p className="text-sm text-gray-600">{chartData.valor}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" 
                        style={{ backgroundColor: item.cor }}
                      />
                      <span className="text-sm text-gray-700 font-medium truncate">{item.tipo}</span>
                      <span className="text-xs text-gray-500 ml-auto font-semibold">{item.valor}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
