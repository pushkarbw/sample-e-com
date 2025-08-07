describe('🛒 Core Shopping - Product Discovery', () => {
  const testConfig = {
    baseUrl: Cypress.config('baseUrl'),
    apiUrl: Cypress.env('apiUrl'),
    testProducts: [
      { id: 'product-1', name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
      { id: 'product-2', name: 'Running Shoes', price: 89.99, category: 'Sports' },
      { id: 'product-3', name: 'Coffee Mug', price: 15.99, category: 'Home' }
    ]
  };

  before(() => {
    cy.task('log', 'Setting up product discovery tests');
    cy.task('seedDb', testConfig.testProducts);
  });

  beforeEach(() => {
    cy.clearAllStorage();
  });

  context('Product Listing', () => {
    it('should display products with proper loading states', () => {
      // Mock slow API response to test loading states
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
      
      // Verify loading state
      cy.get('[data-testid="products-loading"]').should('be.visible');
      cy.get('[data-testid="skeleton-loader"]').should('have.length.at.least', 3);
      
      cy.wait('@getProducts');
      
      // Verify products loaded
      cy.get('[data-testid="products-loading"]').should('not.exist');
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      cy.get('[data-testid="product-image"]').should('be.visible');
      cy.get('[data-testid="product-name"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
    });

    it('should handle product search with filters', () => {
      cy.visit('/products');
      
      // Test search functionality
      cy.get('[data-testid="search-input"]').type('headphones');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="product-card"]').should('contain', 'Wireless Headphones');
      cy.get('[data-testid="search-results-count"]').should('contain', '1');
      
      // Test category filter
      cy.get('[data-testid="category-filter"]').select('Electronics');
      cy.get('[data-testid="apply-filters"]').click();
      
      cy.get('[data-testid="product-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Electronics');
      });
      
      // Test price range filter
      cy.get('[data-testid="price-min"]').clear().type('50');
      cy.get('[data-testid="price-max"]').clear().type('200');
      cy.get('[data-testid="apply-filters"]').click();
      
      cy.get('[data-testid="product-price"]').each(($price) => {
        const price = parseFloat($price.text().replace('$', ''));
        expect(price).to.be.within(50, 200);
      });
    });

    it('should sort products correctly', () => {
      cy.visit('/products');
      
      // Test price sorting (low to high)
      cy.get('[data-testid="sort-dropdown"]').select('price-asc');
      
      cy.get('[data-testid="product-price"]').then($prices => {
        const prices = Array.from($prices).map(el => 
          parseFloat(el.textContent.replace('$', ''))
        );
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).to.deep.equal(sortedPrices);
      });
      
      // Test name sorting
      cy.get('[data-testid="sort-dropdown"]').select('name-asc');
      
      cy.get('[data-testid="product-name"]').then($names => {
        const names = Array.from($names).map(el => el.textContent);
        const sortedNames = [...names].sort();
        expect(names).to.deep.equal(sortedNames);
      });
    });
  });

  context('Product Details', () => {
    it('should display product details correctly', () => {
      cy.visit('/products');
      cy.get('[data-testid="product-card"]').first().click();
      
      // Verify product detail page
      cy.url().should('include', '/products/');
      cy.get('[data-testid="product-title"]').should('be.visible');
      cy.get('[data-testid="product-description"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
      cy.get('[data-testid="product-images"]').should('be.visible');
      cy.get('[data-testid="add-to-cart-button"]').should('be.visible');
      cy.get('[data-testid="quantity-selector"]').should('be.visible');
      
      // Test image gallery
      cy.get('[data-testid="product-image-thumbnail"]').should('have.length.at.least', 1);
      cy.get('[data-testid="product-image-thumbnail"]').then($thumbnails => {
        if ($thumbnails.length > 1) {
          cy.wrap($thumbnails).eq(1).click();
          cy.get('[data-testid="main-product-image"]').should('have.attr', 'src').and('include', 'image-1');
        }
      });
    });

    it('should handle product variations', () => {
      cy.visit('/products/product-with-variations');
      
      // Test size selection
      cy.get('[data-testid="size-selector"]').should('be.visible');
      cy.get('[data-testid="size-option"]').first().click();
      cy.get('[data-testid="size-option"]').first().should('have.class', 'selected');
      
      // Test color selection
      cy.get('[data-testid="color-selector"]').should('be.visible');
      cy.get('[data-testid="color-option"]').first().click();
      
      // Verify price updates with variations
      cy.get('[data-testid="product-price"]').should('contain', '$');
      
      // Test stock availability
      cy.get('[data-testid="stock-status"]').should('be.visible');
      cy.get('[data-testid="add-to-cart-button"]').should('not.be.disabled');
    });

    it('should show related products', () => {
      cy.visit('/products/product-1');
      
      cy.get('[data-testid="related-products"]').should('be.visible');
      cy.get('[data-testid="related-product-card"]').should('have.length.at.least', 1);
      
      // Click on related product
      cy.get('[data-testid="related-product-card"]').first().click();
      cy.url().should('include', '/products/');
      cy.get('[data-testid="product-title"]').should('be.visible');
    });
  });

  context('Product Reviews', () => {
    it('should display product reviews', () => {
      cy.visit('/products/product-1');
      
      cy.get('[data-testid="reviews-section"]').should('be.visible');
      cy.get('[data-testid="average-rating"]').should('be.visible');
      cy.get('[data-testid="review-count"]').should('contain', 'reviews');
      
      // Test review pagination
      cy.get('[data-testid="review-item"]').should('have.length.at.least', 1);
      
      if (cy.get('[data-testid="load-more-reviews"]').should('exist')) {
        cy.get('[data-testid="load-more-reviews"]').click();
        cy.get('[data-testid="review-item"]').should('have.length.greaterThan', 5);
      }
    });

    it('should allow authenticated users to write reviews', () => {
      cy.loginAsTestUser();
      cy.visit('/products/product-1');
      
      // Open review form
      cy.get('[data-testid="write-review-button"]').click();
      cy.get('[data-testid="review-form"]').should('be.visible');
      
      // Fill review form
      cy.get('[data-testid="rating-stars"]').within(() => {
        cy.get('[data-rating="4"]').click();
      });
      cy.get('[data-testid="review-title"]').type('Great product!');
      cy.get('[data-testid="review-text"]').type('I really enjoyed using this product. Highly recommended!');
      
      // Submit review
      cy.get('[data-testid="submit-review"]').click();
      cy.get('[data-testid="review-success"]').should('be.visible');
      
      // Verify review appears
      cy.get('[data-testid="review-item"]').first().should('contain', 'Great product!');
    });
  });
});