describe('👤 User Authentication & Account Management', () => {
  const testConfig = {
    defaultUser: {
      email: 'shopper@example.com',
      password: 'password123'
    }
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  context('User Registration', () => {
    it('should register new user successfully', () => {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      cy.visit('/signup');
      
      cy.get('[data-testid="email-input"]').type(newUser.email);
      cy.get('[data-testid="password-input"]').type(newUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(newUser.password);
      cy.get('[data-testid="first-name-input"]').type(newUser.firstName);
      cy.get('[data-testid="last-name-input"]').type(newUser.lastName);
      cy.get('[data-testid="terms-checkbox"]').check();
      
      cy.get('[data-testid="signup-button"]').click();
      
      cy.url().should('include', '/login');
      cy.get('[data-testid="signup-success"]').should('contain', 'Registration successful');
    });

    it('should validate registration form', () => {
      cy.visit('/signup');
      
      // Test password mismatch
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="confirm-password-input"]').type('different');
      cy.get('[data-testid="signup-button"]').click();
      
      cy.get('[data-testid="password-mismatch-error"]').should('be.visible');
      
      // Test weak password
      cy.get('[data-testid="password-input"]').clear().type('123');
      cy.get('[data-testid="weak-password-error"]').should('be.visible');
      
      // Test invalid email
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
    });

    it('should prevent duplicate email registration', () => {
      cy.visit('/signup');
      
      cy.get('[data-testid="email-input"]').type(testConfig.defaultUser.email);
      cy.get('[data-testid="password-input"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('NewPassword123!');
      cy.get('[data-testid="first-name-input"]').type('Test');
      cy.get('[data-testid="last-name-input"]').type('User');
      cy.get('[data-testid="terms-checkbox"]').check();
      
      cy.get('[data-testid="signup-button"]').click();
      
      cy.get('[data-testid="email-exists-error"]').should('contain', 'Email already exists');
    });
  });

  context('User Login', () => {
    it('should login with valid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type(testConfig.defaultUser.email);
      cy.get('[data-testid="password-input"]').type(testConfig.defaultUser.password);
      cy.get('[data-testid="login-button"]').click();
      
      cy.url().should('not.include', '/login');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="logout-button"]').should('be.visible');
    });

    it('should handle invalid login credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials');
      cy.url().should('include', '/login');
    });

    it('should remember user session', () => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      
      // Refresh page and verify user is still logged in
      cy.reload();
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      // Close browser and reopen (simulate browser restart)
      cy.clearCookies();
      cy.visit('/');
      cy.get('[data-testid="login-button"]').should('be.visible'); // Should be logged out
    });

    it('should handle "Remember Me" functionality', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type(testConfig.defaultUser.email);
      cy.get('[data-testid="password-input"]').type(testConfig.defaultUser.password);
      cy.get('[data-testid="remember-me"]').check();
      cy.get('[data-testid="login-button"]').click();
      
      // Verify user is logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      // Clear session storage but keep cookies
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });
      
      cy.reload();
      cy.get('[data-testid="user-menu"]').should('be.visible'); // Should still be logged in
    });
  });

  context('User Profile Management', () => {
    beforeEach(() => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
    });

    it('should display user profile information', () => {
      cy.visit('/profile');
      
      cy.get('[data-testid="profile-email"]').should('contain', testConfig.defaultUser.email);
      cy.get('[data-testid="profile-name"]').should('be.visible');
      cy.get('[data-testid="profile-avatar"]').should('be.visible');
      cy.get('[data-testid="edit-profile-button"]').should('be.visible');
    });

    it('should update profile information', () => {
      cy.visit('/profile');
      
      cy.get('[data-testid="edit-profile-button"]').click();
      
      cy.get('[data-testid="first-name-input"]').clear().type('Updated');
      cy.get('[data-testid="last-name-input"]').clear().type('Name');
      cy.get('[data-testid="phone-input"]').type('123-456-7890');
      
      cy.get('[data-testid="save-profile-button"]').click();
      
      cy.get('[data-testid="profile-success"]').should('contain', 'Profile updated');
      cy.get('[data-testid="profile-name"]').should('contain', 'Updated Name');
    });

    it('should change password', () => {
      cy.visit('/profile');
      
      cy.get('[data-testid="change-password-button"]').click();
      
      cy.get('[data-testid="current-password"]').type(testConfig.defaultUser.password);
      cy.get('[data-testid="new-password"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-new-password"]').type('NewPassword123!');
      
      cy.get('[data-testid="update-password-button"]').click();
      
      cy.get('[data-testid="password-success"]').should('contain', 'Password updated');
      
      // Verify new password works
      cy.logout();
      cy.login(testConfig.defaultUser.email, 'NewPassword123!');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });
  });

  context('Password Reset', () => {
    it('should request password reset', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.url().should('include', '/forgot-password');
      
      cy.get('[data-testid="email-input"]').type(testConfig.defaultUser.email);
      cy.get('[data-testid="reset-password-button"]').click();
      
      cy.get('[data-testid="reset-email-sent"]').should('contain', 'Reset email sent');
    });

    it('should handle invalid email for reset', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-testid="email-input"]').type('nonexistent@example.com');
      cy.get('[data-testid="reset-password-button"]').click();
      
      cy.get('[data-testid="email-not-found-error"]').should('contain', 'Email not found');
    });
  });

  context('Session Management', () => {
    it('should auto-logout on session expiry', () => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      
      // Mock expired token
      cy.intercept('GET', '**/api/user/profile', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('expiredToken');
      
      cy.visit('/profile');
      cy.wait('@expiredToken');
      
      cy.get('[data-testid="session-expired"]').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should handle logout', () => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
      
      // Verify local storage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });
});