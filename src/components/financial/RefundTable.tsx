import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RefundTableProps {
  refundData: any[];
  formatCurrency: (value: number) => string;
}

export const RefundTable = ({ refundData, formatCurrency }: RefundTableProps) => {
  return (
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
  );
};