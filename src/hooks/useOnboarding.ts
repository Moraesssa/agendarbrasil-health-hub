
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Medico, Paciente } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

export const useOnboarding = () => {
  const { user, userData, updateOnboardingStep, completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const saveMedicoData = async (data: Partial<Medico>) => {
    if (!user) return false;

    try {
      setIsSubmitting(true);
      
      // Check if medico record exists
      const { data: existing } = await supabase
        .from('medicos')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const medicoData = {
        user_id: user.id,
        crm: data.crm || '',
        especialidades: data.especialidades || [],
        registro_especialista: data.registroEspecialista || null,
        telefone: data.telefone || '',
        whatsapp: data.whatsapp || null,
        endereco: data.endereco || {},
        dados_profissionais: data.dadosProfissionais || {},
        configuracoes: data.configuracoes || {},
        verificacao: data.verificacao || {
          crmVerificado: false,
          documentosEnviados: false,
          aprovado: false
        }
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('user_id', user.id));
      } else {
        ({ error } = await supabase
          .from('medicos')
          .insert([medicoData]));
      }

      if (error) {
        console.error('Erro ao salvar dados do médico:', error);
        toast({
          title: "Erro ao salvar dados",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do médico:', error);
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

  const savePacienteData = async (data: Partial<Paciente>) => {
    if (!user) return false;

    try {
      setIsSubmitting(true);
      
      // Check if paciente record exists
      const { data: existing } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const pacienteData = {
        user_id: user.id,
        dados_pessoais: data.dadosPessoais || {},
        contato: data.contato || {},
        endereco: data.endereco || {},
        dados_medicos: data.dadosMedicos || {},
        convenio: data.convenio || { temConvenio: false }
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
          .insert([pacienteData]));
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
