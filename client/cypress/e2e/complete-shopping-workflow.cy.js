describe('E-Commerce Application - Complete Test Suite', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: Cypress.config('baseUrl'),
    apiUrl: Cypress.env('apiUrl'),
    defaultUser: {
      email: 'shopper@example.com',
      password: 'password123'
    },
    testProducts: [
      { id: 'product-1', name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
      { id: 'product-2', name: 'Running Shoes', price: 89.99, category: 'Sports' },
      { id: 'product-3', name: 'Coffee Mug', price: 15.99, category: 'Home' }
    ]
  };

  before(() => {
    // Global test setup
    cy.task('log', 'Starting E-Commerce Test Suite');
    cy.task('resetDb');
    cy.task('seedDb', testConfig.testProducts);
  });

  beforeEach(() => {
    // Reset state before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  /**
   * CATEGORY 1: CORE SHOPPING FUNCTIONALITY
   * Tests the primary user flows for shopping
   */
  describe('🛒 Core Shopping Functionality', () => {
    context('Product Discovery', () => {
      it('should display products with proper loading states', () => {
        // Mock slow API response to test loading states
        cy.intercept('GET', '**/api/products', (req) => {
          req.reply((res) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(res.send({ fixture: 'products.json' }));
              }, 1000);
            });
          });
        }).as('getProducts');

        cy.visit('/products');
        
        // Verify loading state
        cy.get('[data-testid="products-loading"]').should('be.visible');
        cy.get('[data-testid="skeleton-loader"]').should('have.length.at.least', 3);
        
        cy.wait('@getProducts');
        
        // Verify products loaded
        cy.get('[data-testid="products-loading"]').should('not.exist');
        cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
        cy.get('[data-testid="product-image"]').should('be.visible');
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
      });

      it('should handle product search with filters', () => {
        cy.visit('/products');
        
        // Test search functionality
        cy.get('[data-testid="search-input"]').type('headphones');
        cy.get('[data-testid="search-button"]').click();
        
        cy.get('[data-testid="product-card"]').should('contain', 'Wireless Headphones');
        cy.get('[data-testid="search-results-count"]').should('contain', '1');
        
        // Test category filter
        cy.get('[data-testid="category-filter"]').select('Electronics');
        cy.get('[data-testid="apply-filters"]').click();
        
        cy.get('[data-testid="product-card"]').each(($card) => {
          cy.wrap($card).should('contain', 'Electronics');
        });
        
        // Test price range filter
        cy.get('[data-testid="price-min"]').clear().type('50');
        cy.get('[data-testid="price-max"]').clear().type('200');
        cy.get('[data-testid="apply-filters"]').click();
        
        cy.get('[data-testid="product-price"]').each(($price) => {
          const price = parseFloat($price.text().replace('$', ''));
          expect(price).to.be.within(50, 200);
        });
      });

      it('should display product details correctly', () => {
        cy.visit('/products');
        cy.get('[data-testid="product-card"]').first().click();
        
        // Verify product detail page
        cy.url().should('include', '/products/');
        cy.get('[data-testid="product-title"]').should('be.visible');
        cy.get('[data-testid="product-description"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
        cy.get('[data-testid="product-images"]').should('be.visible');
        cy.get('[data-testid="add-to-cart-button"]').should('be.visible');
        cy.get('[data-testid="quantity-selector"]').should('be.visible');
        
        // Test image gallery
        cy.get('[data-testid="product-image-thumbnail"]').should('have.length.at.least', 1);
        if (cy.get('[data-testid="product-image-thumbnail"]').its('length').then(length => length > 1)) {
          cy.get('[data-testid="product-image-thumbnail"]').eq(1).click();
          cy.get('[data-testid="main-product-image"]').should('have.attr', 'src').and('include', 'image-1');
        }
      });
    });

    context('Shopping Cart Operations', () => {
      beforeEach(() => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      });

      it('should add products to cart with quantity management', () => {
        cy.visit('/products');
        
        // Add first product
        cy.get('[data-testid="product-card"]').first().within(() => {
          cy.get('[data-testid="add-to-cart-button"]').click();
        });
        
        cy.get('[data-testid="cart-notification"]').should('contain', 'Added to cart');
        cy.get('[data-testid="cart-count"]').should('contain', '1');
        
        // Add product with specific quantity
        cy.get('[data-testid="product-card"]').eq(1).click();
        cy.get('[data-testid="quantity-selector"]').clear().type('3');
        cy.get('[data-testid="add-to-cart-button"]').click();
        
        cy.get('[data-testid="cart-count"]').should('contain', '4');
        
        // Verify cart contents
        cy.get('[data-testid="cart-icon"]').click();
        cy.get('[data-testid="cart-items"]').should('have.length', 2);
        
        // Test quantity update in cart
        cy.get('[data-testid="cart-item"]').first().within(() => {
          cy.get('[data-testid="quantity-increase"]').click();
          cy.get('[data-testid="item-quantity"]').should('contain', '2');
        });
        
        cy.get('[data-testid="cart-total"]').should('be.visible');
      });

      it('should handle cart persistence across sessions', () => {
        // Add items to cart
        cy.visit('/products/product-1');
        cy.get('[data-testid="add-to-cart-button"]').click();
        
        // Reload page and verify persistence
        cy.reload();
        cy.get('[data-testid="cart-count"]').should('contain', '1');
        
        // Logout and login again
        cy.logout();
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
        
        cy.get('[data-testid="cart-count"]').should('contain', '1');
      });

      it('should remove items from cart', () => {
        // Add multiple items
        cy.visit('/products');
        cy.get('[data-testid="product-card"]').first().within(() => {
          cy.get('[data-testid="add-to-cart-button"]').click();
        });
        cy.get('[data-testid="product-card"]').eq(1).within(() => {
          cy.get('[data-testid="add-to-cart-button"]').click();
        });
        
        // Open cart and remove item
        cy.get('[data-testid="cart-icon"]').click();
        cy.get('[data-testid="cart-item"]').first().within(() => {
          cy.get('[data-testid="remove-item"]').click();
        });
        
        cy.get('[data-testid="confirm-remove"]').click();
        cy.get('[data-testid="cart-items"]').should('have.length', 1);
        cy.get('[data-testid="cart-count"]').should('contain', '1');
        
        // Clear entire cart
        cy.get('[data-testid="clear-cart"]').click();
        cy.get('[data-testid="confirm-clear"]').click();
        cy.get('[data-testid="empty-cart-message"]').should('be.visible');
      });
    });

    context('Checkout Process', () => {
      beforeEach(() => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
        // Add a product to cart for checkout tests
        cy.visit('/products/product-1');
        cy.get('[data-testid="add-to-cart-button"]').click();
      });

      it('should complete full checkout flow', () => {
        cy.visit('/checkout');
        
        // Verify checkout page structure
        cy.get('[data-testid="checkout-form"]').should('be.visible');
        cy.get('[data-testid="order-summary"]').should('be.visible');
        cy.get('[data-testid="shipping-section"]').should('be.visible');
        cy.get('[data-testid="payment-section"]').should('be.visible');
        
        // Fill shipping information
        cy.get('[data-testid="first-name"]').type('John');
        cy.get('[data-testid="last-name"]').type('Doe');
        cy.get('[data-testid="address"]').type('123 Test Street');
        cy.get('[data-testid="city"]').type('Test City');
        cy.get('[data-testid="postal-code"]').type('12345');
        cy.get('[data-testid="country"]').select('United States');
        
        // Fill payment information
        cy.get('[data-testid="card-number"]').type('4242424242424242');
        cy.get('[data-testid="expiry-date"]').type('12/25');
        cy.get('[data-testid="cvv"]').type('123');
        cy.get('[data-testid="cardholder-name"]').type('John Doe');
        
        // Verify order total
        cy.get('[data-testid="order-total"]').should('contain', '$');
        
        // Place order
        cy.get('[data-testid="place-order"]').click();
        
        // Verify success
        cy.url().should('include', '/order-confirmation');
        cy.get('[data-testid="order-success"]').should('be.visible');
        cy.get('[data-testid="order-number"]').should('be.visible');
      });

      it('should validate checkout form fields', () => {
        cy.visit('/checkout');
        
        // Try to submit empty form
        cy.get('[data-testid="place-order"]').click();
        
        // Verify validation messages
        cy.get('[data-testid="first-name-error"]').should('contain', 'required');
        cy.get('[data-testid="address-error"]').should('contain', 'required');
        cy.get('[data-testid="card-number-error"]').should('contain', 'required');
        
        // Test invalid card number
        cy.get('[data-testid="card-number"]').type('1234');
        cy.get('[data-testid="card-number-error"]').should('contain', 'invalid');
        
        // Test invalid expiry date
        cy.get('[data-testid="expiry-date"]').type('01/20');
        cy.get('[data-testid="expiry-error"]').should('contain', 'expired');
      });

      it('should handle payment failures gracefully', () => {
        cy.intercept('POST', '**/api/orders', {
          statusCode: 402,
          body: { error: 'Payment declined' }
        }).as('paymentError');
        
        cy.visit('/checkout');
        
        // Fill required fields
        cy.fillCheckoutForm();
        cy.get('[data-testid="place-order"]').click();
        
        cy.wait('@paymentError');
        
        // Verify error handling
        cy.get('[data-testid="payment-error"]').should('contain', 'Payment declined');
        cy.get('[data-testid="retry-payment"]').should('be.visible');
        cy.url().should('include', '/checkout'); // Should stay on checkout page
      });
    });
  });

  /**
   * CATEGORY 2: USER AUTHENTICATION & ACCOUNT MANAGEMENT
   * Tests user registration, login, profile management
   */
  describe('👤 User Authentication & Account Management', () => {
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
        
        // Reload page and verify still logged in
        cy.reload();
        cy.get('[data-testid="user-menu"]').should('be.visible');
        
        // Visit protected route directly
        cy.visit('/orders');
        cy.url().should('include', '/orders');
      });
    });

    context('Account Management', () => {
      beforeEach(() => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      });

      it('should update user profile', () => {
        cy.visit('/profile');
        
        cy.get('[data-testid="first-name-input"]').clear().type('Updated');
        cy.get('[data-testid="last-name-input"]').clear().type('Name');
        cy.get('[data-testid="phone-input"]').type('555-123-4567');
        
        cy.get('[data-testid="save-profile"]').click();
        
        cy.get('[data-testid="profile-updated"]').should('be.visible');
        
        // Verify changes persisted
        cy.reload();
        cy.get('[data-testid="first-name-input"]').should('have.value', 'Updated');
      });

      it('should change password', () => {
        cy.visit('/profile/security');
        
        cy.get('[data-testid="current-password"]').type(testConfig.defaultUser.password);
        cy.get('[data-testid="new-password"]').type('NewSecurePass123!');
        cy.get('[data-testid="confirm-new-password"]').type('NewSecurePass123!');
        
        cy.get('[data-testid="change-password"]').click();
        
        cy.get('[data-testid="password-changed"]').should('be.visible');
        
        // Test login with new password
        cy.logout();
        cy.login(testConfig.defaultUser.email, 'NewSecurePass123!');
        cy.get('[data-testid="user-menu"]').should('be.visible');
      });

      it('should view order history', () => {
        // First create an order
        cy.visit('/products/product-1');
        cy.get('[data-testid="add-to-cart-button"]').click();
        cy.visit('/checkout');
        cy.fillCheckoutForm();
        cy.get('[data-testid="place-order"]').click();
        
        // Then check order history
        cy.visit('/orders');
        
        cy.get('[data-testid="order-list"]').should('be.visible');
        cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
        
        // Click on order to view details
        cy.get('[data-testid="order-item"]').first().click();
        cy.get('[data-testid="order-details"]').should('be.visible');
        cy.get('[data-testid="order-status"]').should('be.visible');
        cy.get('[data-testid="order-items"]').should('be.visible');
      });
    });
  });

  /**
   * CATEGORY 3: API INTEGRATION & DATA MANAGEMENT
   * Tests backend integration and data handling
   */
  describe('🔌 API Integration & Data Management', () => {
    context('Product API', () => {
      it('should handle API errors gracefully', () => {
        cy.intercept('GET', '**/api/products', {
          statusCode: 500,
          body: { error: 'Internal server error' }
        }).as('productError');

        cy.visit('/products');
        cy.wait('@productError');

        cy.get('[data-testid="error-message"]').should('contain', 'Unable to load products');
        cy.get('[data-testid="retry-button"]').should('be.visible');
        
        // Test retry functionality
        cy.intercept('GET', '**/api/products', { fixture: 'products.json' }).as('productSuccess');
        cy.get('[data-testid="retry-button"]').click();
        cy.wait('@productSuccess');
        
        cy.get('[data-testid="product-card"]').should('be.visible');
      });

      it('should handle slow API responses', () => {
        cy.intercept('GET', '**/api/products', (req) => {
          req.reply((res) => {
            return new Promise((resolve) => {
              setTimeout(() => resolve(res.send({ fixture: 'products.json' })), 3000);
            });
          });
        }).as('slowProducts');

        cy.visit('/products');
        
        // Should show loading state for slow requests
        cy.get('[data-testid="products-loading"]', { timeout: 1000 }).should('be.visible');
        cy.get('[data-testid="skeleton-loader"]').should('be.visible');
        
        cy.wait('@slowProducts', { timeout: 5000 });
        cy.get('[data-testid="product-card"]').should('be.visible');
      });

      it('should cache API responses appropriately', () => {
        cy.intercept('GET', '**/api/products', { fixture: 'products.json' }).as('initialLoad');
        
        cy.visit('/products');
        cy.wait('@initialLoad');
        
        // Navigate away and back
        cy.visit('/');
        cy.visit('/products');
        
        // Should use cached data (no new request)
        cy.get('@initialLoad').should('have.been.calledOnce');
        cy.get('[data-testid="product-card"]').should('be.visible');
      });
    });

    context('Authentication API', () => {
      it('should handle token expiration', () => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
        
        // Mock expired token response
        cy.intercept('GET', '**/api/user/profile', {
          statusCode: 401,
          body: { error: 'Token expired' }
        }).as('tokenExpired');

        cy.visit('/profile');
        cy.wait('@tokenExpired');

        // Should redirect to login
        cy.url().should('include', '/login');
        cy.get('[data-testid="session-expired"]').should('be.visible');
      });

      it('should refresh tokens automatically', () => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
        
        // Mock token refresh
        cy.intercept('POST', '**/api/auth/refresh', {
          statusCode: 200,
          body: { token: 'new-token', refreshToken: 'new-refresh-token' }
        }).as('tokenRefresh');

        // Trigger API call that requires auth
        cy.visit('/orders');
        
        // Should automatically refresh token and continue
        cy.wait('@tokenRefresh');
        cy.get('[data-testid="order-list"]').should('be.visible');
      });
    });

    context('Cart API Synchronization', () => {
      beforeEach(() => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      });

      it('should sync cart with backend', () => {
        cy.intercept('POST', '**/api/cart/add', {
          statusCode: 200,
          body: { success: true, cartCount: 1 }
        }).as('addToCart');

        cy.visit('/products/product-1');
        cy.get('[data-testid="add-to-cart-button"]').click();
        
        cy.wait('@addToCart');
        cy.get('[data-testid="cart-count"]').should('contain', '1');
      });

      it('should handle offline cart operations', () => {
        // Simulate offline
        cy.intercept('POST', '**/api/cart/add', { forceNetworkError: true }).as('offlineAdd');

        cy.visit('/products/product-1');
        cy.get('[data-testid="add-to-cart-button"]').click();
        
        // Should show offline indicator and queue action
        cy.get('[data-testid="offline-indicator"]').should('be.visible');
        cy.get('[data-testid="cart-count"]').should('contain', '1'); // Local update
        
        // Simulate coming back online
        cy.intercept('POST', '**/api/cart/add', {
          statusCode: 200,
          body: { success: true }
        }).as('onlineSync');
        
        cy.window().its('navigator').invoke('onLine', true);
        cy.wait('@onlineSync');
        cy.get('[data-testid="offline-indicator"]').should('not.exist');
      });
    });
  });

  /**
   * CATEGORY 4: USER EXPERIENCE & ACCESSIBILITY
   * Tests UX, performance, and accessibility
   */
  describe('♿ User Experience & Accessibility', () => {
    context('Responsive Design', () => {
      it('should work on mobile devices', () => {
        cy.viewport('iphone-x');
        cy.visit('/products');
        
        // Mobile-specific elements should be visible
        cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
        cy.get('[data-testid="mobile-nav"]').should('not.be.visible');
        
        // Open mobile menu
        cy.get('[data-testid="mobile-menu-button"]').click();
        cy.get('[data-testid="mobile-nav"]').should('be.visible');
        
        // Test mobile cart
        cy.get('[data-testid="mobile-cart-icon"]').click();
        cy.get('[data-testid="mobile-cart-drawer"]').should('be.visible');
      });

      it('should work on tablet devices', () => {
        cy.viewport('ipad-2');
        cy.visit('/products');
        
        // Tablet layout should show grid properly
        cy.get('[data-testid="product-grid"]').should('have.class', 'tablet-grid');
        cy.get('[data-testid="product-card"]').should('be.visible');
        
        // Navigation should be desktop-style on tablet
        cy.get('[data-testid="desktop-nav"]').should('be.visible');
        cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible');
      });

      it('should adapt to different screen sizes', () => {
        const viewports = [
          [320, 568], // iPhone SE
          [768, 1024], // iPad
          [1024, 768], // iPad Landscape
          [1440, 900], // Desktop
        ];

        viewports.forEach(([width, height]) => {
          cy.viewport(width, height);
          cy.visit('/products');
          
          cy.get('[data-testid="product-grid"]').should('be.visible');
          cy.get('[data-testid="header"]').should('be.visible');
          cy.get('[data-testid="footer"]').should('be.visible');
        });
      });
    });

    context('Performance', () => {
      it('should load pages quickly', () => {
        cy.visit('/products', {
          onBeforeLoad: (win) => {
            cy.stub(win.performance, 'mark').as('performanceMark');
            cy.stub(win.performance, 'measure').as('performanceMeasure');
          }
        });

        // Verify performance marks are being set
        cy.get('@performanceMark').should('have.been.calledWith', 'products-start');
        
        cy.get('[data-testid="product-card"]').should('be.visible');
        
        // Page should load within reasonable time
        cy.window().its('performance').invoke('now').should('be.lessThan', 3000);
      });

      it('should lazy load images', () => {
        cy.visit('/products');
        
        // Check that images use lazy loading
        cy.get('[data-testid="product-image"]').should('have.attr', 'loading', 'lazy');
        
        // Images below fold shouldn't load immediately
        cy.get('[data-testid="product-image"]').eq(10).should('not.have.attr', 'src');
        
        // Scroll to make image visible
        cy.get('[data-testid="product-image"]').eq(10).scrollIntoView();
        cy.get('[data-testid="product-image"]').eq(10).should('have.attr', 'src');
      });

      it('should optimize bundle size', () => {
        cy.visit('/');
        
        // Check that code splitting is working
        cy.window().then((win) => {
          const scripts = Array.from(win.document.querySelectorAll('script[src]'));
          const chunks = scripts.filter(script => script.src.includes('chunk'));
          expect(chunks.length).to.be.greaterThan(1); // Should have multiple chunks
        });
      });
    });

    context('Accessibility', () => {
      it('should be keyboard navigable', () => {
        cy.visit('/products');
        
        // Tab through navigation
        cy.get('body').tab();
        cy.focused().should('have.attr', 'data-testid', 'skip-link');
        
        cy.focused().tab();
        cy.focused().should('have.attr', 'data-testid', 'home-link');
        
        cy.focused().tab();
        cy.focused().should('have.attr', 'data-testid', 'products-link');
        
        // Navigate to first product
        cy.get('[data-testid="product-card"]').first().focus();
        cy.focused().type('{enter}');
        cy.url().should('include', '/products/');
      });

      it('should have proper ARIA labels', () => {
        cy.visit('/products');
        
        // Check main landmarks
        cy.get('[role="main"]').should('exist');
        cy.get('[role="navigation"]').should('exist');
        cy.get('[role="banner"]').should('exist');
        
        // Check form labels
        cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label');
        cy.get('[data-testid="cart-icon"]').should('have.attr', 'aria-label');
        
        // Check product cards
        cy.get('[data-testid="product-card"]').first().should('have.attr', 'role', 'article');
        cy.get('[data-testid="product-card"]').first().should('have.attr', 'aria-labelledby');
      });

      it('should work with screen readers', () => {
        cy.visit('/products');
        
        // Check heading structure
        cy.get('h1').should('exist').and('be.visible');
        cy.get('h2').should('exist');
        
        // Check alt text for images
        cy.get('[data-testid="product-image"]').each(($img) => {
          cy.wrap($img).should('have.attr', 'alt').and('not.be.empty');
        });
        
        // Check button descriptions
        cy.get('[data-testid="add-to-cart-button"]').should('have.attr', 'aria-describedby');
      });

      it('should have sufficient color contrast', () => {
        cy.visit('/products');
        
        // This would typically be tested with axe-core
        cy.injectAxe();
        cy.checkA11y('[data-testid="main-content"]', {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
      });
    });
  });

  /**
   * CATEGORY 5: ERROR HANDLING & EDGE CASES
   * Tests error scenarios and edge cases
   */
  describe('⚠️ Error Handling & Edge Cases', () => {
    context('Network Errors', () => {
      it('should handle complete network failure', () => {
        cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError');
        
        cy.visit('/products');
        
        cy.get('[data-testid="network-error"]').should('be.visible');
        cy.get('[data-testid="offline-mode"]').should('be.visible');
        cy.get('[data-testid="retry-when-online"]').should('be.visible');
      });

      it('should handle partial API failures', () => {
        // Products load but categories fail
        cy.intercept('GET', '**/api/products', { fixture: 'products.json' });
        cy.intercept('GET', '**/api/categories', { statusCode: 500 });
        
        cy.visit('/products');
        
        cy.get('[data-testid="product-card"]').should('be.visible');
        cy.get('[data-testid="categories-error"]').should('be.visible');
        cy.get('[data-testid="categories-fallback"]').should('be.visible');
      });
    });

    context('Data Validation', () => {
      it('should handle malformed API responses', () => {
        cy.intercept('GET', '**/api/products', { body: 'invalid json' });
        
        cy.visit('/products');
        
        cy.get('[data-testid="data-error"]').should('contain', 'Unable to load products');
        cy.get('[data-testid="contact-support"]').should('be.visible');
      });

      it('should handle missing required fields', () => {
        cy.intercept('GET', '**/api/products', {
          body: {
            products: [
              { id: '1', name: 'Product 1' }, // Missing price
              { id: '2', price: 99.99 }, // Missing name
            ]
          }
        });
        
        cy.visit('/products');
        
        // Should show products with fallback values
        cy.get('[data-testid="product-card"]').should('have.length', 2);
        cy.get('[data-testid="product-name"]').first().should('contain', 'Product 1');
        cy.get('[data-testid="product-price"]').first().should('contain', 'Price unavailable');
      });
    });

    context('Security', () => {
      it('should sanitize user input', () => {
        cy.visit('/products');
        
        // Try XSS in search
        cy.get('[data-testid="search-input"]').type('<script>alert("xss")</script>');
        cy.get('[data-testid="search-button"]').click();
        
        // Should not execute script
        cy.get('[data-testid="search-results"]').should('not.contain', '<script>');
        cy.get('[data-testid="search-term"]').should('contain', '&lt;script&gt;');
      });

      it('should protect against CSRF', () => {
        cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
        
        // Verify CSRF token is included in forms
        cy.visit('/checkout');
        cy.get('[name="csrf_token"]').should('exist').and('have.value');
        
        // Verify API calls include CSRF protection
        cy.intercept('POST', '**/api/orders').as('createOrder');
        cy.fillCheckoutForm();
        cy.get('[data-testid="place-order"]').click();
        
        cy.wait('@createOrder').then((interception) => {
          expect(interception.request.headers).to.have.property('x-csrf-token');
        });
      });
    });

    context('Browser Compatibility', () => {
      it('should work without JavaScript', () => {
        // This would require server-side rendering testing
        cy.visit('/products', { 
          onBeforeLoad: (win) => {
            win.document.querySelector('noscript').style.display = 'block';
          }
        });
        
        cy.get('[data-testid="noscript-message"]').should('be.visible');
        cy.get('[data-testid="basic-product-list"]').should('be.visible');
      });

      it('should handle missing browser features gracefully', () => {
        cy.visit('/products', {
          onBeforeLoad: (win) => {
            // Simulate missing localStorage
            delete win.localStorage;
          }
        });
        
        // Should fallback to session-based cart
        cy.get('[data-testid="product-card"]').first().within(() => {
          cy.get('[data-testid="add-to-cart-button"]').click();
        });
        
        cy.get('[data-testid="cart-count"]').should('contain', '1');
        cy.get('[data-testid="storage-fallback-notice"]').should('be.visible');
      });
    });
  });

  after(() => {
    // Cleanup after all tests
    cy.task('log', 'E-Commerce Test Suite Complete');
    cy.task('generateTestReport');
  });
});