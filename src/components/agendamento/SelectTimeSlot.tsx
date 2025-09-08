import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { SchedulingService, Doctor, AvailableSlot } from '@/services/schedulingService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SelectTimeSlotProps {
  doctor: Doctor;
  onSelectSlot: (slot: AvailableSlot) => void;
  onBack: () => void;
}

export function SelectTimeSlot({ doctor, onSelectSlot, onBack }: SelectTimeSlotProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState<'presencial' | 'teleconsulta' | ''>('');
  const [locaisAtendimento, setLocaisAtendimento] = useState<any[]>([]);

  useEffect(() => {
    loadLocaisAtendimento();
  }, [doctor.id]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, tipoConsulta, doctor.id]);

  const loadLocaisAtendimento = async () => {
    try {
      const { data, error } = await supabase
        .from('locais_atendimento')
        .select('*')
        .eq('medico_id', doctor.id)
        .eq('ativo', true);

      if (error) throw error;
      setLocaisAtendimento(data || []);
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    }
  };

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const dataInicio = startOfDay(selectedDate).toISOString();
      const dataFim = startOfDay(addDays(selectedDate, 1)).toISOString();
      
      const slots = await SchedulingService.getAvailableSlots(
        doctor.id,
        dataInicio,
        dataFim,
        tipoConsulta || undefined
      );
      
      setAvailableSlots(slots);
    } catch (error) {
      toast.error('Erro ao carregar horários disponíveis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'HH:mm', { locale: ptBR });
  };

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getLocalName = (localId?: string) => {
    if (!localId) return 'Teleconsulta';
    const local = locaisAtendimento.find(l => l.id === localId);
    return local ? local.nome : 'Local não encontrado';
  };

  const getLocalAddress = (localId?: string) => {
    if (!localId) return null;
    const local = locaisAtendimento.find(l => l.id === localId);
    return local ? `${local.endereco}, ${local.cidade} - ${local.estado}` : null;
  };

  // Filtrar tipos de consulta disponíveis
  const tiposDisponiveis = [];
  if (doctor.aceita_consulta_presencial) {
    tiposDisponiveis.push({ value: 'presencial', label: 'Presencial' });
  }
  if (doctor.aceita_teleconsulta) {
    tiposDisponiveis.push({ value: 'teleconsulta', label: 'Teleconsulta' });
  }

  return (
    <div className="space-y-6">
      {/* Header com informações do médico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{doctor.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {doctor.especialidade} • CRM: {doctor.crm}/{doctor.uf_crm}
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seleção de Data e Tipo */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={tipoConsulta}
                onValueChange={(value) => setTipoConsulta(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {tiposDisponiveis.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                className="rounded-md border"
                locale={ptBR}
              />
            </CardContent>
          </Card>
        </div>

        {/* Horários Disponíveis */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Horários para {formatDate(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Carregando horários disponíveis...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum horário disponível para esta data.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tente selecionar outra data ou tipo de consulta.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSlots.map((slot, index) => (
                    <Card 
                      key={index} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onSelectSlot(slot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {formatTime(slot.data_hora)}
                            </span>
                          </div>
                          <Badge variant={slot.tipo_consulta === 'presencial' ? 'default' : 'secondary'}>
                            {slot.tipo_consulta === 'presencial' ? 'Presencial' : 'Teleconsulta'}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            <span>R$ {slot.valor.toFixed(2)}</span>
                          </div>

                          {slot.local_id && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 mt-0.5" />
                              <div>
                                <p className="font-medium">{getLocalName(slot.local_id)}</p>
                                <p className="text-xs">{getLocalAddress(slot.local_id)}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Duração: {slot.duracao_disponivel} min</span>
                          </div>
                        </div>

                        <Button className="w-full mt-3" size="sm">
                          Agendar este horário
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}