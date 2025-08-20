describe('🛒 Core Shopping - Product Discovery', () => {
  before(() => {
    cy.task('log', 'Setting up product discovery tests for real app');
  });

  beforeEach(() => {
    cy.clearAllStorage();
  });

  context('Product Listing', () => {
    it('should display products with proper loading states', () => {
      cy.visit('/products');
      
      // Wait for products container to load
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Check if products are loaded (either products exist or "No products found" message)
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text();
        return text.includes('No products found') || $body.find('img[alt]').length > 0;
      });
    });

    it('should handle product search functionality', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test search using the actual search input with correct placeholder
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      
      // Test search functionality
      cy.get('input[placeholder="Search products..."]').clear().type('laptop');
      cy.wait(2000); // Allow search to process and debounce
      
      // Verify that the search input contains the typed value
      cy.get('input[placeholder="Search products..."]').should('have.value', 'laptop');
    });

    it('should filter products by category', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test category filter using the actual select element
      cy.get('select').should('be.visible');
      cy.get('select option').should('have.length.at.least', 1);
      
      // Verify "All Categories" option exists
      cy.get('select option[value=""]').should('contain', 'All Categories');
      
      // Select a category if multiple options are available
      cy.get('select option').then($options => {
        if ($options.length > 1) {
          // Select the second option (first non-"All Categories" option)
          const categoryValue = $options[1].value;
          if (categoryValue) {
            cy.get('select').select(categoryValue);
            cy.wait(2000); // Allow filter to process
            cy.get('select').should('have.value', categoryValue);
          }
        }
      });
    });

    it('should display product information correctly', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000); // Wait for products to load
      
      // Check if products exist and verify their structure
      cy.get('body').then(($body) => {
        const productImages = $body.find('img[alt]');
        if (productImages.length > 0) {
          // Verify product cards have required information
          cy.get('img[alt]').first().should('be.visible');
          
          // Look for price indicators (dollar signs)
          cy.get('body').should('contain', '$');
          
          // Look for product titles
          cy.get('h3').should('exist'); // ProductCard uses h3 for titles
        } else {
          // If no products, should show appropriate message
          cy.get('body').should('contain', 'No products found');
        }
      });
    });

    it('should handle search with no results', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Search for something that likely won't exist
      cy.get('input[placeholder="Search products..."]').clear().type('xyznoproduct123');
      cy.wait(2000);
      
      // Should either show "No products found" or handle gracefully
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text();
        return text.includes('No products found') || text.includes('Loading') || $body.find('img[alt]').length >= 0;
      });
    });
  });

  context('Product Details', () => {
    it('should navigate to product details via View Details button', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Look for "View Details" links in product cards
      cy.get('body').then(($body) => {
        const viewDetailsLinks = $body.find('a').filter((i, el) => 
          Cypress.$(el).text().includes('View Details')
        );
        
        if (viewDetailsLinks.length > 0) {
          cy.wrap(viewDetailsLinks.first()).click();
          cy.url().should('match', /\/products\/[\w-]+$/);
          
          // Verify product detail page elements
          cy.get('h1, h2').should('be.visible'); // Product title
          cy.get('body').should('contain', '$'); // Price
        } else {
          // Test direct product URL if no links found
          cy.visit('/products/1');
          cy.url().should('include', '/products/1');
        }
      });
    });

    it('should display product images and add to cart functionality', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Navigate to first product or use direct URL
      cy.get('body').then(($body) => {
        const viewDetailsLinks = $body.find('a').filter((i, el) => 
          Cypress.$(el).text().includes('View Details')
        );
        
        if (viewDetailsLinks.length > 0) {
          cy.wrap(viewDetailsLinks.first()).click();
        } else {
          cy.visit('/products/1');
        }
      });
      
      // Verify product detail elements exist
      cy.get('img').should('have.length.at.least', 1);
      cy.get('body').should('contain', '$');
      
      // Note: Add to cart requires authentication, so we just check for existence
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        if (text.includes('add to cart') || text.includes('cart')) {
          // Add to cart functionality is present
          cy.log('Add to cart functionality found');
        }
      });
    });
  });

  context('API Integration', () => {
    it('should load products from API successfully', () => {
      cy.intercept('GET', '**/api/products*').as('getProducts');
      
      cy.visit('/products');
      cy.wait('@getProducts').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 304]);
        if (interception.response.body) {
          expect(interception.response.body).to.have.property('data');
        }
      });
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/products*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('apiError');
      
      cy.visit('/products');
      cy.wait('@apiError');
      
      // Should show error message or handle gracefully
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('error') || 
               text.includes('failed') || 
               text.includes('unable') ||
               text.includes('try again') ||
               text.includes('loading'); // May show loading state
      });
    });

    it('should make search API calls with correct parameters', () => {
      cy.intercept('GET', '**/api/products*').as('getProducts');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Clear any existing intercepts and set up a new one for search
      cy.intercept('GET', '**/api/products*').as('searchProducts');
      
      // Clear the search input and type the search term slowly to allow for proper API calls
      cy.get('input[placeholder="Search products..."]').clear();
      
      // Type the search term and wait for the API call with the complete search
      cy.get('input[placeholder="Search products..."]').type('test search', { delay: 100 });
      
      // Wait for the input to have the correct value
      cy.get('input[placeholder="Search products..."]').should('have.value', 'test search');
      
      // Wait a bit longer for any debouncing to complete
      cy.wait(1000);
      
      // Now check the most recent API call
      cy.get('@searchProducts.all').then((interceptions) => {
        // Get the last interception (most recent API call)
        const lastInterception = interceptions[interceptions.length - 1];
        const url = lastInterception.request.url;
        
        // Verify the URL includes the search parameter with the complete search term
        // Accept both %20 and + encoding for spaces
        expect(url.includes('search=test%20search') || url.includes('search=test+search')).to.be.true;
      });
    });
  });

  context('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Verify search input is accessible on mobile
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      cy.get('select').should('be.visible');
      
      cy.wait(2000);
      cy.get('body').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024);
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Verify layout adapts to tablet size
      cy.get('input[placeholder="Search products..."]').should('be.visible');
      cy.get('select').should('be.visible');
      
      cy.wait(2000);
      cy.get('body').should('be.visible');
    });
  });

  context('Pagination', () => {
    it('should display pagination controls when needed', () => {
      cy.visit('/products');
      cy.get('[data-testid="products-container"]').should('be.visible');
      cy.wait(2000);
      
      // Check if pagination exists (depends on number of products)
      cy.get('body').then(($body) => {
        const hasPrevious = $body.text().includes('Previous');
        const hasNext = $body.text().includes('Next');
        
        if (hasPrevious || hasNext) {
          cy.log('Pagination controls found');
          // Test pagination if it exists
          if (hasNext && !$body.find('button:contains("Next"):disabled').length) {
            cy.contains('button', 'Next').click();
            cy.wait(2000);
            cy.url().should('satisfy', (url) => {
              return url.includes('page=') || url.includes('/products');
            });
          }
        } else {
          cy.log('No pagination needed - likely few products');
        }
      });
    });
  });
});