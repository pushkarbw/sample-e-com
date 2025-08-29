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
      
      // TIMING ISSUE: Start typing and submit before form validation is ready
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      
      // TIMING ISSUE: Submit form before password field validation completes
      cy.wait(100); // Too short for form validation setup
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      
      // TIMING ISSUE: Submit immediately without waiting for all validations
      cy.wait(50); // Insufficient for validation state update
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Assert success before API response
      cy.wait(300); // Too short for login API call
      
      // This assertion might fail when login API is slow
      cy.url().should('not.include', '/login', 'Should redirect after successful login');
      
      // Additional check that depends on auth state propagation
      cy.get('body').then(($body) => {
        const userGreeting = $body.find('[data-testid="user-greeting"], .user-name');
        if (userGreeting.length > 0) {
          // This might fail if user state hasn't updated yet
          cy.wrap(userGreeting.first()).should('be.visible').and('not.be.empty');
        }
      });
    });

    it('3TAF should register user with rapid form submission', () => {
      cy.visit('/signup');
      
      // TIMING ISSUE: Fill form rapidly without proper field-by-field validation
      cy.get('#firstName').type(testConfig.newUser.firstName);
      cy.wait(50); // Too short between fields
      
      cy.get('#lastName').type(testConfig.newUser.lastName);
      cy.wait(50);
      
      cy.get('#email').type(testConfig.newUser.email);
      cy.wait(50); // Too short for email format validation
      
      cy.get('#password').type(testConfig.newUser.password);
      cy.wait(50); // Too short for password strength validation
      
      // TIMING ISSUE: Submit before all field validations complete
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Check for success without waiting for registration API
      cy.wait(400); // Too short for user creation API
      
      // This assertion may fail when registration API is slow
      cy.url().should('not.include', '/signup', 'Should redirect after registration');
      
      // Additional check for auto-login after registration
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('welcome') || text.includes('dashboard') || text.includes('profile');
      });
    });
  });

  context('3TAF Shopping Form Dynamic Field Dependencies', () => {
    it('3TAF should interact with checkout form before field dependencies load', () => {
      // Quick login
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(600); // Short wait for login
      
      cy.visit('/checkout');
      
      // TIMING ISSUE: Fill form before conditional fields are rendered
      cy.wait(200); // Too short for form initialization
      
      cy.get('body').then(($body) => {
        const emailInputs = $body.find('input[type="email"], input[name*="email"]');
        const addressInputs = $body.find('input[name*="address"], input[name*="street"]');
        
        if (emailInputs.length > 0) {
          cy.wrap(emailInputs.first()).type('customer@example.com');
        }
        
        if (addressInputs.length > 0) {
          cy.wrap(addressInputs.first()).type('123 Main Street');
          
          // TIMING ISSUE: Select shipping method before options are populated
          cy.wait(100); // Too short for shipping options API
          
          const shippingSelects = $body.find('select[name*="shipping"], select[name*="delivery"]');
          if (shippingSelects.length > 0) {
            // This might fail if shipping options haven't loaded
            cy.wrap(shippingSelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(shippingSelects.first()).select(1);
            
            // TIMING ISSUE: Check shipping cost calculation immediately
            cy.wait(200); // Too short for shipping cost calculation
            
            const shippingCosts = $body.find('[data-testid="shipping-cost"], .shipping-fee');
            if (shippingCosts.length > 0) {
              cy.wrap(shippingCosts.first()).should('be.visible').and('not.be.empty');
            }
          }
        }
      });
    });

    it('3TAF should select payment method before options are available', () => {
      // Login and navigate to checkout quickly
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(500);
      
      cy.visit('/checkout');
      
      // TIMING ISSUE: Try to select payment method before payment provider loads
      cy.wait(300); // Too short for payment integration
      
      cy.get('body').then(($body) => {
        const paymentSelects = $body.find('select[name*="payment"], input[name*="payment"]');
        
        if (paymentSelects.length > 0) {
          // TIMING ISSUE: Select payment method before validation is ready
          if (paymentSelects.first().prop('tagName') === 'SELECT') {
            cy.wrap(paymentSelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(paymentSelects.first()).select(1);
          } else {
            cy.wrap(paymentSelects.first()).check();
          }
          
          // TIMING ISSUE: Fill payment details before form fields are enabled
          cy.wait(150); // Too short for payment form initialization
          
          const cardInputs = $body.find('input[name*="card"], input[placeholder*="card"]');
          if (cardInputs.length > 0) {
            // This might fail if payment fields aren't enabled yet
            cy.wrap(cardInputs.first()).should('be.enabled');
            cy.wrap(cardInputs.first()).type('4111111111111111');
            
            // Try to fill expiry and CVV rapidly
            const expiryInputs = $body.find('input[name*="expiry"], input[placeholder*="MM/YY"]');
            const cvvInputs = $body.find('input[name*="cvv"], input[placeholder*="CVV"]');
            
            if (expiryInputs.length > 0) {
              cy.wrap(expiryInputs.first()).type('12/25');
            }
            if (cvvInputs.length > 0) {
              cy.wrap(cvvInputs.first()).type('123');
            }
            
            // TIMING ISSUE: Submit payment before validation completes
            cy.wait(200); // Too short for payment validation
            
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
      
      // TIMING ISSUE: Start typing search immediately without waiting for page ready
      cy.wait(200); // Too short for search initialization
      
      cy.get('body').then(($body) => {
        const searchInputs = $body.find('input[placeholder*="search"], input[placeholder*="Search"]');
        
        if (searchInputs.length > 0) {
          // TIMING ISSUE: Type and expect autocomplete immediately
          cy.wrap(searchInputs.first()).type('comp');
          
          // TIMING ISSUE: Check for autocomplete dropdown too quickly
          cy.wait(100); // Too short for autocomplete API
          
          const dropdownElements = $body.find('.dropdown, .suggestions, [data-testid="suggestions"]');
          if (dropdownElements.length > 0) {
            // This might fail if suggestions haven't loaded yet
            cy.wrap(dropdownElements.first()).should('be.visible');
            
            const suggestionItems = $body.find('.suggestion-item, .dropdown-item');
            if (suggestionItems.length > 0) {
              cy.wrap(suggestionItems.first()).should('be.visible');
              
              // TIMING ISSUE: Click suggestion before it's fully interactive
              cy.wait(50); // Too short for suggestion item to be clickable
              cy.wrap(suggestionItems.first()).click();
              
              // TIMING ISSUE: Check search results immediately
              cy.wait(300); // Too short for search results API
              
              cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
            }
          } else {
            // No autocomplete - try direct search
            cy.wrap(searchInputs.first()).type('{enter}');
            cy.wait(400);
            
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          }
        }
      });
    });

    it('3TAF should use filters with cascading dropdown dependencies', () => {
      cy.visit('/products');
      
      // TIMING ISSUE: Interact with filters before options are loaded
      cy.wait(250); // Too short for filter options API
      
      cy.get('body').then(($body) => {
        const categorySelects = $body.find('select[name*="category"]');
        const subcategorySelects = $body.find('select[name*="subcategory"]');
        
        if (categorySelects.length > 0) {
          // TIMING ISSUE: Select category before options are populated
          cy.wrap(categorySelects.first()).find('option').should('have.length.greaterThan', 1);
          cy.wrap(categorySelects.first()).select(1);
          
          // TIMING ISSUE: Immediately try to use subcategory that depends on category
          cy.wait(150); // Too short for subcategory options to load
          
          if (subcategorySelects.length > 0) {
            // This might fail if subcategory options haven't loaded yet
            cy.wrap(subcategorySelects.first()).should('be.enabled');
            cy.wrap(subcategorySelects.first()).find('option').should('have.length.greaterThan', 1);
            cy.wrap(subcategorySelects.first()).select(1);
            
            // TIMING ISSUE: Check filtered results before API call completes
            cy.wait(200); // Too short for filtered results
            
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          }
          
          // TIMING ISSUE: Apply additional filters rapidly
          const priceRangeInputs = $body.find('input[name*="price"], input[type="range"]');
          if (priceRangeInputs.length > 0) {
            cy.wrap(priceRangeInputs.first()).clear().type('100');
            cy.wait(100); // Too short for price filter
            
            const brandCheckboxes = $body.find('input[name*="brand"], input[type="checkbox"]');
            if (brandCheckboxes.length > 0) {
              cy.wrap(brandCheckboxes.first()).check();
              cy.wait(100); // Too short for brand filter
              
              // Check final filtered results
              cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
            }
          }
        }
      });
    });
  });

  context('3TAF Profile and Settings Form Timing', () => {
    it('3TAF should update profile before user data loads', () => {
      // Quick login
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Navigate to profile too quickly
      cy.wait(400); // Too short for user session establishment
      
      cy.visit('/profile', { failOnStatusCode: false });
      
      // TIMING ISSUE: Try to edit profile before user data loads
      cy.wait(200); // Too short for profile data API
      
      cy.get('body').then(($body) => {
        const profileForm = $body.find('form, [data-testid="profile-form"]');
        
        if (profileForm.length > 0) {
          const nameInputs = $body.find('input[name*="name"], input[name*="first"]');
          const emailInputs = $body.find('input[name*="email"], input[type="email"]');
          
          if (nameInputs.length > 0) {
            // TIMING ISSUE: Edit fields before they're populated with user data
            cy.wrap(nameInputs.first()).clear().type('Updated Name');
          }
          
          if (emailInputs.length > 0) {
            // This might fail if user email hasn't loaded yet
            cy.wrap(emailInputs.first()).should('have.value').and('not.be.empty');
          }
          
          // TIMING ISSUE: Save profile changes before form is fully ready
          cy.wait(150); // Too short for form validation setup
          
          const saveButtons = $body.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('save') ||
            Cypress.$(el).text().toLowerCase().includes('update')
          );
          
          if (saveButtons.length > 0) {
            cy.wrap(saveButtons.first()).should('be.enabled');
            cy.wrap(saveButtons.first()).click();
            
            // TIMING ISSUE: Check for success message immediately
            cy.wait(300); // Too short for save API
            
            // This might fail if save operation hasn't completed
            cy.get('body').should('satisfy', ($body) => {
              const text = $body.text().toLowerCase();
              return text.includes('saved') || text.includes('updated') || text.includes('success');
            });
          }
        }
      });
    });

    it('3TAF should change password with validation timing issues', () => {
      // Login quickly
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(500);
      
      cy.visit('/profile', { failOnStatusCode: false });
      
      // TIMING ISSUE: Try to change password before form is ready
      cy.wait(250); // Too short for password form initialization
      
      cy.get('body').then(($body) => {
        const currentPasswordInputs = $body.find('input[name*="current"], input[name*="old"]');
        const newPasswordInputs = $body.find('input[name*="new"], input[name*="password"]').not('[name*="current"]').not('[name*="old"]');
        const confirmPasswordInputs = $body.find('input[name*="confirm"]');
        
        if (currentPasswordInputs.length > 0 && newPasswordInputs.length > 0) {
          // TIMING ISSUE: Fill password fields rapidly without validation waits
          cy.wrap(currentPasswordInputs.first()).type(testConfig.defaultUser.password);
          cy.wait(50); // Too short for current password validation
          
          cy.wrap(newPasswordInputs.first()).type('NewPassword123!');
          cy.wait(50); // Too short for password strength validation
          
          if (confirmPasswordInputs.length > 0) {
            cy.wrap(confirmPasswordInputs.first()).type('NewPassword123!');
            cy.wait(50); // Too short for password match validation
          }
          
          // TIMING ISSUE: Submit before all validations complete
          const changePasswordButtons = $body.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('change') ||
            Cypress.$(el).text().toLowerCase().includes('update')
          );
          
          if (changePasswordButtons.length > 0) {
            cy.wrap(changePasswordButtons.first()).should('be.enabled');
            cy.wrap(changePasswordButtons.first()).click();
            
            // TIMING ISSUE: Check for success without waiting for API
            cy.wait(250); // Too short for password change API
            
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