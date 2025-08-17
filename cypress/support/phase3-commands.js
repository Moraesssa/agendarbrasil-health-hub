/**
 * Phase 3 Enhanced Cypress Commands
 * Advanced commands for comprehensive E2E testing
 */

// Enhanced scheduling commands
Cypress.Commands.add('completeSchedulingSteps', (steps) => {
  steps.forEach(step => {
    switch(step) {
      case 'specialty':
        cy.selectSpecialty('Cardiologia');
        cy.clickNext();
        break;
      case 'state':
        cy.selectState('São Paulo');
        cy.clickNext();
        break;
      case 'city':
        cy.selectCity('São Paulo');
        cy.clickNext();
        break;
      case 'doctor':
        cy.get('[data-testid="doctor-card"]').first().click();
        cy.clickNext();
        break;
      case 'date':
        cy.get('[data-testid="available-date"]').first().click();
        cy.clickNext();
        break;
      case 'time':
        cy.get('[data-testid="time-slot"]').first().click();
        cy.clickNext();
        break;
      case 'confirmation':
        cy.get('[data-testid="confirm-appointment-button"]').click();
        break;
    }
  });
});

// Enhanced element interaction commands
Cypress.Commands.add('selectSpecialty', (specialty) => {
  cy.get('[data-testid="specialty-select"]').click();
  cy.get('[data-testid="specialty-option"]')
    .contains(specialty)
    .click();
});

Cypress.Commands.add('selectState', (state) => {
  cy.get('[data-testid="enhanced-state-select"]').click();
  cy.get('[data-testid="state-option"]')
    .contains(state)
    .click();
});

Cypress.Commands.add('selectCity', (city) => {
  cy.get('[data-testid="enhanced-city-select"]').click();
  cy.get('[data-testid="city-option"]')
    .contains(city)
    .click();
});

Cypress.Commands.add('clickNext', () => {
  cy.get('[data-testid="next-button"]', { timeout: 10000 })
    .should('be.enabled')
    .click();
});

// Authentication commands
Cypress.Commands.add('loginAsDoctor', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('mock_auth_user', JSON.stringify({
      id: 'doctor-1',
      email: 'doctor@test.com',
      user_metadata: {
        full_name: 'Dr. João Silva',
        user_type: 'medico'
      }
    }));
  });
});

Cypress.Commands.add('loginAsPatient', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('mock_auth_user', JSON.stringify({
      id: 'patient-1',
      email: 'patient@test.com',
      user_metadata: {
        full_name: 'Maria Santos',
        user_type: 'paciente'
      }
    }));
  });
});

// Data management commands
Cypress.Commands.add('cleanTestData', () => {
  cy.window().then((win) => {
    // Clear all localStorage
    win.localStorage.clear();
    
    // Clear IndexedDB if used
    if (win.indexedDB) {
      const databases = ['appointments', 'favorites', 'searchHistory'];
      databases.forEach(dbName => {
        const deleteReq = win.indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => cy.log(`Cleared database: ${dbName}`);
      });
    }
  });
});

Cypress.Commands.add('loadRealisticMockData', () => {
  cy.window().then((win) => {
    // Load comprehensive mock data
    win.localStorage.setItem('mock_doctors_loaded', 'true');
    win.localStorage.setItem('mock_appointments_loaded', 'true');
    win.localStorage.setItem('mock_specialties_loaded', 'true');
  });
});

// API interception commands
Cypress.Commands.add('interceptAdvancedSchedulingCalls', () => {
  // Core scheduling APIs
  cy.intercept('GET', '**/api/specialties', { fixture: 'specialties.json' }).as('getSpecialties');
  cy.intercept('GET', '**/api/states', { fixture: 'states.json' }).as('getStates');
  cy.intercept('GET', '**/api/cities/**', { fixture: 'cities.json' }).as('getCities');
  cy.intercept('GET', '**/api/doctors/**', { fixture: 'doctors.json' }).as('getDoctors');
  cy.intercept('GET', '**/api/availability/**', { fixture: 'availability.json' }).as('getAvailability');
  
  // Enhanced features APIs
  cy.intercept('POST', '**/api/favorites', { success: true }).as('addFavorite');
  cy.intercept('GET', '**/api/favorites', { fixture: 'favorites.json' }).as('getFavorites');
  cy.intercept('POST', '**/api/comparison', { success: true }).as('addToComparison');
  cy.intercept('POST', '**/api/reserve-slot', { fixture: 'reservation.json' }).as('reserveSlot');
  
  // Payment APIs
  cy.intercept('POST', '**/api/create-payment', { fixture: 'payment-intent.json' }).as('createPayment');
  cy.intercept('GET', '**/api/payment-status/**', { fixture: 'payment-success.json' }).as('getPaymentStatus');
});

Cypress.Commands.add('interceptDoctorManagementCalls', () => {
  // Location management
  cy.intercept('GET', '**/api/doctor/locations', { fixture: 'doctor-locations.json' }).as('getLocations');
  cy.intercept('POST', '**/api/doctor/locations', { success: true }).as('createLocation');
  cy.intercept('PUT', '**/api/doctor/locations/**', { success: true }).as('updateLocation');
  cy.intercept('DELETE', '**/api/doctor/locations/**', { success: true }).as('deleteLocation');
  
  // Schedule management
  cy.intercept('GET', '**/api/doctor/schedule', { fixture: 'doctor-schedule.json' }).as('getSchedule');
  cy.intercept('POST', '**/api/doctor/schedule', { success: true }).as('updateSchedule');
  cy.intercept('POST', '**/api/doctor/blocks', { success: true }).as('createBlock');
  cy.intercept('DELETE', '**/api/doctor/blocks/**', { success: true }).as('deleteBlock');
  
  // Analytics
  cy.intercept('GET', '**/api/doctor/analytics', { fixture: 'doctor-analytics.json' }).as('getAnalytics');
});

Cypress.Commands.add('interceptRealisticAPIs', () => {
  // Geographic data with realistic distribution
  cy.intercept('GET', '**/api/states', (req) => {
    req.reply({
      statusCode: 200,
      body: [
        { id: 'SP', name: 'São Paulo', doctorCount: 1250 },
        { id: 'RJ', name: 'Rio de Janeiro', doctorCount: 800 },
        { id: 'MG', name: 'Minas Gerais', doctorCount: 600 },
        { id: 'RS', name: 'Rio Grande do Sul', doctorCount: 400 },
        { id: 'PR', name: 'Paraná', doctorCount: 350 }
      ]
    });
  }).as('getRealisticStates');
  
  // Specialty distribution
  cy.intercept('GET', '**/api/specialties', (req) => {
    req.reply({
      statusCode: 200,
      body: [
        { name: 'Clínica Geral', availability: 'high', avgPrice: 150 },
        { name: 'Cardiologia', availability: 'medium', avgPrice: 250 },
        { name: 'Dermatologia', availability: 'medium', avgPrice: 200 },
        { name: 'Neurologia', availability: 'low', avgPrice: 350 },
        { name: 'Neurocirurgia', availability: 'very-low', avgPrice: 800 }
      ]
    });
  }).as('getRealisticSpecialties');
  
  // Time-based availability
  cy.intercept('GET', '**/api/availability/**', (req) => {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isMorning = now.getHours() < 12;
    
    const availability = generateRealisticAvailability(isWeekend, isMorning);
    
    req.reply({
      statusCode: 200,
      body: availability
    });
  }).as('getRealisticAvailability');
});

// Utility commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 2000 }).should('not.exist');
  cy.get('[data-testid="main-content"]').should('be.visible');
});

Cypress.Commands.add('waitForElementToBeInteractable', (selector) => {
  cy.get(selector)
    .should('be.visible')
    .should('not.be.disabled')
    .should('not.have.class', 'loading');
});

Cypress.Commands.add('configureBasicSchedule', () => {
  cy.get('[data-testid="schedule-day-monday"]').click();
  cy.get('[data-testid="start-time-input"]').type('08:00');
  cy.get('[data-testid="end-time-input"]').type('18:00');
  cy.get('[data-testid="consultation-duration"]').select('30');
  cy.get('[data-testid="save-schedule-button"]').click();
});

// Context setting commands
Cypress.Commands.add('setPatientProfile', (profile) => {
  cy.window().then((win) => {
    win.localStorage.setItem('patient_profile', JSON.stringify(profile));
  });
});

Cypress.Commands.add('mockTimeOfWeek', (day, time) => {
  cy.clock(new Date(`2024-01-01T${time}:00.000Z`));
});

Cypress.Commands.add('mockSeason', (season) => {
  const seasonDates = {
    'winter': new Date('2024-07-15'),
    'summer': new Date('2024-01-15'),
    'spring': new Date('2024-10-15'),
    'autumn': new Date('2024-04-15')
  };
  
  cy.clock(seasonDates[season]);
});

// Accessibility testing commands
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Performance testing commands
Cypress.Commands.add('measurePerformance', (actionCallback) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    
    actionCallback();
    
    cy.then(() => {
      const endTime = win.performance.now();
      const duration = endTime - startTime;
      
      cy.log(`Performance measurement: ${duration}ms`);
      expect(duration).to.be.lessThan(2000); // Should complete within 2s
    });
  });
});

// Helper functions
function generateRealisticAvailability(isWeekend, isMorning) {
  const baseSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];
  
  if (isWeekend) {
    // Reduced weekend hours
    return baseSlots.slice(2, 8).map(time => ({
      time,
      available: Math.random() > 0.3 // 70% availability on weekends
    }));
  }
  
  // Weekday availability with lunch break and realistic booking patterns
  return baseSlots.map(time => {
    let availabilityRate = 0.6; // Base 60% availability
    
    // Monday morning rush
    if (isMorning && Math.random() > 0.8) {
      availabilityRate = 0.3; // High demand
    }
    
    // Friday afternoon more available
    if (!isMorning && new Date().getDay() === 5) {
      availabilityRate = 0.8;
    }
    
    return {
      time,
      available: Math.random() > availabilityRate
    };
  });
}