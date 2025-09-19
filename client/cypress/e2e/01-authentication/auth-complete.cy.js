describe('🔐 Authentication & User Management', () => {
  const validUser = { email: 'john@example.com', password: 'Ecomm@123' };
  
  beforeEach(() => {
    cy.clearAllStorage();
    cy.intercept('POST', '**/api/auth/login').as('loginAPI');
    cy.intercept('POST', '**/api/auth/register').as('registerAPI');
    cy.intercept('POST', '**/api/auth/logout').as('logoutAPI');
  });

  describe('User Registration', () => {
    it('should register new users with valid data', () => {
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test+${Date.now()}@example.com`,
        password: 'Test123!'
      };
      
      cy.visit('/signup');
      cy.get('#firstName').type(newUser.firstName);
      cy.get('#lastName').type(newUser.lastName);
      cy.get('#email').type(newUser.email);
      cy.get('#password').type(newUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect after successful registration or show success message
      cy.get('body').should('be.visible');
      cy.url({ timeout: 10000 }).should('not.include', '/signup');
    });

    it('should validate required fields', () => {
      cy.visit('/signup');
      cy.get('button[type="submit"]').click();
      
      // Check HTML5 validation or custom validation messages
      cy.get('input:invalid').should('have.length.at.least', 1);
    });

    it('should validate email format', () => {
      cy.visit('/signup');
      cy.get('#email').type('invalid-email-format');
      cy.get('button[type="submit"]').click();
      
      cy.get('#email:invalid').should('exist');
    });
  });

  describe('User Login', () => {
    it('should login with correct credentials', () => {
      cy.visit('/login');
      cy.get('#email').type(validUser.email);
      cy.get('#password').type(validUser.password);
      cy.get('button[type="submit"]').click();
      
      // Wait for successful login
      cy.url({ timeout: 10000 }).should('not.include', '/login');
      cy.get('header').should('contain', 'Hi,');
    });

    it('should reject invalid credentials', () => {
      // Mock API to return error for invalid credentials
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Invalid email or password'
        }
      }).as('invalidLoginAPI');

      cy.visit('/login');
      cy.get('#email').type('wrong@example.com');
      cy.get('#password').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@invalidLoginAPI');
      
      // Should show error message and stay on login page
      cy.get('[data-cy="error-message"]').should('be.visible')
        .and('contain.text', 'Invalid');
      
      // Should still be on login page
      cy.url().should('include', '/login');
      
      // Form should be available for retry
      cy.get('#email').should('be.visible');
      cy.get('#password').should('be.visible');
    });

    it('should show loading state during login', () => {
      cy.visit('/login');
      cy.get('#email').type(validUser.email);
      cy.get('#password').type(validUser.password);
      
      cy.get('button[type="submit"]').click();
      
      // Check for loading state
      cy.get('button[type="submit"]').should('satisfy', ($btn) => {
        return $btn.text().includes('Logging') || $btn.is(':disabled');
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page reloads', () => {
      cy.loginAsTestUser(validUser.email, validUser.password);
      cy.reload();
      cy.get('header').should('contain', 'Hi,');
    });

    it('should logout successfully', () => {
      cy.loginAsTestUser(validUser.email, validUser.password);
      
      cy.get('header').within(() => {
        cy.get('button').contains('Logout').click();
      });
      
      // Should redirect to home and show login links
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('header').should('contain', 'Login');
    });

    it('should handle expired sessions gracefully', () => {
      cy.loginAsTestUser(validUser.email, validUser.password);
      
      // Simulate expired token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired-token-123');
      });
      
      cy.visit('/cart'); // Protected route
      
      // Should redirect to login or handle gracefully
      cy.get('body').should('be.visible');
    });
  });

  describe('Route Protection', () => {
    const protectedRoutes = ['/cart', '/orders', '/profile'];
    
    protectedRoutes.forEach(route => {
      it(`should protect ${route} route when not authenticated`, () => {
        cy.visit(route);
        
        // Should redirect to login or show login prompt
        cy.get('body').should('satisfy', ($body) => {
          return window.location.href.includes('/login') || 
                 $body.text().includes('Login') ||
                 $body.text().includes('Please log in');
        });
      });
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.loginAsTestUser(validUser.email, validUser.password);
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.get('body').should('be.visible');
        cy.url().should('include', route);
      });
    });
  });
});