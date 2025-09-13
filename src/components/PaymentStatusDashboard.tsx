
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, CreditCard } from "lucide-react";
import { useConsultas } from "@/hooks/useConsultas";
import { useToast } from "@/hooks/use-toast";
import { usePayment } from "@/hooks/usePayment";

export const PaymentStatusDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Use empty filters (no specific filtering needed for payment dashboard)
  const emptyFilters = useMemo(() => ({}), []);
  const { consultas, loading, refetch } = useConsultas(emptyFilters);
  const { verifyPayment } = usePayment();
  const { toast } = useToast();

  const consultasPagas = consultas?.filter(c => c.status_pagamento === 'pago' || c.status === 'paid') || [];
  const consultasPendentes = consultas?.filter(c => c.status_pagamento === 'pendente' || c.status === 'pending' || c.status === 'pending_payment') || [];
  const consultasAguardandoPagamento = consultas?.filter(c => c.status_pagamento === 'aguardando' || c.status === 'awaiting_payment') || [];

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      // Tentar verificar pagamentos de todas as consultas pendentes
      const consultasParaVerificar = [...consultasPendentes, ...consultasAguardandoPagamento];
      
      if (consultasParaVerificar.length === 0) {
        toast({
          title: "Nenhuma consulta para verificar",
          description: "Todas as suas consultas já estão com pagamento confirmado.",
        });
        return;
      }

      let verificacoesBemSucedidas = 0;
      
      for (const consulta of consultasParaVerificar) {
        try {
          console.log('PaymentStatusDashboard: Verificando consulta:', consulta.id);
          const result = await verifyPayment(consulta.id?.toString() || '');
          if (result.success && result.paid) {
            verificacoesBemSucedidas++;
          }
        } catch (error) {
          console.error('Erro ao verificar consulta:', consulta.id, error);
        }
      }

      if (verificacoesBemSucedidas > 0) {
        toast({
          title: `${verificacoesBemSucedidas} pagamento(s) confirmado(s)!`,
          description: "Suas consultas foram atualizadas.",
        });
        refetch();
      } else {
        toast({
          title: "Verificação concluída",
          description: "Nenhum novo pagamento foi confirmado.",
        });
      }
    } catch (error) {
      console.error('Erro na verificação em lote:', error);
      toast({
        title: "Erro na verificação",
        description: "Houve um problema ao verificar os pagamentos.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status dos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status dos Pagamentos
          </div>
          <Button 
            onClick={handleRefreshAll}
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Verificando...' : 'Verificar Tudo'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo dos Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Pagas</p>
              <p className="text-2xl font-bold text-green-900">{consultasPagas.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900">{consultasPendentes.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Aguardando</p>
              <p className="text-2xl font-bold text-orange-900">{consultasAguardandoPagamento.length}</p>
            </div>
          </div>
        </div>

        {/* Lista de Consultas com Problemas */}
        {(consultasPendentes.length > 0 || consultasAguardandoPagamento.length > 0) && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Consultas que precisam de atenção:</h4>
            <div className="space-y-2">
              {[...consultasPendentes, ...consultasAguardandoPagamento].map((consulta) => (
                <div key={consulta?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {consulta?.doctor_profile?.display_name || 'Médico não especificado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(consulta?.consultation_date || '').toLocaleDateString('pt-BR')} às{' '}
                      {new Date(consulta?.consultation_date || '').toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={consulta.status_pagamento === 'pending_payment' ? 'outline' : 'secondary'}>
                      {consulta.status_pagamento === 'pending_payment' ? 'Aguardando' : 'Pendente'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => verifyPayment(consulta.id?.toString() || '')}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {consultas.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma consulta encontrada.</p>
          </div>
        )}

        {consultasPagas.length === consultas.length && consultas.length > 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium">Todos os pagamentos estão em dia!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
