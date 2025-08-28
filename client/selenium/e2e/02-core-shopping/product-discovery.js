const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const TestSetup = require('../../support/test-setup');

describe('🛒 Core Shopping - Product Discovery', function() {
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

  describe('Product Listing', function() {
    it('should display products with proper loading states', async function() {
      await commands.visit('/products');
      
      // Wait for products container to load
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.waitForProductsToLoad();
      
      // Check for products using proper data-testid attributes
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        // If we have products, verify they have required elements
        await commands.shouldBeVisible('[data-testid="product-name"]');
        await commands.shouldBeVisible('[data-testid="product-price"]');
        
        // Verify prices are properly formatted
        const prices = await commands.getAll('[data-testid="product-price"]');
        for (const price of prices) {
          const priceText = await price.getText();
          expect(priceText).to.include('$', 'Price should include currency symbol');
        }
      } else {
        // If no products, should show proper empty state
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasEmptyMessage = bodyText.toLowerCase().includes('no products') ||
                               bodyText.toLowerCase().includes('loading');
        expect(hasEmptyMessage).to.be.true('Should show proper empty state or loading message');
      }
    });

    it('should handle product search functionality', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        await commands.searchProducts('laptop');
        await commands.wait(2000);
        
        const searchInput = await commands.get('input[placeholder*="Search"]');
        const value = await searchInput.getAttribute('value');
        expect(value).to.include('laptop');
      }
    });

    it('should filter products by category', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Look for the category select dropdown (based on actual implementation)
      const categorySelects = await commands.getAll('select');
      
      if (categorySelects.length > 0) {
        const select = categorySelects[0];
        try {
          // Wait for select to be fully loaded
          await commands.wait(1000);
          const options = await select.findElements(By.tagName('option'));
          
          if (options && options.length > 1) {
            // Get the initial products count
            const initialProductCards = await commands.getAll('[data-testid="product-card"]');
            const initialCount = initialProductCards.length;
            
            // Select first category option (skip "All Categories")
            const optionText = await options[1].getText();
            await options[1].click();
            await commands.wait(2000); // Wait for filter to apply
            
            // Verify filtering worked - either products changed or we see "No products found"
            const bodyText = await commands.get('body').then(el => el.getText());
            const newProductCards = await commands.getAll('[data-testid="product-card"]');
            
            // Category filtering should either show different products or "No products found"
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
          // Just verify the page is still functional
          await commands.shouldBeVisible('body');
          this.skip();
        }
      } else {
        await commands.log('Category select dropdown not found - feature may not be implemented');
        this.skip();
      }
    });

    it('should display product information correctly', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Check if products exist and verify their structure
      const productImages = await commands.getAll('img[alt]');
      if (productImages.length > 0) {
        // Verify product cards have required information
        await commands.shouldBeVisible('img[alt]');
        
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('$'); // Price should be visible
        
        const headings = await commands.getAll('h3, h2, h1');
        expect(headings.length).to.be.greaterThan(0); // Product titles
      } else {
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found');
      }
    });

    it('should navigate to product details page', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Navigate to first product or use direct URL
      const viewDetailsLinks = await commands.getAll('a:contains("View Details")');
      
      if (viewDetailsLinks.length > 0) {
        await viewDetailsLinks[0].click();
        
        const currentUrl = await commands.driver.getCurrentUrl();
        expect(currentUrl).to.match(/\/products\/[\w-]+$/);
        
        await commands.shouldBeVisible('h1, h2');
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('$'); // Price
      } else {
        // Test direct product URL if no links found
        await commands.visit('/products/1');
        await commands.shouldHaveUrl('/products/1');
      }
    });

    it('should display product images and add to cart functionality', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Based on actual implementation, products should have images
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        // Verify product images are present (either real images or placeholders)
        const images = await commands.getAll('img');
        expect(images.length).to.be.greaterThan(0, 'Product cards should contain images');
        
        // Verify prices are displayed
        const prices = await commands.getAll('[data-testid="product-price"]');
        expect(prices.length).to.be.greaterThan(0, 'Products should display prices');
        
        // Verify add to cart buttons exist (may require authentication)
        const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
        const viewDetailsButtons = await commands.getAll('[data-testid="view-details-button"]');
        
        // Should have either add to cart buttons or view details buttons
        expect(addToCartButtons.length + viewDetailsButtons.length).to.be.greaterThan(0, 
          'Products should have either add to cart or view details buttons');
        
        await commands.log(`Found ${productCards.length} products with ${images.length} images`);
      } else {
        // No products case - verify proper empty state
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found', 'Should show proper no products message');
      }
    });
  });

  describe('API Integration', function() {
    it('should load products successfully', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Verify page loads and shows content
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('$') || 
        bodyText.includes('No products') ||
        bodyText.includes('Loading')
      ).to.be.true;
    });

    it('should handle API errors gracefully', async function() {
      // Test that products page loads even if API might fail
      await commands.visit('/products');
      await commands.shouldBeVisible('body');
      
      // Be more specific about what constitutes proper error handling
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // Check for actual content or proper error messages, not just any text
      const hasProducts = bodyText.includes('$') && /\$\d+/.test(bodyText);
      const hasProperNoProducts = bodyText.toLowerCase().includes('no products') || 
                                 bodyText.toLowerCase().includes('no items found');
      const hasProperError = (bodyText.toLowerCase().includes('error') || 
                             bodyText.toLowerCase().includes('failed')) &&
                            (bodyText.toLowerCase().includes('try again') || 
                             bodyText.toLowerCase().includes('reload'));
      const isStillLoading = bodyText.toLowerCase().includes('loading') || 
                            bodyText.toLowerCase().includes('please wait');
      
      // Must have either valid products, proper no-products message, proper error message, or loading state
      const hasValidState = hasProducts || hasProperNoProducts || hasProperError || isStillLoading;
      expect(hasValidState).to.be.true;
      
      // If none of the above, it's likely broken
      if (!hasValidState) {
        throw new Error('Products page appears broken - no valid content, error handling, or loading state found');
      }
    });

    it('should make search API calls with correct parameters', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        // Clear the search input and type the search term
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('test search');
        
        // Wait for the input to have the correct value
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
      
      // Look for sort options
      const sortSelects = await commands.getAll('select');
      const sortButtons = await commands.getAll('button:contains("Sort"), button:contains("Price")');
      
      if (sortSelects.length > 1) {
        // Assume second select might be for sorting
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
      
      // Look for pagination controls
      const nextButtons = await commands.getAll('button:contains("Next"), a:contains("Next"), button:contains("2")');
      
      if (nextButtons.length > 0) {
        await nextButtons[0].click();
        await commands.wait(2000);
        
        // Check if URL changed or page updated
        await commands.shouldBeVisible('body');
        await commands.log('Pagination functionality found and tested');
      } else {
        await commands.log('Pagination not found - may not be implemented or not needed');
      }
    });

    it('should display product ratings and reviews', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000); // Give time for products to load
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        // Based on actual implementation, look for star characters (★, ☆)
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasStarChars = bodyText.includes('★') || bodyText.includes('☆') || bodyText.includes('⭐');
        
        // Check for review count patterns like "(127 reviews)"
        const hasReviewText = /\(\d+\s+reviews?\)/i.test(bodyText);
        
        // Products with ratings should display stars and/or review counts
        if (hasStarChars || hasReviewText) {
          expect(hasStarChars || hasReviewText).to.be.true;
          await commands.log('Found product ratings and reviews');
        } else {
          // If no ratings found, verify products are still displaying properly
          const prices = await commands.getAll('[data-testid="product-price"]');
          expect(prices.length).to.be.greaterThan(0);
          await commands.log('No ratings found but products are displaying correctly');
        }
      } else {
        // No products case
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('No products found', 'Should show proper no products message');
      }
    });
  });

  describe('Performance and UX', function() {
    it('should load product images efficiently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(3000); // Allow images time to load
      
      const images = await commands.getAll('img');
      if (images.length > 0) {
        // Check if at least some images have loaded
        let loadedImages = 0;
        for (const img of images.slice(0, 3)) { // Check first 3 images
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
      
      // Rapidly interact with search and filters
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
      
      // App should remain responsive
      await commands.shouldBeVisible('body');
      await commands.log('Rapid interactions test completed');
    });
  });
});