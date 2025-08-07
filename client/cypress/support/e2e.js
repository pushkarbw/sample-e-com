// Import commands.js using ES2015 syntax
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Import code coverage support
import '@cypress/code-coverage/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on unhandled promise rejections
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Viewport presets
Cypress.Commands.add('setViewport', (device) => {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    largeDesktop: { width: 1920, height: 1080 }
  };
  
  const viewport = viewports[device] || viewports.desktop;
  cy.viewport(viewport.width, viewport.height);
});

// Enhanced waiting commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.window().its('document.readyState').should('equal', 'complete');
});

// Performance monitoring
beforeEach(() => {
  // Clear performance marks
  cy.window().then((win) => {
    win.performance.clearMarks();
    win.performance.clearMeasures();
  });
});

afterEach(() => {
  // Log performance metrics
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('navigation')[0];
    if (perfData) {
      cy.task('log', `Page load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
    }
  });
});