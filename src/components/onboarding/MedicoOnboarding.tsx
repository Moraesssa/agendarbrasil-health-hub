
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { DadosProfissionaisForm } from "./forms/DadosProfissionaisForm";
import { EnderecoForm } from "./forms/EnderecoForm";
import { ConfiguracoesForm } from "./forms/ConfiguracoesForm";
import { Medico } from "@/types/user";

interface MedicoOnboardingProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

export const MedicoOnboarding = ({ 
  currentStep, 
  setCurrentStep, 
  totalSteps 
}: MedicoOnboardingProps) => {
  const navigate = useNavigate();
  const { finishOnboarding, isSubmitting } = useOnboarding();
  const { toast } = useToast();
  const [medicoData, setMedicoData] = useState<Partial<Medico>>({});

  const handleNext = async (stepData: any) => {
    const updatedData = { ...medicoData, ...stepData };
    setMedicoData(updatedData);

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar onboarding
      const success = await finishOnboarding(updatedData);
      if (success) {
        toast({
          title: "Cadastro concluído!",
          description: "Bem-vindo ao AgendarBrasil",
        });
        navigate("/perfil-medico");
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
          <DadosProfissionaisForm
            onNext={handleNext}
            initialData={medicoData.dadosProfissionais}
          />
        );
      case 2:
        return (
          <EnderecoForm
            onNext={handleNext}
            initialData={medicoData.endereco}
          />
        );
      case 3:
        return (
          <ConfiguracoesForm
            onNext={handleNext}
            initialData={medicoData.configuracoes}
          />
        );
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Revise suas informações e finalize seu cadastro médico.
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
