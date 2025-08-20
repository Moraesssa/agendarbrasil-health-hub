
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Medico, Paciente } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { getDefaultWorkingHours } from '@/utils/timeSlotUtils';
import { medicoService } from '@/services/medicoService';

export const useOnboarding = () => {
  const { user, userData, updateOnboardingStep, completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const saveMedicoData = async (data: Partial<Medico>) => {
    if (!user) return false;

    try {
      setIsSubmitting(true);
      
      // Garante que a configuração de horário exista, usando o padrão se necessário.
      const newConfiguracoes = (data.configuracoes as Record<string, any>) || {};
      
      if (!newConfiguracoes.horarioAtendimento) {
        newConfiguracoes.horarioAtendimento = getDefaultWorkingHours();
      } else {
        // Transforma o formato do horário para corresponder à restrição do banco de dados
        const horarios = newConfiguracoes.horarioAtendimento;
        const horariosFormatados: Record<string, any[]> = {};
        for (const dia in horarios) {
          if (Object.prototype.hasOwnProperty.call(horarios, dia)) {
            // Garante que cada dia seja um array de blocos de horário
            horariosFormatados[dia] = Array.isArray(horarios[dia]) ? horarios[dia] : [horarios[dia]];
          }
        }
        newConfiguracoes.horarioAtendimento = horariosFormatados;
      }

      const medicoData = {
        crm: data.crm || '',
        especialidades: data.especialidades || [],
        registroEspecialista: data.registroEspecialista || null,
        telefone: data.telefone || '',
        whatsapp: data.whatsapp || null,
        endereco: data.endereco || {},
        dadosProfissionais: data.dadosProfissionais || {},
        configuracoes: newConfiguracoes,
        verificacao: data.verificacao || {}
      };

      await medicoService.saveMedicoData(medicoData);
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do médico:', error);
      toast({ title: "Erro ao salvar dados", description: "Tente novamente", variant: "destructive" });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const savePacienteData = async (data: Partial<Paciente>) => {
    if (!user) return false;

    try {
      setIsSubmitting(true);
      
      const { data: existing } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const processConvenio = (convenio: any) => {
        if (!convenio) return { temConvenio: false };
        
        return {
          ...convenio,
          validade: convenio.validade 
            ? convenio.validade instanceof Date 
              ? convenio.validade.toISOString()
              : convenio.validade
            : undefined
        };
      };

      const pacienteData = {
        user_id: user.id,
        dados_pessoais: data.dadosPessoais || {},
        contato: data.contato || {},
        endereco: data.endereco || {},
        dados_medicos: data.dadosMedicos || {},
        convenio: processConvenio(data.convenio)
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('pacientes')
          .update(pacienteData)
          .eq('user_id', user.id));
      } else {
        ({ error } = await supabase
          .from('pacientes')
          .insert(pacienteData));
      }

      if (error) {
        console.error('Erro ao salvar dados do paciente:', error);
        toast({
          title: "Erro ao salvar dados",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do paciente:', error);
      toast({
        title: "Erro ao salvar dados",
        description: "Tente novamente",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async (currentStep: number, data?: any) => {
    if (data) {
      const success = userData?.userType === 'medico' 
        ? await saveMedicoData(data)
        : await savePacienteData(data);
      
      if (!success) return false;
    }

    await updateOnboardingStep(currentStep);
    return true;
  };

  const finishOnboarding = async (finalData?: any) => {
    if (finalData) {
      const success = userData?.userType === 'medico' 
        ? await saveMedicoData(finalData)
        : await savePacienteData(finalData);
      
      if (!success) return false;
    }

    await completeOnboarding();
    return true;
  };

  return {
    isSubmitting,
    saveMedicoData,
    savePacienteData,
    nextStep,
    finishOnboarding
  };
};
