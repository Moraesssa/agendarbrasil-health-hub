/**
 * Automated UX Testing Script for Agendamento Page
 * This script tests the implemented UX improvements
 */

const testResults = {
  passed: 0,
  failed: 0,
  issues: []
};

// Test utilities
function logTest(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - ${details}`);
    testResults.failed++;
    testResults.issues.push({ test: testName, details });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// DOM Testing Functions
function testNavigationHeader() {
  console.log('\n🧪 Testing Navigation Header...');
  
  // Test if NavigationHeader exists
  const header = document.querySelector('header[role="banner"]');
  logTest('Navigation header exists', !!header);
  
  if (header) {
    // Test home button
    const homeButton = header.querySelector('button[aria-label*="Voltar ao início"]');
    logTest('Home button exists', !!homeButton);
    
    // Test back button visibility logic
    const backButton = header.querySelector('button[aria-label*="Voltar para a etapa"]');
    const currentStepText = header.querySelector('[role="status"]');
    
    if (currentStepText) {
      const stepMatch = currentStepText.textContent.match(/(\d+)\/\d+/);
      const currentStep = stepMatch ? parseInt(stepMatch[1]) : 1;
      
      if (currentStep === 1) {
        logTest('Back button hidden on step 1', !backButton || backButton.style.display === 'none');
      } else {
        logTest('Back button visible after step 1', !!backButton);
      }
    }
    
    // Test unsaved changes indicator
    const unsavedIndicator = header.querySelector('#unsaved-changes-warning');
    logTest('Unsaved changes indicator exists', !!unsavedIndicator);
  }
}

function testProgressIndicator() {
  console.log('\n🧪 Testing Progress Indicator...');
  
  const progressContainer = document.querySelector('[role="navigation"][aria-label*="Progresso"]');
  logTest('Progress indicator exists', !!progressContainer);
  
  if (progressContainer) {
    // Test desktop version
    const desktopProgress = progressContainer.querySelector('.hidden.md\\:block');
    logTest('Desktop progress indicator exists', !!desktopProgress);
    
    // Test mobile version
    const mobileProgress = progressContainer.querySelector('.md\\:hidden');
    logTest('Mobile progress indicator exists', !!mobileProgress);
    
    // Test step states
    const stepButtons = progressContainer.querySelectorAll('button[aria-label*="Etapa"]');
    logTest('Step buttons exist', stepButtons.length > 0);
    
    // Test accessibility
    const progressBar = progressContainer.querySelector('[role="progressbar"]');
    logTest('Progress bar has proper ARIA attributes', 
      !!progressBar && 
      progressBar.hasAttribute('aria-valuenow') && 
      progressBar.hasAttribute('aria-valuemin') && 
      progressBar.hasAttribute('aria-valuemax')
    );
  }
}

function testFamilyMemberSelection() {
  console.log('\n🧪 Testing Family Member Selection...');
  
  // Look for the family selection component
  const familyCard = document.querySelector('.family-selection-highlight');
  logTest('Family selection card has highlight class', !!familyCard);
  
  if (familyCard) {
    // Test visual prominence
    const hasGreenBorder = familyCard.classList.contains('border-green-500');
    const hasGradientBg = familyCard.classList.contains('from-green-50');
    logTest('Family selection has green border', hasGreenBorder);
    logTest('Family selection has gradient background', hasGradientBg);
    
    // Test header section
    const header = familyCard.querySelector('h3');
    logTest('Family selection has prominent header', !!header && header.textContent.includes('Agendar para'));
    
    // Test icon presence
    const icon = familyCard.querySelector('[data-lucide="users"]');
    logTest('Family selection has users icon', !!icon);
    
    // Test select component
    const selectTrigger = familyCard.querySelector('[role="combobox"]');
    logTest('Family selection has select component', !!selectTrigger);
    
    // Test accessibility
    const region = familyCard.closest('[role="region"]');
    logTest('Family selection is in proper region', !!region);
  }
}

function testButtonStates() {
  console.log('\n🧪 Testing Button States...');
  
  const buttons = document.querySelectorAll('button');
  let hasHoverEffects = false;
  let hasDisabledStates = false;
  let hasLoadingStates = false;
  
  buttons.forEach(button => {
    // Check for hover effect classes
    if (button.classList.contains('btn-enhanced-hover') || 
        button.classList.contains('hover:shadow-md') ||
        button.classList.contains('hover:scale-105')) {
      hasHoverEffects = true;
    }
    
    // Check for disabled states
    if (button.disabled || button.classList.contains('disabled:opacity-50')) {
      hasDisabledStates = true;
    }
    
    // Check for loading states
    if (button.querySelector('.animate-spin') || button.textContent.includes('Carregando')) {
      hasLoadingStates = true;
    }
  });
  
  logTest('Buttons have hover effects', hasHoverEffects);
  logTest('Buttons have disabled states', hasDisabledStates);
  logTest('Loading states implemented', hasLoadingStates);
}

function testResponsiveDesign() {
  console.log('\n🧪 Testing Responsive Design...');
  
  // Test responsive classes
  const hasResponsiveClasses = document.querySelector('.sm\\:px-4, .md\\:block, .lg\\:text-xl');
  logTest('Responsive classes present', !!hasResponsiveClasses);
  
  // Test mobile-specific elements
  const mobileElements = document.querySelectorAll('.md\\:hidden');
  logTest('Mobile-specific elements exist', mobileElements.length > 0);
  
  // Test desktop-specific elements
  const desktopElements = document.querySelectorAll('.hidden.md\\:block');
  logTest('Desktop-specific elements exist', desktopElements.length > 0);
  
  // Test touch-friendly sizing
  const touchButtons = document.querySelectorAll('.touch-manipulation');
  logTest('Touch-friendly buttons exist', touchButtons.length > 0);
}

function testAccessibility() {
  console.log('\n🧪 Testing Accessibility...');
  
  // Test ARIA labels
  const ariaLabels = document.querySelectorAll('[aria-label]');
  logTest('ARIA labels present', ariaLabels.length > 0);
  
  // Test roles
  const roles = document.querySelectorAll('[role]');
  logTest('ARIA roles present', roles.length > 0);
  
  // Test live regions
  const liveRegions = document.querySelectorAll('[aria-live]');
  logTest('Live regions present', liveRegions.length > 0);
  
  // Test focus management
  const focusableElements = document.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])');
  logTest('Focusable elements exist', focusableElements.length > 0);
  
  // Test skip links
  const skipLink = document.querySelector('.skip-link');
  logTest('Skip link exists', !!skipLink);
  
  // Test heading structure
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  logTest('Proper heading structure', headings.length > 0);
}

function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test error display components
  const errorElements = document.querySelectorAll('[role="alert"], .text-red-600, .border-red-300');
  logTest('Error display elements exist', errorElements.length > 0);
  
  // Test validation components
  const validationElements = document.querySelectorAll('[aria-invalid], [aria-describedby*="error"]');
  logTest('Validation elements exist', validationElements.length > 0);
}

function testLoadingStates() {
  console.log('\n🧪 Testing Loading States...');
  
  // Test skeleton loaders
  const skeletons = document.querySelectorAll('.animate-pulse');
  logTest('Skeleton loaders implemented', skeletons.length > 0);
  
  // Test loading spinners
  const spinners = document.querySelectorAll('.animate-spin');
  logTest('Loading spinners implemented', spinners.length > 0);
  
  // Test loading text
  const loadingText = document.querySelector('*:contains("Carregando"), *:contains("Processando")');
  logTest('Loading text present', !!loadingText);
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting UX Improvements Testing...\n');
  
  // Wait for page to load
  await sleep(1000);
  
  // Run all test suites
  testNavigationHeader();
  testProgressIndicator();
  testFamilyMemberSelection();
  testButtonStates();
  testResponsiveDesign();
  testAccessibility();
  testErrorHandling();
  testLoadingStates();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}: ${issue.details}`);
    });
  }
  
  return testResults;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runUXTests = runAllTests;
  console.log('UX Testing script loaded. Run window.runUXTests() to start testing.');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}