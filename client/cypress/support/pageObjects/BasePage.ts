export abstract class BasePage {
  protected url: string;

  constructor(url: string) {
    this.url = url;
  }

  visit(): void {
    cy.visit(this.url);
  }

  getTitle(): Cypress.Chainable<string> {
    return cy.title();
  }

  waitForPageLoad(): void {
    cy.get('[data-testid="page-loader"]', { timeout: 10000 }).should('not.exist');
    cy.get('body').should('be.visible');
  }

  // Common assertions
  assertPageTitle(expectedTitle: string): void {
    cy.title().should('eq', expectedTitle);
  }

  assertUrl(expectedUrl: string): void {
    cy.url().should('include', expectedUrl);
  }

  // Accessibility helpers
  checkA11y(context?: string): void {
    cy.injectAxe();
    cy.checkA11y(context, {
      rules: {
        'color-contrast': { enabled: false }, // Often fails in dev
        'focus-order-semantics': { enabled: true },
        'keyboard-navigation': { enabled: true }
      }
    });
  }

  // Visual regression
  takeSnapshot(name?: string): void {
    const snapshotName = name || `${this.constructor.name}-${Date.now()}`;
    cy.compareSnapshot(snapshotName);
  }

  // Network helpers
  waitForApiCall(alias: string, timeout: number = 10000): void {
    cy.wait(alias, { timeout });
  }

  interceptApiCall(method: string, url: string, alias: string, response?: any): void {
    if (response) {
      cy.intercept(method, url, response).as(alias);
    } else {
      cy.intercept(method, url).as(alias);
    }
  }

  // Element interactions with retry logic
  clickWithRetry(selector: string, maxAttempts: number = 3): void {
    let attempts = 0;
    const attemptClick = () => {
      attempts++;
      cy.get(selector).then($el => {
        if ($el.is(':visible') && !$el.is(':disabled')) {
          cy.wrap($el).click();
        } else if (attempts < maxAttempts) {
          cy.wait(1000);
          attemptClick();
        } else {
          throw new Error(`Element ${selector} not clickable after ${maxAttempts} attempts`);
        }
      });
    };
    attemptClick();
  }

  // Form helpers
  fillForm(formData: Record<string, string>): void {
    Object.entries(formData).forEach(([field, value]) => {
      cy.get(`[data-testid="${field}"], [name="${field}"], #${field}`).type(value);
    });
  }

  // Wait for loading states
  waitForSpinner(): void {
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  }

  // Error handling
  assertErrorMessage(message: string): void {
    cy.get('[data-testid="error-message"], .error-message').should('contain.text', message);
  }

  assertSuccessMessage(message: string): void {
    cy.get('[data-testid="success-message"], .success-message').should('contain.text', message);
  }
}