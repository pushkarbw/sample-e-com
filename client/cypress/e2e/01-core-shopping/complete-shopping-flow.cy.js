describe('🛒 Core Shopping Functionality', () => {
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
    cy.task('log', 'Starting Core Shopping Tests');
    cy.task('resetDb');
    cy.task('seedDb', testConfig.testProducts);
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  context('Product Discovery', () => {
    it('should display products with proper loading states', () => {
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
      
      cy.get('[data-testid="products-loading"]').should('be.visible');
      cy.get('[data-testid="skeleton-loader"]').should('have.length.at.least', 3);
      
      cy.wait('@getProducts');
      
      cy.get('[data-testid="products-loading"]').should('not.exist');
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      cy.get('[data-testid="product-image"]').should('be.visible');
      cy.get('[data-testid="product-name"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
    });

    it('should handle product search with filters', () => {
      cy.visit('/products');
      
      cy.get('[data-testid="search-input"]').type('headphones');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="product-card"]').should('contain', 'Wireless Headphones');
      cy.get('[data-testid="search-results-count"]').should('contain', '1');
      
      cy.get('[data-testid="category-filter"]').select('Electronics');
      cy.get('[data-testid="apply-filters"]').click();
      
      cy.get('[data-testid="product-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Electronics');
      });
      
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
      
      cy.url().should('include', '/products/');
      cy.get('[data-testid="product-title"]').should('be.visible');
      cy.get('[data-testid="product-description"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
      cy.get('[data-testid="product-images"]').should('be.visible');
      cy.get('[data-testid="add-to-cart-button"]').should('be.visible');
      cy.get('[data-testid="quantity-selector"]').should('be.visible');
    });
  });

  context('Shopping Cart Operations', () => {
    beforeEach(() => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
    });

    it('should add products to cart with quantity management', () => {
      cy.visit('/products');
      
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click();
      });
      
      cy.get('[data-testid="cart-notification"]').should('contain', 'Added to cart');
      cy.get('[data-testid="cart-count"]').should('contain', '1');
      
      cy.get('[data-testid="product-card"]').eq(1).click();
      cy.get('[data-testid="quantity-selector"]').clear().type('3');
      cy.get('[data-testid="add-to-cart-button"]').click();
      
      cy.get('[data-testid="cart-count"]').should('contain', '4');
      
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="cart-items"]').should('have.length', 2);
      
      cy.get('[data-testid="cart-item"]').first().within(() => {
        cy.get('[data-testid="quantity-increase"]').click();
        cy.get('[data-testid="item-quantity"]').should('contain', '2');
      });
      
      cy.get('[data-testid="cart-total"]').should('be.visible');
    });

    it('should handle cart persistence across sessions', () => {
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      
      cy.reload();
      cy.get('[data-testid="cart-count"]').should('contain', '1');
      
      cy.logout();
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      
      cy.get('[data-testid="cart-count"]').should('contain', '1');
    });

    it('should remove items from cart', () => {
      cy.visit('/products');
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click();
      });
      cy.get('[data-testid="product-card"]').eq(1).within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click();
      });
      
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="cart-item"]').first().within(() => {
        cy.get('[data-testid="remove-item"]').click();
      });
      
      cy.get('[data-testid="confirm-remove"]').click();
      cy.get('[data-testid="cart-items"]').should('have.length', 1);
      cy.get('[data-testid="cart-count"]').should('contain', '1');
      
      cy.get('[data-testid="clear-cart"]').click();
      cy.get('[data-testid="confirm-clear"]').click();
      cy.get('[data-testid="empty-cart-message"]').should('be.visible');
    });
  });

  context('Checkout Process', () => {
    beforeEach(() => {
      cy.login(testConfig.defaultUser.email, testConfig.defaultUser.password);
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
    });

    it('should complete full checkout flow', () => {
      cy.visit('/checkout');
      
      cy.get('[data-testid="checkout-form"]').should('be.visible');
      cy.get('[data-testid="order-summary"]').should('be.visible');
      cy.get('[data-testid="shipping-section"]').should('be.visible');
      cy.get('[data-testid="payment-section"]').should('be.visible');
      
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="address"]').type('123 Test Street');
      cy.get('[data-testid="city"]').type('Test City');
      cy.get('[data-testid="postal-code"]').type('12345');
      cy.get('[data-testid="country"]').select('United States');
      
      cy.get('[data-testid="card-number"]').type('4242424242424242');
      cy.get('[data-testid="expiry-date"]').type('12/25');
      cy.get('[data-testid="cvv"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('John Doe');
      
      cy.get('[data-testid="order-total"]').should('contain', '$');
      
      cy.get('[data-testid="place-order"]').click();
      
      cy.url().should('include', '/order-confirmation');
      cy.get('[data-testid="order-success"]').should('be.visible');
      cy.get('[data-testid="order-number"]').should('be.visible');
    });

    it('should validate checkout form fields', () => {
      cy.visit('/checkout');
      
      cy.get('[data-testid="place-order"]').click();
      
      cy.get('[data-testid="first-name-error"]').should('contain', 'required');
      cy.get('[data-testid="address-error"]').should('contain', 'required');
      cy.get('[data-testid="card-number-error"]').should('contain', 'required');
      
      cy.get('[data-testid="card-number"]').type('1234');
      cy.get('[data-testid="card-number-error"]').should('contain', 'invalid');
      
      cy.get('[data-testid="expiry-date"]').type('01/20');
      cy.get('[data-testid="expiry-error"]').should('contain', 'expired');
    });

    it('should handle payment failures gracefully', () => {
      cy.intercept('POST', '**/api/orders', {
        statusCode: 402,
        body: { error: 'Payment declined' }
      }).as('paymentError');
      
      cy.visit('/checkout');
      cy.fillCheckoutForm();
      cy.get('[data-testid="place-order"]').click();
      
      cy.wait('@paymentError');
      
      cy.get('[data-testid="payment-error"]').should('contain', 'Payment declined');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
      cy.url().should('include', '/checkout');
    });
  });

  afterEach(() => {
    cy.cleanupTestData();
  });
});