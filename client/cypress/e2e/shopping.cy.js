describe('Shopping Experience', () => {
  const testProducts = [
    {
      id: 'product-1',
      name: 'Laptop Computer',
      price: 999.99,
      category: 'Electronics',
      stock: 10,
      rating: 4.5,
      reviewCount: 123,
      imageUrl: '/images/laptop.jpg'
    },
    {
      id: 'product-2', 
      name: 'Wireless Headphones',
      price: 199.99,
      category: 'Electronics',
      stock: 25,
      rating: 4.8,
      reviewCount: 89,
      imageUrl: '/images/headphones.jpg'
    },
    {
      id: 'product-3',
      name: 'Running Shoes',
      price: 129.99,
      category: 'Sports',
      stock: 0,
      rating: 4.2,
      reviewCount: 67,
      imageUrl: '/images/shoes.jpg'
    }
  ];

  beforeEach(() => {
    cy.resetTestData();
    cy.mockProductsApi(testProducts);
    cy.login();
  });

  describe('Product Browsing', () => {
    it('should display products on the homepage', () => {
      cy.visit('/');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="featured-products"]').should('be.visible');
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      
      // Verify product information is displayed
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
        cy.get('[data-testid="product-image"]').should('be.visible');
        cy.get('[data-testid="product-rating"]').should('be.visible');
      });
    });

    it('should navigate to products page and display all products', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Verify page structure
      cy.get('[data-testid="products-grid"]').should('be.visible');
      cy.get('[data-testid="search-input"]').should('be.visible');
      cy.get('[data-testid="category-filter"]').should('be.visible');
      
      // Verify products are displayed
      testProducts.forEach(product => {
        cy.contains(product.name).should('be.visible');
        cy.contains(`$${product.price}`).should('be.visible');
      });
    });

    it('should filter products by category', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Filter by Electronics category
      cy.get('[data-testid="category-filter"]').select('Electronics');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="product-card"]').should('have.length', 2);
      cy.contains('Laptop Computer').should('be.visible');
      cy.contains('Wireless Headphones').should('be.visible');
      cy.contains('Running Shoes').should('not.exist');
    });

    it('should search products by name', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.searchProducts('Laptop');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="product-card"]').should('have.length', 1);
      cy.contains('Laptop Computer').should('be.visible');
    });

    it('should handle empty search results', () => {
      cy.mockProductsApi([]); // Empty results
      
      cy.visit('/products');
      cy.searchProducts('NonexistentProduct');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="no-products-message"]').should('contain', 'No products found');
    });
  });

  describe('Product Details', () => {
    it('should display detailed product information', () => {
      cy.intercept('GET', '**/api/products/product-1', {
        statusCode: 200,
        body: {
          ...testProducts[0],
          description: 'High-performance laptop with latest specs',
          specifications: {
            'CPU': 'Intel i7',
            'RAM': '16GB',
            'Storage': '512GB SSD'
          },
          features: ['Fast performance', 'Long battery life', 'Lightweight design']
        }
      }).as('getProductDetail');

      cy.visit('/products/product-1');
      cy.wait('@getProductDetail');
      
      // Verify all product details are displayed
      cy.get('[data-testid="product-title"]').should('contain', 'Laptop Computer');
      cy.get('[data-testid="product-price"]').should('contain', '$999.99');
      cy.get('[data-testid="product-description"]').should('contain', 'High-performance laptop');
      cy.get('[data-testid="product-rating"]').should('contain', '4.5');
      cy.get('[data-testid="product-stock"]').should('contain', '10');
      
      // Verify specifications
      cy.get('[data-testid="specifications"]').within(() => {
        cy.contains('Intel i7').should('be.visible');
        cy.contains('16GB').should('be.visible');
        cy.contains('512GB SSD').should('be.visible');
      });
      
      // Verify features
      cy.get('[data-testid="features"]').within(() => {
        cy.contains('Fast performance').should('be.visible');
        cy.contains('Long battery life').should('be.visible');
      });
    });

    it('should handle out of stock products', () => {
      cy.intercept('GET', '**/api/products/product-3', {
        statusCode: 200,
        body: testProducts[2]
      }).as('getOutOfStockProduct');

      cy.visit('/products/product-3');
      cy.wait('@getOutOfStockProduct');
      
      cy.get('[data-testid="stock-status"]').should('contain', 'Out of Stock');
      cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
    });

    it('should navigate back to products from breadcrumb', () => {
      cy.visit('/products/product-1');
      
      cy.get('[data-testid="breadcrumb-products"]').click();
      cy.url().should('include', '/products');
    });
  });

  describe('Add to Cart', () => {
    beforeEach(() => {
      cy.clearCart();
    });

    it('should add single product to cart', () => {
      cy.intercept('POST', '**/api/cart', {
        statusCode: 200,
        body: { message: 'Product added to cart' }
      }).as('addToCart');

      cy.addToCart('product-1', 1);
      cy.wait('@addToCart');
      
      // Verify cart badge updates
      cy.get('[data-testid="cart-badge"]').should('contain', '1');
    });

    it('should add multiple quantities to cart', () => {
      cy.intercept('POST', '**/api/cart', {
        statusCode: 200,
        body: { message: 'Product added to cart' }
      }).as('addToCart');

      cy.addToCart('product-1', 3);
      cy.wait('@addToCart');
      
      cy.get('[data-testid="cart-badge"]').should('contain', '3');
    });

    it('should limit quantity to available stock', () => {
      cy.visit('/products/product-1');
      
      cy.get('[data-testid="quantity-input"]').clear().type('15');
      cy.get('[data-testid="quantity-input"]').should('have.value', '10'); // Max stock
    });

    it('should show cart notification after adding product', () => {
      cy.intercept('POST', '**/api/cart', {
        statusCode: 200,
        body: { message: 'Product added to cart' }
      }).as('addToCart');

      cy.addToCart('product-1');
      cy.wait('@addToCart');
      
      cy.get('[data-testid="cart-notification"]')
        .should('be.visible')
        .and('contain', 'Product added to cart');
      
      // Notification should auto-hide
      cy.get('[data-testid="cart-notification"]', { timeout: 5000 })
        .should('not.be.visible');
    });

    it('should handle add to cart errors', () => {
      cy.intercept('POST', '**/api/cart', {
        statusCode: 400,
        body: { message: 'Product out of stock' }
      }).as('addToCartError');

      cy.visit('/products/product-1');
      cy.get('[data-testid="add-to-cart-button"]').click();
      cy.wait('@addToCartError');
      
      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .and('contain', 'Product out of stock');
    });
  });

  describe('Responsive Design', () => {
    it('should display properly on mobile devices', () => {
      cy.setViewport('mobile');
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Verify mobile layout
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
      cy.get('[data-testid="products-grid"]').should('have.class', 'mobile-layout');
      
      // Verify product cards stack properly
      cy.get('[data-testid="product-card"]').first().should('have.class', 'mobile-card');
    });

    it('should adapt product details page for tablet', () => {
      cy.setViewport('tablet');
      cy.visit('/products/product-1');
      
      cy.get('[data-testid="product-layout"]').should('have.class', 'tablet-layout');
      cy.get('[data-testid="product-image"]').should('be.visible');
      cy.get('[data-testid="product-info"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load products page within performance budget', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.measureNetworkPerformance();
      
      // Verify page loads within 3 seconds
      cy.window().then((win) => {
        const perfData = win.performance.getEntriesByType('navigation')[0];
        expect(perfData.loadEventEnd - perfData.fetchStart).to.be.lessThan(3000);
      });
    });

    it('should not have console errors', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.expectNoConsoleErrors();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on products page', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      cy.checkA11y();
    });

    it('should be accessible on product detail page', () => {
      cy.visit('/products/product-1');
      cy.checkA11y();
    });

    it('should support keyboard navigation on products grid', () => {
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="product-card"]').first().focus();
      cy.focused().should('have.attr', 'data-testid', 'product-card');
      
      // Navigate through products with arrow keys
      cy.focused().type('{rightarrow}');
      cy.focused().should('contain', testProducts[1].name);
    });
  });
});