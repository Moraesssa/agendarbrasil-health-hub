# Requirements Document - Dashboard Médico V3

## Introduction

Refatoração completa do Dashboard Médico para criar uma experiência moderna, responsiva e intuitiva que atenda todas as necessidades de gestão da prática médica. O dashboard deve ser o hub central onde o médico visualiza métricas, gerencia agenda, acompanha pacientes e acessa funcionalidades principais.

## Glossary

- **Dashboard**: Página principal do médico após login, exibindo visão geral da prática
- **Métricas**: Indicadores quantitativos de desempenho (consultas, receita, pacientes)
- **Widget**: Componente visual independente que exibe informação específica
- **Responsivo**: Interface que se adapta a diferentes tamanhos de tela (mobile, tablet, desktop)
- **Real-time**: Dados atualizados automaticamente sem necessidade de refresh manual
- **KPI**: Key Performance Indicator - Indicador-chave de desempenho

## Requirements

### Requirement 1: Visualização de Métricas em Tempo Real

**User Story:** Como médico, quero visualizar métricas atualizadas da minha prática em tempo real, para tomar decisões informadas sobre meu negócio.

#### Acceptance Criteria

1. WHEN o médico acessa o dashboard, THE Sistema SHALL exibir 4 cards de métricas principais com dados atualizados dos últimos 30 dias
2. WHEN os dados são carregados, THE Sistema SHALL exibir skeleton loaders durante o carregamento para melhor UX
3. WHEN ocorre erro no carregamento, THE Sistema SHALL exibir mensagem de erro clara com opção de retry
4. THE Sistema SHALL calcular e exibir as seguintes métricas:
   - Total de consultas realizadas no período
   - Receita total e média por consulta
   - Taxa de ocupação da agenda (%)
   - Número de pacientes únicos atendidos
5. WHEN o médico clica em um card de métrica, THE Sistema SHALL exibir detalhes expandidos com breakdown da informação

### Requirement 2: Gráficos Interativos de Desempenho

**User Story:** Como médico, quero visualizar gráficos interativos do meu desempenho, para identificar tendências e padrões na minha prática.

#### Acceptance Criteria

1. THE Sistema SHALL exibir gráfico de barras com consultas dos últimos 7 dias, agrupadas por dia
2. THE Sistema SHALL exibir gráfico de pizza com distribuição de tipos de consulta (presencial vs teleconsulta)
3. THE Sistema SHALL exibir gráfico de linha com evolução da receita nos últimos 30 dias
4. WHEN o médico passa o mouse sobre um ponto do gráfico, THE Sistema SHALL exibir tooltip com detalhes específicos
5. THE Sistema SHALL permitir alternar período de visualização (7 dias, 30 dias, 90 dias, ano)
6. THE Sistema SHALL usar cores consistentes com o design system (azul para consultas, verde para receita)

### Requirement 3: Lista de Próximas Consultas

**User Story:** Como médico, quero ver minhas próximas consultas do dia, para me preparar adequadamente para cada atendimento.

#### Acceptance Criteria

1. THE Sistema SHALL exibir lista das próximas 5 consultas do dia atual, ordenadas por horário
2. WHEN não há consultas agendadas, THE Sistema SHALL exibir estado vazio com mensagem amigável
3. THE Sistema SHALL exibir para cada consulta:
   - Nome do paciente
   - Horário agendado
   - Tipo de consulta (presencial/teleconsulta)
   - Status (confirmada, pendente)
   - Foto do paciente (ou avatar com iniciais)
4. WHEN o médico clica em uma consulta, THE Sistema SHALL abrir modal com detalhes completos
5. WHEN faltam menos de 15 minutos para uma consulta, THE Sistema SHALL destacar visualmente com badge de urgência

### Requirement 4: Alertas e Notificações Importantes

**User Story:** Como médico, quero receber alertas sobre situações que requerem minha atenção, para não perder informações críticas.

#### Acceptance Criteria

1. THE Sistema SHALL exibir seção de alertas no topo do dashboard quando houver itens pendentes
2. THE Sistema SHALL alertar sobre:
   - Consultas com pagamento pendente
   - Pacientes aguardando confirmação
   - Documentos pendentes de assinatura
   - Mensagens não lidas de pacientes
3. WHEN o médico clica em um alerta, THE Sistema SHALL navegar para a tela apropriada para resolver o item
4. WHEN o médico resolve um alerta, THE Sistema SHALL remover automaticamente da lista
5. THE Sistema SHALL usar cores semânticas (amarelo para atenção, vermelho para urgente, azul para informativo)

### Requirement 5: Ações Rápidas e Atalhos

**User Story:** Como médico, quero acessar rapidamente as ações mais comuns, para economizar tempo na navegação.

#### Acceptance Criteria

1. THE Sistema SHALL exibir seção de ações rápidas com botões para:
   - Nova consulta
   - Visualizar agenda completa
   - Acessar lista de pacientes
   - Gerenciar locais de atendimento
   - Configurar horários
2. WHEN o médico clica em uma ação rápida, THE Sistema SHALL navegar para a tela correspondente
3. THE Sistema SHALL exibir ícones intuitivos para cada ação
4. THE Sistema SHALL manter consistência visual com o resto da aplicação

### Requirement 6: Responsividade Multi-dispositivo

**User Story:** Como médico, quero acessar o dashboard de qualquer dispositivo, para gerenciar minha prática em movimento.

#### Acceptance Criteria

1. THE Sistema SHALL adaptar layout para telas mobile (< 640px), tablet (640-1024px) e desktop (> 1024px)
2. WHEN em mobile, THE Sistema SHALL empilhar widgets verticalmente em coluna única
3. WHEN em tablet, THE Sistema SHALL exibir widgets em grid de 2 colunas
4. WHEN em desktop, THE Sistema SHALL exibir widgets em grid de até 4 colunas
5. THE Sistema SHALL manter todos os elementos interativos com área de toque mínima de 44x44px em mobile
6. THE Sistema SHALL usar tipografia responsiva que escala adequadamente em cada breakpoint

### Requirement 7: Performance e Otimização

**User Story:** Como médico, quero que o dashboard carregue rapidamente, para não perder tempo esperando.

#### Acceptance Criteria

1. THE Sistema SHALL carregar a estrutura inicial do dashboard em menos de 1 segundo
2. THE Sistema SHALL carregar dados de métricas em menos de 2 segundos
3. THE Sistema SHALL implementar lazy loading para gráficos pesados
4. THE Sistema SHALL cachear dados de métricas por 5 minutos para evitar requisições desnecessárias
5. THE Sistema SHALL usar skeleton loaders durante carregamento para melhor percepção de performance
6. THE Sistema SHALL implementar virtual scrolling para listas com mais de 50 itens

### Requirement 8: Gerenciamento de Locais e Horários Integrado

**User Story:** Como médico, quero gerenciar meus locais de atendimento e horários diretamente do dashboard, para configurar minha prática facilmente.

#### Acceptance Criteria

1. THE Sistema SHALL exibir seção colapsável com lista de locais de atendimento cadastrados
2. THE Sistema SHALL permitir adicionar novo local através de modal sem sair do dashboard
3. THE Sistema SHALL exibir seção colapsável com resumo dos horários configurados
4. THE Sistema SHALL permitir editar horários através de modal sem sair do dashboard
5. WHEN não há locais cadastrados, THE Sistema SHALL exibir CTA (Call-to-Action) para adicionar primeiro local
6. THE Sistema SHALL validar dados antes de salvar (campos obrigatórios, formato de CEP, etc)

### Requirement 9: Filtros e Personalização

**User Story:** Como médico, quero personalizar a visualização do dashboard, para focar nas informações mais relevantes para mim.

#### Acceptance Criteria

1. THE Sistema SHALL permitir alternar período de visualização das métricas (hoje, semana, mês, ano)
2. THE Sistema SHALL permitir ocultar/exibir widgets específicos através de menu de configuração
3. THE Sistema SHALL salvar preferências do usuário no banco de dados
4. WHEN o médico retorna ao dashboard, THE Sistema SHALL restaurar preferências salvas
5. THE Sistema SHALL permitir reordenar widgets através de drag-and-drop (desktop only)

### Requirement 10: Acessibilidade e Usabilidade

**User Story:** Como médico com necessidades especiais, quero que o dashboard seja acessível, para poder usar a plataforma sem barreiras.

#### Acceptance Criteria

1. THE Sistema SHALL implementar navegação completa por teclado (Tab, Enter, Esc)
2. THE Sistema SHALL usar ARIA labels em todos os elementos interativos
3. THE Sistema SHALL manter contraste mínimo de 4.5:1 entre texto e fundo (WCAG AA)
4. THE Sistema SHALL anunciar mudanças de estado para screen readers
5. THE Sistema SHALL permitir zoom até 200% sem quebrar layout
6. THE Sistema SHALL usar foco visível em todos os elementos interativos

### Requirement 11: Integração com Sistema de Pagamentos

**User Story:** Como médico, quero visualizar informações financeiras consolidadas, para acompanhar a saúde financeira da minha prática.

#### Acceptance Criteria

1. THE Sistema SHALL exibir widget com resumo financeiro:
   - Receita do mês atual
   - Receita do mês anterior (comparação)
   - Consultas pagas vs pendentes
   - Ticket médio
2. THE Sistema SHALL exibir gráfico de evolução da receita mensal
3. WHEN há pagamentos pendentes, THE Sistema SHALL exibir alerta com quantidade e valor total
4. THE Sistema SHALL permitir clicar no widget financeiro para ver detalhes completos
5. THE Sistema SHALL atualizar dados financeiros em tempo real quando pagamento é confirmado

### Requirement 12: Estado Vazio e Onboarding

**User Story:** Como médico novo na plataforma, quero ser guiado nas primeiras configurações, para começar a usar o sistema rapidamente.

#### Acceptance Criteria

1. WHEN o médico acessa o dashboard pela primeira vez, THE Sistema SHALL exibir tour guiado opcional
2. WHEN não há dados para exibir, THE Sistema SHALL mostrar estado vazio com ilustração e CTA
3. THE Sistema SHALL exibir checklist de configuração inicial:
   - Completar perfil
   - Adicionar local de atendimento
   - Configurar horários
   - Definir valores de consulta
4. WHEN o médico completa um item do checklist, THE Sistema SHALL atualizar progresso visualmente
5. WHEN todos os itens são completados, THE Sistema SHALL ocultar checklist e exibir congratulações

---

## Non-Functional Requirements

### Performance
- Tempo de carregamento inicial < 1s
- Tempo de resposta de interações < 100ms
- Suporte a 1000+ consultas sem degradação de performance

### Segurança
- Todas as requisições devem usar autenticação JWT
- Dados sensíveis devem ser criptografados em trânsito (HTTPS)
- RLS (Row Level Security) deve estar habilitado no Supabase

### Compatibilidade
- Suporte a navegadores modernos (Chrome, Firefox, Safari, Edge - últimas 2 versões)
- Suporte a iOS 14+ e Android 10+
- Funcionar offline com dados em cache (progressive enhancement)

### Manutenibilidade
- Código deve seguir padrões do projeto (TypeScript, ESLint, Prettier)
- Componentes devem ser reutilizáveis e testáveis
- Documentação inline para lógica complexa

---

## Success Metrics

- **Tempo médio de carregamento**: < 2 segundos
- **Taxa de erro**: < 1%
- **Satisfação do usuário**: > 4.5/5
- **Tempo para completar ação comum**: < 30 segundos
- **Taxa de adoção de funcionalidades**: > 80%

---

## Out of Scope (Para Versões Futuras)

- Integração com sistemas externos (ERP, contabilidade)
- Relatórios customizáveis avançados
- Exportação de dados em múltiplos formatos
- Dashboard colaborativo (múltiplos médicos)
- Modo offline completo com sincronização
