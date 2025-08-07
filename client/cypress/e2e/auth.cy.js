describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.resetTestData();
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should complete successful user registration flow', () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: `test+${Date.now()}@example.com`,
        password: 'SecurePass123!'
      };

      cy.registerUser(userData).then((user) => {
        // Verify successful registration
        cy.url().should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="user-greeting"]').should('contain', user.firstName);
        cy.window().its('localStorage.token').should('exist');
      });
    });

    it('should validate registration form fields', () => {
      cy.visit('/signup');
      
      // Test required field validation
      cy.get('[data-testid="signup-button"]').click();
      cy.get('[data-testid="first-name-error"]').should('contain', 'First name is required');
      cy.get('[data-testid="last-name-error"]').should('contain', 'Last name is required');
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');

      // Test email format validation
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="signup-button"]').click();
      cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email');

      // Test password strength
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="password-strength"]').should('contain', 'Weak');
      
      cy.get('[data-testid="password-input"]').clear().type('StrongPass123!');
      cy.get('[data-testid="password-strength"]').should('contain', 'Strong');
    });

    it('should handle registration errors gracefully', () => {
      cy.intercept('POST', '**/api/auth/signup', {
        statusCode: 409,
        body: { message: 'Email already exists' }
      }).as('signupError');

      cy.visit('/signup');
      cy.get('[data-testid="first-name-input"]').type('John');
      cy.get('[data-testid="last-name-input"]').type('Doe');
      cy.get('[data-testid="email-input"]').type('existing@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="confirm-password-input"]').type('password123');
      cy.get('[data-testid="signup-button"]').click();

      cy.wait('@signupError');
      cy.get('[data-testid="error-message"]').should('contain', 'Email already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      cy.seedTestData({
        users: [{
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        }]
      });
    });

    it('should complete successful login flow', () => {
      cy.login('test@example.com', 'password123');
      
      cy.visit('/');
      cy.get('[data-testid="user-greeting"]').should('contain', 'Test');
      cy.get('[data-testid="logout-button"]').should('be.visible');
    });

    it('should handle invalid credentials', () => {
      cy.mockAuthApi(null); // Mock login error
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginError');
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
      cy.url().should('include', '/login');
    });

    it('should persist login session', () => {
      cy.login();
      
      // Navigate away and back
      cy.visit('/products');
      cy.visit('/');
      
      // Should still be logged in
      cy.get('[data-testid="user-greeting"]').should('be.visible');
      cy.window().its('localStorage.token').should('exist');
    });

    it('should complete logout flow', () => {
      cy.login();
      cy.visit('/');
      
      cy.logout();
      
      cy.get('[data-testid="login-button"]').should('be.visible');
      cy.get('[data-testid="signup-button"]').should('be.visible');
      cy.window().its('localStorage.token').should('not.exist');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/cart');
      cy.url().should('include', '/login');
      
      cy.visit('/orders');
      cy.url().should('include', '/login');
      
      cy.visit('/checkout');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes after login', () => {
      cy.login();
      
      cy.visit('/cart');
      cy.url().should('include', '/cart');
      
      cy.visit('/orders');
      cy.url().should('include', '/orders');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login');
      cy.checkA11y();
    });

    it('should be accessible on signup page', () => {
      cy.visit('/signup');
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.visit('/login');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'login-button');
    });
  });
});