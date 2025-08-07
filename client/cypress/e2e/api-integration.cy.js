describe('API Integration and Data Consistency Tests', () => {
  beforeEach(() => {
    cy.resetTestData();
    cy.seedTestData({
      products: [
        {
          id: 'product-1',
          name: 'Test Product 1',
          price: 99.99,
          stock: 5,
          category: 'Electronics'
        },
        {
          id: 'product-2',
          name: 'Test Product 2',
          price: 149.99,
          stock: 0,
          category: 'Electronics'
        }
      ],
      users: [
        {
          id: 'user-1',
          email: 'test@example.com',
          password: 'password123'
        }
      ]
    });
  });

  describe('Real-time Data Synchronization', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
    });

    it('should reflect inventory changes in real-time', () => {
      cy.visit('/products/product-1');
      cy.get('[data-testid="stock-level"]').should('contain', '5 in stock');
      cy.get('[data-testid="add-to-cart-button"]').should('be.enabled');

      // Simulate stock update from another source
      cy.updateProductStock('product-1', 0);
      
      // Should update UI automatically
      cy.get('[data-testid="stock-level"]').should('contain', 'Out of stock');
      cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
      cy.get('[data-testid="out-of-stock-notification"]').should('be.visible');
    });

    it('should handle cart synchronization across tabs', () => {
      // Add item to cart
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.get('[data-testid="cart-icon-badge"]').should('contain', '1');

      // Open new tab and verify cart sync
      cy.window().then((win) => {
        const newTab = win.open('/cart', '_blank');
        cy.wrap(newTab).its('document').should('exist');
        cy.wrap(newTab).its('document.querySelector("[data-testid=cart-item]")').should('exist');
      });

      // Modify cart in original tab
      cy.visit('/cart');
      cy.get('[data-testid="quantity-increase"]').click();
      
      // Should sync to other tab via WebSocket/localStorage
      cy.window().then((win) => {
        const event = new win.StorageEvent('storage', {
          key: 'cart',
          newValue: JSON.stringify({ totalItems: 2 })
        });
        win.dispatchEvent(event);
      });
    });

    it('should handle price changes during checkout', () => {
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.visit('/checkout');

      // Verify initial price
      cy.get('[data-testid="order-total"]').should('contain', '$109.98'); // $99.99 + tax

      // Simulate price change on server
      cy.intercept('POST', '**/api/orders', (req) => {
        // Modify response to indicate price change
        req.reply({
          statusCode: 409,
          body: {
            error: 'PRICE_CHANGED',
            message: 'Product price has changed',
            updatedItems: [{
              productId: 'product-1',
              oldPrice: 99.99,
              newPrice: 119.99
            }]
          }
        });
      }).as('priceChanged');

      cy.get('[data-testid="place-order-button"]').click();
      cy.wait('@priceChanged');

      // Should show price change modal
      cy.get('[data-testid="price-change-modal"]').should('be.visible');
      cy.get('[data-testid="old-price"]').should('contain', '$99.99');
      cy.get('[data-testid="new-price"]').should('contain', '$119.99');
      cy.get('[data-testid="accept-price-change"]').click();

      // Should update totals and proceed
      cy.get('[data-testid="order-total"]').should('contain', '$131.98'); // $119.99 + tax
    });
  });

  describe('API Error Handling and Recovery', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
    });

    it('should handle API timeout errors', () => {
      cy.intercept('GET', '**/api/products', (req) => {
        req.destroy(); // Simulate timeout
      }).as('timeout');

      cy.visit('/products');
      cy.wait('@timeout');

      cy.get('[data-testid="timeout-error"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Test automatic retry
      cy.intercept('GET', '**/api/products', { fixture: 'products.json' }).as('retry');
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@retry');

      cy.get('[data-testid="product-grid"]').should('be.visible');
    });

    it('should handle rate limiting gracefully', () => {
      cy.intercept('POST', '**/api/cart/items', {
        statusCode: 429,
        body: { message: 'Rate limit exceeded. Please try again in 60 seconds.' }
      }).as('rateLimited');

      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.wait('@rateLimited');

      cy.get('[data-testid="rate-limit-modal"]').should('be.visible');
      cy.get('[data-testid="rate-limit-countdown"]').should('be.visible');

      // Should disable buttons during cooldown
      cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
    });

    it('should handle server maintenance mode', () => {
      cy.intercept('**', {
        statusCode: 503,
        body: { message: 'Service temporarily unavailable for maintenance' }
      }).as('maintenance');

      cy.visit('/products');
      cy.wait('@maintenance');

      cy.get('[data-testid="maintenance-banner"]').should('be.visible');
      cy.get('[data-testid="maintenance-message"]').should('contain', 'temporarily unavailable');
      
      // Should show estimated return time
      cy.get('[data-testid="estimated-return-time"]').should('be.visible');
    });

    it('should handle partial API failures', () => {
      // Product API works but recommendation API fails
      cy.intercept('GET', '**/api/products', { fixture: 'products.json' });
      cy.intercept('GET', '**/api/recommendations/**', {
        statusCode: 500,
        body: { message: 'Recommendation service unavailable' }
      }).as('recommendationError');

      cy.visit('/products/product-1');
      cy.wait('@recommendationError');

      // Main product should load
      cy.get('[data-testid="product-title"]').should('be.visible');
      
      // Recommendations should show fallback
      cy.get('[data-testid="recommendations-fallback"]').should('contain', 'Unable to load recommendations');
      cy.get('[data-testid="popular-products"]').should('be.visible'); // Fallback content
    });
  });

  describe('Data Validation and Integrity', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
    });

    it('should validate product data consistency', () => {
      cy.visit('/products/product-1');
      
      // Verify product data matches API response
      cy.request('/api/products/product-1').then((response) => {
        const product = response.body;
        
        cy.get('[data-testid="product-title"]').should('contain', product.name);
        cy.get('[data-testid="product-price"]').should('contain', `$${product.price}`);
        cy.get('[data-testid="product-category"]').should('contain', product.category);
        
        if (product.stock > 0) {
          cy.get('[data-testid="add-to-cart-button"]').should('be.enabled');
        } else {
          cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
        }
      });
    });

    it('should validate cart calculations', () => {
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      
      cy.visit('/cart');
      
      // Verify calculations match server
      cy.request('/api/cart').then((response) => {
        const cart = response.body;
        
        cy.get('[data-testid="subtotal"]').should('contain', `$${cart.subtotal.toFixed(2)}`);
        cy.get('[data-testid="tax"]').should('contain', `$${cart.tax.toFixed(2)}`);
        cy.get('[data-testid="total"]').should('contain', `$${cart.total.toFixed(2)}`);
        
        // Verify item count
        cy.get('[data-testid="cart-item"]').should('have.length', cart.items.length);
      });
    });

    it('should validate order data integrity', () => {
      // Add item and complete checkout
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.visit('/checkout');
      
      // Fill required fields
      cy.get('[data-testid="card-number-input"]').type('4242424242424242');
      cy.get('[data-testid="expiry-input"]').type('12/25');
      cy.get('[data-testid="cvv-input"]').type('123');
      cy.get('[data-testid="cardholder-name-input"]').type('Test User');
      
      cy.intercept('POST', '**/api/orders').as('createOrder');
      cy.get('[data-testid="place-order-button"]').click();
      cy.wait('@createOrder');

      // Verify order was created with correct data
      cy.get('@createOrder').then((interception) => {
        const orderData = interception.request.body;
        
        expect(orderData.items).to.have.length(1);
        expect(orderData.items[0].productId).to.equal('product-1');
        expect(orderData.total).to.be.a('number');
        expect(orderData.shippingAddress).to.be.an('object');
        expect(orderData.paymentMethod).to.be.an('object');
      });
    });
  });

  describe('Security and Authentication Integration', () => {
    it('should properly handle token refresh', () => {
      cy.login('test@example.com', 'password123');
      
      // Mock expired token scenario
      cy.intercept('GET', '**/api/cart', {
        statusCode: 401,
        body: { message: 'Token expired' }
      }).as('tokenExpired');
      
      // Mock successful token refresh
      cy.intercept('POST', '**/api/auth/refresh', {
        statusCode: 200,
        body: { 
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      }).as('tokenRefresh');
      
      // Mock successful retry with new token
      cy.intercept('GET', '**/api/cart', { fixture: 'cart.json' }).as('cartSuccess');
      
      cy.visit('/cart');
      cy.wait('@tokenExpired');
      cy.wait('@tokenRefresh');
      cy.wait('@cartSuccess');
      
      // Should display cart without redirecting to login
      cy.get('[data-testid="cart-items"]').should('be.visible');
      cy.url().should('include', '/cart');
    });

    it('should prevent unauthorized access to protected routes', () => {
      // Try to access protected route without authentication
      cy.visit('/orders');
      cy.url().should('include', '/login');
      cy.get('[data-testid="auth-required-message"]').should('be.visible');
      
      // Login and verify redirect
      cy.login('test@example.com', 'password123');
      cy.url().should('include', '/orders');
    });

    it('should handle CSRF protection', () => {
      cy.login('test@example.com', 'password123');
      
      // Verify CSRF token is included in requests
      cy.intercept('POST', '**/api/**', (req) => {
        expect(req.headers).to.have.property('x-csrf-token');
      }).as('csrfProtected');
      
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.wait('@csrfProtected');
    });

    it('should validate user permissions for actions', () => {
      cy.login('test@example.com', 'password123');
      
      // Try to access admin-only functionality
      cy.request({
        method: 'POST',
        url: '/api/admin/products',
        body: { name: 'Test Product' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(403);
        expect(response.body.message).to.contain('Insufficient permissions');
      });
    });
  });

  describe('Performance and Caching Integration', () => {
    it('should leverage browser caching effectively', () => {
      cy.visit('/products');
      
      // Check that static assets are cached
      cy.window().then((win) => {
        const performanceEntries = win.performance.getEntriesByType('resource');
        const cachedResources = performanceEntries.filter(entry => 
          entry.transferSize === 0 && entry.decodedBodySize > 0
        );
        
        expect(cachedResources.length).to.be.greaterThan(0);
      });
    });

    it('should implement proper API response caching', () => {
      cy.intercept('GET', '**/api/products', (req) => {
        req.reply((res) => {
          res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
          res.send({ fixture: 'products.json' });
        });
      }).as('productsWithCache');
      
      cy.visit('/products');
      cy.wait('@productsWithCache');
      
      // Second visit should use cached data
      cy.visit('/');
      cy.visit('/products');
      
      // Should not make another API call due to caching
      cy.get('@productsWithCache.all').should('have.length', 1);
    });

    it('should handle offline scenarios gracefully', () => {
      cy.login('test@example.com', 'password123');
      
      // Simulate offline mode
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.visit('/products');
      
      // Should show offline banner
      cy.get('[data-testid="offline-banner"]').should('be.visible');
      cy.get('[data-testid="offline-message"]').should('contain', 'You are currently offline');
      
      // Should disable certain features
      cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
      cy.get('[data-testid="offline-disabled-tooltip"]').should('be.visible');
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    it('should work consistently across different viewport sizes', () => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];
      
      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/products');
        
        // Check responsive layout
        cy.get('[data-testid="product-grid"]').should('be.visible');
        
        if (viewport.name === 'mobile') {
          cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
          cy.get('[data-testid="desktop-navigation"]').should('not.be.visible');
        } else {
          cy.get('[data-testid="desktop-navigation"]').should('be.visible');
        }
      });
    });

    it('should handle touch interactions on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      
      // Test swipe gestures for product carousel
      cy.get('[data-testid="product-carousel"]')
        .trigger('touchstart', { touches: [{ clientX: 300, clientY: 200 }] })
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 200 }] })
        .trigger('touchend');
      
      cy.get('[data-testid="carousel-slide"]').eq(1).should('be.visible');
    });
  });
});