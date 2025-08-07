import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor() {
    super('/');
  }

  // Selectors
  private selectors = {
    heroSection: '[data-testid="hero-section"]',
    featuredProducts: '[data-testid="featured-products"]',
    productCard: '[data-testid="product-card"]',
    ctaButton: '[data-testid="cta-button"]',
    searchBar: '[data-testid="search-bar"]',
    categoryLinks: '[data-testid="category-link"]',
    testimonials: '[data-testid="testimonials"]',
    newsletter: '[data-testid="newsletter-signup"]'
  };

  // Actions
  clickShopNowButton(): void {
    cy.get(this.selectors.ctaButton).contains('Shop Now').click();
  }

  searchForProduct(searchTerm: string): void {
    cy.get(this.selectors.searchBar).type(searchTerm).type('{enter}');
  }

  clickCategory(categoryName: string): void {
    cy.get(this.selectors.categoryLinks).contains(categoryName).click();
  }

  clickFeaturedProduct(productIndex: number = 0): void {
    cy.get(this.selectors.productCard).eq(productIndex).click();
  }

  subscribeToNewsletter(email: string): void {
    cy.get(this.selectors.newsletter).find('input[type="email"]').type(email);
    cy.get(this.selectors.newsletter).find('button').click();
  }

  // Assertions
  assertHeroSectionVisible(): void {
    cy.get(this.selectors.heroSection).should('be.visible');
  }

  assertFeaturedProductsDisplayed(expectedCount?: number): void {
    cy.get(this.selectors.featuredProducts).should('be.visible');
    if (expectedCount) {
      cy.get(this.selectors.productCard).should('have.length', expectedCount);
    } else {
      cy.get(this.selectors.productCard).should('have.length.greaterThan', 0);
    }
  }

  assertCategoriesDisplayed(): void {
    cy.get(this.selectors.categoryLinks).should('have.length.greaterThan', 0);
    cy.get(this.selectors.categoryLinks).should('be.visible');
  }

  assertTestimonialsVisible(): void {
    cy.get(this.selectors.testimonials).should('be.visible');
  }

  assertNewsletterSignupVisible(): void {
    cy.get(this.selectors.newsletter).should('be.visible');
  }

  // Business logic assertions
  assertPageLoadsWithinTimeout(timeout: number = 5000): void {
    cy.get(this.selectors.heroSection, { timeout }).should('be.visible');
    cy.get(this.selectors.featuredProducts, { timeout }).should('be.visible');
  }

  assertResponsiveLayout(): void {
    // Test mobile layout
    cy.viewport(375, 667);
    this.assertHeroSectionVisible();
    this.assertFeaturedProductsDisplayed();

    // Test tablet layout
    cy.viewport(768, 1024);
    this.assertHeroSectionVisible();
    this.assertFeaturedProductsDisplayed();

    // Test desktop layout
    cy.viewport(1200, 800);
    this.assertHeroSectionVisible();
    this.assertFeaturedProductsDisplayed();
  }
}