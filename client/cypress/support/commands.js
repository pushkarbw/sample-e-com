// ***********************************************
// Custom commands for E-commerce Application
// ***********************************************

// Authentication Commands
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type(email);
      cy.get('[data-testid="password-input"]').type(password);
      cy.get('[data-testid="login-button"]').click();
      cy.url().should('not.include', '/login');
      cy.window().its('localStorage.token').should('exist');
    },
    {
      validate: () => {
        cy.window().its('localStorage.token').should('exist');
      },
    }
  );
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
  cy.window().its('localStorage.token').should('not.exist');
});

// User Registration
Cypress.Commands.add('registerUser', (userData) => {
  const defaultUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: `test+${Date.now()}@example.com`,
    password: 'password123'
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.visit('/signup');
  cy.get('[data-testid="first-name-input"]').type(user.firstName);
  cy.get('[data-testid="last-name-input"]').type(user.lastName);
  cy.get('[data-testid="email-input"]').type(user.email);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="confirm-password-input"]').type(user.password);
  cy.get('[data-testid="signup-button"]').click();
  
  return cy.wrap(user);
});

// Product Management Commands
Cypress.Commands.add('addToCart', (productId, quantity = 1) => {
  cy.visit(`/products/${productId}`);
  cy.get('[data-testid="quantity-input"]').clear().type(quantity.toString());
  cy.get('[data-testid="add-to-cart-button"]').click();
  cy.get('[data-testid="cart-notification"]').should('be.visible');
});

Cypress.Commands.add('searchProducts', (searchTerm) => {
  cy.get('[data-testid="search-input"]').type(searchTerm);
  cy.get('[data-testid="search-button"]').click();
  cy.url().should('include', `search=${encodeURIComponent(searchTerm)}`);
});

// Cart Management
Cypress.Commands.add('clearCart', () => {
  cy.visit('/cart');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="clear-cart-button"]').length > 0) {
      cy.get('[data-testid="clear-cart-button"]').click();
      cy.get('[data-testid="confirm-clear-cart"]').click();
    }
  });
});

Cypress.Commands.add('getCartItemCount', () => {
  return cy.get('[data-testid="cart-badge"]').then(($badge) => {
    return $badge.length > 0 ? parseInt($badge.text()) : 0;
  });
});

// API Mocking Commands
Cypress.Commands.add('mockApiCall', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as('apiCall');
});

Cypress.Commands.add('mockProductsApi', (products = []) => {
  cy.intercept('GET', '**/api/products*', {
    statusCode: 200,
    body: {
      data: products,
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: products.length,
        limit: 12
      }
    }
  }).as('getProducts');
});

Cypress.Commands.add('mockAuthApi', (user = null) => {
  if (user) {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { user, token: 'mock-jwt-token' }
    }).as('login');
    
    cy.intercept('GET', '**/api/auth/profile', {
      statusCode: 200,
      body: user
    }).as('getProfile');
  } else {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginError');
  }
});

// Accessibility Testing Commands
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(context, {
    ...options,
    includedImpacts: ['minor', 'moderate', 'serious', 'critical']
  });
});

// Form Testing Commands
Cypress.Commands.add('fillCheckoutForm', (formData = {}) => {
  const defaultData = {
    phone: '(555) 123-4567',
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'United States'
  };
  
  const data = { ...defaultData, ...formData };
  
  Object.keys(data).forEach(field => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(data[field]);
  });
});

// Visual Testing Commands
Cypress.Commands.add('visualTest', (name, options = {}) => {
  cy.get('[data-testid="loading"]').should('not.exist');
  cy.wait(500); // Allow for animations to complete
  cy.matchImageSnapshot(name, {
    threshold: 0.1,
    thresholdType: 'percent',
    ...options
  });
});

// Network Performance Commands
Cypress.Commands.add('measureNetworkPerformance', () => {
  cy.window().then((win) => {
    const entries = win.performance.getEntriesByType('resource');
    const slowRequests = entries.filter(entry => entry.duration > 1000);
    
    if (slowRequests.length > 0) {
      cy.task('log', `Slow requests detected: ${slowRequests.length}`);
      slowRequests.forEach(request => {
        cy.task('log', `${request.name}: ${request.duration}ms`);
      });
    }
  });
});

// Database State Management
Cypress.Commands.add('seedTestData', (data = {}) => {
  cy.task('seedDb', data);
});

Cypress.Commands.add('resetTestData', () => {
  cy.task('resetDb');
});

// Error Handling Commands
Cypress.Commands.add('expectNoConsoleErrors', () => {
  cy.window().then((win) => {
    cy.stub(win.console, 'error').as('consoleError');
  });
  
  cy.get('@consoleError').should('not.have.been.called');
});

// Responsive Testing Commands
Cypress.Commands.add('testResponsive', (callback) => {
  const devices = ['mobile', 'tablet', 'desktop'];
  
  devices.forEach(device => {
    cy.setViewport(device);
    cy.waitForPageLoad();
    callback(device);
  });
});