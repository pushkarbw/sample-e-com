describe('🔐 Authentication & User Management', () => {
  const testUsers = {
    validUser: {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    },
    adminUser: {
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    }
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.task('resetUsers');
  });

  context('User Registration', () => {
    it('should register new user successfully', () => {
      cy.visit('/signup');
      
      cy.get('[data-testid="first-name"]').type(testUsers.validUser.firstName);
      cy.get('[data-testid="last-name"]').type(testUsers.validUser.lastName);
      cy.get('[data-testid="email"]').type(testUsers.validUser.email);
      cy.get('[data-testid="password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="confirm-password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="terms-checkbox"]').check();
      
      cy.get('[data-testid="signup-button"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]').should('contain', testUsers.validUser.firstName);
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should validate registration form fields', () => {
      cy.visit('/signup');
      
      cy.get('[data-testid="signup-button"]').click();
      
      cy.get('[data-testid="first-name-error"]').should('contain', 'required');
      cy.get('[data-testid="email-error"]').should('contain', 'required');
      cy.get('[data-testid="password-error"]').should('contain', 'required');
      
      cy.get('[data-testid="email"]').type('invalid-email');
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
      
      cy.get('[data-testid="password"]').type('123');
      cy.get('[data-testid="password-error"]').should('contain', '8 characters');
      
      cy.get('[data-testid="confirm-password"]').type('different');
      cy.get('[data-testid="confirm-password-error"]').should('contain', 'match');
    });

    it('should handle existing user registration', () => {
      cy.task('createUser', testUsers.validUser);
      
      cy.visit('/signup');
      cy.get('[data-testid="email"]').type(testUsers.validUser.email);
      cy.get('[data-testid="password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="confirm-password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="first-name"]').type('Test');
      cy.get('[data-testid="last-name"]').type('User');
      cy.get('[data-testid="terms-checkbox"]').check();
      
      cy.get('[data-testid="signup-button"]').click();
      
      cy.get('[data-testid="signup-error"]').should('contain', 'already exists');
    });
  });

  context('User Login', () => {
    beforeEach(() => {
      cy.task('createUser', testUsers.validUser);
    });

    it('should login with valid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email"]').type(testUsers.validUser.email);
      cy.get('[data-testid="password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="login-button"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain', testUsers.validUser.firstName);
    });

    it('should handle invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email"]').type(testUsers.validUser.email);
      cy.get('[data-testid="password"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials');
      cy.url().should('include', '/login');
    });

    it('should remember user session', () => {
      cy.login(testUsers.validUser.email, testUsers.validUser.password);
      
      cy.reload();
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      cy.visit('/login');
      cy.url().should('include', '/dashboard');
    });

    it('should handle forgot password flow', () => {
      cy.visit('/login');
      cy.get('[data-testid="forgot-password"]').click();
      
      cy.url().should('include', '/forgot-password');
      cy.get('[data-testid="email"]').type(testUsers.validUser.email);
      cy.get('[data-testid="reset-button"]').click();
      
      cy.get('[data-testid="reset-success"]').should('contain', 'reset link sent');
    });
  });

  context('User Logout', () => {
    beforeEach(() => {
      cy.task('createUser', testUsers.validUser);
      cy.login(testUsers.validUser.email, testUsers.validUser.password);
    });

    it('should logout user successfully', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      cy.url().should('include', '/login');
      cy.get('[data-testid="user-menu"]').should('not.exist');
      
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should clear user data on logout', () => {
      cy.window().its('localStorage').should('contain.key', 'authToken');
      
      cy.logout();
      
      cy.window().its('localStorage').should('not.contain.key', 'authToken');
      cy.getCookies().should('be.empty');
    });
  });

  context('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      const protectedRoutes = ['/dashboard', '/profile', '/orders', '/checkout'];
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
        cy.get('[data-testid="redirect-message"]').should('contain', 'Please log in');
      });
    });

    it('should allow authenticated users to access protected routes', () => {
      cy.task('createUser', testUsers.validUser);
      cy.login(testUsers.validUser.email, testUsers.validUser.password);
      
      const protectedRoutes = ['/dashboard', '/profile', '/orders'];
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.get('[data-testid="user-menu"]').should('be.visible');
      });
    });
  });

  context('User Profile Management', () => {
    beforeEach(() => {
      cy.task('createUser', testUsers.validUser);
      cy.login(testUsers.validUser.email, testUsers.validUser.password);
    });

    it('should display user profile information', () => {
      cy.visit('/profile');
      
      cy.get('[data-testid="profile-form"]').should('be.visible');
      cy.get('[data-testid="first-name"]').should('have.value', testUsers.validUser.firstName);
      cy.get('[data-testid="last-name"]').should('have.value', testUsers.validUser.lastName);
      cy.get('[data-testid="email"]').should('have.value', testUsers.validUser.email);
    });

    it('should update profile information', () => {
      cy.visit('/profile');
      
      cy.get('[data-testid="first-name"]').clear().type('Updated');
      cy.get('[data-testid="last-name"]').clear().type('Name');
      cy.get('[data-testid="phone"]').type('555-1234');
      
      cy.get('[data-testid="save-profile"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain', 'Profile updated');
      cy.get('[data-testid="user-name"]').should('contain', 'Updated');
    });

    it('should change password', () => {
      cy.visit('/profile');
      cy.get('[data-testid="change-password-tab"]').click();
      
      cy.get('[data-testid="current-password"]').type(testUsers.validUser.password);
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-new-password"]').type('newpassword123');
      
      cy.get('[data-testid="change-password-button"]').click();
      
      cy.get('[data-testid="password-success"]').should('contain', 'Password changed');
      
      cy.logout();
      cy.login(testUsers.validUser.email, 'newpassword123');
      cy.url().should('include', '/dashboard');
    });
  });
});