describe('Gerenciar Agenda - suporte a IDs numéricos de locais', () => {
  const doctorId = 'doctor-numeric-id';
  const doctorEmail = 'numeric.doctor@example.com';
  let session;

  beforeEach(() => {
    session = {
      access_token: 'numeric-token',
      refresh_token: 'numeric-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: doctorId,
        email: doctorEmail,
        user_metadata: {
          full_name: 'Dr. Números',
          user_type: 'medico'
        }
      }
    };

    cy.intercept('GET', '**/auth/v1/session', {
      statusCode: 200,
      body: {
        currentSession: session,
        session,
        user: session.user
      }
    }).as('getSession');

    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: session.user
    }).as('getUser');

    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: [
        {
          id: doctorId,
          email: doctorEmail,
          display_name: 'Dr. Números',
          photo_url: null,
          user_type: 'medico',
          onboarding_completed: true,
          is_active: true,
          preferences: {}
        }
      ]
    }).as('getProfile');

    cy.intercept('GET', '**/rest/v1/medicos*', (req) => {
      if (req.url.includes('select=especialidades')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              user_id: doctorId,
              especialidades: [],
              crm: '12345-SP'
            }
          ]
        });
        return;
      }

      if (req.url.includes('select=configuracoes')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              user_id: doctorId,
              configuracoes: null
            }
          ]
        });
        return;
      }

      req.reply({ statusCode: 200, body: [] });
    }).as('getMedicoData');

    cy.intercept('GET', '**/rest/v1/locais_atendimento*', {
      statusCode: 200,
      body: [
        {
          id: 987,
          medico_id: doctorId,
          nome_local: 'Clínica Numérica',
          endereco: {
            cep: '01001000',
            logradouro: 'Praça da Sé',
            numero: '100',
            bairro: 'Sé',
            cidade: 'São Paulo',
            uf: 'SP'
          },
          telefone: null,
          ativo: true
        }
      ]
    }).as('getLocations');

    cy.intercept('PATCH', `**/rest/v1/medicos?user_id=eq.${doctorId}`, (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            ...req.body[0],
            user_id: doctorId
          }
        ]
      });
    }).as('saveAgenda');
  });

  it('permite salvar agenda utilizando um local com ID numérico', () => {
    cy.visit('/gerenciar-agenda', {
      onBeforeLoad(win) {
        win.localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: session,
          user: session.user
        }));
        win.localStorage.setItem('mock_auth_user', JSON.stringify(session.user));
      }
    });

    cy.wait(['@getSession', '@getUser', '@getProfile', '@getLocations']);
    cy.wait('@getMedicoData');
    cy.wait('@getMedicoData');

    cy.contains('Adicionar Bloco').first().click();

    cy.get('[data-testid="schedule-start-segunda-0"]').clear().type('09:00');
    cy.get('[data-testid="schedule-end-segunda-0"]').clear().type('12:00');

    cy.get('[data-testid="schedule-local-select-segunda-0"]').click();
    cy.contains('[data-radix-collection-item]', 'Clínica Numérica').click();

    cy.contains('Salvar Alterações').click();

    cy.wait('@saveAgenda').its('request.body').then((body) => {
      const payload = Array.isArray(body) ? body[0] : body;
      const horario = payload.configuracoes.horarioAtendimento.segunda[0];
      expect(horario.local_id).to.eq('987');
    });
  });
});
