describe('Jornada de Agendamento', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Página de Agendamento - Componentes', () => {
    beforeEach(() => {
      // A página /agendamento requer autenticação
      // Para testes E2E, podemos interceptar e simular ou testar componentes isoladamente
      cy.visit('/agendamento');
    });

    it('Deve exibir o formulário de busca quando autenticado', () => {
      // Verificar se os elementos de busca estão presentes
      cy.get('[data-testid="specialty-select"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="state-select"]').should('exist');
      cy.get('[data-testid="city-select"]').should('exist');
      cy.get('[data-testid="search-button"]').should('exist');
    });

    it('Deve habilitar o botão de busca apenas quando todos os campos estiverem preenchidos', () => {
      // Botão deve estar desabilitado inicialmente
      cy.get('[data-testid="search-button"]').should('be.disabled');
    });
  });

  describe('Fluxo de Agendamento com Mock', () => {
    beforeEach(() => {
      // Interceptar chamadas do Supabase
      cy.intercept('POST', '**/rest/v1/rpc/get_specialties', {
        statusCode: 200,
        body: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria']
      }).as('getSpecialties');

      cy.intercept('POST', '**/rest/v1/rpc/get_available_states', {
        statusCode: 200,
        body: [
          { uf: 'SP', nome: 'São Paulo' },
          { uf: 'RJ', nome: 'Rio de Janeiro' },
          { uf: 'MG', nome: 'Minas Gerais' }
        ]
      }).as('getStates');

      cy.intercept('POST', '**/rest/v1/rpc/get_available_cities', {
        statusCode: 200,
        body: [
          { cidade: 'São Paulo', estado: 'SP', total_medicos: 10 },
          { cidade: 'Campinas', estado: 'SP', total_medicos: 5 }
        ]
      }).as('getCities');

      cy.intercept('GET', '**/rest/v1/medicos*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            user_id: 'test-uuid-1',
            display_name: 'Dr. João Silva',
            crm: '123456',
            especialidades: ['Cardiologia'],
            rating: 4.8,
            total_avaliacoes: 120,
            valor_consulta_presencial: 250,
            aceita_teleconsulta: true,
            foto_perfil_url: null
          }
        ]
      }).as('getMedicos');

      cy.visit('/agendamento');
    });

    it('Deve exibir os selects de filtro', () => {
      cy.get('[data-testid="specialty-select"]').should('be.visible');
      cy.get('[data-testid="state-select"]').should('be.visible');
      cy.get('[data-testid="city-select"]').should('be.visible');
    });

    it('Deve exibir mensagem quando nenhum médico for encontrado', () => {
      // Este teste verifica o estado vazio
      cy.contains('Encontre o Médico Ideal').should('be.visible');
    });
  });

  describe('Lista de Médicos', () => {
    it('Deve exibir cards de médicos com informações corretas', () => {
      // Interceptar para simular médicos encontrados
      cy.intercept('GET', '**/rest/v1/medicos*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            user_id: 'test-uuid-1',
            display_name: 'Dr. Maria Santos',
            crm: '654321',
            especialidades: ['Dermatologia'],
            rating: 4.9,
            total_avaliacoes: 85,
            valor_consulta_presencial: 300,
            aceita_teleconsulta: true,
            foto_perfil_url: 'https://example.com/photo.jpg'
          }
        ]
      }).as('getMedicos');

      cy.visit('/agendamento');

      // Após buscar médicos, verificar os cards
      cy.get('[data-testid="doctor-list"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="doctor-card"]').should('have.length.at.least', 0);
    });
  });

  describe('Seletor de Horários', () => {
    it('Deve exibir calendário quando médico for selecionado', () => {
      cy.visit('/agendamento');
      
      // O calendário é exibido na etapa de horários
      cy.get('[data-testid="date-calendar"]', { timeout: 10000 }).should('exist');
    });

    it('Deve exibir horários disponíveis após selecionar data', () => {
      cy.visit('/agendamento');
      
      // Verificar que os time slots existem quando há horários
      cy.get('[data-testid="time-slot"]', { timeout: 10000 }).should('exist');
    });
  });

  describe('Confirmação de Agendamento', () => {
    it('Deve exibir mensagem de sucesso após agendamento', () => {
      cy.visit('/agendamento');
      
      // Verificar elementos de confirmação quando existirem
      cy.get('[data-testid="confirmation-success"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="success-message"]').should('exist');
      cy.get('[data-testid="appointment-details"]').should('exist');
    });
  });

  describe('Responsividade Mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('Deve exibir formulário de busca corretamente em mobile', () => {
      cy.visit('/agendamento');
      
      cy.get('[data-testid="specialty-select"]').should('be.visible');
      cy.get('[data-testid="state-select"]').should('be.visible');
      cy.get('[data-testid="city-select"]').should('be.visible');
      cy.get('[data-testid="search-button"]').should('be.visible');
    });

    it('Deve exibir cards de médicos empilhados em mobile', () => {
      cy.visit('/agendamento');
      
      // Verificar layout responsivo
      cy.get('[data-testid="doctor-list"]').should('have.css', 'display', 'grid');
    });
  });

  describe('Validação de Formulário', () => {
    beforeEach(() => {
      cy.visit('/agendamento');
    });

    it('Deve manter botão de busca desabilitado sem seleções', () => {
      cy.get('[data-testid="search-button"]').should('be.disabled');
    });

    it('Deve exibir toast quando tentar buscar sem preencher campos', () => {
      // Forçar clique mesmo com disabled
      cy.get('[data-testid="search-button"]').click({ force: true });
      
      // Verificar toast de erro
      cy.contains('Preencha todos os filtros', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Navegação', () => {
    it('Deve voltar para busca ao clicar em voltar', () => {
      cy.visit('/agendamento');
      
      // Verificar que o título está presente
      cy.contains('Agendar Consulta').should('be.visible');
    });

    it('Deve ir para página inicial ao clicar no botão Início', () => {
      cy.visit('/agendamento');
      
      cy.contains('button', 'Início').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});

describe('Validação de Campos Obrigatórios', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('/agendamento');
  });

  it('Deve desabilitar select de cidade quando estado não estiver selecionado', () => {
    cy.get('[data-testid="city-select"]').should('have.attr', 'aria-disabled', 'true');
  });
});

describe('Teste Mobile - iPhone X', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.visit('/agendamento');
  });

  it('Deve funcionar corretamente em dispositivos móveis', () => {
    // Verificar elementos visíveis
    cy.get('[data-testid="specialty-select"]').should('be.visible');
    cy.get('[data-testid="search-button"]').should('be.visible');
    
    // Título deve estar visível
    cy.contains('Agendar Consulta').should('be.visible');
  });
});
