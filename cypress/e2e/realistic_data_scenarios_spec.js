/**
 * Realistic Data Scenarios E2E Tests - Phase 3
 * Testing with comprehensive mock data and real-world scenarios
 */

describe('Realistic Data Scenarios - Production-Like Testing', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.viewport(1280, 720);
    
    // Load realistic mock data
    cy.loadRealisticMockData();
    
    // Set up comprehensive API mocking
    cy.interceptRealisticAPIs();
  });

  describe('🌎 Geographic Distribution Testing', () => {
    it('Should handle nationwide doctor distribution correctly', () => {
      cy.visit('/agendamento');
      
      // Test major metropolitan areas
      const majorCities = [
        { state: 'SP', city: 'São Paulo', expectedDoctors: 50 },
        { state: 'RJ', city: 'Rio de Janeiro', expectedDoctors: 30 },
        { state: 'MG', city: 'Belo Horizonte', expectedDoctors: 20 },
        { state: 'RS', city: 'Porto Alegre', expectedDoctors: 15 },
        { state: 'PR', city: 'Curitiba', expectedDoctors: 12 }
      ];
      
      majorCities.forEach(({ state, city, expectedDoctors }) => {
        cy.log(`Testing ${city}, ${state}`);
        
        // Reset and select specialty
        cy.get('[data-testid="reset-search"]').click();
        cy.selectSpecialty('Cardiologia');
        cy.clickNext();
        
        // Select state
        cy.selectState(state);
        cy.clickNext();
        
        // Select city
        cy.selectCity(city);
        cy.clickNext();
        
        // Verify doctor count
        cy.get('[data-testid="doctor-count"]')
          .should('contain', `${expectedDoctors}+ médicos`);
        
        cy.get('[data-testid="doctor-card"]')
          .should('have.length.at.least', Math.min(expectedDoctors, 10)); // Paginated
      });
    });

    it('Should handle smaller cities and rural areas', () => {
      cy.visit('/agendamento');
      
      const smallerCities = [
        { state: 'MT', city: 'Cuiabá', expectedDoctors: 5 },
        { state: 'AC', city: 'Rio Branco', expectedDoctors: 2 },
        { state: 'RR', city: 'Boa Vista', expectedDoctors: 1 }
      ];
      
      smallerCities.forEach(({ state, city, expectedDoctors }) => {
        cy.log(`Testing smaller city: ${city}, ${state}`);
        
        cy.get('[data-testid="reset-search"]').click();
        cy.selectSpecialty('Clínica Geral');
        cy.clickNext();
        
        cy.selectState(state);
        cy.clickNext();
        
        cy.selectCity(city);
        cy.clickNext();
        
        if (expectedDoctors === 0) {
          cy.get('[data-testid="no-doctors-message"]')
            .should('be.visible')
            .and('contain', 'Nenhum médico encontrado');
          
          cy.get('[data-testid="expand-search-button"]')
            .should('be.visible');
        } else {
          cy.get('[data-testid="doctor-card"]')
            .should('have.length', expectedDoctors);
        }
      });
    });
  });

  describe('🏥 Specialty Distribution Testing', () => {
    it('Should reflect realistic specialty availability', () => {
      cy.visit('/agendamento');
      
      const specialtyTests = [
        { 
          specialty: 'Clínica Geral', 
          availability: 'high',
          minCities: 50,
          description: 'Most common specialty'
        },
        {
          specialty: 'Cardiologia',
          availability: 'medium',
          minCities: 25,
          description: 'Common specialty in major cities'
        },
        {
          specialty: 'Neurocirurgia',
          availability: 'low',
          minCities: 5,
          description: 'Specialized, limited availability'
        },
        {
          specialty: 'Medicina Nuclear',
          availability: 'very-low',
          minCities: 2,
          description: 'Highly specialized'
        }
      ];
      
      specialtyTests.forEach(({ specialty, availability, minCities, description }) => {
        cy.log(`Testing ${specialty} - ${description}`);
        
        cy.selectSpecialty(specialty);
        cy.clickNext();
        
        // Check state-level availability
        cy.get('[data-testid="state-availability-info"]')
          .should('be.visible');
        
        cy.selectState('SP'); // São Paulo should have most specialties
        cy.clickNext();
        
        // Check city-level availability
        cy.get('[data-testid="city-option"]')
          .should('have.length.at.least', minCities);
        
        // Test availability indication
        cy.get('[data-testid="availability-indicator"]')
          .should('have.class', availability);
        
        cy.get('[data-testid="reset-search"]').click();
      });
    });
  });

  describe('⏰ Time Slot Realism Testing', () => {
    it('Should generate realistic appointment schedules', () => {
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city', 'doctor']);
      
      // Select today's date
      cy.get('[data-testid="date-today"]').click();
      cy.clickNext();
      
      // Verify realistic time slots
      cy.get('[data-testid="time-slot"]').should('exist');
      
      // Check business hours (8 AM - 6 PM typical)
      cy.get('[data-testid="time-slot"]')
        .first()
        .should('contain', /^(0[8-9]|1[0-8]):/); // 08:xx - 18:xx
      
      cy.get('[data-testid="time-slot"]')
        .last()
        .should('contain', /^(1[0-8]):/); // Ends by 18:xx
      
      // Check for lunch break gap (12-13h typical)
      cy.get('[data-testid="time-slot"]')
        .contains('12:30')
        .should('not.exist');
      
      cy.get('[data-testid="time-slot"]')
        .contains('13:00')
        .should('exist');
      
      // Test weekend scheduling
      cy.get('[data-testid="date-weekend"]').click();
      
      cy.get('[data-testid="weekend-availability"]')
        .should('be.visible')
        .and('contain', 'Horários limitados');
    });

    it('Should handle peak hour booking pressure', () => {
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city', 'doctor']);
      
      // Select a peak day (Monday)
      cy.get('[data-testid="date-monday"]').click();
      cy.clickNext();
      
      // Verify high demand indication
      cy.get('[data-testid="high-demand-alert"]')
        .should('be.visible')
        .and('contain', 'Alta demanda');
      
      // Check that many slots are already booked
      cy.get('[data-testid="time-slot"]').then($slots => {
        const totalSlots = $slots.length;
        const availableSlots = $slots.filter('.available').length;
        const bookedPercentage = ((totalSlots - availableSlots) / totalSlots) * 100;
        
        expect(bookedPercentage).to.be.greaterThan(60); // > 60% booked on Mondays
      });
      
      // Test alternative suggestions
      cy.get('[data-testid="alternative-dates"]')
        .should('be.visible');
      
      cy.get('[data-testid="alternative-date"]')
        .first()
        .click();
      
      // Verify better availability
      cy.get('[data-testid="time-slot"].available')
        .should('have.length.at.least', 5);
    });
  });

  describe('👥 Patient Demographics Testing', () => {
    it('Should handle diverse patient profiles', () => {
      const patientProfiles = [
        {
          type: 'young-adult',
          age: 25,
          preferences: ['evening-appointments', 'online-consultation'],
          specialties: ['Dermatologia', 'Ginecologia']
        },
        {
          type: 'middle-aged',
          age: 45,
          preferences: ['morning-appointments', 'near-workplace'],
          specialties: ['Cardiologia', 'Endocrinologia']
        },
        {
          type: 'elderly',
          age: 70,
          preferences: ['early-morning', 'accessible-location'],
          specialties: ['Geriatria', 'Cardiologia']
        }
      ];
      
      patientProfiles.forEach(({ type, age, preferences, specialties }) => {
        cy.log(`Testing patient profile: ${type} (age ${age})`);
        
        // Set patient context
        cy.setPatientProfile({ type, age, preferences });
        
        cy.visit('/agendamento');
        
        // Verify personalized recommendations
        cy.get('[data-testid="personalized-recommendations"]')
          .should('be.visible');
        
        // Check specialty suggestions
        specialties.forEach(specialty => {
          cy.get('[data-testid="recommended-specialty"]')
            .should('contain', specialty);
        });
        
        // Check time preferences
        cy.selectSpecialty(specialties[0]);
        cy.completeSchedulingSteps(['state', 'city', 'doctor', 'date']);
        
        // Verify preferred time slots are highlighted
        preferences.forEach(preference => {
          if (preference.includes('morning')) {
            cy.get('[data-testid="time-slot-morning"]')
              .should('have.class', 'recommended');
          }
          if (preference.includes('evening')) {
            cy.get('[data-testid="time-slot-evening"]')
              .should('have.class', 'recommended');
          }
        });
      });
    });
  });

  describe('💰 Pricing and Insurance Testing', () => {
    it('Should display realistic pricing information', () => {
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city']);
      
      // Check pricing display on doctor cards
      cy.get('[data-testid="doctor-card"]').each($card => {
        cy.wrap($card).within(() => {
          // Verify price range
          cy.get('[data-testid="consultation-price"]')
            .should('be.visible')
            .and('match', /R\$ \d{2,3},\d{2}/); // Format: R$ 150,00
          
          // Check insurance acceptance
          cy.get('[data-testid="insurance-accepted"]')
            .should('be.visible');
          
          // Verify common insurance plans
          cy.get('[data-testid="insurance-plan"]')
            .should('contain.oneOf', ['Unimed', 'Bradesco', 'Sul América']);
        });
      });
      
      // Test specialty pricing variations
      const specialtyPricing = [
        { specialty: 'Clínica Geral', maxPrice: 200 },
        { specialty: 'Cardiologia', maxPrice: 300 },
        { specialty: 'Neurocirurgia', maxPrice: 800 }
      ];
      
      specialtyPricing.forEach(({ specialty, maxPrice }) => {
        cy.get('[data-testid="reset-search"]').click();
        cy.selectSpecialty(specialty);
        cy.completeSchedulingSteps(['state', 'city']);
        
        cy.get('[data-testid="consultation-price"]')
          .first()
          .should('contain', 'R$')
          .then($price => {
            const price = parseFloat($price.text().replace(/[R$\s.,]/g, ''));
            expect(price).to.be.lessThan(maxPrice);
          });
      });
    });
  });

  describe('🔄 Booking Patterns and Behavior', () => {
    it('Should simulate realistic booking patterns', () => {
      cy.visit('/agendamento');
      
      // Test Monday morning rush
      cy.mockTimeOfWeek('monday', '09:00');
      
      cy.completeSchedulingSteps(['specialty', 'state', 'city', 'doctor']);
      
      // Select Monday
      cy.get('[data-testid="date-monday"]').click();
      cy.clickNext();
      
      // Verify high booking activity
      cy.get('[data-testid="booking-pressure-indicator"]')
        .should('contain', 'Alta demanda');
      
      cy.get('[data-testid="recent-bookings"]')
        .should('contain', 'agendamentos na última hora');
      
      // Test last-minute cancellation availability
      cy.get('[data-testid="last-minute-availability"]')
        .should('be.visible');
      
      // Test Friday afternoon lull
      cy.mockTimeOfWeek('friday', '15:00');
      cy.get('[data-testid="date-friday"]').click();
      
      cy.get('[data-testid="booking-pressure-indicator"]')
        .should('contain', 'Disponibilidade alta');
    });

    it('Should handle seasonal booking variations', () => {
      // Test flu season (winter months)
      cy.mockSeason('winter');
      cy.visit('/agendamento');
      
      cy.selectSpecialty('Clínica Geral');
      cy.completeSchedulingSteps(['state', 'city']);
      
      // Verify increased demand
      cy.get('[data-testid="seasonal-demand"]')
        .should('contain', 'Temporada de gripe');
      
      cy.get('[data-testid="doctor-card"]').should('have.length.at.least', 10);
      
      // Test vacation season (summer)
      cy.mockSeason('summer');
      cy.get('[data-testid="reset-search"]').click();
      
      cy.selectSpecialty('Dermatologia');
      cy.completeSchedulingSteps(['state', 'city']);
      
      cy.get('[data-testid="seasonal-info"]')
        .should('contain', 'Alta temporada');
    });
  });

  describe('📱 Multi-Platform Behavior', () => {
    it('Should handle cross-device appointment management', () => {
      // Start on desktop
      cy.viewport(1280, 720);
      cy.visit('/agendamento');
      
      // Complete partial booking
      cy.completeSchedulingSteps(['specialty', 'state', 'city']);
      
      // Save progress
      cy.get('[data-testid="save-progress"]').click();
      
      // Switch to mobile
      cy.viewport('iphone-x');
      
      // Continue on mobile
      cy.visit('/agendamento');
      
      // Verify progress restoration
      cy.get('[data-testid="continue-booking"]')
        .should('be.visible')
        .click();
      
      // Verify mobile-optimized interface
      cy.get('[data-testid="mobile-doctor-cards"]')
        .should('be.visible');
      
      // Complete booking on mobile
      cy.completeSchedulingSteps(['doctor', 'date', 'time', 'confirmation']);
      
      // Verify booking success
      cy.get('[data-testid="booking-success"]')
        .should('be.visible');
    });
  });
});