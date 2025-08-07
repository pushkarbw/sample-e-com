describe('🛒 Core Shopping - Cart & Checkout', () => {
  const testConfig = {
    testUser: {
      email: 'test@example.com',
      password: 'Test123!'
    },
    testProducts: [
      { id: 'product-1', name: 'Wireless Headphones', price: 199.99 },
      { id: 'product-2', name: 'Running Shoes', price: 89.99 },
      { id: 'product-3', name: 'Coffee Mug', price: 15.99 }
    ]
  };

  before(() => {
    cy.task('log', 'Setting up cart and checkout tests');
    cy.task('seedDb', testConfig.testProducts);
  });

  beforeEach(() => {
    cy.clearAllStorage();
    cy.loginAsTestUser();
  });

  context('Shopping Cart Operations', () => {
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
      cy.loginAsTestUser();
      
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

    it('should calculate cart totals correctly', () => {
      cy.visit('/products');
      
      // Add products with known prices
      cy.get('[data-testid="product-card"]').each(($card, index) => {
        if (index < 2) { // Add first 2 products
          cy.wrap($card).within(() => {
            cy.get('[data-testid="add-to-cart-button"]').click();
          });
        }
      });
      
      cy.get('[data-testid="cart-icon"]').click();
      
      // Verify subtotal calculation
      cy.get('[data-testid="cart-subtotal"]').then($subtotal => {
        const subtotal = parseFloat($subtotal.text().replace('$', ''));
        expect(subtotal).to.equal(289.98); // 199.99 + 89.99
      });
      
      // Verify tax calculation
      cy.get('[data-testid="cart-tax"]').should('be.visible');
      
      // Verify total calculation
      cy.get('[data-testid="cart-total"]').should('be.visible');
    });
  });

  context('Checkout Process', () => {
    beforeEach(() => {
      // Add a product to cart for checkout tests
      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
    });

    it('should complete checkout with valid information', () => {
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="checkout-button"]').click();
      
      // Verify checkout page
      cy.url().should('include', '/checkout');
      cy.get('[data-testid="checkout-form"]').should('be.visible');
      
      // Fill shipping information
      cy.get('[data-testid="shipping-address"]').within(() => {
        cy.get('[data-testid="first-name"]').type('John');
        cy.get('[data-testid="last-name"]').type('Doe');
        cy.get('[data-testid="address-line-1"]').type('123 Main St');
        cy.get('[data-testid="city"]').type('Anytown');
        cy.get('[data-testid="state"]').select('CA');
        cy.get('[data-testid="zip-code"]').type('12345');
        cy.get('[data-testid="phone"]').type('555-123-4567');
      });
      
      // Select shipping method
      cy.get('[data-testid="shipping-method"]').within(() => {
        cy.get('[data-value="standard"]').click();
      });
      
      // Fill payment information
      cy.get('[data-testid="payment-section"]').within(() => {
        cy.get('[data-testid="card-number"]').type('4111111111111111');
        cy.get('[data-testid="expiry-date"]').type('12/25');
        cy.get('[data-testid="cvv"]').type('123');
        cy.get('[data-testid="cardholder-name"]').type('John Doe');
      });
      
      // Review order
      cy.get('[data-testid="order-summary"]').should('be.visible');
      cy.get('[data-testid="order-total"]').should('contain', '$');
      
      // Place order
      cy.get('[data-testid="place-order"]').click();
      
      // Verify order confirmation
      cy.get('[data-testid="order-confirmation"]').should('be.visible');
      cy.get('[data-testid="order-number"]').should('be.visible');
      cy.url().should('include', '/order-confirmation');
    });

    it('should handle different payment methods', () => {
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="checkout-button"]').click();
      
      // Fill required shipping info quickly
      cy.fillShippingInfo();
      
      // Test credit card payment
      cy.get('[data-testid="payment-method-card"]').click();
      cy.get('[data-testid="card-form"]').should('be.visible');
      
      // Test PayPal payment
      cy.get('[data-testid="payment-method-paypal"]').click();
      cy.get('[data-testid="paypal-button"]').should('be.visible');
      
      // Test Apple Pay (if available)
      cy.get('body').then($body => {
        if ($body.find('[data-testid="payment-method-apple-pay"]').length > 0) {
          cy.get('[data-testid="payment-method-apple-pay"]').click();
          cy.get('[data-testid="apple-pay-button"]').should('be.visible');
        }
      });
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="checkout-button"]').click();
      
      // Try to proceed without filling required fields
      cy.get('[data-testid="place-order"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="first-name-error"]').should('contain', 'required');
      cy.get('[data-testid="address-error"]').should('contain', 'required');
      cy.get('[data-testid="payment-error"]').should('be.visible');
      
      // Fill partial info and test field-specific validation
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').blur();
      cy.get('[data-testid="last-name-error"]').should('contain', 'required');
      
      // Test email validation
      cy.get('[data-testid="email"]').type('invalid-email');
      cy.get('[data-testid="email"]').blur();
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
      
      // Test phone validation
      cy.get('[data-testid="phone"]').type('123');
      cy.get('[data-testid="phone"]').blur();
      cy.get('[data-testid="phone-error"]').should('contain', 'valid phone');
    });

    it('should calculate shipping costs correctly', () => {
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="checkout-button"]').click();
      
      cy.fillShippingInfo();
      
      // Test different shipping methods
      cy.get('[data-testid="shipping-standard"]').click();
      cy.get('[data-testid="shipping-cost"]').should('contain', '$5.99');
      
      cy.get('[data-testid="shipping-express"]').click();
      cy.get('[data-testid="shipping-cost"]').should('contain', '$12.99');
      
      cy.get('[data-testid="shipping-overnight"]').click();
      cy.get('[data-testid="shipping-cost"]').should('contain', '$24.99');
      
      // Verify total updates with shipping
      cy.get('[data-testid="order-total"]').then($total => {
        const total = parseFloat($total.text().replace('$', ''));
        expect(total).to.be.greaterThan(199.99); // Product price + shipping
      });
    });

    it('should handle promo codes and discounts', () => {
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="checkout-button"]').click();
      
      cy.fillShippingInfo();
      
      // Test invalid promo code
      cy.get('[data-testid="promo-code-input"]').type('INVALID');
      cy.get('[data-testid="apply-promo"]').click();
      cy.get('[data-testid="promo-error"]').should('contain', 'Invalid code');
      
      // Test valid promo code
      cy.get('[data-testid="promo-code-input"]').clear().type('SAVE10');
      cy.get('[data-testid="apply-promo"]').click();
      cy.get('[data-testid="promo-success"]').should('contain', 'Applied successfully');
      cy.get('[data-testid="discount-amount"]').should('contain', '$');
      
      // Verify total is reduced
      cy.get('[data-testid="order-total"]').then($total => {
        const total = parseFloat($total.text().replace('$', ''));
        expect(total).to.be.lessThan(199.99);
      });
      
      // Test removing promo code
      cy.get('[data-testid="remove-promo"]').click();
      cy.get('[data-testid="discount-amount"]').should('not.exist');
    });
  });

  context('Order Management', () => {
    it('should display order history', () => {
      // First complete an order
      cy.completeTestOrder();
      
      // Navigate to orders page
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="orders-link"]').click();
      
      cy.url().should('include', '/orders');
      cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
      
      // Verify order details
      cy.get('[data-testid="order-item"]').first().within(() => {
        cy.get('[data-testid="order-number"]').should('be.visible');
        cy.get('[data-testid="order-date"]').should('be.visible');
        cy.get('[data-testid="order-status"]').should('be.visible');
        cy.get('[data-testid="order-total"]').should('contain', '$');
      });
    });

    it('should allow order tracking', () => {
      cy.completeTestOrder();
      cy.visit('/orders');
      
      cy.get('[data-testid="order-item"]').first().within(() => {
        cy.get('[data-testid="track-order"]').click();
      });
      
      cy.get('[data-testid="tracking-info"]').should('be.visible');
      cy.get('[data-testid="tracking-status"]').should('be.visible');
      cy.get('[data-testid="estimated-delivery"]').should('be.visible');
    });

    it('should handle order cancellation', () => {
      cy.completeTestOrder();
      cy.visit('/orders');
      
      cy.get('[data-testid="order-item"]').first().within(() => {
        cy.get('[data-testid="cancel-order"]').click();
      });
      
      cy.get('[data-testid="cancel-confirmation"]').should('be.visible');
      cy.get('[data-testid="cancel-reason"]').select('changed-mind');
      cy.get('[data-testid="confirm-cancel"]').click();
      
      cy.get('[data-testid="cancel-success"]').should('be.visible');
      cy.get('[data-testid="order-status"]').should('contain', 'Cancelled');
    });
  });
});