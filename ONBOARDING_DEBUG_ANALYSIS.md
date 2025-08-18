# Análise de Congelamento e Loops no Fluxo de Onboarding

Este documento detalha a análise dos problemas de performance (congelamentos, travamentos, loops) reportados na rota `/onboarding`.

## 1. Arquitetura do Fluxo de Onboarding

O onboarding é um fluxo de múltiplas etapas, estruturado da seguinte forma:

1.  **`Onboarding.tsx` (Página Principal):**
    *   É o componente "pai" que gerencia o passo atual (`currentStep`).
    *   Renderiza o componente `OnboardingSteps`.

2.  **`OnboardingSteps.tsx` (Componente de Roteamento):**
    *   Decide qual fluxo de onboarding mostrar com base no `userType` ('paciente' ou 'medico').
    *   Renderiza `PacienteOnboarding.tsx` ou `MedicoOnboarding.tsx`.

3.  **`PacienteOnboarding.tsx` (Componente de Lógica):**
    *   Gerencia os dados do formulário do paciente (`pacienteData`).
    *   Renderiza os formulários para cada passo (ex: `DadosPessoaisForm`).
    *   Contém a lógica para avançar os passos (`handleNext`).

## 2. A Causa Raiz do Problema: Atualização de Estado em Cascata

Ao contrário da suspeita inicial de um loop de `useEffect`, o problema aqui é um **anti-padrão de gerenciamento de estado** que leva a re-renderizações múltiplas e em cascata, o que causa os congelamentos e travamentos reportados.

O código problemático está na função `handleNext` dentro de `src/components/onboarding/PacienteOnboarding.tsx`:

```typescript
// Dentro de PacienteOnboarding.tsx

const handleNext = async (stepData: any) => {
  // 1. PRIMEIRA ATUALIZAÇÃO DE ESTADO
  const updatedData = { ...pacienteData, ...stepData };
  setPacienteData(updatedData); // Atualiza o estado LOCAL

  if (currentStep < totalSteps) {
    // 2. SEGUNDA ATUALIZAÇÃO DE ESTADO
    setCurrentStep(currentStep + 1); // Atualiza o estado do PAI
  } else {
    // ...
  }
};
```

**O que acontece aqui:**

1.  Quando o usuário clica em "Próximo", a função `handleNext` é chamada.
2.  A linha `setPacienteData(updatedData)` diz ao React: "Por favor, agende uma nova renderização deste componente (`PacienteOnboarding`) com os novos dados do formulário."
3.  **Imediatamente depois**, a linha `setCurrentStep(currentStep + 1)` diz ao React: "Por favor, agende uma nova renderização do componente pai (`Onboarding`) com o novo número do passo."
4.  A renderização do componente pai (`Onboarding`) **também causa a renderização de todos os seus filhos**, incluindo `PacienteOnboarding`.

O resultado é que um único clique do usuário agenda, no mínimo, **duas renderizações separadas** para o mesmo componente (`PacienteOnboarding`). Se os componentes renderizados forem complexos, essa cascata de renderizações pode sobrecarregar o navegador, resultando em uma interface que não responde (congelamento) ou até mesmo em um crash da aba.

## 3. Recomendação para Correção

A solução é refatorar a lógica para que o estado seja gerenciado de forma mais centralizada e as atualizações de estado ocorram de forma mais controlada, evitando a cascata.

**Solução Recomendada: Centralizar o Estado no Componente Pai**

O estado dos dados do formulário (`pacienteData`) deve ser "levantado" do componente filho (`PacienteOnboarding`) para o componente pai (`Onboarding`).

**Passo 1: Mover o estado para `Onboarding.tsx`**

```typescript
// Em src/pages/Onboarding.tsx

const Onboarding = () => {
  // ... outros estados
  const [currentStep, setCurrentStep] = useState(1);
  // MOVER O ESTADO PARA CÁ
  const [onboardingData, setOnboardingData] = useState({});

  // ...

  return (
    // ...
    <OnboardingSteps
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      onboardingData={onboardingData} // Passar os dados para o filho
      setOnboardingData={setOnboardingData} // Passar a função de update
      // ...
    />
    // ...
  );
};
```

**Passo 2: Simplificar o `PacienteOnboarding.tsx`**

O componente filho agora recebe os dados e a função de atualização de seu pai, e só precisa se preocupar em chamar uma única função para atualizar tudo.

```typescript
// Em src/components/onboarding/PacienteOnboarding.tsx

// A função handleNext é simplificada e agora vive no componente PAI (Onboarding.tsx)
// ou é passada como uma única função de callback.

// Exemplo de como a função de submissão do formulário ficaria:
const handleFormSubmit = (stepData: any) => {
  // Chama uma única função do pai que faz tudo
  onNextStep(stepData);
};

// O componente pai (Onboarding.tsx) teria a função onNextStep:
const onNextStep = (stepData: any) => {
  // UMA ÚNICA ATUALIZAÇÃO DE ESTADO
  setOnboardingData(prevData => ({ ...prevData, ...stepData }));
  setCurrentStep(prevStep => prevStep + 1);
};
```
*Nota: React pode agrupar múltiplas chamadas `set` em uma única renderização se elas estiverem no mesmo escopo de evento, mas levantar o estado é uma solução arquiteturalmente mais limpa e robusta que evita esse tipo de problema por completo.*

Ao centralizar o estado no componente pai e usar uma única função de callback para lidar com as atualizações, garantimos que cada clique do usuário resulte em **uma única e previsível renderização**, eliminando a cascata e resolvendo os problemas de congelamento e travamento.
