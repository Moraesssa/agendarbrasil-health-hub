import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefundButton } from "./RefundButton";

interface TransactionTableProps {
  reportData: any[];
  formatCurrency: (value: number) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onRefundSuccess: () => void;
}

export const TransactionTable = ({ 
  reportData, 
  formatCurrency, 
  getStatusColor, 
  getStatusText, 
  onRefundSuccess 
}: TransactionTableProps) => {
  const transactions = reportData.filter(item => item.status !== 'refund');

  return (
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
            {transactions.map((item) => (
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
                      onRefundSuccess={onRefundSuccess}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma transação encontrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};