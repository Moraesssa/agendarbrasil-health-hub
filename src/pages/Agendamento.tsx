import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { agendamentoService } from '@/services/agendamento';
import { FiltroBusca } from '@/components/agendamento/FiltroBusca';
import { ListaMedicos } from '@/components/agendamento/ListaMedicos';
import { SeletorHorarios } from '@/components/agendamento/SeletorHorarios';
import { ConfirmacaoAgendamento } from '@/components/agendamento/ConfirmacaoAgendamento';
import { ProgressStepper } from '@/components/agendamento/ProgressStepper';
import { DoctorCardSkeleton } from '@/components/agendamento/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Medico, LocalAtendimento } from '@/services/agendamento/types';

type Etapa = 'busca' | 'medicos' | 'horarios' | 'confirmacao';

export default function Agendamento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [etapa, setEtapa] = useState<Etapa>('busca');
  const [especialidade, setEspecialidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [locais, setLocais] = useState<LocalAtendimento[]>([]);
  const [consultaId, setConsultaId] = useState<number | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!especialidade || !estado || !cidade) return;

    setLoading(true);
    try {
      const resultado = await agendamentoService.buscarMedicos(especialidade, estado, cidade);
      setMedicos(resultado);
      setEtapa('medicos');
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar médicos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarMedico = (medico: Medico) => {
    setMedicoSelecionado(medico);
    setDataSelecionada('');
    setLocais([]);
    setEtapa('horarios');
  };

  const handleSelecionarData = async (data: string) => {
    if (!medicoSelecionado) return;

    setDataSelecionada(data);
    setLoading(true);
    try {
      const resultado = await agendamentoService.buscarHorarios(medicoSelecionado.id, data);
      setLocais(resultado);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar horários disponíveis.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarHorario = async (time: string, localId: number) => {
    if (!user || !medicoSelecionado || !dataSelecionada) return;

    setLoading(true);
    try {
      const dataHora = `${dataSelecionada}T${time}:00`;
      
      const consulta = await agendamentoService.criarConsulta({
        medico_id: medicoSelecionado.id,
        paciente_id: user.id,
        consultation_date: dataHora,
        consultation_type: 'presencial',
        local_id: localId
      });

      setConsultaId(consulta.id);
      setHorarioSelecionado(time);
      setEtapa('confirmacao');
      
      toast({
        title: 'Sucesso!',
        description: 'Consulta agendada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar a consulta. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNovaConsulta = () => {
    setEtapa('busca');
    setEspecialidade('');
    setEstado('');
    setCidade('');
    setMedicos([]);
    setMedicoSelecionado(null);
    setDataSelecionada('');
    setLocais([]);
    setConsultaId(null);
    setHorarioSelecionado('');
  };

  const handleVerAgenda = () => {
    navigate('/agenda-paciente');
  };

  const handleVoltar = () => {
    if (etapa === 'medicos') {
      setEtapa('busca');
      setMedicos([]);
    } else if (etapa === 'horarios') {
      setEtapa('medicos');
      setMedicoSelecionado(null);
      setDataSelecionada('');
      setLocais([]);
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  // Progress stepper configuration
  const steps = useMemo(() => [
    {
      id: 1,
      label: 'Busca',
      completed: ['medicos', 'horarios', 'confirmacao'].includes(etapa),
      current: etapa === 'busca'
    },
    {
      id: 2,
      label: 'Médico',
      completed: ['horarios', 'confirmacao'].includes(etapa),
      current: etapa === 'medicos'
    },
    {
      id: 3,
      label: 'Horário',
      completed: etapa === 'confirmacao',
      current: etapa === 'horarios'
    },
    {
      id: 4,
      label: 'Confirmação',
      completed: false,
      current: etapa === 'confirmacao'
    }
  ], [etapa]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header with Navigation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {etapa !== 'busca' && etapa !== 'confirmacao' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleVoltar}
                  className="hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Agendar Consulta
                </h1>
                <p className="text-muted-foreground mt-1">
                  {etapa === 'busca' && 'Encontre o médico ideal para você'}
                  {etapa === 'medicos' && 'Selecione um médico disponível'}
                  {etapa === 'horarios' && 'Escolha o melhor horário'}
                  {etapa === 'confirmacao' && 'Consulta confirmada com sucesso!'}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleHome}
              className="hidden sm:flex gap-2"
            >
              <Home className="w-4 h-4" />
              Início
            </Button>
          </div>

          {/* Progress Stepper */}
          {etapa !== 'confirmacao' && (
            <ProgressStepper steps={steps} className="max-w-2xl mx-auto" />
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
          </div>
        ) : (
          <div className={cn(
            "transition-all duration-300",
            etapa === 'confirmacao' ? "animate-fade-in" : ""
          )}>
            {etapa === 'busca' && (
              <div className="max-w-3xl mx-auto">
                <FiltroBusca
                  especialidade={especialidade}
                  estado={estado}
                  cidade={cidade}
                  onEspecialidadeChange={setEspecialidade}
                  onEstadoChange={setEstado}
                  onCidadeChange={setCidade}
                  onBuscar={handleBuscar}
                />
              </div>
            )}

            {etapa === 'medicos' && (
              <ListaMedicos
                medicos={medicos}
                onSelecionar={handleSelecionarMedico}
              />
            )}

            {etapa === 'horarios' && medicoSelecionado && (
              <SeletorHorarios
                medico={medicoSelecionado}
                dataSelecionada={dataSelecionada}
                locais={locais}
                onSelecionarData={handleSelecionarData}
                onSelecionarHorario={handleSelecionarHorario}
              />
            )}

            {etapa === 'confirmacao' && consultaId && (
              <ConfirmacaoAgendamento
                consultaId={consultaId}
                medico={medicoSelecionado}
                data={dataSelecionada}
                horario={horarioSelecionado}
                onNovaConsulta={handleNovaConsulta}
                onVerAgenda={handleVerAgenda}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
