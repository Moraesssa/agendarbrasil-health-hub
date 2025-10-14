import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User } from 'lucide-react';
import type { Medico } from '@/services/agendamento/types';

interface ConfirmacaoAgendamentoProps {
  consultaId: number;
  medico: Medico | null;
  data: string;
  horario: string;
  onNovaConsulta: () => void;
  onVerAgenda: () => void;
}

export function ConfirmacaoAgendamento({
  consultaId,
  medico,
  data,
  horario,
  onNovaConsulta,
  onVerAgenda
}: ConfirmacaoAgendamentoProps) {
  const formatarData = (dataStr: string) => {
    const dt = new Date(dataStr);
    return dt.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardContent className="p-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Consulta Agendada!</h2>
            <p className="text-muted-foreground">
              Sua consulta foi agendada com sucesso.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left max-w-md mx-auto">
            {medico && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Médico</div>
                  <div className="font-medium">{medico.display_name}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Data</div>
                <div className="font-medium capitalize">{formatarData(data)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Horário</div>
                <div className="font-medium">{horario}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onNovaConsulta}>
              Agendar Outra Consulta
            </Button>
            <Button onClick={onVerAgenda}>
              Ver Minhas Consultas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
