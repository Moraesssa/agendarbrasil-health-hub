/**
 * Enhanced Scheduling Flow E2E Tests - Phase 3
 * Comprehensive testing of the complete patient journey with advanced features
 */

describe('Enhanced Scheduling Flow - Complete Patient Journey', () => {
  beforeEach(() => {
    // Reset state and clear data
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.viewport(1280, 720);
    
    // Mock advanced scheduling APIs
    cy.interceptAdvancedSchedulingCalls();
    
    // Start with a clean session
    cy.cleanTestData();
  });

  describe('🎯 Core Flow: New Patient Complete Journey', () => {
    it('Should complete the entire scheduling process with enhanced components', () => {
      // 1. Navigate to scheduling page
      cy.visit('/agendamento');
      cy.waitForPageLoad();
      
      // 2. Step 1: Enhanced Specialty Selection with Smart Recommendations
      cy.log('📋 Step 1: Specialty Selection with Smart Recommendations');
      cy.get('[data-testid="specialty-select"]').should('be.visible');
      
      // Select specialty
      cy.selectSpecialty('Cardiologia');
      
      // Verify smart recommendations appear
      cy.get('[data-testid="smart-recommendations"]', { timeout: 10000 })
        .should('be.visible');
      
      // Verify progress indicator updates
      cy.get('[data-testid="progress-indicator"]')
        .should('contain', '1/7');
      
      cy.clickNext();
      
      // 3. Step 2: Enhanced State Selection
      cy.log('🗺️ Step 2: Enhanced State Selection');
      cy.get('[data-testid="enhanced-state-select"]').should('be.visible');
      
      // Test state search functionality
      cy.get('[data-testid="state-search-input"]')
        .type('são p');
      
      // Select state
      cy.get('[data-testid="state-option"]')
        .contains('São Paulo')
        .click();
      
      // Verify state statistics
      cy.get('[data-testid="state-stats"]')
        .should('contain', 'médicos');
      
      cy.clickNext();
      
      // 4. Step 3: Enhanced City Selection (Cascading)
      cy.log('🏙️ Step 3: Enhanced City Selection');
      cy.get('[data-testid="enhanced-city-select"]').should('be.visible');
      
      // Verify cascading load
      cy.get('[data-testid="city-loading"]').should('exist');
      cy.get('[data-testid="city-loading"]').should('not.exist');
      
      // Test city search and filtering
      cy.get('[data-testid="city-search-input"]')
        .type('são paulo');
      
      cy.get('[data-testid="city-option"]')
        .contains('São Paulo')
        .click();
      
      // Verify city ratings
      cy.get('[data-testid="city-ratings"]')
        .should('be.visible');
      
      cy.clickNext();
      
      // 5. Step 4: Enhanced Doctor Selection with Advanced Features
      cy.log('👨‍⚕️ Step 4: Enhanced Doctor Selection');
      cy.get('[data-testid="enhanced-doctor-select"]').should('be.visible');
      
      // Test doctor filtering
      cy.get('[data-testid="doctor-filter-rating"]')
        .select('4+');
      
      cy.get('[data-testid="doctor-filter-availability"]')
        .select('today');
      
      // Test doctor favorites
      cy.get('[data-testid="doctor-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="favorite-button"]').click();
          cy.get('[data-testid="favorite-button"]')
            .should('have.class', 'favorited');
        });
      
      // Verify doctor comparison feature
      cy.get('[data-testid="compare-doctors-button"]')
        .should('be.visible');
      
      // Select doctor
      cy.get('[data-testid="doctor-card"]')
        .first()
        .click();
      
      cy.clickNext();
      
      // 6. Step 5: Date Selection
      cy.log('📅 Step 5: Date Selection');
      cy.get('[data-testid="date-select"]').should('be.visible');
      
      // Select earliest available date
      cy.get('[data-testid="available-date"]')
        .first()
        .click();
      
      cy.clickNext();
      
      // 7. Step 6: Enhanced Time Slot Grid
      cy.log('⏰ Step 6: Enhanced Time Slot Selection');
      cy.get('[data-testid="enhanced-time-slot-grid"]').should('be.visible');
      
      // Verify location information
      cy.get('[data-testid="location-info"]')
        .should('be.visible')
        .and('contain', 'Endereço');
      
      // Test time slot reservation
      cy.get('[data-testid="time-slot"]')
        .first()
        .click();
      
      // Verify temporary reservation
      cy.get('[data-testid="reservation-timer"]')
        .should('be.visible')
        .and('contain', '15:00');
      
      cy.clickNext();
      
      // 8. Step 7: Final Confirmation with Enhanced Summary
      cy.log('✅ Step 7: Enhanced Appointment Summary');
      cy.get('[data-testid="appointment-summary"]').should('be.visible');
      
      // Verify all selected data
      cy.get('[data-testid="summary-specialty"]')
        .should('contain', 'Cardiologia');
      
      cy.get('[data-testid="summary-doctor"]')
        .should('not.be.empty');
      
      cy.get('[data-testid="summary-location"]')
        .should('not.be.empty');
      
      cy.get('[data-testid="summary-datetime"]')
        .should('not.be.empty');
      
      // Test family member selection
      cy.get('[data-testid="family-member-select"]')
        .select('self');
      
      // Final confirmation
      cy.get('[data-testid="confirm-appointment-button"]')
        .should('be.enabled')
        .click();
      
      // Verify payment redirect
      cy.url().should('include', 'stripe');
      
      // Verify success state
      cy.get('[data-testid="payment-success"]', { timeout: 30000 })
        .should('be.visible');
    });
  });

  describe('🔄 Advanced Features Testing', () => {
    it('Should test favorites and search history functionality', () => {
      cy.visit('/agendamento');
      
      // Complete basic flow to reach doctor selection
      cy.completeSchedulingSteps(['specialty', 'state', 'city']);
      
      // Test favorites functionality
      cy.get('[data-testid="doctor-card"]').each(($card, index) => {
        if (index < 3) { // Add first 3 to favorites
          cy.wrap($card)
            .find('[data-testid="favorite-button"]')
            .click();
        }
      });
      
      // Test favorites filter
      cy.get('[data-testid="show-favorites-only"]').click();
      
      cy.get('[data-testid="doctor-card"]')
        .should('have.length', 3);
      
      // Test search history
      cy.get('[data-testid="search-history"]')
        .should('be.visible')
        .and('contain', 'Cardiologia');
    });

    it('Should test doctor comparison feature', () => {
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city']);
      
      // Add doctors to comparison
      cy.get('[data-testid="doctor-card"]').each(($card, index) => {
        if (index < 3) {
          cy.wrap($card)
            .find('[data-testid="add-to-comparison"]')
            .click();
        }
      });
      
      // Open comparison modal
      cy.get('[data-testid="view-comparison"]').click();
      
      // Verify comparison table
      cy.get('[data-testid="comparison-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="comparison-table"] tbody tr')
        .should('have.length', 3);
      
      // Test comparison criteria
      cy.get('[data-testid="comparison-criteria"]')
        .should('contain', 'Avaliação')
        .and('contain', 'Preço')
        .and('contain', 'Disponibilidade');
    });

    it('Should test smart recommendations system', () => {
      cy.visit('/agendamento');
      
      // Test specialty recommendations
      cy.get('[data-testid="specialty-select"]').click();
      
      cy.get('[data-testid="smart-recommendations"]')
        .should('be.visible');
      
      cy.get('[data-testid="recommendation-item"]')
        .should('have.length.at.least', 3);
      
      // Test recommendation click
      cy.get('[data-testid="recommendation-item"]')
        .first()
        .click();
      
      // Verify specialty is selected
      cy.get('[data-testid="selected-specialty"]')
        .should('not.be.empty');
    });
  });

  describe('📱 Responsive Design Testing', () => {
    const viewports = [
      { device: 'iphone-x', width: 375, height: 812 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'macbook-15', width: 1440, height: 900 }
    ];

    viewports.forEach(({ device, width, height }) => {
      it(`Should work correctly on ${device}`, () => {
        cy.viewport(width, height);
        cy.visit('/agendamento');
        
        // Test basic functionality on each viewport
        cy.get('[data-testid="specialty-select"]').should('be.visible');
        cy.selectSpecialty('Cardiologia');
        
        // Test mobile-specific elements
        if (width < 768) {
          cy.get('[data-testid="mobile-menu"]').should('be.visible');
        }
        
        // Verify responsive layout
        cy.get('[data-testid="progress-indicator"]')
          .should('be.visible');
        
        cy.get('[data-testid="step-content"]')
          .should('be.visible')
          .and('have.css', 'display', 'block');
      });
    });
  });

  describe('⚠️ Error Handling & Edge Cases', () => {
    it('Should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkFailure');
      
      cy.visit('/agendamento');
      
      // Verify error state
      cy.get('[data-testid="network-error"]', { timeout: 10000 })
        .should('be.visible');
      
      // Test retry functionality
      cy.get('[data-testid="retry-button"]').click();
      
      // Restore network and verify recovery
      cy.intercept('GET', '**/api/**').as('networkRestore');
      cy.wait('@networkRestore');
      
      cy.get('[data-testid="specialty-select"]')
        .should('be.visible');
    });

    it('Should handle appointment slot conflicts', () => {
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city', 'doctor', 'date']);
      
      // Select a time slot
      cy.get('[data-testid="time-slot"]').first().click();
      
      // Simulate slot becoming unavailable
      cy.intercept('POST', '**/reserve-slot', {
        statusCode: 409,
        body: { error: 'Slot no longer available' }
      }).as('slotConflict');
      
      cy.clickNext();
      
      // Verify conflict handling
      cy.get('[data-testid="slot-conflict-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="alternative-slots"]')
        .should('be.visible');
    });

    it('Should handle form validation errors', () => {
      cy.visit('/agendamento');
      
      // Try to proceed without selecting specialty
      cy.clickNext();
      
      // Verify validation error
      cy.get('[data-testid="specialty-error"]')
        .should('be.visible')
        .and('contain', 'obrigatório');
      
      // Verify error styling
      cy.get('[data-testid="specialty-select"]')
        .should('have.class', 'error');
    });
  });

  describe('♿ Accessibility Testing', () => {
    it('Should be fully accessible via keyboard navigation', () => {
      cy.visit('/agendamento');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'specialty-select');
      
      cy.focused().tab();
      cy.focused().should('be.visible');
      
      // Test ARIA labels
      cy.get('[data-testid="progress-indicator"]')
        .should('have.attr', 'aria-label');
      
      cy.get('[data-testid="step-content"]')
        .should('have.attr', 'role', 'region');
      
      // Test screen reader announcements
      cy.selectSpecialty('Cardiologia');
      
      cy.get('[data-testid="sr-announcement"]')
        .should('contain', 'Cardiologia selecionada');
    });

    it('Should meet WCAG 2.1 AA standards', () => {
      cy.visit('/agendamento');
      cy.injectAxe();
      
      // Check for accessibility violations
      cy.checkA11y('[data-testid="main-content"]', {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true }
        }
      });
    });
  });

  describe('⚡ Performance Testing', () => {
    it('Should load quickly and meet Core Web Vitals', () => {
      cy.visit('/agendamento', {
        onBeforeLoad: (win) => {
          // Start performance measurement
          win.performance.mark('navigation-start');
        }
      });
      
      // Measure Largest Contentful Paint (LCP)
      cy.window().then((win) => {
        cy.waitUntil(() => 
          win.performance.getEntriesByType('paint')
            .find(entry => entry.name === 'largest-contentful-paint')
        ).then((lcp) => {
          expect(lcp.startTime).to.be.lessThan(2500); // LCP < 2.5s
        });
      });
      
      // Measure First Input Delay (FID) simulation
      cy.get('[data-testid="specialty-select"]').click();
      
      cy.window().then((win) => {
        const clickTime = win.performance.now();
        cy.get('[data-testid="specialty-option"]').first().click().then(() => {
          const responseTime = win.performance.now() - clickTime;
          expect(responseTime).to.be.lessThan(100); // FID < 100ms
        });
      });
    });

    it('Should handle large datasets efficiently', () => {
      // Simulate large doctor list
      cy.intercept('GET', '**/doctors**', { fixture: 'large-doctor-list.json' }).as('largeDoctorList');
      
      cy.visit('/agendamento');
      cy.completeSchedulingSteps(['specialty', 'state', 'city']);
      
      // Measure rendering time
      const startTime = performance.now();
      
      cy.wait('@largeDoctorList');
      
      cy.get('[data-testid="doctor-card"]', { timeout: 5000 })
        .should('have.length.at.least', 100)
        .then(() => {
          const renderTime = performance.now() - startTime;
          expect(renderTime).to.be.lessThan(1000); // Render < 1s
        });
      
      // Test virtual scrolling
      cy.get('[data-testid="virtual-scroll-container"]')
        .should('be.visible');
    });
  });

  describe('🔄 State Management & Navigation', () => {
    it('Should preserve state during navigation', () => {
      cy.visit('/agendamento');
      
      // Complete several steps
      cy.selectSpecialty('Cardiologia');
      cy.clickNext();
      
      cy.selectState('São Paulo');
      cy.clickNext();
      
      cy.selectCity('São Paulo');
      cy.clickNext();
      
      // Navigate back
      cy.get('[data-testid="back-button"]').click();
      
      // Verify state preservation
      cy.get('[data-testid="selected-city"]')
        .should('contain', 'São Paulo');
      
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="selected-state"]')
        .should('contain', 'São Paulo');
      
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="selected-specialty"]')
        .should('contain', 'Cardiologia');
    });

    it('Should handle browser refresh correctly', () => {
      cy.visit('/agendamento');
      
      // Complete first few steps
      cy.selectSpecialty('Cardiologia');
      cy.clickNext();
      cy.selectState('São Paulo');
      cy.clickNext();
      
      // Refresh page
      cy.reload();
      
      // Verify state recovery
      cy.get('[data-testid="recovery-modal"]')
        .should('be.visible');
      
      cy.get('[data-testid="restore-progress"]').click();
      
      // Verify restoration
      cy.get('[data-testid="current-step"]')
        .should('contain', '3');
      
      cy.get('[data-testid="selected-specialty"]')
        .should('contain', 'Cardiologia');
    });
  });
});