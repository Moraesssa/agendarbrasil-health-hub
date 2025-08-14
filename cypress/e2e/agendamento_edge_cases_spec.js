describe('Agendamento - Cenários Alternativos e Edge Cases', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.cleanTestData();
  });

  it('Deve exibir mensagem quando não há resultados para a busca', () => {
    cy.visit('/');
    
    // Buscar por especialidade inexistente
    cy.searchSpecialist('Especialidade Inexistente', 'Cidade Inexistente');
    
    // Verificar mensagem de "nenhum resultado encontrado"
    cy.get('[data-testid="no-results-message"]')
      .should('be.visible')
      .and('contain.text', 'Nenhum profissional encontrado');
    
    // Verificar sugestões alternativas
    cy.get('[data-testid="search-suggestions"]')
      .should('be.visible');
  });

  it('Deve lidar com erro de conexão durante a busca', () => {
    // Simular erro de rede
    cy.intercept('GET', '**/api/doctors/search**', {
      statusCode: 500,
      body: { error: 'Erro interno do servidor' }
    }).as('searchError');
    
    cy.visit('/');
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    // Aguardar erro
    cy.wait('@searchError');
    
    // Verificar mensagem de erro
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain.text', 'Erro ao buscar profissionais');
    
    // Verificar botão de tentar novamente
    cy.get('[data-testid="retry-button"]')
      .should('be.visible')
      .and('contain.text', 'Tentar novamente');
  });

  it('Deve validar todos os campos obrigatórios do formulário', () => {
    cy.visit('/');
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]').click();
    });
    
    cy.selectFirstAvailableSlot();
    
    // Tentar confirmar sem preencher nada
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.disabled');
    
    // Preencher apenas nome
    cy.get('[data-testid="patient-name-input"]')
      .type('João Silva');
    
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.disabled');
    
    // Preencher e-mail inválido
    cy.get('[data-testid="patient-email-input"]')
      .type('email-invalido');
    
    cy.get('[data-testid="email-error-message"]')
      .should('be.visible');
    
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.disabled');
    
    // Corrigir e-mail
    cy.get('[data-testid="patient-email-input"]')
      .clear()
      .type('joao@email.com');
    
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('be.disabled');
    
    // Preencher telefone inválido
    cy.get('[data-testid="patient-phone-input"]')
      .type('123');
    
    cy.get('[data-testid="phone-error-message"]')
      .should('be.visible');
    
    // Corrigir telefone
    cy.get('[data-testid="patient-phone-input"]')
      .clear()
      .type('(11) 99999-9999');
    
    // Agora o botão deve estar habilitado
    cy.get('[data-testid="confirm-appointment-button"]')
      .should('not.be.disabled');
  });

  it('Deve lidar com horário que se torna indisponível durante o agendamento', () => {
    cy.visit('/');
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]').click();
    });
    
    cy.selectFirstAvailableSlot();
    
    // Simular erro de horário já ocupado
    cy.intercept('POST', '**/api/appointments', {
      statusCode: 409,
      body: { 
        error: 'Horário não está mais disponível',
        code: 'SLOT_UNAVAILABLE'
      }
    }).as('slotUnavailable');
    
    cy.fillPatientData();
    cy.get('[data-testid="confirm-appointment-button"]').click();
    
    cy.wait('@slotUnavailable');
    
    // Verificar mensagem de erro específica
    cy.get('[data-testid="slot-unavailable-error"]')
      .should('be.visible')
      .and('contain.text', 'Horário não está mais disponível');
    
    // Verificar botão para escolher outro horário
    cy.get('[data-testid="choose-another-slot-button"]')
      .should('be.visible');
  });

  it('Deve permitir cancelar o agendamento durante o processo', () => {
    cy.visit('/');
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]').click();
    });
    
    cy.selectFirstAvailableSlot();
    
    // Verificar botão de cancelar no modal
    cy.get('[data-testid="cancel-appointment-button"]')
      .should('be.visible')
      .click();
    
    // Verificar se modal foi fechado
    cy.get('[data-testid="appointment-confirmation-modal"]')
      .should('not.exist');
    
    // Verificar se voltou para a página do médico
    cy.get('[data-testid="available-slots-container"]')
      .should('be.visible');
  });

  it('Deve funcionar corretamente em diferentes resoluções', () => {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 375, height: 667, name: 'Mobile Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      
      cy.visit('/');
      
      // Verificar elementos principais visíveis
      cy.get('[data-testid="search-specialty-input"]')
        .should('be.visible');
      cy.get('[data-testid="search-location-input"]')
        .should('be.visible');
      cy.get('[data-testid="search-button"]')
        .should('be.visible');
      
      // Executar busca
      cy.searchSpecialist('Cardiologista', 'São Paulo');
      
      // Verificar resultados
      cy.get('[data-testid="doctor-card"]')
        .should('have.length.at.least', 1)
        .first()
        .should('be.visible');
    });
  });

  it('Deve manter dados preenchidos ao voltar da confirmação', () => {
    cy.visit('/');
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.get('[data-testid="view-profile-button"]').click();
    });
    
    cy.selectFirstAvailableSlot();
    
    // Preencher dados parcialmente
    const patientData = {
      fullName: 'João Silva Santos',
      email: 'joao@email.com'
    };
    
    cy.fillPatientData(patientData);
    
    // Cancelar e reabrir
    cy.get('[data-testid="cancel-appointment-button"]').click();
    cy.selectFirstAvailableSlot();
    
    // Verificar se dados foram mantidos
    cy.get('[data-testid="patient-name-input"]')
      .should('have.value', patientData.fullName);
    cy.get('[data-testid="patient-email-input"]')
      .should('have.value', patientData.email);
  });

  it('Deve exibir loading states apropriados', () => {
    cy.visit('/');
    
    // Interceptar com delay para ver loading
    cy.intercept('GET', '**/api/doctors/search**', {
      delay: 2000,
      fixture: 'doctors.json'
    }).as('searchDoctorsDelay');
    
    cy.searchSpecialist('Cardiologista', 'São Paulo');
    
    // Verificar loading durante busca
    cy.get('[data-testid="loading-spinner"]')
      .should('be.visible');
    
    cy.wait('@searchDoctorsDelay');
    
    // Loading deve desaparecer
    cy.get('[data-testid="loading-spinner"]')
      .should('not.exist');
    
    // Resultados devem aparecer
    cy.get('[data-testid="doctor-card"]')
      .should('be.visible');
  });

  it('Deve permitir busca por diferentes especialidades', () => {
    const specialties = [
      'Cardiologista',
      'Dermatologista', 
      'Pediatra',
      'Ginecologista',
      'Ortopedista'
    ];
    
    specialties.forEach(specialty => {
      cy.visit('/');
      cy.searchSpecialist(specialty, 'São Paulo');
      
      // Verificar se a busca foi executada
      cy.url().should('include', '/busca');
      
      // Verificar se há resultados ou mensagem apropriada
      cy.get('body').then($body => {
        if ($body.find('[data-testid="doctor-card"]').length > 0) {
          cy.get('[data-testid="doctor-card"]')
            .should('have.length.at.least', 1);
        } else {
          cy.get('[data-testid="no-results-message"]')
            .should('be.visible');
        }
      });
    });
  });

  it('Deve validar acessibilidade básica', () => {
    cy.visit('/');
    
    // Verificar navegação por teclado
    cy.get('[data-testid="search-specialty-input"]')
      .focus()
      .should('be.focused');
    
    cy.get('[data-testid="search-specialty-input"]')
      .tab()
      .should('not.be.focused');
    
    cy.get('[data-testid="search-location-input"]')
      .should('be.focused');
    
    // Verificar labels e aria-labels
    cy.checkBasicAccessibility();
    
    // Verificar contraste e tamanhos mínimos
    cy.get('[data-testid="search-button"]')
      .should('have.css', 'min-height')
      .and('match', /^[4-9]\d+px$|^[1-9]\d{2,}px$/); // Mínimo 44px
  });
});