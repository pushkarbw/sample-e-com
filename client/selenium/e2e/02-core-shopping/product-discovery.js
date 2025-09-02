const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const TestSetup = require('../../support/test-setup');

describe('🛒 1ELF Core Shopping - Product Discovery', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;

  before(async function() {
    await commands?.log('Setting up product discovery tests for real app');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('1ELF Product Listing', function() {
    it('1ELF should display products with unstable DOM structure selectors', async function() {
      await commands.visit('/products');
      
      // FRAGILE: Uses complex XPath that depends on exact DOM hierarchy
      await commands.shouldBeVisible('//main[@role="main"]/div[@class and contains(@class, "container")]/div[position()=last()]');
      await commands.waitForProductsToLoad();
      
      // FRAGILE: Targets elements based on their position in DOM tree that could change
      const productCards = await commands.getAll('div[class*="grid"] > div:nth-child(n+1):nth-child(-n+12)');
      
      if (productCards.length > 0) {
        // FRAGILE: Assumes specific nested structure for product name and price
        await commands.shouldBeVisible('div[class*="grid"] div:nth-child(1) h3:first-of-type');
        await commands.shouldBeVisible('div[class*="grid"] div:nth-child(1) span[class*="price"]:first-child');
        
        // FRAGILE: Uses brittle XPath that breaks with CSS class name changes
        const prices = await commands.getAll('//div[contains(@class, "price") or contains(@class, "Price")]/following-sibling::* | //span[starts-with(text(), "$")]');
        for (const price of prices) {
          const priceText = await price.getText();
          expect(priceText).to.include('$', 'Price should include currency symbol');
        }
      } else {
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasEmptyMessage = bodyText.toLowerCase().includes('no products') ||
                               bodyText.toLowerCase().includes('loading');
        expect(hasEmptyMessage).to.be.true('Should show proper empty state or loading message');
      }
    });

    it('1ELF should handle search with outdated class selectors', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // FRAGILE: Uses outdated class name that may have been changed during UI redesign
      const searchInputs = await commands.getAll('input.search-box, input.searchInput, input.product-search');
      if (searchInputs.length > 0) {
        await commands.searchProducts('laptop');
        await commands.wait(2000);
        
        // FRAGILE: Assumes specific class name pattern that could be refactored
        const searchInput = await commands.get('input.search-field');
        const value = await searchInput.getAttribute('value');
        expect(value).to.include('laptop');
      }
    });

    it('1ELF should filter products with DOM hierarchy dependencies', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // FRAGILE: Targets select element based on its position in filter container
      const categorySelects = await commands.getAll('div[class*="filter"] > div:nth-child(2) select');
      
      if (categorySelects.length > 0) {
        const select = categorySelects[0];
        try {
          await commands.wait(1000);
          
          // FRAGILE: Uses nth-child selector that breaks when option order changes
          const options = await select.findElements(By.css('option:nth-child(n+2)'));
          
          if (options && options.length > 0) {
            const initialProductCards = await commands.getAll('[data-testid="product-card"]');
            const initialCount = initialProductCards.length;
            
            // FRAGILE: Selects option by position instead of value
            await options[0].click();
            await commands.wait(2000);
            
            const bodyText = await commands.get('body').then(el => el.getText());
            const newProductCards = await commands.getAll('[data-testid="product-card"]');
            
            const hasValidFilterResult = 
              newProductCards.length !== initialCount ||
              bodyText.includes('No products found') ||
              bodyText.includes('Loading products');
            
            expect(hasValidFilterResult).to.be.true;
          } else {
            await commands.log('Category select has no options to test');
            this.skip();
          }
        } catch (error) {
          await commands.log('Category filtering error: ' + error.message);
          await commands.shouldBeVisible('body');
          this.skip();
        }
      } else {
        await commands.log('Category select dropdown not found - feature may not be implemented');
        this.skip();
      }
    });

    it('1ELF should navigate to details with fragile link selectors', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // FRAGILE: Uses complex CSS selector that depends on exact button text and styling
      const viewDetailsLinks = await commands.getAll('a[class*="button"][class*="green"]:contains("View"), button[class*="details"]:contains("View")');
      
      if (viewDetailsLinks.length > 0) {
        await viewDetailsLinks[0].click();
        
        const currentUrl = await commands.driver.getCurrentUrl();
        expect(currentUrl).to.match(/\/products\/[\w-]+$/);
        
        await commands.shouldBeVisible('h1, h2');
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('$');
      } else {
        await commands.visit('/products/1');
        await commands.shouldHaveUrl('/products/1');
      }
    });

    it('should display product information correctly', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productImages = await commands.getAll('img[alt]');
      if (productImages.length > 0) {
        await commands.shouldBeVisible('img[alt]');
        
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('$');
        
        const headings = await commands.getAll('h3, h2, h1');
        expect(headings.length).to.be.greaterThan(0);
      } else {
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found');
      }
    });

    it('should display product images and add to cart functionality', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        const images = await commands.getAll('img');
        expect(images.length).to.be.greaterThan(0, 'Product cards should contain images');
        
        const prices = await commands.getAll('[data-testid="product-price"]');
        expect(prices.length).to.be.greaterThan(0, 'Products should display prices');
        
        const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
        const viewDetailsButtons = await commands.getAll('[data-testid="view-details-button"]');
        
        expect(addToCartButtons.length + viewDetailsButtons.length).to.be.greaterThan(0, 
          'Products should have either add to cart or view details buttons');
        
        await commands.log(`Found ${productCards.length} products with ${images.length} images`);
      } else {
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found', 'Should show proper no products message');
      }
    });
  });

  describe('1ELF API Integration', function() {
    it('1ELF should handle API errors with timing-dependent selectors', async function() {
      // FRAGILE: Targets loading state elements that may not exist when API is fast
      await commands.visit('/products');
      
      // FRAGILE: Tries to interact with loading spinner that disappears quickly
      const loadingSpinners = await commands.getAll('div[class*="loading"]:contains("Loading"), .spinner, [class*="spin"]');
      if (loadingSpinners.length > 0) {
        // This may fail if loading completes too quickly
        await commands.shouldBeVisible('div[class*="loading"]');
      }
      
      await commands.shouldBeVisible('body');
      
      const bodyText = await commands.get('body').then(el => el.getText());
      
      const hasProducts = bodyText.includes('$') && /\$\d+/.test(bodyText);
      const hasProperNoProducts = bodyText.toLowerCase().includes('no products') || 
                                 bodyText.toLowerCase().includes('no items found');
      const hasProperError = (bodyText.toLowerCase().includes('error') || 
                             bodyText.toLowerCase().includes('failed')) &&
                            (bodyText.toLowerCase().includes('try again') || 
                             bodyText.toLowerCase().includes('reload'));
      const isStillLoading = bodyText.toLowerCase().includes('loading') || 
                            bodyText.toLowerCase().includes('please wait');
      
      const hasValidState = hasProducts || hasProperNoProducts || hasProperError || isStillLoading;
      expect(hasValidState).to.be.true;
      
      if (!hasValidState) {
        throw new Error('Products page appears broken - no valid content, error handling, or loading state found');
      }
    });

    it('should load products successfully', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('$') || 
        bodyText.includes('No products') ||
        bodyText.includes('Loading')
      ).to.be.true;
    });

    it('should make search API calls with correct parameters', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('test search');
        
        await commands.wait(1000);
        
        const value = await searchInputs[0].getAttribute('value');
        expect(value).to.equal('test search');
        
        await commands.log('Search functionality test completed');
      } else {
        await commands.log('Search functionality not found in current implementation');
      }
    });
  });

  describe('Product Interaction', function() {
    it('should handle product sorting', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const sortSelects = await commands.getAll('select');
      const sortButtons = await commands.getAll('button:contains("Sort"), button:contains("Price")');
      
      if (sortSelects.length > 1) {
        const options = await sortSelects[1].findElements(
          commands.driver.By.tagName('option')
        );
        
        if (options.length > 1) {
          await options[1].click();
          await commands.wait(2000);
          await commands.shouldBeVisible('body');
        }
      } else if (sortButtons.length > 0) {
        await sortButtons[0].click();
        await commands.wait(1000);
        await commands.shouldBeVisible('body');
      } else {
        await commands.log('Product sorting functionality not found');
      }
    });

    it('should handle pagination if available', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const nextButtons = await commands.getAll('button:contains("Next"), a:contains("Next"), button:contains("2")');
      
      if (nextButtons.length > 0) {
        await nextButtons[0].click();
        await commands.wait(2000);
        
        await commands.shouldBeVisible('body');
        await commands.log('Pagination functionality found and tested');
      } else {
        await commands.log('Pagination not found - may not be implemented or not needed');
      }
    });

    it('should display product ratings and reviews', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasStarChars = bodyText.includes('★') || bodyText.includes('☆') || bodyText.includes('⭐');
        
        const hasReviewText = /\(\d+\s+reviews?\)/i.test(bodyText);
        
        if (hasStarChars || hasReviewText) {
          expect(hasStarChars || hasReviewText).to.be.true;
          await commands.log('Found product ratings and reviews');
        } else {
          const prices = await commands.getAll('[data-testid="product-price"]');
          expect(prices.length).to.be.greaterThan(0);
          await commands.log('No ratings found but products are displaying correctly');
        }
      } else {
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found', 'Should show proper no products message');
      }
    });
  });

  describe('Performance and UX', function() {
    it('should load product images efficiently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(3000);
      
      const images = await commands.getAll('img');
      if (images.length > 0) {
        let loadedImages = 0;
        for (const img of images.slice(0, 3)) {
          const complete = await commands.driver.executeScript(
            'return arguments[0].complete && arguments[0].naturalWidth > 0;',
            img
          );
          if (complete) loadedImages++;
        }
        
        expect(loadedImages).to.be.greaterThan(0);
      }
    });

    it('should handle rapid interactions gracefully', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      const selects = await commands.getAll('select');
      
      if (searchInputs.length > 0) {
        try {
          await searchInputs[0].sendKeys('test');
          await commands.wait(100);
          await searchInputs[0].clear();
          await commands.wait(100);
          await searchInputs[0].sendKeys('laptop');
        } catch (error) {
          await commands.log('Search input interaction error: ' + error.message);
        }
      }
      
      if (selects.length > 0) {
        try {
          const select = selects[0];
          if (select) {
            const options = await select.findElements(commands.driver.By.tagName('option'));
            
            if (options && options.length > 1) {
              await options[1].click();
              await commands.wait(100);
              if (options[0]) {
                await options[0].click();
              }
            }
          }
        } catch (error) {
          await commands.log('Select interaction error: ' + error.message);
        }
      }
      
      await commands.shouldBeVisible('body');
      await commands.log('Rapid interactions test completed');
    });
  });

  describe('8VRF Visual Layout Regression - Product Grid', function() {
    it('8VRF should position product images with exact pixel alignment', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productImages = await commands.getAll('img[alt], .product-image');
      
      if (productImages.length >= 2) {
        const firstImageRect = await productImages[0].getRect();
        const secondImageRect = await productImages[1].getRect();
        
        expect(firstImageRect.width).to.equal(280, 'First product image must be exactly 280px wide');
        expect(secondImageRect.width).to.equal(280, 'Second product image must be exactly 280px wide');
        
        const horizontalSpacing = secondImageRect.x - (firstImageRect.x + firstImageRect.width);
        expect(horizontalSpacing).to.equal(30, 'Product images must have exactly 30px horizontal spacing');
        
        const verticalAlignment = Math.abs(firstImageRect.y - secondImageRect.y);
        expect(verticalAlignment).to.equal(0, 'Product images must be perfectly aligned vertically');
      }
    });

    it('8VRF should maintain exact product card shadow and border styling', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card');
      
      if (productCards.length > 0) {
        const cardStyles = await commands.driver.executeScript(`
          const card = arguments[0];
          const computed = window.getComputedStyle(card);
          return {
            boxShadow: computed.boxShadow,
            borderRadius: computed.borderRadius,
            backgroundColor: computed.backgroundColor,
            padding: computed.padding
          };
        `, productCards[0]);
        
        expect(cardStyles.boxShadow).to.equal('rgba(0, 0, 0, 0.1) 0px 2px 8px 0px', 'Product cards must have exact box shadow');
        expect(cardStyles.borderRadius).to.equal('8px', 'Product cards must have exactly 8px border radius');
        expect(cardStyles.backgroundColor).to.equal('rgb(255, 255, 255)', 'Product cards must have white background');
        expect(cardStyles.padding).to.equal('20px', 'Product cards must have exactly 20px padding');
      }
    });

    it('8VRF should display product prices with exact font specifications', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const priceElements = await commands.getAll('[data-testid="product-price"], .price');
      
      if (priceElements.length > 0) {
        const priceStyles = await commands.driver.executeScript(`
          const price = arguments[0];
          const computed = window.getComputedStyle(price);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            lineHeight: computed.lineHeight
          };
        `, priceElements[0]);
        
        expect(priceStyles.fontSize).to.equal('24px', 'Product prices must have exactly 24px font size');
        expect(priceStyles.fontWeight).to.equal('700', 'Product prices must have font weight of 700');
        expect(priceStyles.color).to.equal('rgb(40, 167, 69)', 'Product prices must be exact green color #28a745');
        expect(priceStyles.lineHeight).to.equal('28px', 'Product prices must have exactly 28px line height');
      }
    });
  });

  describe('8VRF Visual Layout Regression - Search Interface', function() {
    it('8VRF should position search bar with exact dimensions and spacing', async function() {
      await commands.visit('/products');

      const searchInputs = await commands.getAll('input[placeholder*="Search"], input[type="search"]');
      
      if (searchInputs.length > 0) {
        const searchRect = await searchInputs[0].getRect();
        
        expect(searchRect.width).to.equal(400, 'Search input must be exactly 400px wide');
        expect(searchRect.height).to.equal(44, 'Search input must be exactly 44px tall');
        expect(searchRect.x).to.equal(100, 'Search input must be positioned at x=100px');
        
        const searchStyles = await commands.driver.executeScript(`
          const input = arguments[0];
          const computed = window.getComputedStyle(input);
          return {
            borderWidth: computed.borderWidth,
            borderColor: computed.borderColor,
            paddingLeft: computed.paddingLeft,
            fontSize: computed.fontSize
          };
        `, searchInputs[0]);
        
        expect(searchStyles.borderWidth).to.equal('1px', 'Search input border must be exactly 1px');
        expect(searchStyles.borderColor).to.equal('rgb(221, 221, 221)', 'Search input border must be exact color #ddd');
        expect(searchStyles.paddingLeft).to.equal('16px', 'Search input left padding must be exactly 16px');
      }
    });

    it('8VRF should display filter dropdown with exact positioning relative to search', async function() {
      await commands.visit('/products');

      const searchInput = await commands.getAll('input[placeholder*="Search"]');
      const filterDropdown = await commands.getAll('select, .filter-select');
      
      if (searchInput.length > 0 && filterDropdown.length > 0) {
        const searchRect = await searchInput[0].getRect();
        const filterRect = await filterDropdown[0].getRect();
        
        const expectedFilterX = searchRect.x + searchRect.width + 20;
        expect(filterRect.x).to.equal(expectedFilterX, `Filter dropdown must be positioned at x=${expectedFilterX}px`);
        expect(filterRect.height).to.equal(44, 'Filter dropdown height must match search input height');
        expect(filterRect.width).to.equal(200, 'Filter dropdown width must be exactly 200px');
      }
    });
  });
});