describe('🛒 3TAF Form Interactions - Async Timing Issues', () => {
  const testConfig = {
    defaultUser: {
      email: 'john@example.com',
      password: 'password123'
    },
    newUser: {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User'
    }
  };

  beforeEach(() => {
    cy.clearAllStorage();
  });

  context('3TAF Authentication Form Timing Dependencies', () => {
    it('3TAF should submit login form before validation completes', () => {
      cy.visit('/login');
      
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      
      cy.wait(100);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      
      cy.wait(50);
      cy.get('button[type="submit"]').click();
      
      cy.wait(300);
      
      cy.url().should('not.include', '/login', 'Should redirect after successful login');
      
      cy.get('body').then(($body) => {
        const userGreeting = $body.find('[data-testid="user-greeting"], .user-name');
        if (userGreeting.length > 0) {
          cy.wrap(userGreeting.first()).should('be.visible').and('not.be.empty');
        }
      });
    });

    it('3TAF should register user with rapid form submission', () => {
      cy.visit('/signup');
      
      cy.get('#firstName').type(testConfig.newUser.firstName);
      cy.wait(50);
      
      cy.get('#lastName').type(testConfig.newUser.lastName);
      cy.wait(50);
      
      cy.get('#email').type(testConfig.newUser.email);
      cy.wait(50);
      
      cy.get('#password').type(testConfig.newUser.password);
      cy.wait(50);
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(400);
      
      cy.url().should('not.include', '/signup', 'Should redirect after registration');
      
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('welcome') || text.includes('dashboard') || text.includes('profile');
      });
    });
  });

  context('3TAF Shopping Form Dynamic Field Dependencies', () => {
    it('3TAF should interact with checkout form before field dependencies load', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(600);
      
      cy.visit('/checkout');
      
      cy.wait(200);
      
      cy.get('body').then(($body) => {
        const emailInputs = $body.find('input[type="email"], input[name*="email"]');
        const addressInputs = $body.find('input[name*="address"], input[name*="street"]');
        
        if (emailInputs.length > 0) {
          cy.wrap(emailInputs.first()).type('customer@example.com');
        }
        
        if (addressInputs.length > 0) {
          cy.wrap(addressInputs.first()).type('123 Main Street');
          
          cy.wait(100);
          
          const shippingSelects = $body.find('select[name*="shipping"], select[name*="delivery"]');
          if (shippingSelects.length > 0) {
            cy.wrap(shippingSelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(shippingSelects.first()).select(1);
            
            cy.wait(200);
            
            const shippingCosts = $body.find('[data-testid="shipping-cost"], .shipping-fee');
            if (shippingCosts.length > 0) {
              cy.wrap(shippingCosts.first()).should('be.visible').and('not.be.empty');
            }
          }
        }
      });
    });

    it('3TAF should select payment method before options are available', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(500);
      
      cy.visit('/checkout');
      
      cy.wait(300);
      
      cy.get('body').then(($body) => {
        const paymentSelects = $body.find('select[name*="payment"], input[name*="payment"]');
        
        if (paymentSelects.length > 0) {
          if (paymentSelects.first().prop('tagName') === 'SELECT') {
            cy.wrap(paymentSelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(paymentSelects.first()).select(1);
          } else {
            cy.wrap(paymentSelects.first()).check();
          }
          
          cy.wait(150);
          
          const cardInputs = $body.find('input[name*="card"], input[placeholder*="card"]');
          if (cardInputs.length > 0) {
            cy.wrap(cardInputs.first()).should('be.enabled');
            cy.wrap(cardInputs.first()).type('4111111111111111');
            
            const expiryInputs = $body.find('input[name*="expiry"], input[placeholder*="MM/YY"]');
            const cvvInputs = $body.find('input[name*="cvv"], input[placeholder*="CVV"]');
            
            if (expiryInputs.length > 0) {
              cy.wrap(expiryInputs.first()).type('12/25');
            }
            if (cvvInputs.length > 0) {
              cy.wrap(cvvInputs.first()).type('123');
            }
            
            cy.wait(200);
            
            const submitButtons = $body.find('button[type="submit"], button').filter((i, el) => 
              Cypress.$(el).text().toLowerCase().includes('place') ||
              Cypress.$(el).text().toLowerCase().includes('order')
            );
            
            if (submitButtons.length > 0) {
              cy.wrap(submitButtons.first()).should('be.enabled');
            }
          }
        }
      });
    });
  });

  context('3TAF Search Form Real-time Dependencies', () => {
    it('3TAF should search with autocomplete before suggestions load', () => {
      cy.visit('/products');
      
      cy.wait(200);
      
      cy.get('body').then(($body) => {
        const searchInputs = $body.find('input[placeholder*="search"], input[placeholder*="Search"]');
        
        if (searchInputs.length > 0) {
          cy.wrap(searchInputs.first()).type('comp');
          
          cy.wait(100);
          
          const dropdownElements = $body.find('.dropdown, .suggestions, [data-testid="suggestions"]');
          if (dropdownElements.length > 0) {
            cy.wrap(dropdownElements.first()).should('be.visible');
            
            const suggestionItems = $body.find('.suggestion-item, .dropdown-item');
            if (suggestionItems.length > 0) {
              cy.wrap(suggestionItems.first()).should('be.visible');
              
              cy.wait(50);
              cy.wrap(suggestionItems.first()).click();
              
              cy.wait(300);
              
              cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
            }
          } else {
            cy.wrap(searchInputs.first()).type('{enter}');
            cy.wait(400);
            
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          }
        }
      });
    });

    it('3TAF should use filters with cascading dropdown dependencies', () => {
      cy.visit('/products');
      
      cy.wait(250);
      
      cy.get('body').then(($body) => {
        const categorySelects = $body.find('select[name*="category"]');
        const subcategorySelects = $body.find('select[name*="subcategory"]');
        
        if (categorySelects.length > 0) {
          cy.wrap(categorySelects.first()).find('option').should('have.length.greaterThan', 1);
          cy.wrap(categorySelects.first()).select(1);
          
          cy.wait(150);
          
          if (subcategorySelects.length > 0) {
            cy.wrap(subcategorySelects.first()).should('be.enabled');
            cy.wrap(subcategorySelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(subcategorySelects.first()).select(1);
            
            cy.wait(200);
            
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          }
          
          const priceRangeInputs = $body.find('input[name*="price"], input[type="range"]');
          if (priceRangeInputs.length > 0) {
            cy.wrap(priceRangeInputs.first()).clear().type('100');
            cy.wait(100);
            
            const brandCheckboxes = $body.find('input[name*="brand"], input[type="checkbox"]');
            if (brandCheckboxes.length > 0) {
              cy.wrap(brandCheckboxes.first()).check();
              cy.wait(100);
              
              cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
            }
          }
        }
      });
    });
  });

  context('3TAF Profile and Settings Form Timing', () => {
    it('3TAF should update profile before user data loads', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait(400);
      
      cy.visit('/profile', { failOnStatusCode: false });
      
      cy.wait(200);
      
      cy.get('body').then(($body) => {
        const profileForm = $body.find('form, [data-testid="profile-form"]');
        
        if (profileForm.length > 0) {
          const nameInputs = $body.find('input[name*="name"], input[name*="first"]');
          const emailInputs = $body.find('input[name*="email"], input[type="email"]');
          
          if (nameInputs.length > 0) {
            cy.wrap(nameInputs.first()).clear().type('Updated Name');
          }
          
          if (emailInputs.length > 0) {
            cy.wrap(emailInputs.first()).should('have.value').and('not.be.empty');
          }
          
          cy.wait(150);
          
          const saveButtons = $body.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('save') ||
            Cypress.$(el).text().toLowerCase().includes('update')
          );
          
          if (saveButtons.length > 0) {
            cy.wrap(saveButtons.first()).should('be.enabled');
            cy.wrap(saveButtons.first()).click();
            
            cy.wait(300);
            
            cy.get('body').should('satisfy', ($body) => {
              const text = $body.text().toLowerCase();
              return text.includes('saved') || text.includes('updated') || text.includes('success');
            });
          }
        }
      });
    });

    it('3TAF should change password with validation timing issues', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(500);
      
      cy.visit('/profile', { failOnStatusCode: false });
      
      cy.wait(250);
      
      cy.get('body').then(($body) => {
        const currentPasswordInputs = $body.find('input[name*="current"], input[name*="old"]');
        const newPasswordInputs = $body.find('input[name*="new"], input[name*="password"]').not('[name*="current"]').not('[name*="old"]');
        const confirmPasswordInputs = $body.find('input[name*="confirm"]');
        
        if (currentPasswordInputs.length > 0 && newPasswordInputs.length > 0) {
          cy.wrap(currentPasswordInputs.first()).type(testConfig.defaultUser.password);
          cy.wait(50);
          
          cy.wrap(newPasswordInputs.first()).type('NewPassword123!');
          cy.wait(50);
          
          if (confirmPasswordInputs.length > 0) {
            cy.wrap(confirmPasswordInputs.first()).type('NewPassword123!');
            cy.wait(50);
          }
          
          const changePasswordButtons = $body.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('change') ||
            Cypress.$(el).text().toLowerCase().includes('update')
          );
          
          if (changePasswordButtons.length > 0) {
            cy.wrap(changePasswordButtons.first()).should('be.enabled');
            cy.wrap(changePasswordButtons.first()).click();
            
            cy.wait(250);
            
            cy.get('body').should('satisfy', ($body) => {
              const text = $body.text().toLowerCase();
              return text.includes('password') && (text.includes('changed') || text.includes('updated'));
            });
          }
        }
      });
    });
  });
});