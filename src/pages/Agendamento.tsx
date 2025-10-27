import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { agendamentoService } from '@/services/agendamento';
import { FiltroBusca } from '@/components/agendamento/FiltroBusca';
import { ListaMedicos } from '@/components/agendamento/ListaMedicos';
import { SeletorHorarios } from '@/components/agendamento/SeletorHorarios';
import { ConfirmacaoAgendamento } from '@/components/agendamento/ConfirmacaoAgendamento';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Medico, LocalAtendimento } from '@/services/agendamento/types';

type Etapa = 'busca' | 'medicos' | 'horarios' | 'confirmacao';

export default function AgendamentoV2() {
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {etapa !== 'busca' && etapa !== 'confirmacao' && (
            <Button variant="ghost" size="icon" onClick={handleVoltar}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Agendar Consulta</h1>
            <p className="text-muted-foreground">
              {etapa === 'busca' && 'Encontre o médico ideal para você'}
              {etapa === 'medicos' && 'Selecione um médico'}
              {etapa === 'horarios' && 'Escolha a data e horário'}
              {etapa === 'confirmacao' && 'Consulta confirmada!'}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {etapa === 'busca' && (
              <FiltroBusca
                especialidade={especialidade}
                estado={estado}
                cidade={cidade}
                onEspecialidadeChange={setEspecialidade}
                onEstadoChange={setEstado}
                onCidadeChange={setCidade}
                onBuscar={handleBuscar}
              />
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
          </>
        )}
      </div>
    </div>
  );
}
