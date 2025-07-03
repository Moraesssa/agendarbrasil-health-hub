import { useState, useEffect } from "react";
import { Filter, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { FinancialSummary } from "@/services/financeService";
import { usePayment } from "@/hooks/usePayment";
import { PageLoader } from "@/components/PageLoader";
import { RevenueChart } from "@/components/financial/RevenueChart";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import { TransactionTable } from "@/components/financial/TransactionTable";
import { RefundTable } from "@/components/financial/RefundTable";
import { useFinancialData } from "@/hooks/useFinancialData";
import { formatCurrency, getStatusColor, getStatusText } from "@/utils/financialUtils";

const Financeiro = () => {
  const { user } = useAuth();
  const { createCustomerPortalSession } = usePayment();
  const { fetchFinancialData } = useFinancialData();
  const [reportData, setReportData] = useState<any[]>([]);
  const [refundData, setRefundData] = useState<any[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await fetchFinancialData(user.id);
      setReportData(data.reportData);
      setRefundData(data.refundData);
      setSummary(data.summary);
      setChartData(data.chartData);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user]);

  const handleOpenCustomerPortal = async () => {
    await createCustomerPortalSession();
  };

  const handleRefundSuccess = () => {
    loadFinancialData();
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
              <FinancialSummaryCards 
                summary={summary} 
                formatCurrency={formatCurrency} 
              />
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
                <TransactionTable
                  reportData={reportData}
                  formatCurrency={formatCurrency}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  onRefundSuccess={handleRefundSuccess}
                />
              </TabsContent>

              <TabsContent value="refunds">
                <RefundTable
                  refundData={refundData}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Financeiro;