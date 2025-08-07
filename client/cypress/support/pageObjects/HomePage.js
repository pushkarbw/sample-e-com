import BasePage from './BasePage.js';

/**
 * Home Page Object - Landing page functionality
 */
class HomePage extends BasePage {
  constructor() {
    super();
    
    // Selectors
    this.selectors = {
      // Header elements
      header: '[data-testid="header"]',
      logo: '[data-testid="logo"]',
      navigationMenu: '[data-testid="nav-menu"]',
      userMenu: '[data-testid="user-menu"]',
      cartIcon: '[data-testid="cart-icon"]',
      cartCount: '[data-testid="cart-count"]',
      
      // Hero section
      heroSection: '[data-testid="hero-section"]',
      heroTitle: '[data-testid="hero-title"]',
      heroSubtitle: '[data-testid="hero-subtitle"]',
      heroCtaButton: '[data-testid="hero-cta"]',
      
      // Featured products
      featuredSection: '[data-testid="featured-products"]',
      featuredTitle: '[data-testid="featured-title"]',
      featuredProductCard: '[data-testid="featured-product-card"]',
      featuredProductImage: '[data-testid="featured-product-image"]',
      featuredProductTitle: '[data-testid="featured-product-title"]',
      featuredProductPrice: '[data-testid="featured-product-price"]',
      featuredProductButton: '[data-testid="featured-product-button"]',
      
      // Categories section
      categoriesSection: '[data-testid="categories-section"]',
      categoryCard: '[data-testid="category-card"]',
      categoryImage: '[data-testid="category-image"]',
      categoryTitle: '[data-testid="category-title"]',
      
      // Newsletter section
      newsletterSection: '[data-testid="newsletter-section"]',
      newsletterInput: '[data-testid="newsletter-input"]',
      newsletterButton: '[data-testid="newsletter-button"]',
      newsletterMessage: '[data-testid="newsletter-message"]',
      
      // Footer
      footer: '[data-testid="footer"]',
      footerLinks: '[data-testid="footer-links"]',
      socialLinks: '[data-testid="social-links"]',
      
      // Loading states
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[data-testid="error-message"]'
    };
  }

  // Navigation methods
  visit() {
    return super.visit('/');
  }

  navigateToProducts() {
    this.clickElement(this.selectors.heroCtaButton);
    return this;
  }

  navigateToCategory(categoryName) {
    cy.get(this.selectors.categoryCard)
      .contains(categoryName)
      .click();
    return this;
  }

  navigateToCart() {
    this.clickElement(this.selectors.cartIcon);
    return this;
  }

  // Header validation methods
  verifyHeaderElements() {
    this.verifyElementVisible(this.selectors.header);
    this.verifyElementVisible(this.selectors.logo);
    this.verifyElementVisible(this.selectors.navigationMenu);
    this.verifyElementVisible(this.selectors.cartIcon);
    return this;
  }

  verifyCartCount(expectedCount) {
    if (expectedCount > 0) {
      this.verifyElementVisible(this.selectors.cartCount);
      this.verifyText(this.selectors.cartCount, expectedCount.toString());
    } else {
      this.verifyElementNotVisible(this.selectors.cartCount);
    }
    return this;
  }

  // Hero section validation methods
  verifyHeroSection() {
    this.verifyElementVisible(this.selectors.heroSection);
    this.verifyElementVisible(this.selectors.heroTitle);
    this.verifyElementVisible(this.selectors.heroSubtitle);
    this.verifyElementVisible(this.selectors.heroCtaButton);
    return this;
  }

  verifyHeroContent(title, subtitle, buttonText) {
    if (title) this.verifyText(this.selectors.heroTitle, title);
    if (subtitle) this.verifyText(this.selectors.heroSubtitle, subtitle);
    if (buttonText) this.verifyText(this.selectors.heroCtaButton, buttonText);
    return this;
  }

  // Featured products validation methods
  verifyFeaturedProducts() {
    this.verifyElementVisible(this.selectors.featuredSection);
    this.verifyElementVisible(this.selectors.featuredTitle);
    cy.get(this.selectors.featuredProductCard).should('have.length.at.least', 1);
    return this;
  }

  verifyFeaturedProduct(index, expectedData) {
    const productCard = `${this.selectors.featuredProductCard}:nth-child(${index + 1})`;
    
    this.verifyElementVisible(productCard);
    
    if (expectedData.title) {
      cy.get(productCard)
        .find(this.selectors.featuredProductTitle)
        .should('contain.text', expectedData.title);
    }
    
    if (expectedData.price) {
      cy.get(productCard)
        .find(this.selectors.featuredProductPrice)
        .should('contain.text', expectedData.price);
    }
    
    return this;
  }

  addFeaturedProductToCart(index) {
    cy.get(this.selectors.featuredProductCard)
      .eq(index)
      .find(this.selectors.featuredProductButton)
      .click();
    return this;
  }

  // Categories validation methods
  verifyCategories() {
    this.verifyElementVisible(this.selectors.categoriesSection);
    cy.get(this.selectors.categoryCard).should('have.length.at.least', 1);
    return this;
  }

  verifyCategoryCard(categoryName) {
    cy.get(this.selectors.categoryCard)
      .contains(categoryName)
      .should('be.visible');
    return this;
  }

  // Newsletter methods
  subscribeToNewsletter(email) {
    this.typeText(this.selectors.newsletterInput, email);
    this.clickElement(this.selectors.newsletterButton);
    return this;
  }

  verifyNewsletterSuccess() {
    this.verifyElementVisible(this.selectors.newsletterMessage);
    this.verifyText(this.selectors.newsletterMessage, 'Successfully subscribed');
    return this;
  }

  verifyNewsletterError(errorMessage) {
    this.verifyElementVisible(this.selectors.newsletterMessage);
    this.verifyText(this.selectors.newsletterMessage, errorMessage);
    return this;
  }

  // Footer validation methods
  verifyFooter() {
    this.verifyElementVisible(this.selectors.footer);
    this.verifyElementVisible(this.selectors.footerLinks);
    this.verifyElementVisible(this.selectors.socialLinks);
    return this;
  }

  // Loading and error state methods
  verifyPageLoaded() {
    this.verifyElementNotVisible(this.selectors.loadingSpinner);
    this.verifyElementNotVisible(this.selectors.errorMessage);
    return this;
  }

  verifyErrorState(errorMessage) {
    this.verifyElementVisible(this.selectors.errorMessage);
    if (errorMessage) {
      this.verifyText(this.selectors.errorMessage, errorMessage);
    }
    return this;
  }

  // Performance testing methods
  measureHomePagePerformance() {
    this.measurePageLoadTime();
    
    // Measure image load times
    cy.get(this.selectors.featuredProductImage).each(($img) => {
      cy.wrap($img).should('be.visible');
    });
    
    return this;
  }

  // Accessibility testing methods
  checkHomePageAccessibility() {
    // Check overall accessibility
    this.checkAccessibility();
    
    // Check specific sections
    this.checkAccessibility(this.selectors.heroSection);
    this.checkAccessibility(this.selectors.featuredSection);
    this.checkAccessibility(this.selectors.categoriesSection);
    
    return this;
  }

  // API intercept methods for home page
  interceptHomePageApis() {
    this.interceptApi('GET', '**/api/products/featured', 'featured-products.json', 'getFeaturedProducts');
    this.interceptApi('GET', '**/api/categories', 'categories.json', 'getCategories');
    this.interceptApi('POST', '**/api/newsletter/subscribe', null, 'subscribeNewsletter');
    return this;
  }

  // Mobile-specific methods
  verifyMobileLayout() {
    this.setMobileViewport();
    this.verifyHeaderElements();
    this.verifyHeroSection();
    this.verifyFeaturedProducts();
    
    // Check that products stack vertically on mobile
    cy.get(this.selectors.featuredProductCard)
      .should('have.css', 'flex-direction', 'column');
    
    return this;
  }
}

export default HomePage;