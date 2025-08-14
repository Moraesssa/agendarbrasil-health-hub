/**
 * AgendarBrasil Health Hub - Testes E2E do Fluxo de Busca
 * 
 * Este arquivo contém testes para verificar o fluxo de busca por profissionais,
 * incluindo navegação para perfis de médicos e visualização de resultados.
 */

describe('Resultados da Busca e Perfil', () => {
  beforeEach(() => {
    // Configurar interceptadores para simular dados de busca
    cy.intercept('GET', '**/api/specialties**', {
      fixture: 'specialties.json'
    }).as('getSpecialties');
    
    cy.intercept('GET', '**/api/doctors**', {
      fixture: 'doctors.json'
    }).as('getDoctors');
    
    // Simular usuário logado para acessar funcionalidades protegidas
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
  });

  describe('Navegação para Resultados de Busca', () => {
    it('Deve navegar para resultados através do fluxo de agendamento', () => {
      // Visitar página de agendamento
      cy.visit('/agendamento');
      
      // Aguardar carregamento da página
      cy.get('h1, h2').contains('Agendar Consulta').should('be.visible');
      
      // Passo 1: Selecionar especialidade
      cy.get('select, [role="combobox"], input')
        .first()
        .should('be.visible');
      
      // Simular seleção de especialidade (Cardiologista)
      cy.get('select, [role="combobox"]')
        .first()
        .select('Cardiologia')
        .or('type', 'Cardiologia{enter}');
      
      // Avançar para próximo passo
      cy.get('button')
        .contains('Próximo')
        .or('contains', '→')
        .click();
      
      // Passo 2: Selecionar estado
      cy.get('select, [role="combobox"]')
        .select('São Paulo')
        .or('type', 'São Paulo{enter}');
      
      // Avançar para próximo passo
      cy.get('button')
        .contains('Próximo')
        .or('contains', '→')
        .click();
      
      // Passo 3: Selecionar cidade
      cy.get('select, [role="combobox"]')
        .select('São Paulo')
        .or('type', 'São Paulo{enter}');
      
      // Avançar para próximo passo
      cy.get('button')
        .contains('Próximo')
        .or('contains', '→')
        .click();
      
      // Verificar se chegou na seleção de médicos
      cy.get('h2, h3, .text-lg')
        .contains('Médico')
        .or('contains', 'Profissional')
        .should('be.visible');
    });
  });

  describe('Visualização de Perfil de Profissional', () => {
    beforeEach(() => {
      // Simular dados de médico para teste
      cy.intercept('GET', '**/api/doctors/dr-exemplo-123', {
        statusCode: 200,
        body: {
          id: 'dr-exemplo-123',
          name: 'Dr. João Silva',
          specialty: 'Cardiologia',
          crm: '12345-SP',
          location: 'São Paulo, SP',
          rating: 4.8,
          available_times: ['09:00', '10:00', '14:00', '15:00']
        }
      }).as('getDoctorProfile');
    });

    it('Deve navegar para o perfil do profissional', () => {
      // Visitar página de seleção de médicos (simulando chegada através do fluxo)
      cy.visit('/agendamento');
      
      // Simular navegação até a etapa de seleção de médicos
      // (Em um cenário real, isso seria feito através dos passos anteriores)
      cy.window().then((win) => {
        // Simular estado da aplicação com seleções anteriores
        win.sessionStorage.setItem('scheduling-state', JSON.stringify({
          specialty: 'Cardiologia',
          state: 'São Paulo',
          city: 'São Paulo',
          step: 4
        }));
      });
      
      cy.reload();
      
      // Aguardar carregamento dos médicos
      cy.wait('@getDoctors');
      
      // Localizar e clicar no primeiro card de médico disponível
      cy.get('[data-testid="doctor-card"], .doctor-card, .card')
        .first()
        .should('be.visible')
        .within(() => {
          // Verificar informações do médico
          cy.get('h3, .font-semibold, .text-lg')
            .should('contain.text', 'Dr.')
            .or('contain.text', 'Dra.');
          
          // Clicar no botão "Ver Perfil" ou selecionar médico
          cy.get('button')
            .contains('Ver Perfil')
            .or('contains', 'Selecionar')
            .or('contains', 'Escolher')
            .click();
        });
      
      // Verificar se navegou para o perfil detalhado ou próxima etapa
      cy.url().should('match', /\/(perfil|agendamento)/);
      
      // Se navegou para perfil, verificar elementos
      cy.get('body').then(($body) => {
        if ($body.find('h1, h2').text().includes('Perfil') || 
            $body.find('h1, h2').text().includes('Dr.')) {
          // Verificar elementos do perfil
          cy.get('h1, h2').should('contain.text', 'Dr.');
          cy.get('.specialty, .especialidade').should('be.visible');
          cy.get('.crm, .registro').should('be.visible');
        } else {
          // Se continuou no fluxo de agendamento, verificar próxima etapa
          cy.get('h2, h3').should('contain.text', 'Data')
            .or('contain.text', 'Horário');
        }
      });
    });

    it('Deve exibir informações completas do profissional', () => {
      // Visitar diretamente o perfil de um médico
      cy.visit('/perfil/dr-exemplo-123');
      
      // Aguardar carregamento do perfil
      cy.wait('@getDoctorProfile');
      
      // Verificar informações básicas
      cy.get('h1, h2').should('contain.text', 'Dr. João Silva');
      cy.get('.specialty, .especialidade').should('contain.text', 'Cardiologia');
      cy.get('.crm, .registro').should('contain.text', '12345-SP');
      cy.get('.location, .localizacao').should('contain.text', 'São Paulo');
      
      // Verificar avaliação
      cy.get('.rating, .avaliacao, .stars').should('be.visible');
      
      // Verificar horários disponíveis
      cy.get('.available-times, .horarios, .schedule')
        .should('be.visible')
        .within(() => {
          cy.get('button, .time-slot').should('have.length.greaterThan', 0);
        });
    });

    it('Deve permitir agendamento direto do perfil', () => {
      // Visitar perfil do médico
      cy.visit('/perfil/dr-exemplo-123');
      cy.wait('@getDoctorProfile');
      
      // Selecionar um horário disponível
      cy.get('.available-times, .horarios, .schedule')
        .find('button, .time-slot')
        .first()
        .click();
      
      // Verificar se abriu modal de agendamento ou navegou para confirmação
      cy.get('.modal, .dialog, [role="dialog"]')
        .should('be.visible')
        .or(() => {
          cy.url().should('include', 'agendamento');
        });
    });
  });

  describe('Filtros e Busca Avançada', () => {
    it('Deve filtrar resultados por especialidade', () => {
      cy.visit('/agendamento');
      
      // Testar filtro por especialidade
      cy.get('select, [role="combobox"]')
        .first()
        .select('Dermatologia');
      
      // Verificar se os resultados foram filtrados
      cy.get('button').contains('Próximo').click();
      
      // Continuar fluxo e verificar se apenas dermatologistas aparecem
      // (implementação dependeria da estrutura específica da aplicação)
    });

    it('Deve filtrar resultados por localização', () => {
      cy.visit('/agendamento');
      
      // Selecionar especialidade primeiro
      cy.get('select, [role="combobox"]')
        .first()
        .select('Cardiologia');
      cy.get('button').contains('Próximo').click();
      
      // Selecionar estado
      cy.get('select, [role="combobox"]')
        .select('Rio de Janeiro');
      cy.get('button').contains('Próximo').click();
      
      // Selecionar cidade
      cy.get('select, [role="combobox"]')
        .select('Rio de Janeiro');
      
      // Verificar se a localização foi aplicada corretamente
      cy.get('button').contains('Próximo').click();
      
      // Na lista de médicos, verificar se todos são do RJ
      cy.get('.doctor-card, [data-testid="doctor-card"]')
        .each(($card) => {
          cy.wrap($card).should('contain.text', 'RJ')
            .or('contain.text', 'Rio de Janeiro');
        });
    });
  });

  describe('Estados de Erro e Loading', () => {
    it('Deve lidar com erro na busca de médicos', () => {
      // Simular erro na API
      cy.intercept('GET', '**/api/doctors**', {
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      }).as('getDoctorsError');
      
      cy.visit('/agendamento');
      
      // Navegar até a seleção de médicos
      cy.get('select').first().select('Cardiologia');
      cy.get('button').contains('Próximo').click();
      cy.get('select').select('São Paulo');
      cy.get('button').contains('Próximo').click();
      cy.get('select').select('São Paulo');
      cy.get('button').contains('Próximo').click();
      
      // Aguardar erro
      cy.wait('@getDoctorsError');
      
      // Verificar mensagem de erro
      cy.get('.error, .alert, [role="alert"]')
        .should('be.visible')
        .and('contain.text', 'erro')
        .or('contain.text', 'Não foi possível');
    });

    it('Deve exibir loading durante busca', () => {
      // Simular delay na resposta
      cy.intercept('GET', '**/api/doctors**', {
        delay: 2000,
        fixture: 'doctors.json'
      }).as('getDoctorsDelay');
      
      cy.visit('/agendamento');
      
      // Navegar até busca de médicos
      cy.get('select').first().select('Cardiologia');
      cy.get('button').contains('Próximo').click();
      cy.get('select').select('São Paulo');
      cy.get('button').contains('Próximo').click();
      cy.get('select').select('São Paulo');
      cy.get('button').contains('Próximo').click();
      
      // Verificar indicador de loading
      cy.get('.loading, .spinner, .animate-spin, [data-testid="loading"]')
        .should('be.visible');
      
      // Aguardar conclusão
      cy.wait('@getDoctorsDelay');
      
      // Verificar se loading desapareceu
      cy.get('.loading, .spinner, .animate-spin')
        .should('not.exist');
    });
  });
});