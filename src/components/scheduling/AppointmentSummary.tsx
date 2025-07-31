
import React from 'react';
import { MapPin, Calendar, Clock, User, Stethoscope, MapIcon, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoRow } from './InfoRow';

interface AppointmentSummaryProps {
    selectedSpecialty: string;
    selectedDoctorName: string;
    selectedState: string;
    selectedCity: string;
    selectedDate: string;
    selectedTime: string;
    selectedLocal: { nome_local: string; endereco: any } | null;
    selectedPatientName?: string;
}

export const AppointmentSummary = ({
  selectedSpecialty,
  selectedDoctorName,
  selectedState,
  selectedCity,
  selectedDate,
  selectedTime,
  selectedLocal,
  selectedPatientName
}: AppointmentSummaryProps) => {
    
    const locationText = selectedLocal ? `${selectedLocal.nome_local} (${selectedLocal.endereco.cidade}, ${selectedLocal.endereco.uf})` : null;

    return (
        <Card>
            <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <span>Resumo do Agendamento</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 sm:space-y-2">
                {selectedPatientName && (
                  <InfoRow icon={User} label="Paciente" value={selectedPatientName} isCompleted={!!selectedPatientName} />
                )}
                <InfoRow icon={Stethoscope} label="Especialidade" value={selectedSpecialty} isCompleted={!!selectedSpecialty} />
                <InfoRow icon={User} label="Médico" value={selectedDoctorName} isCompleted={!!selectedDoctorName} />
                <InfoRow icon={MapIcon} label="Estado" value={selectedState} isCompleted={!!selectedState} />
                <InfoRow icon={Building} label="Cidade" value={selectedCity} isCompleted={!!selectedCity} />
                <InfoRow icon={Calendar} label="Data" value={selectedDate} isCompleted={!!selectedDate} />
                <InfoRow icon={Clock} label="Horário" value={selectedTime} isCompleted={!!selectedTime} />
                <InfoRow icon={MapPin} label="Local" value={locationText} isCompleted={!!locationText}/>
            </CardContent>
        </Card>
    );
};
