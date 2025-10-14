import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import type { Medico, LocalAtendimento } from '@/services/agendamento/types';

interface SeletorHorariosProps {
  medico: Medico;
  dataSelecionada: string;
  locais: LocalAtendimento[];
  onSelecionarData: (data: string) => void;
  onSelecionarHorario: (time: string, localId: number) => void;
}

export function SeletorHorarios({
  medico,
  dataSelecionada,
  locais,
  onSelecionarData,
  onSelecionarHorario
}: SeletorHorariosProps) {
  const dataObj = dataSelecionada ? new Date(dataSelecionada) : undefined;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Seletor de Data */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={dataObj}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                onSelecionarData(`${year}-${month}-${day}`);
              }
            }}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Horários Disponíveis */}
      <div className="space-y-4">
        {!dataSelecionada ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Selecione uma data para ver os horários disponíveis
              </p>
            </CardContent>
          </Card>
        ) : locais.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum horário disponível para esta data
              </p>
            </CardContent>
          </Card>
        ) : (
          locais.map(local => (
            <Card key={local.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <div>
                    <div>{local.nome_local}</div>
                    {local.endereco.cidade && (
                      <div className="text-sm font-normal text-muted-foreground mt-1">
                        {local.endereco.logradouro && `${local.endereco.logradouro}, `}
                        {local.endereco.cidade} - {local.endereco.estado}
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {local.horarios_disponiveis.map(horario => (
                    <Button
                      key={horario.time}
                      variant={horario.available ? "outline" : "ghost"}
                      disabled={!horario.available}
                      onClick={() => onSelecionarHorario(horario.time, local.id)}
                      className="w-full"
                      size="sm"
                    >
                      {horario.time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
