/**
 * Doctor Management E2E Tests - Phase 3
 * Testing the enhanced doctor management modules
 */

describe('Doctor Management - Enhanced Features', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.viewport(1280, 720);
    
    // Login as doctor
    cy.loginAsDoctor();
    
    // Mock doctor management APIs
    cy.interceptDoctorManagementCalls();
  });

  describe('🏥 Location Management Module', () => {
    it('Should allow doctors to manage their locations', () => {
      cy.visit('/dashboard-medico');
      
      // Navigate to location management
      cy.get('[data-testid="location-management-card"]')
        .should('be.visible')
        .click();
      
      // Test adding new location
      cy.get('[data-testid="add-location-button"]').click();
      
      cy.get('[data-testid="location-modal"]')
        .should('be.visible');
      
      // Fill location form
      cy.get('[data-testid="location-name-input"]')
        .type('Clínica São Paulo Centro');
      
      cy.get('[data-testid="location-address-input"]')
        .type('Rua da Consolação, 123 - Centro, São Paulo - SP');
      
      cy.get('[data-testid="location-phone-input"]')
        .type('(11) 3333-4444');
      
      // Test geolocation
      cy.get('[data-testid="auto-geocode-button"]').click();
      
      cy.get('[data-testid="coordinates-loading"]')
        .should('be.visible');
      
      cy.get('[data-testid="coordinates-display"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Latitude')
        .and('contain', 'Longitude');
      
      // Save location
      cy.get('[data-testid="save-location-button"]').click();
      
      // Verify location was added
      cy.get('[data-testid="location-card"]')
        .should('contain', 'Clínica São Paulo Centro');
      
      // Test location status toggle
      cy.get('[data-testid="location-status-toggle"]')
        .first()
        .click();
      
      cy.get('[data-testid="status-confirmation-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="confirm-status-change"]').click();
      
      // Verify status change
      cy.get('[data-testid="location-status-badge"]')
        .first()
        .should('contain', 'Inativo');
    });

    it('Should handle location editing and deletion', () => {
      cy.visit('/dashboard-medico');
      
      // Edit existing location
      cy.get('[data-testid="location-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="edit-location-button"]').click();
        });
      
      // Update location details
      cy.get('[data-testid="location-name-input"]')
        .clear()
        .type('Clínica São Paulo Centro - Atualizada');
      
      cy.get('[data-testid="save-location-button"]').click();
      
      // Verify update
      cy.get('[data-testid="location-card"]')
        .first()
        .should('contain', 'Atualizada');
      
      // Test location deletion
      cy.get('[data-testid="location-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="delete-location-button"]').click();
        });
      
      cy.get('[data-testid="delete-confirmation-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Verify deletion
      cy.get('[data-testid="location-card"]')
        .should('not.contain', 'Atualizada');
    });

    it('Should validate location data and handle errors', () => {
      cy.visit('/dashboard-medico');
      
      cy.get('[data-testid="add-location-button"]').click();
      
      // Try to save without required fields
      cy.get('[data-testid="save-location-button"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="location-name-error"]')
        .should('be.visible')
        .and('contain', 'obrigatório');
      
      cy.get('[data-testid="location-address-error"]')
        .should('be.visible');
      
      // Test invalid phone format
      cy.get('[data-testid="location-phone-input"]')
        .type('123');
      
      cy.get('[data-testid="location-phone-error"]')
        .should('be.visible')
        .and('contain', 'formato inválido');
      
      // Test geocoding error handling
      cy.intercept('GET', '**/geocode/**', {
        statusCode: 500,
        body: { error: 'Geocoding service unavailable' }
      }).as('geocodeError');
      
      cy.get('[data-testid="location-address-input"]')
        .type('Endereço inválido');
      
      cy.get('[data-testid="auto-geocode-button"]').click();
      
      cy.get('[data-testid="geocoding-error"]')
        .should('be.visible')
        .and('contain', 'Não foi possível determinar');
    });
  });

  describe('📅 Schedule Management Module', () => {
    it('Should allow doctors to configure their schedules', () => {
      cy.visit('/dashboard-medico');
      
      // Navigate to schedule management
      cy.get('[data-testid="schedule-management-card"]')
        .should('be.visible')
        .click();
      
      // Test weekly schedule configuration
      cy.get('[data-testid="schedule-day-monday"]').click();
      
      // Set working hours
      cy.get('[data-testid="start-time-input"]')
        .type('08:00');
      
      cy.get('[data-testid="end-time-input"]')
        .type('18:00');
      
      // Set lunch break
      cy.get('[data-testid="lunch-break-checkbox"]').check();
      
      cy.get('[data-testid="lunch-start-input"]')
        .type('12:00');
      
      cy.get('[data-testid="lunch-end-input"]')
        .type('13:00');
      
      // Set consultation duration
      cy.get('[data-testid="consultation-duration"]')
        .select('30');
      
      // Save schedule
      cy.get('[data-testid="save-schedule-button"]').click();
      
      // Verify schedule was saved
      cy.get('[data-testid="schedule-success-message"]')
        .should('be.visible');
      
      // Test schedule preview
      cy.get('[data-testid="schedule-preview"]')
        .should('be.visible')
        .and('contain', '08:00')
        .and('contain', '18:00');
    });

    it('Should handle temporary schedule blocks', () => {
      cy.visit('/dashboard-medico');
      
      // Add temporary block
      cy.get('[data-testid="add-temp-block-button"]').click();
      
      cy.get('[data-testid="temp-block-modal"]')
        .should('be.visible');
      
      // Set block details
      cy.get('[data-testid="block-start-date"]')
        .type('2024-12-25');
      
      cy.get('[data-testid="block-end-date"]')
        .type('2024-12-31');
      
      cy.get('[data-testid="block-reason"]')
        .select('vacation');
      
      cy.get('[data-testid="block-description"]')
        .type('Férias de final de ano');
      
      cy.get('[data-testid="save-block-button"]').click();
      
      // Verify block was created
      cy.get('[data-testid="schedule-block"]')
        .should('be.visible')
        .and('contain', 'Férias');
      
      // Test block deletion
      cy.get('[data-testid="delete-block-button"]')
        .first()
        .click();
      
      cy.get('[data-testid="confirm-delete-block"]').click();
      
      // Verify block was removed
      cy.get('[data-testid="schedule-block"]')
        .should('not.contain', 'Férias');
    });

    it('Should generate and preview time slots', () => {
      cy.visit('/dashboard-medico');
      
      // Configure schedule
      cy.configureBasicSchedule();
      
      // Generate time slots
      cy.get('[data-testid="generate-slots-button"]').click();
      
      // Verify slots generation
      cy.get('[data-testid="slots-generation-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="generation-progress"]')
        .should('be.visible');
      
      cy.get('[data-testid="generation-complete"]', { timeout: 10000 })
        .should('be.visible');
      
      // Preview generated slots
      cy.get('[data-testid="preview-slots"]').click();
      
      cy.get('[data-testid="slots-calendar"]')
        .should('be.visible');
      
      // Verify slot details
      cy.get('[data-testid="time-slot"]')
        .should('have.length.at.least', 10);
      
      cy.get('[data-testid="time-slot"]')
        .first()
        .should('contain', '08:00');
      
      // Test slot editing
      cy.get('[data-testid="time-slot"]')
        .first()
        .click();
      
      cy.get('[data-testid="slot-edit-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="slot-available-toggle"]').click();
      
      cy.get('[data-testid="save-slot-changes"]').click();
      
      // Verify slot was updated
      cy.get('[data-testid="time-slot"]')
        .first()
        .should('have.class', 'unavailable');
    });
  });

  describe('📊 Analytics and Insights', () => {
    it('Should display schedule analytics', () => {
      cy.visit('/dashboard-medico');
      
      // Check analytics cards
      cy.get('[data-testid="schedule-analytics"]')
        .should('be.visible');
      
      cy.get('[data-testid="utilization-rate"]')
        .should('be.visible')
        .and('contain', '%');
      
      cy.get('[data-testid="popular-times"]')
        .should('be.visible');
      
      cy.get('[data-testid="booking-trends"]')
        .should('be.visible');
      
      // Test analytics filters
      cy.get('[data-testid="analytics-period"]')
        .select('last-month');
      
      cy.get('[data-testid="analytics-loading"]')
        .should('be.visible');
      
      cy.get('[data-testid="analytics-loading"]')
        .should('not.exist');
      
      // Verify updated data
      cy.get('[data-testid="utilization-rate"]')
        .should('not.contain', 'Carregando');
    });

    it('Should export schedule data', () => {
      cy.visit('/dashboard-medico');
      
      // Test CSV export
      cy.get('[data-testid="export-schedule"]').click();
      
      cy.get('[data-testid="export-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="export-format"]')
        .select('csv');
      
      cy.get('[data-testid="export-date-range"]')
        .type('2024-01-01');
      
      cy.get('[data-testid="export-download"]').click();
      
      // Verify download started
      cy.get('[data-testid="export-progress"]')
        .should('be.visible');
      
      cy.get('[data-testid="export-complete"]', { timeout: 10000 })
        .should('be.visible');
    });
  });

  describe('🔔 Notifications and Alerts', () => {
    it('Should handle appointment notifications', () => {
      cy.visit('/dashboard-medico');
      
      // Check notifications panel
      cy.get('[data-testid="notifications-panel"]')
        .should('be.visible');
      
      // Verify notification types
      cy.get('[data-testid="notification-item"]')
        .should('have.length.at.least', 1);
      
      cy.get('[data-testid="notification-appointment"]')
        .should('be.visible');
      
      // Test notification actions
      cy.get('[data-testid="notification-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="mark-read"]').click();
        });
      
      cy.get('[data-testid="notification-item"]')
        .first()
        .should('have.class', 'read');
      
      // Test notification settings
      cy.get('[data-testid="notification-settings"]').click();
      
      cy.get('[data-testid="settings-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="sms-notifications"]').check();
      
      cy.get('[data-testid="save-settings"]').click();
      
      // Verify settings were saved
      cy.get('[data-testid="settings-success"]')
        .should('be.visible');
    });
  });
});