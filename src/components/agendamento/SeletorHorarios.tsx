import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Building } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { TimeSlotButton } from './TimeSlotButton';
import { cn } from '@/lib/utils';
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
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; localId: number } | null>(null);
  const dataObj = dataSelecionada ? new Date(dataSelecionada) : undefined;

  const handleSlotClick = (time: string, localId: number, available: boolean) => {
    if (!available) return;
    setSelectedSlot({ time, localId });
    onSelecionarHorario(time, localId);
  };

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      {/* Seletor de Data */}
      <Card className="shadow-lg h-fit sticky top-4">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Selecione a Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Escolha um dia para ver horários disponíveis
          </p>
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
                setSelectedSlot(null);
              }
            }}
            disabled={(date) => date < new Date()}
            className={cn(
              "rounded-md border p-3 pointer-events-auto",
              "w-full"
            )}
            data-testid="date-calendar"
          />
        </CardContent>
      </Card>

      {/* Horários Disponíveis */}
      <div className="space-y-4">
        {!dataSelecionada ? (
          <Card className="border-2 border-dashed">
            <CardContent>
              <EmptyState
                icon={Clock}
                title="Selecione uma data"
                description="Escolha uma data no calendário ao lado para visualizar os horários disponíveis"
              />
            </CardContent>
          </Card>
        ) : locais.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent>
              <EmptyState
                icon={Clock}
                title="Nenhum horário disponível"
                description="Não há horários disponíveis para esta data. Tente selecionar outra data."
              />
            </CardContent>
          </Card>
        ) : (
          locais.map(local => (
            <Card 
              key={local.id}
              data-testid="local-card"
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{local.nome_local}</CardTitle>
                    {local.endereco.cidade && (
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {local.endereco.logradouro && `${local.endereco.logradouro}, `}
                          {local.endereco.cidade} - {local.endereco.estado}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {local.horarios_disponiveis.filter(h => h.available).length} horários
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {local.horarios_disponiveis.map(horario => (
                    <div key={horario.time} data-testid="time-slot">
                      <TimeSlotButton
                        time={horario.time}
                        available={horario.available}
                        selected={
                          selectedSlot?.time === horario.time && 
                          selectedSlot?.localId === local.id
                        }
                        onClick={() => handleSlotClick(horario.time, local.id, horario.available)}
                      />
                    </div>
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
