const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 3TAF Product Search - Async Dependencies Tests', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'Ecomm@123' }
    }
  };

  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.users.valid.email);
      await commands.type('input[type="password"]', testConfig.users.valid.password);
      await commands.click('button[type="submit"]');
      await commands.wait(1500);
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 3TAF Product Search Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('3TAF Search Functionality with Button Timing', function() {
    it('3TAF should interact with search button before it becomes enabled', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('headphones');
        
        await commands.wait(50);
        
        const searchButtons = await commands.getAll('button[type="submit"], [data-testid="search-button"]');
        if (searchButtons.length > 0) {
          await searchButtons[0].click();
          
          await commands.wait(300);
          
          const productCards = await commands.getAll('[data-testid="product-card"]');
          expect(productCards.length).to.be.greaterThan(0, 'Search should return results immediately');
          
          const bodyText = await commands.get('body').then(el => el.getText());
          expect(bodyText.toLowerCase()).to.include('headphones');
        } else {
          this.skip('No search button found');
        }
      } else {
        this.skip('No search input found');
      }
    });

    it('3TAF should perform rapid search queries without proper debouncing', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        const searchTerms = ['lap', 'laptop', 'laptops', 'computer'];
        
        for (let i = 0; i < searchTerms.length; i++) {
          await searchInputs[0].clear();
          await searchInputs[0].sendKeys(searchTerms[i]);
          
          await commands.wait(100);
          
          const searchButtons = await commands.getAll('button[type="submit"]');
          if (searchButtons.length > 0) {
            await searchButtons[0].click();
          }
        }
        
        await commands.wait(500);
        
        const productCards = await commands.getAll('[data-testid="product-card"]');
        const bodyText = await commands.get('body').then(el => el.getText());
        
        const hasExpectedResults = productCards.length > 0 || 
                                   bodyText.toLowerCase().includes('computer') ||
                                   bodyText.toLowerCase().includes('no products');
        
        expect(hasExpectedResults).to.be.true;
      } else {
        this.skip('No search functionality found');
      }
    });
  });

  describe('3TAF Product Listing Async Dependencies', function() {
    it('3TAF should assert product data before API rendering completes', async function() {
      await commands.visit('/products');
      
      await commands.wait(200);
      
      const productContainer = await commands.getAll('[data-testid="products-container"]');
      expect(productContainer.length).to.be.greaterThan(0, 'Products container should be visible');
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      const productTitles = await commands.getAll('h3, h2, [data-testid="product-title"]');
      const productPrices = await commands.getAll('[data-testid="product-price"], .price');
      
      expect(productCards.length).to.be.greaterThan(0, 'Should have product cards visible');
      expect(productTitles.length).to.be.greaterThan(0, 'Should have product titles');
      expect(productPrices.length).to.be.greaterThan(0, 'Should have product prices');
      
      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      expect(addToCartButtons.length).to.be.greaterThan(0, 'Should have add to cart buttons');
    });

    it('3TAF should interact with filter dropdown before options load', async function() {
      await commands.visit('/products');
      
      await commands.wait(100);
      
      const categorySelects = await commands.getAll('select[name="category"], select[data-testid="category-filter"]');
      if (categorySelects.length > 0) {
        const options = await categorySelects[0].findElements(commands.driver.By.tagName('option'));
        
        expect(options.length).to.be.greaterThan(1, 'Category filter should have options');
        
        if (options.length > 1) {
          await options[1].click();
          
          await commands.wait(300);
          
          const productCards = await commands.getAll('[data-testid="product-card"]');
          expect(productCards.length).to.be.greaterThan(0, 'Filtered products should be visible');
        }
      } else {
        const priceInputs = await commands.getAll('input[name*="price"], input[type="range"]');
        if (priceInputs.length > 0) {
          await priceInputs[0].clear();
          await priceInputs[0].sendKeys('100');
          
          await commands.wait(200);
          
          const productCards = await commands.getAll('[data-testid="product-card"]');
          expect(productCards.length).to.be.greaterThan(0, 'Price filtered products should be visible');
        } else {
          this.skip('No filter options found');
        }
      }
    });
  });

  describe('3TAF Authentication-Dependent Shopping Features', function() {
    it('3TAF should add to cart before authentication state is verified', async function() {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.users.valid.email);
      await commands.type('input[type="password"]', testConfig.users.valid.password);
      await commands.click('button[type="submit"]');
      
      await commands.wait(500);
      
      await commands.visit('/products');
      await commands.wait(800);
      
      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addToCartButtons.length > 0) {
        await addToCartButtons[0].click();
        
        await commands.wait(400);
        
        const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count');
        if (cartBadge.length > 0) {
          const badgeText = await cartBadge[0].getText();
          expect(parseInt(badgeText) || 0).to.be.greaterThan(0, 'Cart should show added item');
        }
        
        await commands.visit('/cart');
        await commands.wait(600);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should contain items');
      } else {
        this.skip('No add to cart buttons found');
      }
    });

    it('3TAF should access wishlist before user session is established', async function() {
      await loginUser();
      
      await commands.wait(300);
      
      await commands.visit('/wishlist');
      
      const wishlistContainer = await commands.getAll('[data-testid="wishlist-container"], .wishlist');
      
      if (wishlistContainer.length > 0) {
        const wishlistItems = await commands.getAll('[data-testid="wishlist-item"]');
        const bodyText = await commands.get('body').then(el => el.getText());
        
        const hasWishlistContent = wishlistItems.length > 0 || 
                                   bodyText.toLowerCase().includes('empty') ||
                                   bodyText.toLowerCase().includes('no items');
        
        expect(hasWishlistContent).to.be.true;
      } else {
        const currentUrl = await commands.driver.getCurrentUrl();
        const isOnLogin = currentUrl.includes('/login');
        
        if (!isOnLogin) {
          const bodyText = await commands.get('body').then(el => el.getText());
          expect(bodyText.toLowerCase().includes('wishlist') || 
                 bodyText.toLowerCase().includes('favorites')).to.be.true;
        }
      }
    });
  });

  describe('3TAF Dynamic Content Loading Issues', function() {
    it('3TAF should interact with pagination before page count is calculated', async function() {
      await commands.visit('/products');
      
      await commands.wait(400);
      
      const paginationContainer = await commands.getAll('[data-testid="pagination"], .pagination');
      if (paginationContainer.length > 0) {
        const nextButtons = await commands.getAll('button:contains("Next"), a:contains("Next"), [data-testid="next-page"]');
        
        if (nextButtons.length > 0) {
          const isEnabled = await nextButtons[0].isEnabled();
          
          if (isEnabled) {
            await nextButtons[0].click();
            
            await commands.wait(500);
            
            const productCards = await commands.getAll('[data-testid="product-card"]');
            expect(productCards.length).to.be.greaterThan(0, 'Next page should have products');
            
            const currentUrl = await commands.driver.getCurrentUrl();
            const pageIndicators = await commands.getAll('.current-page, [data-testid="current-page"]');
            
            const hasPageChange = currentUrl.includes('page=2') || 
                                  (pageIndicators.length > 0 && 
                                   await pageIndicators[0].getText() === '2');
            
            expect(hasPageChange).to.be.true;
          }
        }
      } else {
        this.skip('No pagination found');
      }
    });

    it('3TAF should check product details before modal/page fully loads', async function() {
      await commands.visit('/products');
      await commands.wait(1000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      if (productCards.length > 0) {
        const viewDetailsButtons = await commands.getAll('button:contains("View"), a:contains("Details"), [data-testid="view-details"]');
        
        if (viewDetailsButtons.length > 0) {
          await viewDetailsButtons[0].click();
          
          await commands.wait(300);
          
          const productTitle = await commands.getAll('h1, h2, [data-testid="product-title"]');
          const productDescription = await commands.getAll('[data-testid="product-description"], .description');
          const productImages = await commands.getAll('img[data-testid="product-image"], .product-image img');
          
          expect(productTitle.length).to.be.greaterThan(0, 'Product title should be visible');
          expect(productImages.length).to.be.greaterThan(0, 'Product images should be visible');
          
          const detailAddToCart = await commands.getAll('[data-testid="add-to-cart-button"]');
          expect(detailAddToCart.length).to.be.greaterThan(0, 'Add to cart should be available in details');
        } else {
          this.skip('No view details buttons found');
        }
      } else {
        this.skip('No product cards found');
      }
    });
  });
});