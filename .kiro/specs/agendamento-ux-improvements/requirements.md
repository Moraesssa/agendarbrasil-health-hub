# Requirements Document

## Introduction

Esta especificação define melhorias de UX/UI para a página de agendamento (/agendamento) com foco em navegação e visibilidade de elementos importantes. O objetivo é tornar a experiência do usuário mais intuitiva e fluida, especialmente na navegação entre etapas e na seleção de familiar para agendamento.

## Requirements

### Requirement 1

**User Story:** Como usuário navegando pela página de agendamento, eu quero ter botões de navegação claros para voltar ao início ou à etapa anterior, para que eu possa navegar facilmente pelo processo.

#### Acceptance Criteria

1. WHEN o usuário estiver em qualquer etapa do agendamento THEN o sistema SHALL exibir um botão "Home" no cabeçalho da página
2. WHEN o usuário clicar no botão "Home" THEN o sistema SHALL redirecionar para a página inicial do dashboard
3. WHEN o usuário estiver em qualquer etapa após a primeira THEN o sistema SHALL exibir um botão "Voltar" claramente visível
4. WHEN o usuário clicar no botão "Voltar" THEN o sistema SHALL retornar à etapa anterior mantendo os dados já preenchidos
5. WHEN o usuário estiver na primeira etapa THEN o sistema SHALL ocultar o botão "Voltar"

### Requirement 2

**User Story:** Como usuário na etapa final de agendamento, eu quero que a seção "Agendar para" seja mais visível e chamativa, para que eu não perca essa opção importante de seleção.

#### Acceptance Criteria

1. WHEN o usuário chegar na etapa final (step 7) THEN o sistema SHALL exibir a seção "Agendar para" com destaque visual
2. WHEN a seção "Agendar para" for exibida THEN o sistema SHALL usar cores contrastantes e ícones para chamar atenção
3. WHEN a seção "Agendar para" for exibida THEN o sistema SHALL posicionar esta seção antes do resumo do agendamento
4. WHEN o usuário não tiver selecionado um familiar THEN o sistema SHALL mostrar claramente que está agendando para si mesmo
5. WHEN houver familiares disponíveis THEN o sistema SHALL destacar visualmente as opções de seleção

### Requirement 3

**User Story:** Como usuário, eu quero que a navegação entre etapas seja mais intuitiva e responsiva, para que eu tenha uma experiência fluida durante todo o processo.

#### Acceptance Criteria

1. WHEN o usuário navegar entre etapas THEN o sistema SHALL manter feedback visual do progresso
2. WHEN o usuário estiver em uma etapa THEN o sistema SHALL destacar visualmente a etapa atual
3. WHEN o usuário completar uma etapa THEN o sistema SHALL mostrar indicação visual de conclusão
4. WHEN o usuário tentar avançar sem preencher campos obrigatórios THEN o sistema SHALL mostrar mensagem clara do que está faltando
5. WHEN o usuário usar dispositivos móveis THEN o sistema SHALL manter a usabilidade dos botões de navegação

### Requirement 4

**User Story:** Como usuário, eu quero que os elementos interativos tenham feedback visual adequado, para que eu saiba quando posso interagir com eles.

#### Acceptance Criteria

1. WHEN o usuário passar o mouse sobre botões THEN o sistema SHALL mostrar efeito hover apropriado
2. WHEN botões estiverem desabilitados THEN o sistema SHALL mostrar claramente o estado desabilitado
3. WHEN o usuário clicar em botões THEN o sistema SHALL mostrar feedback visual de clique
4. WHEN houver carregamento THEN o sistema SHALL mostrar indicadores de loading apropriados
5. WHEN houver erros THEN o sistema SHALL destacar visualmente os campos com problema