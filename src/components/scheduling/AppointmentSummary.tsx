
import React, { useState } from 'react';
import { MapPin, Calendar, Clock, User, Stethoscope, MapIcon, Building, Phone, Mail, Edit3, ExternalLink, Navigation, Wifi, Car, Accessibility, CreditCard, Clock4, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InfoRow } from './InfoRow';
import { LocationActions } from '@/components/location/LocationActions';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { EnhancedLocation, LocationFacility } from '@/types/location';

interface AppointmentSummaryProps {
    selectedSpecialty: string;
    selectedDoctorName: string;
    selectedState: string;
    selectedCity: string;
    selectedDate: string;
    selectedTime: string;
    selectedLocal: { nome_local: string; endereco: { 
        logradouro?: string; 
        numero?: string; 
        bairro?: string; 
        cidade?: string; 
        uf?: string; 
    } } | null;
    selectedPatientName?: string;
    // Enhanced location props
    enhancedLocation?: EnhancedLocation;
    onLocationChange?: () => void;
    showLocationDetails?: boolean;
    appointmentType?: 'presencial' | 'telemedicina';
    appointmentId?: string;
}

export const AppointmentSummary = ({
  selectedSpecialty,
  selectedDoctorName,
  selectedState,
  selectedCity,
  selectedDate,
  selectedTime,
  selectedLocal,
  selectedPatientName,
  // Enhanced location props
  enhancedLocation,
  onLocationChange,
  showLocationDetails = true,
  appointmentType = 'presencial',
  appointmentId
}: AppointmentSummaryProps) => {
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    
    // Use enhanced location if available, fallback to legacy selectedLocal
    const currentLocation = enhancedLocation || (selectedLocal ? {
        id: 'legacy',
        nome: selectedLocal.nome_local,
        endereco: selectedLocal.endereco,
        telefone: '',
        email: '',
        horario_funcionamento: {},
        facilities: [],
        status: 'active' as const,
        ultima_atualizacao: new Date().toISOString()
    } : null);
    
    const locationText = currentLocation?.nome || null;
    const locationAddress = currentLocation?.endereco ? 
        `${currentLocation.endereco.logradouro}, ${currentLocation.endereco.numero} - ${currentLocation.endereco.bairro}, ${currentLocation.endereco.cidade}/${currentLocation.endereco.uf}` : null;

    // Generate location-specific instructions
    const getLocationInstructions = () => {
        if (!currentLocation) return [];
        
        const instructions = [];
        
        // Basic arrival instructions
        instructions.push({
            icon: Navigation,
            title: "Como chegar",
            content: `Chegue com 15 minutos de antecedência no ${currentLocation.nome}. ${locationAddress}`
        });
        
        // Parking instructions if available
        if (currentLocation.facilities?.some(f => f.type === 'estacionamento')) {
            instructions.push({
                icon: Car,
                title: "Estacionamento",
                content: "Estacionamento disponível no local. Consulte a recepção para orientações."
            });
        }
        
        // Accessibility instructions
        if (currentLocation.facilities?.some(f => f.type === 'acessibilidade')) {
            instructions.push({
                icon: Accessibility,
                title: "Acessibilidade",
                content: "Local com acessibilidade para pessoas com deficiência."
            });
        }
        
        // Payment instructions
        if (currentLocation.facilities?.some(f => f.type === 'cartao')) {
            instructions.push({
                icon: CreditCard,
                title: "Formas de pagamento",
                content: "Aceitamos cartão de débito, crédito e PIX."
            });
        }
        
        // Operating hours
        if (currentLocation.horario_funcionamento) {
            const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
            const todayHours = currentLocation.horario_funcionamento[today];
            if (todayHours) {
                instructions.push({
                    icon: Clock4,
                    title: "Horário de funcionamento hoje",
                    content: `${todayHours.abertura} às ${todayHours.fechamento}`
                });
            }
        }
        
        return instructions;
    };

    const locationInstructions = getLocationInstructions();

    return (
        <div className="space-y-4">
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
                    
                    {/* Enhanced location information */}
                    {currentLocation && (
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <InfoRow 
                                    icon={Building} 
                                    label="Estabelecimento" 
                                    value={locationText} 
                                    isCompleted={!!locationText}
                                />
                                {onLocationChange && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onLocationChange}
                                        className="ml-2 h-7 px-2"
                                    >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        Alterar
                                    </Button>
                                )}
                            </div>
                            
                            {locationAddress && (
                              <InfoRow icon={MapPin} label="Endereço" value={locationAddress} isCompleted={!!locationAddress}/>
                            )}
                            
                            {/* Contact information */}
                            {currentLocation.telefone && (
                                <InfoRow 
                                    icon={Phone} 
                                    label="Telefone" 
                                    value={currentLocation.telefone} 
                                    isCompleted={!!currentLocation.telefone}
                                />
                            )}
                            
                            {currentLocation.email && (
                                <InfoRow 
                                    icon={Mail} 
                                    label="Email" 
                                    value={currentLocation.email} 
                                    isCompleted={!!currentLocation.email}
                                />
                            )}
                            
                            {/* Facilities */}
                            {currentLocation.facilities && currentLocation.facilities.length > 0 && (
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wifi className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Facilidades</span>
                                    </div>
                                    <LocationFacilities 
                                        facilities={currentLocation.facilities}
                                        showTooltips={true}
                                        size="sm"
                                    />
                                </div>
                            )}
                            
                            {/* Location actions */}
                            {showLocationDetails && (
                                <div className="pt-2">
                                    <LocationActions
                                        location={currentLocation}
                                        appointmentDetails={{
                                            specialty: selectedSpecialty,
                                            doctor: selectedDoctorName,
                                            date: selectedDate,
                                            time: selectedTime,
                                            patient: selectedPatientName
                                        }}
                                        size="sm"
                                        variant="outline"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Location-specific instructions */}
            {locationInstructions.length > 0 && showLocationDetails && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span>Instruções para a consulta</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {locationInstructions.map((instruction, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                                    <instruction.icon className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{instruction.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{instruction.content}</p>
                                </div>
                            </div>
                        ))}
                        
                        {/* Additional appointment type specific instructions */}
                        {appointmentType === 'presencial' && (
                            <div className="flex items-start gap-3 pt-2 border-t">
                                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <Clock4 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-sm">Documentos necessários</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Traga documento com foto, cartão do convênio (se aplicável) e exames anteriores relacionados.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Detailed location information dialog */}
            {currentLocation && showLocationDetails && (
                <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver detalhes completos do local
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-600" />
                                {currentLocation.nome}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            {/* Complete address */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Endereço completo</h4>
                                <p className="text-gray-600">{locationAddress}</p>
                            </div>
                            
                            {/* Contact information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentLocation.telefone && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Telefone</h4>
                                        <p className="text-gray-600">{currentLocation.telefone}</p>
                                    </div>
                                )}
                                {currentLocation.email && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                                        <p className="text-gray-600">{currentLocation.email}</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Operating hours */}
                            {currentLocation.horario_funcionamento && Object.keys(currentLocation.horario_funcionamento).length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Horário de funcionamento</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.entries(currentLocation.horario_funcionamento).map(([day, hours]) => (
                                            <div key={day} className="flex justify-between text-sm">
                                                <span className="capitalize text-gray-600">{day}:</span>
                                                <span className="text-gray-900">
                                                    {hours ? `${hours.abertura} - ${hours.fechamento}` : 'Fechado'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Facilities */}
                            {currentLocation.facilities && currentLocation.facilities.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Facilidades disponíveis</h4>
                                    <LocationFacilities 
                                        facilities={currentLocation.facilities}
                                        showTooltips={true}
                                        size="md"
                                    />
                                </div>
                            )}
                            
                            {/* Location actions */}
                            <Separator />
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Ações</h4>
                                <LocationActions
                                    location={currentLocation}
                                    appointmentDetails={{
                                        specialty: selectedSpecialty,
                                        doctor: selectedDoctorName,
                                        date: selectedDate,
                                        time: selectedTime,
                                        patient: selectedPatientName
                                    }}
                                    size="md"
                                    variant="default"
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
