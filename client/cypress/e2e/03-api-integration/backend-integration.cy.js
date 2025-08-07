describe('🔗 API Integration & Backend Communication', () => {
  const testConfig = {
    apiBaseUrl: Cypress.env('API_BASE_URL') || 'http://localhost:3001/api',
    defaultUser: {
      email: 'shopper@example.com',
      password: 'password123'
    }
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  context('Product API Integration', () => {
    it('should fetch products with proper error handling', () => {
      // Test successful API call
      cy.intercept('GET', '**/api/products', { fixture: 'products.json' }).as('getProducts');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      
      // Test API error handling
      cy.intercept('GET', '**/api/products', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getProductsError');
      
      cy.reload();
      cy.wait('@getProductsError');
      
      cy.get('[data-testid="api-error-message"]').should('contain', 'Failed to load products');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle product search API', () => {
      cy.intercept('GET', '**/api/products/search*', {
        body: {
          products: [
            { id: 1, name: 'Wireless Headphones', price: 199.99, category: 'Electronics' }
          ],
          total: 1,
          page: 1
        }
      }).as('searchProducts');
      
      cy.visit('/products');
      cy.get('[data-testid="search-input"]').type('headphones');
      cy.get('[data-testid="search-button"]').click();
      
      cy.wait('@searchProducts').then((interception) => {
        expect(interception.request.url).to.include('q=headphones');
      });
      
      cy.get('[data-testid="product-card"]').should('have.length', 1);
    });

    it('should handle pagination API calls', () => {
      cy.intercept('GET', '**/api/products?page=1*', { fixture: 'products-page-1.json' }).as('getPage1');
      cy.intercept('GET', '**/api/products?page=2*', { fixture: 'products-page-2.json' }).as('getPage2');
      
      cy.visit('/products');
      cy.wait('@getPage1');
      
      cy.get('[data-testid="pagination-next"]').click();
      cy.wait('@getPage2');
      
      cy.url().should('include', 'page=2');
    });

    it('should handle product detail API', () => {
      const productId = 'product-123';
      
      cy.intercept('GET', `**/api/products/${productId}`, {
        body: {
          id: productId,
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          images: ['image1.jpg', 'image2.jpg'],
          stock: 10
        }
      }).as('getProductDetail');
      
      cy.visit(`/products/${productId}`);
      cy.wait('@getProductDetail');
      
      cy.get('[data-testid="product-title"]').should('contain', 'Test Product');
      cy.get('[data-testid="product-price"]').should('contain', '$99.99');
    });
  });

  context('Cart API Integration', () => {
    beforeEach(() => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
    });

    it('should sync cart with backend', () => {
      cy.intercept('POST', '**/api/cart/add', {
        statusCode: 200,
        body: { success: true, cartCount: 1 }
      }).as('addToCart');
      
      cy.intercept('GET', '**/api/cart', {
        body: {
          items: [
            { id: 1, productId: 'product-1', quantity: 1, price: 199.99 }
          ],
          total: 199.99
        }
      }).as('getCart');
      
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      
      cy.wait('@addToCart').then((interception) => {
        expect(interception.request.body).to.deep.include({
          productId: 'product-1',
          quantity: 1
        });
      });
      
      cy.visit('/cart');
      cy.wait('@getCart');
      
      cy.get('[data-testid="cart-item"]').should('have.length', 1);
    });

    it('should handle cart update API', () => {
      cy.intercept('PUT', '**/api/cart/update', {
        statusCode: 200,
        body: { success: true }
      }).as('updateCart');
      
      cy.visit('/cart');
      
      cy.get('[data-testid="quantity-input"]').first().clear().type('3');
      cy.get('[data-testid="update-quantity"]').first().click();
      
      cy.wait('@updateCart').then((interception) => {
        expect(interception.request.body.quantity).to.equal(3);
      });
    });

    it('should handle cart removal API', () => {
      cy.intercept('DELETE', '**/api/cart/remove/*', {
        statusCode: 200,
        body: { success: true }
      }).as('removeFromCart');
      
      cy.visit('/cart');
      
      cy.get('[data-testid="remove-item"]').first().click();
      cy.get('[data-testid="confirm-remove"]').click();
      
      cy.wait('@removeFromCart');
    });
  });

  context('Order API Integration', () => {
    beforeEach(() => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
    });

    it('should create order through API', () => {
      const orderData = {
        orderId: 'ORDER-123',
        total: 199.99,
        status: 'confirmed'
      };
      
      cy.intercept('POST', '**/api/orders', {
        statusCode: 201,
        body: orderData
      }).as('createOrder');
      
      cy.visit('/checkout');
      cy.fillCheckoutForm();
      cy.get('[data-testid="place-order"]').click();
      
      cy.wait('@createOrder').then((interception) => {
        expect(interception.request.body).to.have.property('shippingAddress');
        expect(interception.request.body).to.have.property('paymentMethod');
      });
      
      cy.url().should('include', '/order-confirmation');
      cy.get('[data-testid="order-number"]').should('contain', 'ORDER-123');
    });

    it('should fetch order history', () => {
      cy.intercept('GET', '**/api/orders/user/*', {
        body: [
          {
            id: 'ORDER-123',
            date: '2023-01-15',
            total: 199.99,
            status: 'delivered',
            items: [
              { name: 'Wireless Headphones', quantity: 1, price: 199.99 }
            ]
          }
        ]
      }).as('getOrders');
      
      cy.visit('/orders');
      cy.wait('@getOrders');
      
      cy.get('[data-testid="order-item"]').should('have.length', 1);
      cy.get('[data-testid="order-status"]').should('contain', 'delivered');
    });

    it('should handle payment processing API', () => {
      cy.intercept('POST', '**/api/payment/process', {
        statusCode: 200,
        body: {
          success: true,
          transactionId: 'TXN-456',
          paymentStatus: 'completed'
        }
      }).as('processPayment');
      
      cy.visit('/checkout');
      cy.fillCheckoutForm();
      cy.get('[data-testid="place-order"]').click();
      
      cy.wait('@processPayment').then((interception) => {
        expect(interception.request.body).to.have.property('amount');
        expect(interception.request.body).to.have.property('cardToken');
      });
    });
  });

  context('User API Integration', () => {
    it('should authenticate user through API', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: testConfig.defaultUser.email,
            name: 'Test User'
          }
        }
      }).as('loginUser');
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type(testConfig.defaultUser.email);
      cy.get('[data-testid="password-input"]').type(testConfig.defaultUser.password);
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@loginUser').then((interception) => {
        expect(interception.request.body).to.deep.include({
          email: testConfig.defaultUser.email,
          password: testConfig.defaultUser.password
        });
      });
      
      cy.url().should('not.include', '/login');
    });

    it('should register user through API', () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      };
      
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 201,
        body: { success: true, message: 'User created successfully' }
      }).as('registerUser');
      
      cy.visit('/signup');
      cy.get('[data-testid="email-input"]').type(newUser.email);
      cy.get('[data-testid="password-input"]').type(newUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(newUser.password);
      cy.get('[data-testid="first-name-input"]').type(newUser.firstName);
      cy.get('[data-testid="last-name-input"]').type(newUser.lastName);
      cy.get('[data-testid="terms-checkbox"]').check();
      cy.get('[data-testid="signup-button"]').click();
      
      cy.wait('@registerUser').then((interception) => {
        expect(interception.request.body.email).to.equal(newUser.email);
        expect(interception.request.body.firstName).to.equal(newUser.firstName);
      });
    });

    it('should update user profile through API', () => {
      cy.intercept('PUT', '**/api/user/profile', {
        statusCode: 200,
        body: { success: true, message: 'Profile updated' }
      }).as('updateProfile');
      
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      cy.visit('/profile');
      
      cy.get('[data-testid="edit-profile-button"]').click();
      cy.get('[data-testid="first-name-input"]').clear().type('Updated');
      cy.get('[data-testid="save-profile-button"]').click();
      
      cy.wait('@updateProfile').then((interception) => {
        expect(interception.request.body.firstName).to.equal('Updated');
      });
    });
  });

  context('Error Handling & Retry Logic', () => {
    it('should handle network timeouts', () => {
      cy.intercept('GET', '**/api/products', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res.networkError('Timeout')), 5000);
          });
        });
      }).as('timeoutRequest');
      
      cy.visit('/products');
      
      cy.get('[data-testid="loading-spinner"]', { timeout: 6000 }).should('be.visible');
      cy.get('[data-testid="timeout-error"]', { timeout: 8000 }).should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should retry failed requests', () => {
      let callCount = 0;
      cy.intercept('GET', '**/api/products', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({ statusCode: 500, body: { error: 'Server error' } });
        } else {
          req.reply({ fixture: 'products.json' });
        }
      }).as('retryRequest');
      
      cy.visit('/products');
      cy.get('[data-testid="retry-button"]').click();
      
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '**/api/cart/add', {
        statusCode: 429,
        body: { error: 'Too many requests' }
      }).as('rateLimited');
      
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      
      cy.wait('@rateLimited');
      cy.get('[data-testid="rate-limit-error"]').should('contain', 'Too many requests');
    });

    it('should validate API response structure', () => {
      cy.intercept('GET', '**/api/products', {
        body: { invalid: 'response' } // Invalid structure
      }).as('invalidResponse');
      
      cy.visit('/products');
      cy.wait('@invalidResponse');
      
      cy.get('[data-testid="data-error"]').should('contain', 'Invalid data format');
    });
  });

  context('Real-time Features', () => {
    it('should handle stock updates via WebSocket', () => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      cy.visit('/products/product-1');
      
      // Mock WebSocket stock update
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('stockUpdate', {
          detail: { productId: 'product-1', stock: 0 }
        }));
      });
      
      cy.get('[data-testid="out-of-stock"]').should('be.visible');
      cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
    });

    it('should handle order status updates', () => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      cy.visit('/orders');
      
      // Mock order status update
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('orderStatusUpdate', {
          detail: { orderId: 'ORDER-123', status: 'shipped' }
        }));
      });
      
      cy.get('[data-testid="order-status"]').should('contain', 'shipped');
    });
  });
});