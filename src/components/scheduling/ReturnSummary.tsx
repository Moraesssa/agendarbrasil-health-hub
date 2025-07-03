
import React from 'react';
import { MapPin, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoRow } from './InfoRow';

interface Patient {
  id: string;
  display_name: string;
  email: string;
  last_consultation: string;
  consultation_count: number;
}

interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: {
    cidade: string;
    uf: string;
    logradouro: string;
    numero: string;
  };
}

interface ReturnSummaryProps {
  selectedPatient: Patient | null;
  selectedDate: string;
  selectedTime: string;
  selectedLocal: LocalComHorarios | null;
}

export const ReturnSummary = ({
  selectedPatient,
  selectedDate,
  selectedTime,
  selectedLocal
}: ReturnSummaryProps) => {
  const locationText = selectedLocal ? `${selectedLocal.nome_local} (${selectedLocal.endereco.cidade}, ${selectedLocal.endereco.uf})` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Resumo do Retorno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow 
          icon={User} 
          label="Paciente" 
          value={selectedPatient?.display_name || null} 
          isCompleted={!!selectedPatient} 
        />
        <InfoRow 
          icon={Calendar} 
          label="Data" 
          value={selectedDate} 
          isCompleted={!!selectedDate} 
        />
        <InfoRow 
          icon={Clock} 
          label="Horário" 
          value={selectedTime} 
          isCompleted={!!selectedTime} 
        />
        <InfoRow 
          icon={MapPin} 
          label="Local" 
          value={locationText} 
          isCompleted={!!locationText}
        />
        
        {selectedPatient && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Última consulta: {new Date(selectedPatient.last_consultation).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">
              Total de consultas: {selectedPatient.consultation_count}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
