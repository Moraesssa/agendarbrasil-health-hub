
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { DadosPessoaisForm } from "./forms/DadosPessoaisForm";
import { EnderecoForm } from "./forms/EnderecoForm";
import { Paciente } from "@/types/user";

interface PacienteOnboardingProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  onboardingData: any;
  setOnboardingData: (data: any) => void;
}

export const PacienteOnboarding = ({ 
  currentStep, 
  setCurrentStep, 
  totalSteps,
  onboardingData,
  setOnboardingData
}: PacienteOnboardingProps) => {
  const navigate = useNavigate();
  const { finishOnboarding, isSubmitting } = useOnboarding();
  const { toast } = useToast();

  const handleNext = async (stepData: any) => {
    // 1. Atualiza o estado centralizado no componente pai
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);

    // 2. Avança para o próximo passo ou finaliza
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar onboarding com os dados completos
      const success = await finishOnboarding(updatedData);
      if (success) {
        toast({
          title: "Cadastro concluído!",
          description: "Bem-vindo ao AgendarBrasil",
        });
        navigate("/perfil");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DadosPessoaisForm
            onNext={handleNext}
            initialData={onboardingData.dadosPessoais}
          />
        );
      case 2:
        return (
          <EnderecoForm
            onNext={handleNext}
            initialData={onboardingData.endereco}
          />
        );
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Revise suas informações e finalize seu cadastro.
              </p>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => handleNext({})}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Finalizando..." : "Finalizar Cadastro"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
      
      {currentStep > 1 && currentStep < totalSteps && (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
};
