# Testes E2E - AgendarBrasil Health Hub

Este diretório contém os testes End-to-End (E2E) para a aplicação AgendarBrasil Health Hub, implementados usando o framework Cypress.

## Estrutura dos Testes

```
cypress/
├── e2e/                          # Testes E2E
│   ├── agendamento_spec.js       # Teste principal da jornada de agendamento
│   └── agendamento_edge_cases_spec.js # Testes de cenários alternativos
├── fixtures/                     # Dados mockados para testes
│   ├── doctors.json             # Lista de médicos
│   ├── availability.json        # Horários disponíveis
│   └── appointment-success.json # Resposta de sucesso do agendamento
├── support/                     # Arquivos de suporte
│   ├── commands.js              # Comandos customizados
│   └── e2e.js                   # Configurações globais
└── README.md                    # Este arquivo
```

## Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **npm** ou **yarn**
3. **Aplicação rodando** em `http://localhost:8080`

## Instalação

```bash
# Instalar Cypress (se não estiver instalado)
npm install cypress --save-dev

# Ou usando yarn
yarn add cypress --dev
```

## Executando os Testes

### Modo Interativo (Cypress Test Runner)
```bash
# Abrir interface gráfica do Cypress
npx cypress open

# Ou usando yarn
yarn cypress open
```

### Modo Headless (CI/CD)
```bash
# Executar todos os testes
npx cypress run

# Executar teste específico
npx cypress run --spec "cypress/e2e/agendamento_spec.js"

# Executar com browser específico
npx cypress run --browser chrome

# Executar em ambiente específico
npx cypress run --env environment=staging
```

## Configuração de Ambientes

### Desenvolvimento Local
```bash
npx cypress run --env environment=development
```

### Staging
```bash
npx cypress run --env environment=staging
```

### Produção
```bash
npx cypress run --env environment=production
```

## Comandos Customizados Disponíveis

### `cy.searchSpecialist(specialty, location)`
Realiza busca por especialista na página inicial.

```javascript
cy.searchSpecialist('Cardiologista', 'São Paulo');
```

### `cy.fillPatientData(patientData)`
Preenche formulário de dados do paciente.

```javascript
cy.fillPatientData({
  fullName: 'João Silva',
  email: 'joao@email.com',
  phone: '(11) 99999-9999'
});
```

### `cy.selectFirstAvailableSlot()`
Seleciona o primeiro horário disponível na agenda.

```javascript
cy.selectFirstAvailableSlot();
```

### `cy.verifyConfirmationModal()`
Verifica se o modal de confirmação está correto.

```javascript
cy.verifyConfirmationModal();
```

### `cy.verifySuccessMessage()`
Verifica mensagem de sucesso do agendamento.

```javascript
cy.verifySuccessMessage();
```

### `cy.cleanTestData()`
Limpa dados de teste (cookies, localStorage, etc.).

```javascript
cy.cleanTestData();
```

## Cenários de Teste Cobertos

### Teste Principal (`agendamento_spec.js`)
- ✅ Jornada completa de agendamento para novo paciente
- ✅ Validação de formulário de cadastro
- ✅ Teste de responsividade mobile

### Testes de Edge Cases (`agendamento_edge_cases_spec.js`)
- ✅ Busca sem resultados
- ✅ Erro de conexão durante busca
- ✅ Validação completa de formulário
- ✅ Horário indisponível durante agendamento
- ✅ Cancelamento do processo
- ✅ Diferentes resoluções de tela
- ✅ Persistência de dados no formulário
- ✅ Estados de loading
- ✅ Múltiplas especialidades
- ✅ Acessibilidade básica

## Data-testids Necessários

Para que os testes funcionem corretamente, os seguintes `data-testid` devem estar implementados na aplicação:

### Página Inicial
- `search-specialty-input`
- `search-location-input`
- `search-button`
- `loading-spinner`

### Página de Resultados
- `search-results-container`
- `doctor-card`
- `doctor-name`
- `doctor-specialty`
- `doctor-photo`
- `view-profile-button`
- `no-results-message`

### Página do Médico
- `doctor-profile-container`
- `doctor-details`
- `available-slots-container`
- `loading-slots`
- `time-slot`

### Modal de Confirmação
- `appointment-confirmation-modal`
- `confirmation-doctor-name`
- `confirmation-date`
- `confirmation-time`
- `confirmation-location`
- `patient-registration-form`
- `patient-name-input`
- `patient-email-input`
- `patient-phone-input`
- `confirm-appointment-button`
- `cancel-appointment-button`

### Página de Sucesso
- `success-message`
- `appointment-confirmation-details`
- `appointment-reference`
- `view-appointment-button`
- `schedule-another-button`

### Mensagens de Erro
- `error-message`
- `retry-button`
- `email-error-message`
- `phone-error-message`
- `slot-unavailable-error`

## Boas Práticas

1. **Seletores**: Use `data-testid` sempre que possível
2. **Esperas**: Use `cy.wait()` apenas para interceptadores, prefira `should()` para elementos
3. **Dados**: Use fixtures para dados mockados
4. **Limpeza**: Sempre limpe dados entre testes
5. **Isolamento**: Cada teste deve ser independente
6. **Asserções**: Faça verificações específicas e claras

## Troubleshooting

### Teste falha por timeout
```javascript
// Aumentar timeout específico
cy.get('[data-testid="element"]', { timeout: 15000 })
```

### Elemento não encontrado
```javascript
// Verificar se elemento existe antes de interagir
cy.get('body').then($body => {
  if ($body.find('[data-testid="element"]').length > 0) {
    cy.get('[data-testid="element"]').click();
  }
});
```

### Teste flaky
```javascript
// Usar retry em cypress.config.js
retries: {
  runMode: 2,
  openMode: 0
}
```

## Relatórios

Os testes geram automaticamente:
- **Screenshots** em caso de falha
- **Vídeos** da execução (modo headless)
- **Relatórios** no terminal

Para relatórios mais detalhados, considere usar:
- Cypress Dashboard
- Mochawesome Reporter
- Allure Reporter

## Integração CI/CD

Exemplo para GitHub Actions:

```yaml
- name: Run Cypress Tests
  run: |
    npm start &
    npx wait-on http://localhost:8080
    npx cypress run
```

## Contribuindo

1. Adicione novos testes em arquivos separados por funcionalidade
2. Use comandos customizados para ações repetitivas
3. Mantenha fixtures atualizadas com dados realistas
4. Documente novos data-testids necessários
5. Execute testes localmente antes de fazer commit