/**
 * Base Page Object - Foundation for all page objects
 * Provides common functionality and utilities
 */
class BasePage {
  constructor() {
    this.timeout = 10000;
    this.retryOptions = { limit: 3, delay: 1000 };
  }

  // Navigation utilities
  visit(url = '') {
    cy.visit(url);
    this.waitForPageLoad();
    return this;
  }

  waitForPageLoad() {
    cy.get('body').should('be.visible');
    cy.window().its('document.readyState').should('equal', 'complete');
    return this;
  }

  // Element interaction utilities
  clickElement(selector, options = {}) {
    cy.get(selector, options)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    return this;
  }

  typeText(selector, text, options = {}) {
    cy.get(selector, options)
      .should('be.visible')
      .should('not.be.disabled')
      .clear()
      .type(text);
    return this;
  }

  selectDropdown(selector, value) {
    cy.get(selector)
      .should('be.visible')
      .select(value);
    return this;
  }

  // Validation utilities
  verifyElementExists(selector, options = {}) {
    cy.get(selector, options).should('exist');
    return this;
  }

  verifyElementVisible(selector, options = {}) {
    cy.get(selector, options).should('be.visible');
    return this;
  }

  verifyElementNotVisible(selector, options = {}) {
    cy.get(selector, options).should('not.be.visible');
    return this;
  }

  verifyText(selector, text, options = {}) {
    cy.get(selector, options).should('contain.text', text);
    return this;
  }

  verifyExactText(selector, text, options = {}) {
    cy.get(selector, options).should('have.text', text);
    return this;
  }

  // Wait utilities
  waitForElement(selector, timeout = this.timeout) {
    cy.get(selector, { timeout }).should('exist');
    return this;
  }

  waitForElementToDisappear(selector, timeout = this.timeout) {
    cy.get(selector, { timeout }).should('not.exist');
    return this;
  }

  waitForApiCall(alias, timeout = this.timeout) {
    cy.wait(alias, { timeout });
    return this;
  }

  // Accessibility utilities
  checkAccessibility(context = null, options = {}) {
    cy.injectAxe();
    if (context) {
      cy.checkA11y(context, options);
    } else {
      cy.checkA11y(null, options);
    }
    return this;
  }

  // Performance utilities
  measurePageLoadTime() {
    cy.window().then((win) => {
      const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
      cy.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(5000); // 5 second threshold
    });
    return this;
  }

  // Screenshot utilities
  takeScreenshot(name) {
    cy.screenshot(name);
    return this;
  }

  // Local storage utilities
  clearStorage() {
    cy.clearLocalStorage();
    cy.clearCookies();
    return this;
  }

  setLocalStorage(key, value) {
    cy.window().then((win) => {
      win.localStorage.setItem(key, JSON.stringify(value));
    });
    return this;
  }

  getLocalStorage(key) {
    return cy.window().then((win) => {
      const item = win.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    });
  }

  // API intercept utilities
  interceptApi(method, url, fixture = null, alias = null) {
    const interceptOptions = { method, url };
    if (fixture) {
      interceptOptions.fixture = fixture;
    }
    if (alias) {
      cy.intercept(interceptOptions).as(alias);
    } else {
      cy.intercept(interceptOptions);
    }
    return this;
  }

  // Error handling utilities
  verifyNoConsoleErrors() {
    cy.window().then((win) => {
      const logs = win.console.error.calls?.all() || [];
      expect(logs).to.have.length(0);
    });
    return this;
  }

  // Mobile utilities
  setMobileViewport() {
    cy.viewport(375, 667); // iPhone 6/7/8 size
    return this;
  }

  setTabletViewport() {
    cy.viewport(768, 1024); // iPad size
    return this;
  }

  setDesktopViewport() {
    cy.viewport(1280, 720); // Desktop size
    return this;
  }
}

export default BasePage;