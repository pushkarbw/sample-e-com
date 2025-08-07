describe('Cart and Checkout Flow', () => {
  const testProducts = [
    {
      id: 'product-1',
      name: 'Laptop Computer',
      price: 999.99,
      category: 'Electronics',
      stock: 10,
      imageUrl: '/images/laptop.jpg'
    },
    {
      id: 'product-2',
      name: 'Wireless Mouse',
      price: 29.99,
      category: 'Electronics', 
      stock: 50,
      imageUrl: '/images/mouse.jpg'
    }
  ];

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 1,
        price: 999.99,
        product: testProducts[0]
      },
      {
        id: 'item-2',
        productId: 'product-2',
        quantity: 2,
        price: 29.99,
        product: testProducts[1]
      }
    ],
    totalItems: 3,
    totalPrice: 1059.97,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    cy.resetTestData();
    cy.login();
  });

  describe('Cart Management', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: mockCart
      }).as('getCart');
    });

    it('should display cart items correctly', () => {
      cy.visit('/cart');
      cy.wait('@getCart');

      // Verify cart header
      cy.get('[data-testid="cart-title"]').should('contain', 'Shopping Cart (3 items)');

      // Verify each cart item
      cy.get('[data-testid="cart-item"]').should('have.length', 2);
      
      cy.get('[data-testid="cart-item"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('contain', 'Laptop Computer');
        cy.get('[data-testid="product-price"]').should('contain', '$999.99');
        cy.get('[data-testid="quantity-input"]').should('have.value', '1');
        cy.get('[data-testid="item-total"]').should('contain', '$999.99');
      });

      // Verify cart totals
      cy.get('[data-testid="cart-subtotal"]').should('contain', '$1,059.97');
      cy.get('[data-testid="cart-total"]').should('contain', '$1,059.97');
    });

    it('should update item quantities', () => {
      cy.intercept('PUT', '**/api/cart/item-1', {
        statusCode: 200,
        body: { ...mockCart.items[0], quantity: 2 }
      }).as('updateQuantity');

      cy.visit('/cart');
      cy.wait('@getCart');

      // Increase quantity
      cy.get('[data-testid="cart-item"]').first().within(() => {
        cy.get('[data-testid="increase-quantity"]').click();
      });

      cy.wait('@updateQuantity');
      
      // Verify API call was made with correct data
      cy.get('@updateQuantity').should((interception) => {
        expect(interception.request.body).to.deep.equal({ quantity: 2 });
      });
    });

    it('should remove items from cart', () => {
      cy.intercept('DELETE', '**/api/cart/item-1', {
        statusCode: 200,
        body: { message: 'Item removed from cart' }
      }).as('removeItem');

      cy.visit('/cart');
      cy.wait('@getCart');

      cy.get('[data-testid="cart-item"]').first().within(() => {
        cy.get('[data-testid="remove-item"]').click();
      });

      // Confirm removal in modal
      cy.get('[data-testid="confirm-remove-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-remove-button"]').click();

      cy.wait('@removeItem');
      
      // Verify item is removed from UI
      cy.get('[data-testid="cart-item"]').should('have.length', 1);
    });

    it('should clear entire cart', () => {
      cy.intercept('DELETE', '**/api/cart', {
        statusCode: 200,
        body: { message: 'Cart cleared' }
      }).as('clearCart');

      cy.visit('/cart');
      cy.wait('@getCart');

      cy.get('[data-testid="clear-cart-button"]').click();
      
      // Confirm in modal
      cy.get('[data-testid="confirm-clear-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-clear-button"]').click();

      cy.wait('@clearCart');
      
      // Verify empty cart state
      cy.get('[data-testid="empty-cart-message"]').should('be.visible');
      cy.get('[data-testid="continue-shopping-button"]').should('be.visible');
    });

    it('should handle empty cart state', () => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: { items: [], totalItems: 0, totalPrice: 0 }
      }).as('getEmptyCart');

      cy.visit('/cart');
      cy.wait('@getEmptyCart');

      cy.get('[data-testid="empty-cart-message"]').should('contain', 'Your cart is empty');
      cy.get('[data-testid="continue-shopping-button"]').should('be.visible');
      
      // Test continue shopping navigation
      cy.get('[data-testid="continue-shopping-button"]').click();
      cy.url().should('include', '/products');
    });

    it('should validate quantity constraints', () => {
      cy.visit('/cart');
      cy.wait('@getCart');

      cy.get('[data-testid="cart-item"]').first().within(() => {
        // Test minimum quantity (should not go below 1)
        cy.get('[data-testid="quantity-input"]').clear().type('0');
        cy.get('[data-testid="quantity-input"]').should('have.value', '1');

        // Test maximum quantity (should not exceed stock)
        cy.get('[data-testid="quantity-input"]').clear().type('15');
        cy.get('[data-testid="quantity-input"]').should('have.value', '10');
      });
    });

    it('should calculate taxes and shipping', () => {
      const cartWithTaxAndShipping = {
        ...mockCart,
        subtotal: 1059.97,
        tax: 84.80,
        shipping: 9.99,
        totalPrice: 1154.76
      };

      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: cartWithTaxAndShipping
      }).as('getCartWithTax');

      cy.visit('/cart');
      cy.wait('@getCartWithTax');

      cy.get('[data-testid="cart-subtotal"]').should('contain', '$1,059.97');
      cy.get('[data-testid="cart-tax"]').should('contain', '$84.80');
      cy.get('[data-testid="cart-shipping"]').should('contain', '$9.99');
      cy.get('[data-testid="cart-total"]').should('contain', '$1,154.76');
    });
  });

  describe('Checkout Process', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: mockCart
      }).as('getCart');
    });

    it('should complete full checkout flow', () => {
      const mockOrder = {
        id: 'order-123',
        status: 'confirmed',
        total: 1059.97,
        items: mockCart.items
      };

      cy.intercept('POST', '**/api/orders', {
        statusCode: 201,
        body: mockOrder
      }).as('createOrder');

      cy.visit('/checkout');
      cy.wait('@getCart');

      // Verify checkout page loads correctly
      cy.get('[data-testid="checkout-title"]').should('contain', 'Checkout');
      cy.get('[data-testid="order-summary"]').should('be.visible');

      // Fill shipping form
      cy.fillCheckoutForm({
        phone: '(555) 123-4567',
        street: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'United States'
      });

      // Submit order
      cy.get('[data-testid="place-order-button"]').click();
      cy.wait('@createOrder');

      // Verify order confirmation
      cy.url().should('include', '/orders/order-123');
      cy.get('[data-testid="order-confirmation"]').should('be.visible');
      cy.get('[data-testid="order-number"]').should('contain', 'order-123');
    });

    it('should validate shipping form fields', () => {
      cy.visit('/checkout');
      cy.wait('@getCart');

      // Submit empty form
      cy.get('[data-testid="place-order-button"]').click();

      // Verify validation errors
      cy.get('[data-testid="phone-error"]').should('contain', 'Phone number is required');
      cy.get('[data-testid="street-error"]').should('contain', 'Street address is required');
      cy.get('[data-testid="city-error"]').should('contain', 'City is required');
      cy.get('[data-testid="state-error"]').should('contain', 'State is required');
      cy.get('[data-testid="zipCode-error"]').should('contain', 'ZIP code is required');

      // Test field format validations
      cy.get('[data-testid="phone-input"]').type('123');
      cy.get('[data-testid="zipCode-input"]').type('123');
      cy.get('[data-testid="place-order-button"]').click();

      cy.get('[data-testid="phone-error"]').should('contain', 'Please enter a valid phone number');
      cy.get('[data-testid="zipCode-error"]').should('contain', 'Please enter a valid ZIP code');
    });

    it('should redirect to cart if cart is empty', () => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: { items: [], totalItems: 0, totalPrice: 0 }
      }).as('getEmptyCart');

      cy.visit('/checkout');
      cy.wait('@getEmptyCart');

      cy.url().should('include', '/cart');
    });

    it('should handle checkout errors gracefully', () => {
      cy.intercept('POST', '**/api/orders', {
        statusCode: 400,
        body: { message: 'Payment processing failed' }
      }).as('orderError');

      cy.visit('/checkout');
      cy.wait('@getCart');

      cy.fillCheckoutForm();
      cy.get('[data-testid="place-order-button"]').click();
      cy.wait('@orderError');

      // Verify error handling
      cy.get('[data-testid="checkout-error"]').should('contain', 'Payment processing failed');
      cy.get('[data-testid="place-order-button"]').should('not.be.disabled');
    });

    it('should show loading state during order processing', () => {
      cy.intercept('POST', '**/api/orders', (req) => {
        req.reply((res) => {
          // Simulate slow response
          setTimeout(() => {
            res.send({ statusCode: 201, body: { id: 'order-123' } });
          }, 2000);
        });
      }).as('slowOrder');

      cy.visit('/checkout');
      cy.wait('@getCart');

      cy.fillCheckoutForm();
      cy.get('[data-testid="place-order-button"]').click();

      // Verify loading state
      cy.get('[data-testid="place-order-button"]')
        .should('be.disabled')
        .and('contain', 'Processing...');
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
    });

    it('should preserve form data on page refresh', () => {
      cy.visit('/checkout');
      cy.wait('@getCart');

      // Fill partial form data
      cy.get('[data-testid="phone-input"]').type('(555) 123-4567');
      cy.get('[data-testid="street-input"]').type('123 Main St');

      // Refresh page
      cy.reload();
      cy.wait('@getCart');

      // Verify form data is preserved
      cy.get('[data-testid="phone-input"]').should('have.value', '(555) 123-4567');
      cy.get('[data-testid="street-input"]').should('have.value', '123 Main St');
    });
  });

  describe('Order History', () => {
    const mockOrders = [
      {
        id: 'order-1',
        status: 'delivered',
        total: 1059.97,
        createdAt: '2024-01-15T10:30:00Z',
        items: mockCart.items
      },
      {
        id: 'order-2',
        status: 'processing',
        total: 299.99,
        createdAt: '2024-01-20T14:20:00Z',
        items: [mockCart.items[1]]
      }
    ];

    beforeEach(() => {
      cy.intercept('GET', '**/api/orders', {
        statusCode: 200,
        body: mockOrders
      }).as('getOrders');
    });

    it('should display order history correctly', () => {
      cy.visit('/orders');
      cy.wait('@getOrders');

      cy.get('[data-testid="orders-title"]').should('contain', 'Order History');
      cy.get('[data-testid="order-card"]').should('have.length', 2);

      // Verify first order
      cy.get('[data-testid="order-card"]').first().within(() => {
        cy.get('[data-testid="order-id"]').should('contain', 'order-1');
        cy.get('[data-testid="order-status"]').should('contain', 'Delivered');
        cy.get('[data-testid="order-total"]').should('contain', '$1,059.97');
        cy.get('[data-testid="order-date"]').should('contain', 'Jan 15, 2024');
      });
    });

    it('should filter orders by status', () => {
      cy.visit('/orders');
      cy.wait('@getOrders');

      // Filter by delivered status
      cy.get('[data-testid="status-filter"]').select('delivered');
      
      cy.get('[data-testid="order-card"]').should('have.length', 1);
      cy.get('[data-testid="order-card"]').should('contain', 'order-1');
    });

    it('should navigate to order details', () => {
      cy.intercept('GET', '**/api/orders/order-1', {
        statusCode: 200,
        body: mockOrders[0]
      }).as('getOrderDetails');

      cy.visit('/orders');
      cy.wait('@getOrders');

      cy.get('[data-testid="order-card"]').first().within(() => {
        cy.get('[data-testid="view-details-button"]').click();
      });

      cy.url().should('include', '/orders/order-1');
      cy.wait('@getOrderDetails');

      cy.get('[data-testid="order-details"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: mockCart
      }).as('getCart');
    });

    it('should display cart properly on mobile', () => {
      cy.setViewport('mobile');
      cy.visit('/cart');
      cy.wait('@getCart');

      // Verify mobile layout
      cy.get('[data-testid="cart-container"]').should('have.class', 'mobile-layout');
      cy.get('[data-testid="cart-item"]').should('have.class', 'mobile-item');
    });

    it('should adapt checkout form for tablet', () => {
      cy.setViewport('tablet');
      cy.visit('/checkout');
      cy.wait('@getCart');

      cy.get('[data-testid="checkout-form"]').should('have.class', 'tablet-layout');
      cy.get('[data-testid="order-summary"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cart', {
        statusCode: 200,
        body: mockCart
      }).as('getCart');
    });

    it('should be accessible on cart page', () => {
      cy.visit('/cart');
      cy.wait('@getCart');
      cy.checkA11y();
    });

    it('should be accessible on checkout page', () => {
      cy.visit('/checkout');
      cy.wait('@getCart');
      cy.checkA11y();
    });

    it('should support keyboard navigation in cart', () => {
      cy.visit('/cart');
      cy.wait('@getCart');

      // Tab through cart items
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'quantity-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'remove-item');
    });
  });
});