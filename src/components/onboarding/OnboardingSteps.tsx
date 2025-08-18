
import { UserType } from "@/types/user";
import { PacienteOnboarding } from "./PacienteOnboarding";
import { MedicoOnboarding } from "./MedicoOnboarding";

interface OnboardingStepsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  userType: UserType;
  totalSteps: number;
  onboardingData: any;
  setOnboardingData: (data: any) => void;
}

export const OnboardingSteps = ({ 
  currentStep, 
  setCurrentStep, 
  userType, 
  totalSteps,
  onboardingData,
  setOnboardingData
}: OnboardingStepsProps) => {
  if (userType === 'medico') {
    return (
      <MedicoOnboarding
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        totalSteps={totalSteps}
        onboardingData={onboardingData}
        setOnboardingData={setOnboardingData}
      />
    );
  }

  return (
    <PacienteOnboarding
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      totalSteps={totalSteps}
      onboardingData={onboardingData}
      setOnboardingData={setOnboardingData}
    />
  );
};
