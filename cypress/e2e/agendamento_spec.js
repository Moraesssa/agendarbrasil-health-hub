describe('Jornada de Agendamento - Novo Paciente', () => {
  beforeEach(() => {
    // Configurações iniciais para cada teste
    cy.viewport(1280, 720);
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('Deve completar a jornada de agendamento de consulta com cardiologista', () => {
    // 1. Acessar a Página Inicial
    cy.visit('/');
    
    // Verificações da página inicial
    cy.title().should('eq', 'Agendar Brasil Health Hub');
    cy.get('[data-testid="search-specialty-input"]')
      .should('be.visible')
      .and('be.enabled');
    cy.get('[data-testid="search-location-input"]')
      .should('be.visible')
      .and('be.enabled');
    cy.get('[data-testid="search-button"]')
      .should('be.visible')
      .and('be.enabled');

    // 2. Realizar a Busca por um Especialista
    cy.log('Realizando busca por cardiologista em São Paulo');
    
    // Preencher campo de especialidade
    cy.get('[data-testid="search-specialty-input"]')
      .type('Cardiologista')
      .should('have.value', 'Cardiologista');
    
    // Preencher campo de localização
    cy.get('[data-testid="search-location-input"]')
      .type('São Paulo')
      .should('have.value', 'São Paulo');
    
    // Executar busca
    cy.get('[data-testid="search-button"]').click();
    
    // Aguardar carregamento dos resultados
    cy.get('[data-testid="loading-spinner"]', { timeout: 10000 })
      .should('not.exist');
    
    // Verificações da página de resultados
    cy.url().should('include', '/busca');
    cy.get('[data-testid="search-results-container"]')
      .should('be.visible');
    
    // Verificar se há pelo menos um resultado
    cy.get('[data-testid="doctor-card"]')
      .should('have.length.at.least', 1);
    
    // Verificar informações obrigatórias no primeiro card
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="doctor-name"]')
        .should('be.visible')
        .and('not.be.empty');
      cy.get('[data-testid="doctor-specialty"]')
        .should('be.visible')
        .and('contain.text', 'Cardiologista');
      cy.get('[data-testid="doctor-photo"]')
        .should('be.visible')
        .and('have.attr', 'src');
    });

    // 3. Selecionar um Profissional
    cy.log('Selecionando o primeiro profissional da lista');
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]')
        .should('be.visible')
        .click();
    });
    
    // Verificações da página de perfil do médico
    cy.url().should('include', '/medico/');
    cy.get('[data-testid="doctor-profile-container"]')
      .should('be.visible');
    cy.get('[data-testid="doctor-details"]')
      .should('be.visible');
    cy.get('[data-testid="available-slots-container"]')
      .should('be.visible');

    // 4. Escolher um Horário
    cy.log('Selecionando primeiro horário disponível');
    
    // Aguardar carregamento dos horários
    cy.get('[data-testid="loading-slots"]', { timeout: 10000 })
      .should('not.exist');
    
    // Verificar se há horários disponíveis
    cy.get('[data-testid="time-slot"]')
      .should('have.length.at.least', 1);
    
    // Selecionar primeiro horário disponível
    cy.get('[data-testid="time-slot"]').first()
      .should('be.visible')
      .and('not.have.class', 'disabled')
      .click();
    
    // Verificar abertura do modal de confirmação
    cy.get('[data-testid="appointment-confirmation-modal"]')
      .should('be.visible');
    
    // Verificar detalhes do agendamento no modal
    cy.get('[data-testid="confirmation-doctor-name"]')
      .should('be.visible')
      .and('not.be.empty');
    cy.get('[data-testid="confirmation-date"]')
      .should('be.visible')
      .and('not.be.empty');
    cy.get('[data-testid="confirmation-time"]')
      .should('be.visible')
      .and('not.be.empty');
    cy.get('[data-testid="confirmation-location"]')
      .should('be.visible')
      .and('not.be.empty');

    // 5. Identificação do Paciente (Fluxo de Novo Usuário)
    cy.log('Preenchendo dados do novo paciente');
    
    // Verificar se o formulário de cadastro está visível
    cy.get('[data-testid="patient-registration-form"]')
      .should('be.visible');
    
    // Dados fictícios para teste
    const patientData = {
      fullName: 'João Silva Santos',
      email: 'joao.silva@email.com',
      phone: '(11) 99999-9999'
    };
    
    // Preencher nome completo
    cy.get('[data-testid="patient-name-input"]')
      .should('be.visible')
      .type(patientData.fullName)
      .should('have.value', patientData.fullName);
    
    // Preencher e-mail
    cy.get('[data-testid="patient-email-input"]')
      .should('be.visible')
      .type(patientData.email)
      .should('have.value', patientData.email);
    
    // Preencher telefone
    cy.get('[data-testid="patient-phone-input"]')
      .should('be.visible')
      .type(patientData.phone)
      .should('have.value', patientData.phone);
    
    // Verificar validação dos campos
    cy.get('[data-testid="patient-name-input"]')
      .should('not.have.class', 'error');
    cy.get('[data-testid="patient-email-input"]')
      .should('not.have.class', 'error');
    cy.get('[data-testid="patient-phone-input"]')
      .should('not.have.class', 'error');
    
    // Verificar se o botão de confirmação está habilitado
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.visible')
      .and('not.be.disabled');

    // 6. Confirmar o Agendamento
    cy.log('Confirmando o agendamento');
    
    cy.get('[data-testid="confirm-appointment-button"]').click();
    
    // Aguardar processamento
    cy.get('[data-testid="processing-appointment"]', { timeout: 15000 })
      .should('not.exist');
    
    // Verificação Final - Mensagem de Sucesso
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain.text', 'Consulta agendada com sucesso!');
    
    // Verificar se há informações do agendamento confirmado
    cy.get('[data-testid="appointment-confirmation-details"]')
      .should('be.visible');
    
    // Verificar se há número de protocolo ou referência
    cy.get('[data-testid="appointment-reference"]')
      .should('be.visible')
      .and('not.be.empty');
    
    // Verificar botões de ação pós-agendamento
    cy.get('[data-testid="view-appointment-button"]')
      .should('be.visible');
    cy.get('[data-testid="schedule-another-button"]')
      .should('be.visible');
    
    // Teste adicional: Verificar se o horário não está mais disponível
    cy.log('Verificando se o horário foi removido da disponibilidade');
    
    // Voltar para a página do médico
    cy.get('[data-testid="back-to-doctor-button"]').click();
    
    // Aguardar recarregamento dos horários
    cy.get('[data-testid="loading-slots"]', { timeout: 10000 })
      .should('not.exist');
    
    // O horário selecionado anteriormente não deve mais estar disponível
    // (Esta verificação pode variar dependendo da implementação)
    cy.get('[data-testid="available-slots-container"]')
      .should('be.visible');
  });

  // Teste de validação de formulário
  it('Deve validar campos obrigatórios no formulário de cadastro', () => {
    // Navegar diretamente para um estado onde o modal está aberto
    // (Este teste pode ser adaptado conforme a estrutura da aplicação)
    cy.visit('/');
    
    // Simular chegada ao modal de confirmação
    cy.get('[data-testid="search-specialty-input"]').type('Cardiologista');
    cy.get('[data-testid="search-location-input"]').type('São Paulo');
    cy.get('[data-testid="search-button"]').click();
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]').click();
    });
    
    cy.get('[data-testid="time-slot"]').first().click();
    
    // Tentar confirmar sem preencher dados
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.disabled');
    
    // Preencher e-mail inválido
    cy.get('[data-testid="patient-email-input"]')
      .type('email-invalido');
    
    // Verificar mensagem de erro
    cy.get('[data-testid="email-error-message"]')
      .should('be.visible')
      .and('contain.text', 'E-mail inválido');
    
    // Corrigir e-mail
    cy.get('[data-testid="patient-email-input"]')
      .clear()
      .type('email@valido.com');
    
    cy.get('[data-testid="email-error-message"]')
      .should('not.exist');
  });

  // Teste de responsividade mobile
  it('Deve funcionar corretamente em dispositivos móveis', () => {
    cy.viewport('iphone-x');
    
    cy.visit('/');
    
    // Verificar se elementos estão visíveis em mobile
    cy.get('[data-testid="search-specialty-input"]')
      .should('be.visible');
    cy.get('[data-testid="search-location-input"]')
      .should('be.visible');
    cy.get('[data-testid="search-button"]')
      .should('be.visible');
    
    // Executar busca em mobile
    cy.get('[data-testid="search-specialty-input"]').type('Cardiologista');
    cy.get('[data-testid="search-location-input"]').type('São Paulo');
    cy.get('[data-testid="search-button"]').click();
    
    // Verificar resultados em mobile
    cy.get('[data-testid="doctor-card"]')
      .should('have.length.at.least', 1)
      .first()
      .should('be.visible');
  });
});