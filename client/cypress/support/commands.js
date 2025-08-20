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
      // Check for auth token in localStorage
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
    },
    {
      validate: () => {
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
      },
    }
  );
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.exist');
});

// User Registration with actual API integration
Cypress.Commands.add('registerUser', (userData) => {
  const defaultUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: `test+${Date.now()}@example.com`,
    password: 'Test123!'
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.visit('/signup');
  cy.get('[data-testid="first-name-input"]').type(user.firstName);
  cy.get('[data-testid="last-name-input"]').type(user.lastName);
  cy.get('[data-testid="email-input"]').type(user.email);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="confirm-password-input"]').type(user.password);
  cy.get('[data-testid="terms-checkbox"]').check();
  cy.get('[data-testid="signup-button"]').click();
  
  return cy.wrap(user);
});

// Product Management Commands for actual app
Cypress.Commands.add('addToCart', (productId, quantity = 1) => {
  cy.visit(`/products/${productId}`);
  if (quantity > 1) {
    cy.get('[data-testid="quantity-selector"]').clear().type(quantity.toString());
  }
  cy.get('[data-testid="add-to-cart-button"]').click();
  // Wait for the cart notification or badge update
  cy.get('[data-testid="cart-notification"]').should('be.visible');
});

Cypress.Commands.add('searchProducts', (searchTerm) => {
  cy.visit('/products');
  cy.get('[data-testid="search-input"]').type(searchTerm);
  cy.get('[data-testid="search-button"]').click();
  cy.url().should('include', `search=${encodeURIComponent(searchTerm)}`);
});

// Cart Management for actual API
Cypress.Commands.add('clearCart', () => {
  cy.visit('/cart');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="clear-cart-button"]').length > 0) {
      cy.get('[data-testid="clear-cart-button"]').click();
      cy.get('[data-testid="confirm-clear-button"]').click();
    }
  });
});

Cypress.Commands.add('getCartItemCount', () => {
  return cy.get('[data-testid="cart-count"]').then(($badge) => {
    return $badge.length > 0 ? parseInt($badge.text()) : 0;
  });
});

// Fill checkout form with actual form fields
Cypress.Commands.add('fillCheckoutForm', (formData = {}) => {
  const defaultData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phone: '555-123-4567',
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'United States'
  };
  
  const data = { ...defaultData, ...formData };
  
  // Fill shipping address
  cy.get('[data-testid="first-name"]').clear().type(data.firstName);
  cy.get('[data-testid="last-name"]').clear().type(data.lastName);
  cy.get('[data-testid="email"]').clear().type(data.email);
  cy.get('[data-testid="phone"]').clear().type(data.phone);
  cy.get('[data-testid="street"]').clear().type(data.street);
  cy.get('[data-testid="city"]').clear().type(data.city);
  cy.get('[data-testid="state"]').select(data.state);
  cy.get('[data-testid="zip-code"]').clear().type(data.zipCode);
  cy.get('[data-testid="country"]').select(data.country);
});

// Utility commands for the actual app
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

Cypress.Commands.add('loginAsTestUser', () => {
  const testUser = Cypress.env('testUser');
  cy.login(testUser.email, testUser.password);
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
  cy.get('[data-testid="page-content"]').should('be.visible');
});

// API testing commands for real endpoints
Cypress.Commands.add('apiRequest', (method, endpoint, body = null) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${endpoint}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
    },
    failOnStatusCode: false
  });
});

// Set viewport for responsive testing
Cypress.Commands.add('setViewport', (device) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720]
  };
  
  const [width, height] = viewports[device] || viewports.desktop;
  cy.viewport(width, height);
});

// Complete test order helper
Cypress.Commands.add('completeTestOrder', () => {
  cy.visit('/products');
  cy.get('[data-testid="product-card"]').first().click();
  cy.get('[data-testid="add-to-cart-button"]').click();
  cy.get('[data-testid="cart-icon"]').click();
  cy.get('[data-testid="checkout-button"]').click();
  cy.fillCheckoutForm();
  cy.get('[data-testid="place-order-button"]').click();
});

// Network performance monitoring
Cypress.Commands.add('checkNetworkPerformance', () => {
  cy.window().then((win) => {
    const entries = win.performance.getEntriesByType('navigation');
    const loadTime = entries[0]?.loadEventEnd - entries[0]?.navigationStart;
    expect(loadTime).to.be.lessThan(3000); // Page should load within 3 seconds
  });
});

// Accessibility commands using cypress-axe
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(context, {
    includedImpacts: ['minor', 'moderate', 'serious', 'critical'],
    ...options
  });
});

// Add command for keyboard navigation testing
Cypress.Commands.add('tab', () => {
  cy.focused().tab();
});

// Error validation commands
Cypress.Commands.add('expectNoConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = [];
    cy.stub(win.console, 'error').callsFake((message) => {
      errors.push(message);
    });
    
    cy.then(() => {
      expect(errors).to.have.length(0);
    });
  });
});