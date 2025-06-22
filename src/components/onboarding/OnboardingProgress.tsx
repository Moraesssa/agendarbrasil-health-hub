
import { UserType } from "@/types/user";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  userType: UserType;
}

export const OnboardingProgress = ({ currentStep, totalSteps, userType }: OnboardingProgressProps) => {
  const getStepTitle = (step: number) => {
    if (userType === 'medico') {
      const titles = [
        'Dados Pessoais',
        'Dados Profissionais', 
        'Endereço',
        'Configurações',
        'Finalização'
      ];
      return titles[step - 1];
    } else {
      const titles = [
        'Dados Pessoais',
        'Endereço', 
        'Finalização'
      ];
      return titles[step - 1];
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Etapa {currentStep} de {totalSteps}: {getStepTitle(currentStep)}
        </p>
      </div>
    </div>
  );
};
