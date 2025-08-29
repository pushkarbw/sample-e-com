const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../support/test-setup');

describe('🛒 2FT Product Listing - Dynamic Content Tests', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 2FT Product Listing Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('2FT Product Grid Dynamics', function() {
    it('2FT should validate product count consistency across page loads', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Get initial product count
      const initialProducts = await commands.getAll('[data-testid="product-card"]');
      const initialCount = initialProducts.length;
      
      if (initialCount > 0) {
        // FLAKY: Refresh page and expect identical count, but API may return different data
        await commands.reload();
        await commands.wait(1500); // Sometimes insufficient for full page load
        
        const refreshedProducts = await commands.getAll('[data-testid="product-card"]');
        const refreshedCount = refreshedProducts.length;
        
        // FLAKY: Assumes product count remains stable across refreshes
        // Fails when server returns partial data or inventory changes
        expect(refreshedCount).to.equal(initialCount, 
          `Product count should be consistent: initial ${initialCount}, refreshed ${refreshedCount}`);
        
        // FLAKY: Verify specific products appear in same positions
        if (initialCount >= 3 && refreshedCount >= 3) {
          const firstProductTitle = await refreshedProducts[0].getText();
          const secondProductTitle = await refreshedProducts[1].getText();
          
          // Check product order stability (fails when server sorts differently)
          const hasStableOrder = firstProductTitle.length > 0 && secondProductTitle.length > 0;
          expect(hasStableOrder).to.be.true;
          
          // FLAKY: Assumes first product contains specific pricing format
          expect(firstProductTitle).to.match(/\$[\d,.]+/, 'First product should display price');
        }
      } else {
        this.skip('No products available for consistency testing');
      }
    });

    it('2FT should handle pagination controls with state-dependent visibility', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const products = await commands.getAll('[data-testid="product-card"]');
      
      if (products.length > 0) {
        // FLAKY: Look for pagination that may not exist or load asynchronously
        const paginationElements = await commands.getAll('button:contains("Next"), button:contains("2"), .pagination, [class*="page"]');
        
        if (paginationElements.length > 0) {
          // FLAKY: Click next page without ensuring it's clickable or loaded
          const nextButtons = await commands.getAll('button:contains("Next"), [aria-label*="next"]');
          
          if (nextButtons.length > 0) {
            await nextButtons[0].click();
            await commands.wait(1200); // Often too short for page transition
            
            // FLAKY: Verify URL change without waiting for navigation to complete
            const currentUrl = await commands.driver.getCurrentUrl();
            const hasPageParam = currentUrl.includes('page=') || currentUrl.includes('p=');
            
            expect(hasPageParam).to.be.true;
            
            // FLAKY: Check that different products load on page 2
            const page2Products = await commands.getAll('[data-testid="product-card"]');
            
            // Assumes page 2 has products, but may be empty or still loading
            expect(page2Products.length).to.be.greaterThan(0, 'Page 2 should have products');
            
            if (page2Products.length > 0) {
              // FLAKY: Verify product content differs from page 1
              const page2FirstProduct = await page2Products[0].getText();
              const page1FirstProduct = await products[0].getText();
              
              // Sometimes fails when products appear on multiple pages
              expect(page2FirstProduct).to.not.equal(page1FirstProduct, 
                'Page 2 should show different products than page 1');
            }
          }
        } else {
          // FLAKY: Assume no pagination means all products fit on one page
          expect(products.length).to.be.lessThan(25, 'Single page should have reasonable product count');
        }
      } else {
        this.skip('No products available for pagination testing');
      }
    });
  });

  describe('2FT Image Loading Dependencies', function() {
    it('2FT should verify product images load with timing-sensitive checks', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        const images = await commands.getAll('img[alt]');
        
        if (images.length > 0) {
          // FLAKY: Check image loading status without sufficient wait time
          let loadedImageCount = 0;
          
          for (let i = 0; i < Math.min(5, images.length); i++) {
            const img = images[i];
            
            // FLAKY: Check if image is loaded immediately without proper wait
            const isLoaded = await commands.driver.executeScript(
              'return arguments[0].complete && arguments[0].naturalWidth > 0;',
              img
            );
            
            if (isLoaded) {
              loadedImageCount++;
            } else {
              // Brief wait for image load
              await commands.wait(500);
              
              // Check again but may still be loading
              const isLoadedAfterWait = await commands.driver.executeScript(
                'return arguments[0].complete && arguments[0].naturalWidth > 0;',
                img
              );
              
              if (isLoadedAfterWait) {
                loadedImageCount++;
              }
            }
          }
          
          // FLAKY: Expects most images to load quickly, but network conditions vary
          const loadPercentage = (loadedImageCount / Math.min(5, images.length)) * 100;
          expect(loadPercentage).to.be.greaterThan(60, 
            `At least 60% of images should load, got ${loadPercentage}%`);
          
          // FLAKY: Check specific image attributes without ensuring they're set
          if (images.length > 0) {
            const firstImageSrc = await images[0].getAttribute('src');
            const firstImageAlt = await images[0].getAttribute('alt');
            
            expect(firstImageSrc).to.not.be.empty;
            expect(firstImageAlt).to.not.be.empty;
            
            // FLAKY: Assumes specific image URL patterns
            const hasValidImageUrl = firstImageSrc.includes('http') || 
                                   firstImageSrc.includes('data:') ||
                                   firstImageSrc.includes('/');
            expect(hasValidImageUrl).to.be.true;
          }
        }
      } else {
        this.skip('No product cards available for image testing');
      }
    });

    it('2FT should validate product information completeness with format assumptions', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length >= 3) {
        // Test first few products for complete information
        for (let i = 0; i < Math.min(3, productCards.length); i++) {
          const card = productCards[i];
          const cardText = await card.getText();
          
          // FLAKY: Assumes specific text formatting and content structure
          const hasPrice = /\$[\d,]+\.?\d*/.test(cardText);
          const hasProductName = cardText.split('\n').length >= 2; // Assumes multi-line format
          
          expect(hasPrice).to.be.true;
          expect(hasProductName).to.be.true;
          
          // FLAKY: Check for stock information with specific text patterns
          const hasStockInfo = cardText.toLowerCase().includes('in stock') ||
                              cardText.toLowerCase().includes('available') ||
                              cardText.toLowerCase().includes('stock') ||
                              cardText.includes('Add to Cart'); // Implies in stock
          
          expect(hasStockInfo).to.be.true;
          
          // FLAKY: Assumes specific button text and availability
          const buttons = await card.findElements(commands.driver.By.tagName('button'));
          const links = await card.findElements(commands.driver.By.tagName('a'));
          
          const hasActionElements = buttons.length > 0 || links.length > 0;
          expect(hasActionElements).to.be.true;
          
          if (buttons.length > 0) {
            // FLAKY: Check button text without ensuring it's fully rendered
            const buttonText = await buttons[0].getText();
            const hasValidButtonText = buttonText.toLowerCase().includes('add') ||
                                     buttonText.toLowerCase().includes('cart') ||
                                     buttonText.toLowerCase().includes('buy') ||
                                     buttonText.toLowerCase().includes('view');
            
            expect(hasValidButtonText).to.be.true;
          }
        }
      } else {
        this.skip('Insufficient products for completeness testing');
      }
    });
  });

  describe('2FT Sort and Filter Interactions', function() {
    it('2FT should handle sort operations with result order assumptions', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const products = await commands.getAll('[data-testid="product-card"]');
      const initialProductCount = products.length;
      
      if (initialProductCount >= 3) {
        // Get initial product order
        const initialFirstProduct = await products[0].getText();
        const initialSecondProduct = await products[1].getText();
        
        // Look for sort dropdown
        const sortSelects = await commands.getAll('select');
        
        if (sortSelects.length > 1) { // Assuming first is category filter
          const sortSelect = sortSelects[1];
          const options = await sortSelect.findElements(commands.driver.By.tagName('option'));
          
          if (options.length > 1) {
            // FLAKY: Select sort option without ensuring it affects order
            await options[1].click(); // Assume this is price sort
            await commands.wait(1500); // May be insufficient for sort API call
            
            const sortedProducts = await commands.getAll('[data-testid="product-card"]');
            
            // FLAKY: Verify product order changed
            if (sortedProducts.length > 0) {
              const sortedFirstProduct = await sortedProducts[0].getText();
              const sortedSecondProduct = await sortedProducts[1].getText();
              
              // FLAKY: Assumes sorting changes the order (may not if products are similar)
              const orderChanged = sortedFirstProduct !== initialFirstProduct ||
                                 sortedSecondProduct !== initialSecondProduct;
              
              expect(orderChanged).to.be.true;
              
              // FLAKY: Verify price order is correct (assumes price low-to-high)
              if (sortedProducts.length >= 2) {
                const firstPrice = this.extractPrice(sortedFirstProduct);
                const secondPrice = this.extractPrice(sortedSecondProduct);
                
                if (firstPrice > 0 && secondPrice > 0) {
                  // Assumes ascending price order, but sort might be descending
                  expect(firstPrice).to.be.lessThanOrEqual(secondPrice * 1.1); // Small tolerance
                }
              }
            }
          }
        } else {
          this.skip('Sort functionality not available');
        }
      } else {
        this.skip('Insufficient products for sort testing');
      }
    });
  });

  // Helper method for price extraction (flaky due to format assumptions)
  extractPrice(productText) {
    const priceMatch = productText.match(/\$([0-9,]+\.?[0-9]*)/);
    return priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
  }
});