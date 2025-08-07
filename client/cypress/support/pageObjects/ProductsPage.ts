import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  constructor() {
    super('/products');
  }

  private selectors = {
    productGrid: '[data-testid="product-grid"]',
    productCard: '[data-testid="product-card"]',
    filterSidebar: '[data-testid="filter-sidebar"]',
    categoryFilter: '[data-testid="category-filter"]',
    priceFilter: '[data-testid="price-filter"]',
    brandFilter: '[data-testid="brand-filter"]',
    sortDropdown: '[data-testid="sort-dropdown"]',
    searchInput: '[data-testid="search-input"]',
    loadMoreButton: '[data-testid="load-more"]',
    pagination: '[data-testid="pagination"]',
    viewToggle: '[data-testid="view-toggle"]',
    resultsCount: '[data-testid="results-count"]',
    clearFilters: '[data-testid="clear-filters"]',
    addToCartButton: '[data-testid="add-to-cart"]',
    productImage: '[data-testid="product-image"]',
    productTitle: '[data-testid="product-title"]',
    productPrice: '[data-testid="product-price"]',
    noResults: '[data-testid="no-results"]'
  };

  // Filter actions
  filterByCategory(category: string): void {
    cy.get(this.selectors.categoryFilter).find(`[value="${category}"]`).click();
  }

  filterByPriceRange(min: number, max: number): void {
    cy.get(this.selectors.priceFilter).find('[data-testid="price-min"]').clear().type(min.toString());
    cy.get(this.selectors.priceFilter).find('[data-testid="price-max"]').clear().type(max.toString());
    cy.get(this.selectors.priceFilter).find('button').click();
  }

  filterByBrand(brand: string): void {
    cy.get(this.selectors.brandFilter).find(`[value="${brand}"]`).click();
  }

  sortBy(sortOption: string): void {
    cy.get(this.selectors.sortDropdown).select(sortOption);
  }

  searchProducts(searchTerm: string): void {
    cy.get(this.selectors.searchInput).clear().type(searchTerm).type('{enter}');
  }

  clearAllFilters(): void {
    cy.get(this.selectors.clearFilters).click();
  }

  // Product interactions
  addProductToCart(productIndex: number): void {
    cy.get(this.selectors.productCard).eq(productIndex).find(this.selectors.addToCartButton).click();
  }

  clickProduct(productIndex: number): void {
    cy.get(this.selectors.productCard).eq(productIndex).click();
  }

  toggleView(viewType: 'grid' | 'list'): void {
    cy.get(this.selectors.viewToggle).find(`[data-view="${viewType}"]`).click();
  }

  loadMoreProducts(): void {
    cy.get(this.selectors.loadMoreButton).click();
  }

  goToPage(pageNumber: number): void {
    cy.get(this.selectors.pagination).find(`[data-page="${pageNumber}"]`).click();
  }

  // Assertions
  assertProductsDisplayed(expectedCount?: number): void {
    cy.get(this.selectors.productGrid).should('be.visible');
    if (expectedCount) {
      cy.get(this.selectors.productCard).should('have.length', expectedCount);
    } else {
      cy.get(this.selectors.productCard).should('have.length.greaterThan', 0);
    }
  }

  assertNoProductsFound(): void {
    cy.get(this.selectors.noResults).should('be.visible');
    cy.get(this.selectors.productCard).should('not.exist');
  }

  assertFilteredResults(filterType: string, filterValue: string): void {
    cy.get(this.selectors.productCard).each(($product) => {
      cy.wrap($product).should('contain.attr', `data-${filterType}`, filterValue);
    });
  }

  assertSortedResults(sortType: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'): void {
    cy.get(this.selectors.productCard).then(($products) => {
      const prices: number[] = [];
      const names: string[] = [];

      $products.each((index, product) => {
        if (sortType.includes('price')) {
          const priceText = Cypress.$(product).find(this.selectors.productPrice).text();
          prices.push(parseFloat(priceText.replace(/[^0-9.]/g, '')));
        } else {
          const nameText = Cypress.$(product).find(this.selectors.productTitle).text();
          names.push(nameText);
        }
      });

      if (sortType === 'price-asc') {
        expect(prices).to.deep.equal([...prices].sort((a, b) => a - b));
      } else if (sortType === 'price-desc') {
        expect(prices).to.deep.equal([...prices].sort((a, b) => b - a));
      } else if (sortType === 'name-asc') {
        expect(names).to.deep.equal([...names].sort());
      } else if (sortType === 'name-desc') {
        expect(names).to.deep.equal([...names].sort().reverse());
      }
    });
  }

  assertResultsCount(expectedCount: number): void {
    cy.get(this.selectors.resultsCount).should('contain.text', expectedCount.toString());
  }

  assertProductCardStructure(): void {
    cy.get(this.selectors.productCard).first().within(() => {
      cy.get(this.selectors.productImage).should('be.visible');
      cy.get(this.selectors.productTitle).should('be.visible');
      cy.get(this.selectors.productPrice).should('be.visible');
      cy.get(this.selectors.addToCartButton).should('be.visible');
    });
  }
}