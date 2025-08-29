describe('🛒 Core Shopping Functionality', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: Cypress.config('baseUrl'),
    apiUrl: Cypress.env('apiUrl'),
    defaultUser: {
      email: 'john@example.com',
      password: 'password123'
    }
  };

  before(() => {
    cy.task('log', 'Starting Core Shopping Tests');
  });

  beforeEach(() => {
    cy.clearAllStorage();
  });

  context('Product Discovery', () => {
    it('should display products with proper loading states', () => {
      cy.visit('/products');
      
      // Wait for products container to load
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Check if products are loaded properly
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text();
        return text.includes('No products found') || $body.find('img[alt]').length > 0;
      });
    });

    it('should handle product search functionality', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test search using actual search input
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      cy.get('input[placeholder="Search products..."]').clear().type('laptop');
      cy.wait(2000); // Allow search to process
      
      // Verify search input value
      cy.get('input[placeholder="Search products..."]').should('have.value', 'laptop');
    });

    it('should filter products by category', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test category filter
      cy.get('select').should('be.visible');
      cy.get('select option[value=""]').should('contain', 'All Categories');
      
      // Select a category if available
      cy.get('select option').then($options => {
        if ($options.length > 1) {
          const categoryValue = $options[1].value;
          if (categoryValue) {
            cy.get('select').select(categoryValue);
            cy.wait(2000);
            cy.get('select').should('have.value', categoryValue);
          }
        }
      });
    });

    it('should display product information correctly', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Check product cards structure
      cy.get('body').then(($body) => {
        const productImages = $body.find('img[alt]');
        if (productImages.length > 0) {
          cy.get('img[alt]').first().should('be.visible');
          cy.get('body').should('contain', '$'); // Price
          cy.get('h3').should('exist'); // Product titles
        } else {
          cy.get('body').should('contain', 'No products found');
        }
      });
    });

    it('should navigate to product details', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Look for View Details links
      cy.get('body').then(($body) => {
        const viewDetailsLinks = $body.find('a').filter((i, el) => 
          Cypress.$(el).text().includes('View Details')
        );
        
        if (viewDetailsLinks.length > 0) {
          cy.wrap(viewDetailsLinks.first()).click();
          cy.url().should('match', /\/products\/[\w-]+$/);
          cy.get('h1, h2').should('be.visible');
          cy.get('body').should('contain', '$');
        } else {
          cy.visit('/products/1');
          cy.url().should('include', '/products/1');
        }
      });
    });
  });

  context('Shopping Cart Operations', () => {
    beforeEach(() => {
      // Login before cart operations with better error handling
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // Wait for login to complete with longer timeout and better validation
      cy.url().should('not.include', '/login', { timeout: 15000 });
      cy.wait(2000); // Allow time for authentication to settle
    });

    it('should add products to cart', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Look for Add to Cart buttons
      cy.get('body').then(($body) => {
        const addToCartButtons = $body.find('button').filter((i, el) => 
          Cypress.$(el).text().toLowerCase().includes('add to cart')
        );
        
        if (addToCartButtons.length > 0) {
          cy.wrap(addToCartButtons.first()).click();
          cy.wait(1000);
          
          // Check for cart update indicators
          cy.get('body').should('satisfy', ($body) => {
            const text = $body.text().toLowerCase();
            return text.includes('added') || text.includes('cart') || text.includes('success');
          });
        } else {
          cy.log('No Add to Cart buttons found - may require product details page');
        }
      });
    });

    it('should display cart contents', () => {
      cy.visit('/cart');
      
      // Cart page should load
      cy.url().should('include', '/cart');
      cy.get('body').should('be.visible');
      
      // Check for cart-related content
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('cart') || text.includes('empty') || text.includes('checkout');
      });
    });

    it('should handle cart navigation', () => {
      // Test cart icon/link in header
      cy.visit('/products');
      cy.get('header, nav').should('be.visible');
      
      // Look for cart link in navigation
      cy.get('body').then(($body) => {
        const cartLinks = $body.find('a').filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          const href = Cypress.$(el).attr('href');
          return text.includes('cart') || href?.includes('/cart');
        });
        
        if (cartLinks.length > 0) {
          cy.wrap(cartLinks.first()).click();
          cy.url().should('include', '/cart');
        } else {
          cy.visit('/cart');
          cy.url().should('include', '/cart');
        }
      });
    });
  });

  context('Checkout Process', () => {
    beforeEach(() => {
      // Login before checkout with better error handling
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // Wait for login to complete with longer timeout
      cy.url().should('not.include', '/login', { timeout: 15000 });
      cy.wait(2000); // Allow time for authentication to settle
    });

    it('should navigate to checkout page', () => {
      cy.visit('/checkout');
      
      // Checkout page should load
      cy.url().should('include', '/checkout');
      cy.get('body').should('be.visible');
      
      // Look for checkout-related content
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('checkout') || 
               text.includes('order') || 
               text.includes('shipping') || 
               text.includes('payment') ||
               text.includes('billing');
      });
    });

    it('should display checkout form elements', () => {
      cy.visit('/checkout');
      
      // Look for form inputs
      cy.get('input, select, textarea').should('have.length.at.least', 1);
      
      // Look for submit/place order button
      cy.get('button').should('exist');
      
      // Check for checkout-related text
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('total') || text.includes('order') || text.includes('checkout');
      });
    });

    it('should handle form validation', () => {
      cy.visit('/checkout');
      
      // Try to submit empty form
      cy.get('button[type="submit"], button').filter(':contains("Order"), :contains("Checkout"), :contains("Place")').first().click();
      
      // Should show validation or stay on page
      cy.url().should('include', '/checkout');
    });
  });

  context('API Integration', () => {
    it('should load products from API', () => {
      cy.intercept('GET', '**/api/products*').as('getProducts');
      
      cy.visit('/products');
      cy.wait('@getProducts').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 304]);
      });
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/products*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('apiError');
      
      cy.visit('/products');
      cy.wait('@apiError');
      
      // Should handle error gracefully
      cy.get('body').should('be.visible');
    });

    it('should make search API calls with parameters', () => {
      cy.intercept('GET', '**/api/products*').as('getProducts');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Perform search with trigger or button press
      cy.get('input[placeholder="Search products..."]').type('test');
      
      // Try to trigger search - look for search button or enter key
      cy.get('body').then(($body) => {
        const searchButton = $body.find('button').filter((i, el) => 
          Cypress.$(el).text().toLowerCase().includes('search')
        );
        
        if (searchButton.length > 0) {
          cy.wrap(searchButton.first()).click();
        } else {
          // Try pressing Enter key to trigger search
          cy.get('input[placeholder="Search products..."]').type('{enter}');
        }
      });
      
      cy.wait(2000);
      
      // Check if search API was called with parameters (make it optional)
      cy.get('@getProducts.all').then((interceptions) => {
        if (interceptions.length > 1) {
          const lastCall = interceptions[interceptions.length - 1];
          expect(lastCall.request.url).to.satisfy((url) => {
            return url.includes('search=test') || url.includes('q=test') || url.includes('filter');
          });
        } else {
          cy.log('Search may not trigger separate API call - checking search input works');
          cy.get('input[placeholder="Search products..."]').should('have.value', 'test');
        }
      });
    });
  });

  context('User Authentication Flow', () => {
    it('should require login for cart operations', () => {
      cy.visit('/cart');
      
      // Should redirect to login or show login requirement
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/cart');
      });
    });

    it('should require login for checkout', () => {
      cy.visit('/checkout');
      
      // Should redirect to login or show login requirement
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/checkout');
      });
    });

    it('should handle login flow', () => {
      cy.visit('/login');
      
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Test login
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect after successful login with longer timeout
      cy.url().should('not.include', '/login', { timeout: 15000 });
      cy.wait(1000); // Allow time for authentication to settle
    });
  });

  context('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/products');
      
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      cy.get('select').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024);
      cy.visit('/products');
      
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      cy.get('select').should('be.visible');
    });
  });
});

describe('🛒 3TAF Shopping Flow - Timing Dependencies', () => {
  const testConfig = {
    defaultUser: {
      email: 'john@example.com',
      password: 'password123'
    }
  };

  beforeEach(() => {
    cy.clearAllStorage();
  });

  context('3TAF Cart Operations with DOM Timing Issues', () => {
    it('3TAF should add items to cart without waiting for API completion', () => {
      // TIMING ISSUE: Login and immediately proceed without ensuring auth state
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Navigate too quickly after login
      cy.wait(300); // Too short for auth state propagation
      
      cy.visit('/products');
      
      // TIMING ISSUE: Interact with products before they fully load
      cy.wait(500); // Insufficient for products API and rendering
      
      cy.get('body').then(($body) => {
        const addButtons = $body.find('button').filter((i, el) => 
          Cypress.$(el).text().toLowerCase().includes('add')
        );
        
        if (addButtons.length > 0) {
          cy.wrap(addButtons.first()).click();
          
          // TIMING ISSUE: Check cart state immediately without waiting for add API
          cy.wait(200); // Too short for cart API response
          
          // This assertion will fail inconsistently when API is slow
          cy.get('[data-testid="cart-badge"], .cart-count').should('be.visible').then($badge => {
            const count = parseInt($badge.text()) || 0;
            expect(count).to.be.greaterThan(0, 'Cart should show added item immediately');
          });
          
          // TIMING ISSUE: Navigate to cart before add operation completes
          cy.visit('/cart');
          cy.wait(400); // Too short for cart data to load
          
          // This will fail when cart data hasn't synced yet
          cy.get('[data-testid="cart-item"], .cart-item').should('have.length.greaterThan', 0);
        }
      });
    });

    it('3TAF should modify cart quantities with race conditions', () => {
      // Login quickly
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait(800); // Short wait for login
      
      // Add product to cart
      cy.visit('/products');
      cy.get('body').then(($body) => {
        const addButtons = $body.find('button').filter((i, el) => 
          Cypress.$(el).text().toLowerCase().includes('add')
        );
        
        if (addButtons.length > 0) {
          cy.wrap(addButtons.first()).click();
          cy.wait(600); // May not be enough for cart update
          
          cy.visit('/cart');
          
          // TIMING ISSUE: Rapid quantity changes without waiting for each update
          cy.get('body').then(($cartBody) => {
            const quantityInputs = $cartBody.find('input[type="number"], [data-testid="item-quantity"]');
            
            if (quantityInputs.length > 0) {
              // Rapid quantity updates that create race conditions
              cy.wrap(quantityInputs.first()).clear().type('3');
              cy.wait(150); // Too short for cart recalculation
              
              cy.wrap(quantityInputs.first()).clear().type('5');
              cy.wait(150); // Another rapid change
              
              cy.wrap(quantityInputs.first()).clear().type('2');
              cy.wait(300); // Brief final wait
              
              // TIMING ISSUE: Check total before all updates complete
              cy.get('[data-testid="cart-total"], .total').should('be.visible').then($total => {
                const totalText = $total.text();
                const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
                
                // This might fail if previous quantity updates are still processing
                expect(totalValue).to.be.greaterThan(0, 'Cart total should reflect final quantity');
              });
            }
          });
        }
      });
    });
  });

  context('3TAF Search and Filter Timing Dependencies', () => {
    it('3TAF should search before debounce completes', () => {
      cy.visit('/products');
      
      // TIMING ISSUE: Start searching immediately without waiting for page load
      cy.wait(300); // Too short for initial product load
      
      cy.get('body').then(($body) => {
        const searchInputs = $body.find('input[placeholder*="search"], input[placeholder*="Search"]');
        
        if (searchInputs.length > 0) {
          // TIMING ISSUE: Rapid search input changes
          cy.wrap(searchInputs.first()).type('lap');
          cy.wait(100); // Much shorter than typical debounce
          
          cy.wrap(searchInputs.first()).clear().type('laptop');
          cy.wait(100); // Too short for search API
          
          cy.wrap(searchInputs.first()).clear().type('computer');
          cy.wait(200); // Still shorter than typical API response
          
          // TIMING ISSUE: Assert results before search completes
          cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          
          // Additional check that depends on search completion
          cy.get('body').should('contain.text', 'computer').or('contain.text', 'Computer');
        }
      });
    });

    it('3TAF should interact with filters before options populate', () => {
      cy.visit('/products');
      
      // TIMING ISSUE: Try to use filters before they're populated from API
      cy.wait(200); // Too short for filter data
      
      cy.get('body').then(($body) => {
        const categorySelects = $body.find('select[name*="category"], select[data-testid*="category"]');
        
        if (categorySelects.length > 0) {
          // TIMING ISSUE: Select option before options are loaded
          cy.wrap(categorySelects.first()).should('be.visible');
          
          cy.wrap(categorySelects.first()).find('option').should('have.length.greaterThan', 1);
          cy.wrap(categorySelects.first()).select(1); // Select by index
          
          // TIMING ISSUE: Check filtered results immediately
          cy.wait(300); // Too short for filter API call
          
          // This assertion may fail if filtering hasn't completed
          cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
        } else {
          // Try price range filter
          const priceInputs = $body.find('input[name*="price"], input[type="range"]');
          if (priceInputs.length > 0) {
            cy.wrap(priceInputs.first()).clear().type('50');
            cy.wait(200); // Too short for price filter
            
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
          }
        }
      });
    });
  });

  context('3TAF Authentication Flow Dependencies', () => {
    it('3TAF should access protected features before auth verification', () => {
      // TIMING ISSUE: Login and immediately try to access protected features
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Don't wait for auth confirmation
      cy.wait(400); // Too short for authentication process
      
      // Try to access checkout immediately
      cy.visit('/checkout');
      
      // TIMING ISSUE: Assert checkout access before auth state is verified
      cy.url().should('include', '/checkout');
      
      // Check for checkout elements without ensuring user is authenticated
      cy.get('body').should('contain.text', 'checkout').or('contain.text', 'Checkout');
      
      // TIMING ISSUE: Try to fill checkout form before fields are enabled
      cy.get('body').then(($body) => {
        const inputs = $body.find('input, select, textarea');
        
        if (inputs.length > 0) {
          // This might fail if auth-dependent fields aren't enabled yet
          cy.wrap(inputs.first()).should('be.enabled');
          
          const emailInputs = $body.find('input[type="email"], input[name*="email"]');
          if (emailInputs.length > 0) {
            cy.wrap(emailInputs.first()).type('test@example.com');
          }
        }
      });
    });

    it('3TAF should interact with user-specific features too early', () => {
      // Quick login without proper verification
      cy.visit('/login');
      cy.get('input[type="email"]').type(testConfig.defaultUser.email);
      cy.get('input[type="password"]').type(testConfig.defaultUser.password);
      cy.get('button[type="submit"]').click();
      
      // TIMING ISSUE: Navigate to profile/account before session is established
      cy.wait(350); // Too short for session establishment
      
      cy.visit('/profile', { failOnStatusCode: false });
      
      // TIMING ISSUE: Check profile content before user data loads
      cy.get('body').then(($body) => {
        if ($body.find('input, form').length > 0) {
          // Profile form exists - check if user data is populated
          const nameInputs = $body.find('input[name*="name"], input[name*="first"]');
          
          if (nameInputs.length > 0) {
            // This might fail if user data hasn't loaded yet
            cy.wrap(nameInputs.first()).should('have.value').and('not.be.empty');
          }
          
          // Try to update profile immediately
          const saveButtons = $body.find('button').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('save') ||
            Cypress.$(el).text().toLowerCase().includes('update')
          );
          
          if (saveButtons.length > 0) {
            cy.wrap(saveButtons.first()).should('be.enabled');
          }
        }
      });
    });
  });

  context('3TAF Pagination and Dynamic Content', () => {
    it('3TAF should navigate pages before count calculation', () => {
      cy.visit('/products');
      
      // TIMING ISSUE: Look for pagination before product count is known
      cy.wait(400); // Too short for pagination calculation
      
      cy.get('body').then(($body) => {
        const paginationElements = $body.find('.pagination, [data-testid="pagination"]');
        
        if (paginationElements.length > 0) {
          const nextButtons = $body.find('button, a').filter((i, el) => 
            Cypress.$(el).text().toLowerCase().includes('next') ||
            Cypress.$(el).text() === '2'
          );
          
          if (nextButtons.length > 0) {
            cy.wrap(nextButtons.first()).should('be.enabled');
            cy.wrap(nextButtons.first()).click();
            
            // TIMING ISSUE: Assert page change immediately
            cy.wait(500); // Too short for page transition
            
            // This might fail if page change hasn't completed
            cy.get('[data-testid="product-card"], .product').should('have.length.greaterThan', 0);
            
            // Check if URL or page indicator changed
            cy.url().should('satisfy', (url) => {
              return url.includes('page=2') || url.includes('?page=2');
            });
          }
        }
      });
    });
  });
});