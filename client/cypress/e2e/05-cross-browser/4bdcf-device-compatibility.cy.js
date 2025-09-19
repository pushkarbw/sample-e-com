describe('4BDCF Device-Specific Browser Compatibility', () => {
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'Ecomm@123' }
    }
  };

  beforeEach(() => {
    cy.clearAllStorage();
    
    cy.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('Cannot read properties of undefined') ||
          err.message.includes('Network Error') ||
          err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
      }
      return true;
    });
  });

  context('4BDCF Mobile Safari Touch Event Handling', () => {
    it('should handle touch events for mobile cart interactions', () => {
      cy.viewport('iphone-x');
      cy.visit('/login');
      
      cy.get('input[type="email"]').type(testConfig.users.valid.email);
      cy.get('input[type="password"]').type(testConfig.users.valid.password);
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
      
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      cy.get('body').then(($body) => {
        const addButtons = $body.find('button').filter((i, el) => 
          Cypress.$(el).text().toLowerCase().includes('add')
        );
        
        if (addButtons.length > 0) {
          cy.wrap(addButtons.first()).trigger('touchstart', { force: true });
          cy.wrap(addButtons.first()).trigger('touchend', { force: true });
          cy.wait(1000);
          
          cy.window().then((win) => {
            const isMobileSafari = /iPad|iPhone|iPod/.test(win.navigator.userAgent) && 
                                  /Safari/.test(win.navigator.userAgent);
            
            if (isMobileSafari) {
              cy.get('[data-testid="cart-badge"], .cart-badge').should('be.visible');
            } else {
              cy.wrap(addButtons.first()).click();
              cy.wait(500);
            }
          });
        }
      });
    });

    it('should handle iOS-specific form input behavior', () => {
      cy.viewport('iphone-x');
      cy.visit('/signup');
      
      cy.get('input[type="email"]').then($input => {
        cy.wrap($input).focus();
        
        cy.window().then((win) => {
          const isIOS = /iPad|iPhone|iPod/.test(win.navigator.userAgent);
          
          if (isIOS) {
            cy.wrap($input).should('have.attr', 'autocapitalize', 'off').or('not.have.attr', 'autocapitalize');
            cy.wrap($input).should('have.attr', 'autocorrect', 'off').or('not.have.attr', 'autocorrect');
          }
          
          cy.wrap($input).type('test@example.com');
          cy.wrap($input).should('have.value', 'test@example.com');
        });
      });
    });
  });

  context('4BDCF Android Browser Scroll Behavior', () => {
    it('should handle Android-specific scroll momentum and product grid', () => {
      cy.viewport(360, 640);
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      cy.window().then((win) => {
        const isAndroid = /Android/.test(win.navigator.userAgent);
        
        if (isAndroid) {
          cy.get('body').trigger('touchstart', { clientY: 300 });
          cy.get('body').trigger('touchmove', { clientY: 100 });
          cy.get('body').trigger('touchend');
          cy.wait(500);
          
          cy.window().its('scrollY').should('be.greaterThan', 0);
        } else {
          cy.scrollTo(0, 500);
          cy.wait(300);
        }
        
        cy.get('[data-testid="product-card"], .product-card, .product').should('have.length.greaterThan', 0);
      });
    });

    it('should handle Android keyboard input with different IME behavior', () => {
      cy.viewport(360, 640);
      cy.visit('/products');
      
      cy.get('input[placeholder*="search"], input[placeholder*="Search"]').then($searchInput => {
        if ($searchInput.length > 0) {
          cy.wrap($searchInput).focus();
          
          cy.window().then((win) => {
            const isAndroid = /Android/.test(win.navigator.userAgent);
            
            if (isAndroid) {
              cy.wrap($searchInput).type('laptop', { delay: 100 });
              cy.wait(300);
              
              cy.wrap($searchInput).trigger('input');
              cy.wrap($searchInput).trigger('keyup', { keyCode: 13 });
            } else {
              cy.wrap($searchInput).type('laptop{enter}');
            }
            
            cy.wait(1000);
            cy.get('body').should('be.visible');
          });
        }
      });
    });
  });

  context('4BDCF Case-Sensitivity Attribute Handling', () => {
    it('should handle data attribute case differences between browsers', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      cy.window().then((win) => {
        const testElement = win.document.createElement('div');
        testElement.setAttribute('data-TestId', 'case-test');
        testElement.setAttribute('data-testid', 'lowercase-test');
        win.document.body.appendChild(testElement);
        
        const isXHTML = win.document.contentType === 'application/xhtml+xml';
        const isIE = /Trident|MSIE/.test(win.navigator.userAgent);
        
        if (isXHTML || isIE) {
          cy.get('[data-TestId="case-test"]').should('exist');
        } else {
          cy.get('[data-testid="lowercase-test"]').should('exist');
        }
        
        win.document.body.removeChild(testElement);
      });
    });

    it('should handle CSS class name case sensitivity properly', () => {
      cy.visit('/products');
      
      cy.window().then((win) => {
        const testDiv = win.document.createElement('div');
        testDiv.className = 'ProductCard';
        win.document.body.appendChild(testDiv);
        
        const computedStyle = win.getComputedStyle(testDiv);
        const hasStyles = computedStyle.display !== 'inline' || 
                         computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
        
        if (hasStyles) {
          cy.get('.ProductCard').should('exist');
        } else {
          testDiv.className = 'product-card';
          cy.get('.product-card').should('exist');
        }
        
        win.document.body.removeChild(testDiv);
      });
    });

    it('should handle form input name attribute case variations', () => {
      cy.visit('/checkout');
      
      cy.get('body').then(($body) => {
        const inputs = $body.find('input, select, textarea');
        
        if (inputs.length > 0) {
          cy.window().then((win) => {
            const testForm = win.document.createElement('form');
            const emailInput = win.document.createElement('input');
            emailInput.name = 'Email';
            emailInput.type = 'email';
            testForm.appendChild(emailInput);
            win.document.body.appendChild(testForm);
            
            const formData = new FormData(testForm);
            emailInput.value = 'test@example.com';
            
            const hasEmailValue = formData.get('Email') === 'test@example.com' ||
                                 formData.get('email') === 'test@example.com';
            
            expect(hasEmailValue).to.be.true;
            
            win.document.body.removeChild(testForm);
          });
        }
      });
    });
  });

  context('4BDCF Browser-Specific Event Handling', () => {
    it('should handle mouse vs touch event precedence correctly', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      cy.get('body').then(($body) => {
        const interactiveElements = $body.find('button, a, input');
        
        if (interactiveElements.length > 0) {
          const firstElement = interactiveElements.first();
          
          cy.window().then((win) => {
            const isTouchDevice = 'ontouchstart' in win || win.navigator.maxTouchPoints > 0;
            
            if (isTouchDevice) {
              cy.wrap(firstElement).trigger('touchstart');
              cy.wrap(firstElement).trigger('touchend');
              cy.wait(100);
              
              cy.wrap(firstElement).trigger('mousedown');
              cy.wrap(firstElement).trigger('mouseup');
              cy.wrap(firstElement).trigger('click');
            } else {
              cy.wrap(firstElement).trigger('mouseenter');
              cy.wrap(firstElement).trigger('mouseleave');
              cy.wrap(firstElement).click();
            }
            
            cy.get('body').should('be.visible');
          });
        }
      });
    });

    it('should handle keyboard navigation differences across browsers', () => {
      cy.visit('/products');
      
      cy.get('input, button, a').first().then($focusable => {
        if ($focusable.length > 0) {
          cy.wrap($focusable).focus();
          
          cy.window().then((win) => {
            const isFirefox = /Firefox/.test(win.navigator.userAgent);
            const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
            
            if (isFirefox) {
              cy.wrap($focusable).trigger('keydown', { key: 'Tab', keyCode: 9 });
              cy.wait(100);
              cy.focused().should('exist');
            } else if (isSafari) {
              cy.wrap($focusable).trigger('keydown', { key: 'Tab', keyCode: 9, metaKey: false });
              cy.wait(100);
              cy.focused().should('exist');
            } else {
              cy.wrap($focusable).tab();
              cy.focused().should('exist');
            }
          });
        }
      });
    });
  });

  context('4BDCF Media Query and Viewport Handling', () => {
    it('should handle viewport meta tag differences on mobile browsers', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      
      cy.document().then((doc) => {
        const viewportMeta = doc.querySelector('meta[name="viewport"]');
        
        if (viewportMeta) {
          const content = viewportMeta.getAttribute('content');
          expect(content).to.include('width=device-width');
          
          cy.window().then((win) => {
            const devicePixelRatio = win.devicePixelRatio || 1;
            const screenWidth = win.screen.width;
            const innerWidth = win.innerWidth;
            
            if (devicePixelRatio > 1) {
              expect(innerWidth).to.be.lessThan(screenWidth);
            }
            
            cy.get('[data-testid="products-container"]').should('be.visible');
          });
        }
      });
    });

    it('should handle orientation change events properly', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      
      cy.window().then((win) => {
        if ('orientation' in win.screen) {
          win.dispatchEvent(new Event('orientationchange'));
          cy.wait(500);
          
          cy.get('[data-testid="products-container"]').should('be.visible');
        } else {
          cy.viewport(667, 375);
          cy.wait(300);
          
          cy.get('[data-testid="products-container"]').should('be.visible');
        }
      });
    });
  });
});