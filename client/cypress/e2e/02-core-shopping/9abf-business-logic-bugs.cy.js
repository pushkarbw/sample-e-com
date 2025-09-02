const testConfig = require('../../fixtures/testData');

describe('9ABF Cart and Checkout Business Logic Failures', () => {
  const testUser = testConfig.defaultUser;

  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.wait(2000);
  });

  it('9ABF should calculate multi-item discount correctly', () => {
    cy.visit('/products');
    cy.get('[data-testid="products-container"]').should('be.visible');
    cy.wait(2000);
    
    cy.get('body').then(($body) => {
      const addToCartButtons = $body.find('button').filter((i, el) => 
        Cypress.$(el).text().includes('Add to Cart')
      );
      
      if (addToCartButtons.length >= 2) {
        cy.wrap(addToCartButtons.eq(0)).click();
        cy.wait(1000);
        cy.wrap(addToCartButtons.eq(1)).click();
        cy.wait(1000);
        
        cy.visit('/cart');
        cy.wait(2000);
        
        cy.get('body').then(($cartBody) => {
          const cartItems = $cartBody.find('[data-testid="cart-item"], .cart-item');
          
          if (cartItems.length >= 2) {
            const subtotalElements = $cartBody.find('[data-testid="order-subtotal"], .subtotal, [class*="subtotal"]');
            const totalElements = $cartBody.find('[data-testid="cart-total"], .total, [class*="total"]');
            
            if (subtotalElements.length > 0 && totalElements.length > 0) {
              const subtotalText = subtotalElements.first().text();
              const totalText = totalElements.first().text();
              
              const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
              const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
              
              const expectedDiscount = subtotal * 0.20;
              const expectedTotal = subtotal - expectedDiscount;
              
              expect(Math.abs(total - expectedTotal)).to.be.lessThan(0.01, 
                `Expected discounted total ${expectedTotal.toFixed(2)} but got ${total.toFixed(2)} - discount logic appears broken`);
            }
          }
        });
      }
    });
  });

  it('9ABF should maintain cart integrity after item removal', () => {
    cy.visit('/products');
    cy.get('body').then(($body) => {
      const addToCartButtons = $body.find('button').filter((i, el) => 
        Cypress.$(el).text().includes('Add to Cart')
      );
      
      if (addToCartButtons.length >= 2) {
        cy.wrap(addToCartButtons.eq(0)).click();
        cy.wait(1000);
        cy.wrap(addToCartButtons.eq(1)).click();
        cy.wait(1000);
        
        cy.visit('/cart');
        cy.wait(2000);
        
        cy.get('[data-testid="cart-total"], .total').then($totalElement => {
          const initialTotal = parseFloat($totalElement.text().replace(/[^0-9.]/g, ''));
          
          cy.get('body').then(($cartBody) => {
            const removeButtons = $cartBody.find('button').filter((i, el) => 
              Cypress.$(el).text().toLowerCase().includes('remove') ||
              Cypress.$(el).text().toLowerCase().includes('delete')
            );
            
            if (removeButtons.length > 0) {
              cy.wrap(removeButtons.first()).click();
              cy.wait(2000);
              
              cy.get('[data-testid="cart-item"], .cart-item').should('have.length.lessThan', 2);
              
              cy.get('[data-testid="cart-total"], .total').then($updatedTotal => {
                const updatedTotal = parseFloat($updatedTotal.text().replace(/[^0-9.]/g, ''));
                
                expect(updatedTotal).to.not.equal(initialTotal, 
                  'Cart total should change after item removal but appears unchanged - removal logic bug');
              });
            }
          });
        });
      }
    });
  });

  it('9ABF should preserve product state after failed cart operations', () => {
    cy.window().then((win) => {
      if (win.fetch) {
        const originalFetch = win.fetch;
        win.fetch = function(url, options) {
          if (url.includes('/api/cart') && options && options.method === 'DELETE') {
            return Promise.reject(new Error('Network error'));
          }
          return originalFetch.apply(this, arguments);
        };
      }
    });
    
    cy.visit('/products');
    cy.get('body').then(($body) => {
      const addToCartButtons = $body.find('button').filter((i, el) => 
        Cypress.$(el).text().includes('Add to Cart')
      );
      
      if (addToCartButtons.length > 0) {
        cy.wrap(addToCartButtons.first()).click();
        cy.wait(1500);
        
        cy.visit('/cart');
        cy.wait(2000);
        
        cy.get('body').then(($cartBody) => {
          const removeButtons = $cartBody.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('remove')
          );
          
          if (removeButtons.length > 0) {
            cy.wrap(removeButtons.first()).click();
            cy.wait(3000);
            
            cy.get('[data-testid="cart-item"], .cart-item').should('have.length', 0, 
              'Cart should optimistically remove item even when API fails - inconsistent state bug');
          }
        });
      }
    });
  });
});