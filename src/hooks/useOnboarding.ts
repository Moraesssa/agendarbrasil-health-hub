
import { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      const medicoRef = doc(db, 'medicos', user.uid);
      await setDoc(medicoRef, { ...data, userId: user.uid }, { merge: true });
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
      const pacienteRef = doc(db, 'pacientes', user.uid);
      await setDoc(pacienteRef, { ...data, userId: user.uid }, { merge: true });
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
