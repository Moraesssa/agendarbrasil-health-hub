
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Filter, Download, Settings, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { financeService, FinancialSummary } from "@/services/financeService";
import { usePayment } from "@/hooks/usePayment";
import { PageLoader } from "@/components/PageLoader";
import { RevenueChart } from "@/components/financial/RevenueChart";
import { RefundButton } from "@/components/financial/RefundButton";
import { useToast } from "@/hooks/use-toast";

const Financeiro = () => {
  const { user } = useAuth();
  const { createCustomerPortalSession } = usePayment();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any[]>([]);
  const [refundData, setRefundData] = useState<any[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [reportResult, refundResult, summaryResult, chartResult] = await Promise.all([
          financeService.getRelatorioFinanceiro(user.id),
          financeService.getRefundHistory(user.id),
          financeService.getResumoFinanceiro(user.id),
          financeService.getReceitaMensal(user.id)
        ]);
        
        setReportData(reportResult);
        setRefundData(refundResult);
        setSummary(summaryResult);
        setChartData(chartResult);
      } catch (error) {
        console.error("Erro ao carregar dados financeiros", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados financeiros.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFinancialData();
  }, [user, toast]);

  const handleOpenCustomerPortal = async () => {
    await createCustomerPortalSession();
  };

  const handleRefundSuccess = () => {
    // Recarregar dados após reembolso
    const fetchFinancialData = async () => {
      if (!user) return;
      try {
        const [reportResult, refundResult, summaryResult, chartResult] = await Promise.all([
          financeService.getRelatorioFinanceiro(user.id),
          financeService.getRefundHistory(user.id),
          financeService.getResumoFinanceiro(user.id),
          financeService.getReceitaMensal(user.id)
        ]);
        
        setReportData(reportResult);
        setRefundData(refundResult);
        setSummary(summaryResult);
        setChartData(chartResult);
      } catch (error) {
        console.error("Erro ao recarregar dados financeiros", error);
      }
    };
    fetchFinancialData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) return <PageLoader message="Carregando dados financeiros..." />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
              <p className="text-sm text-gray-600">Relatório de pagamentos e receitas.</p>
            </div>
            <Button variant="outline" onClick={handleOpenCustomerPortal}>
              <Settings className="mr-2 h-4 w-4" />
              Portal do Cliente
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </header>
          
          <main className="p-6 space-y-6">
            {/* Cards de resumo */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalReceita)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.receitaMensal)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consultas Pagas</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.consultasPagas}</div>
                    <p className="text-xs text-muted-foreground">de {summary.totalConsultas} total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.consultasPendentes}</div>
                    <p className="text-xs text-muted-foreground">pagamentos pendentes</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráfico de receita */}
            {chartData.length > 0 && <RevenueChart data={chartData} />}

            {/* Abas de Transações e Reembolsos */}
            <Tabs defaultValue="transactions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Transações</TabsTrigger>
                <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Histórico de Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Especialidade</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.filter(item => item.status !== 'refund').map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{item.consulta?.paciente?.display_name || 'N/A'}</TableCell>
                            <TableCell>{item.consulta?.tipo_consulta || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(Number(item.valor))}</TableCell>
                            <TableCell className="capitalize">
                              {item.metodo_pagamento === 'credit_card' ? 'Cartão de Crédito' : 
                               item.metodo_pagamento === 'pix' ? 'PIX' : 
                               item.metodo_pagamento?.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.status)}>
                                {getStatusText(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.status === 'succeeded' && (
                                <RefundButton
                                  paymentData={{
                                    id: item.id,
                                    valor: Number(item.valor),
                                    consulta_id: item.consulta_id,
                                    status: item.status,
                                    paciente_nome: item.consulta?.paciente?.display_name,
                                    data_consulta: item.consulta?.data_consulta
                                  }}
                                  onRefundSuccess={handleRefundSuccess}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {reportData.filter(item => item.status !== 'refund').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma transação encontrada.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="refunds">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5" />
                      Histórico de Reembolsos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data do Reembolso</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Valor Reembolsado</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>ID Reembolso</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refundData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.refunded_at ? new Date(item.refunded_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </TableCell>
                            <TableCell>{item.consulta?.paciente?.display_name || 'N/A'}</TableCell>
                            <TableCell className="text-red-600 font-medium">
                              -{formatCurrency(Number(item.refunded_amount || Math.abs(item.valor)))}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={item.refund_reason}>
                              {item.refund_reason || 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.refund_id || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-red-100 text-red-800">
                                Reembolsado
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {refundData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum reembolso processado.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Financeiro;
