# Fluxo de Agendamento

Este documento descreve o fluxo padrão de agendamento de consultas no AgendarBrasil Health Hub, detalhando cada etapa, suas responsabilidades e como estender ou personalizar o processo.

## Rota Padrão

O fluxo de agendamento está disponível pela rota `/agendamento`. Essa página implementa a versão integrada do agendador e é o ponto de entrada recomendável para pacientes que desejam marcar novas consultas.

## Etapas do Fluxo e Responsabilidades

### 1. Seleção de Especialidade
* **Responsável:** `AppointmentService.getSpecialties()`
* **Descrição:** Carrega todas as especialidades médicas disponíveis para início do processo.

### 2. Seleção de Estado e Cidade
* **Responsáveis:**
  * `Supabase RPC get_available_states()`
  * `Supabase RPC get_available_cities(state_uf)`
* **Descrição:** Após a escolha da especialidade, o usuário seleciona o estado e a cidade onde deseja atendimento. As opções são filtradas dinamicamente com base no que já foi selecionado.

### 3. Escolha do Médico
* **Responsável:** `AppointmentService.getDoctorsByLocationAndSpecialty()`
* **Descrição:** Recupera os médicos disponíveis que atendem na localidade escolhida e na especialidade selecionada.

### 4. Seleção de Data e Horário
* **Responsável:** `AppointmentService.getAvailableSlotsByDoctor()`
* **Descrição:** Após a seleção do médico, o usuário escolhe a data e um horário disponível. O componente `TimeSlotButton` exibe visualmente os horários livres e a localização correspondente.

### 5. Confirmação do Agendamento
* **Responsável:** `AppointmentService.scheduleAppointment()`
* **Descrição:** Valida todas as informações coletadas, cria o registro de agendamento e redireciona o usuário para o painel do paciente em caso de sucesso.

## Estrutura de Estado

Todo o estado e lógica do fluxo são centralizados no hook `useAppointmentScheduling`, que coordena a cascata de seleções e o carregamento de dados. Esse hook também executa a limpeza de etapas anteriores quando uma seleção pai é alterada.

## Estendendo ou Personalizando o Fluxo

1. **Adicionar Novas Etapas:**
   - Crie componentes específicos para a nova etapa.
   - Estenda `useAppointmentScheduling` para incluir o estado e as funções necessárias.
   - Insira o novo componente na página de agendamento na posição desejada.

2. **Personalizar a Rota:**
   - Adicione uma nova rota em `src/App.tsx` apontando para um componente de agendamento customizado.
   - Use parâmetros de consulta para configurar presets (ex.: `/agendamento?preset=checkup`).

3. **Alterar Fontes de Dados:**
   - Substitua as chamadas do `AppointmentService` ou das funções RPC por integrações externas.
   - Garanta que as funções de carregamento mantenham a mesma assinatura para reaproveitar o hook.

4. **Modificar Estilos ou Comportamentos de UI:**
   - Atualize os componentes de seleção e o `TimeSlotButton` para refletir novas regras de negócio ou temas visuais.

## Considerações Finais

O fluxo padrão atende aos casos comuns de agendamento de consultas médicas, mas foi desenhado para ser flexível. Utilize as diretrizes acima para adaptar o processo às necessidades específicas do seu projeto ou da sua instituição.

