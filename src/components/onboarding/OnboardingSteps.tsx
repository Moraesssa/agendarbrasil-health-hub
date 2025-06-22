
import { UserType } from "@/types/user";
import { PacienteOnboarding } from "./PacienteOnboarding";
import { MedicoOnboarding } from "./MedicoOnboarding";

interface OnboardingStepsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  userType: UserType;
  totalSteps: number;
}

export const OnboardingSteps = ({ 
  currentStep, 
  setCurrentStep, 
  userType, 
  totalSteps 
}: OnboardingStepsProps) => {
  if (userType === 'medico') {
    return (
      <MedicoOnboarding
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        totalSteps={totalSteps}
      />
    );
  }

  return (
    <PacienteOnboarding
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      totalSteps={totalSteps}
    />
  );
};
