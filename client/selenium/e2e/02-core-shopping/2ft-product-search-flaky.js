const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 2FT Product Search - Advanced Discovery Tests', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    }
  };

  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 2FT Product Search Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('2FT Product Search Reliability', function() {
    it('2FT should validate search results with dynamic content ordering', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Search for a common term
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('phone');
        await commands.wait(1500); // Sometimes insufficient for API response
        
        // FLAKY: Depends on nth-child selectors where product order varies by API response time
        const firstProductName = await commands.getAll('div[data-testid="product-card"]:nth-child(1) h3');
        const secondProductName = await commands.getAll('div[data-testid="product-card"]:nth-child(2) h3');
        
        if (firstProductName.length > 0 && secondProductName.length > 0) {
          const firstName = await firstProductName[0].getText();
          const secondName = await secondProductName[0].getText();
          
          // FLAKY: Assumes first result always contains search term better than second
          // Fails when API returns products in different relevance order
          const firstRelevance = firstName.toLowerCase().includes('phone') ? 2 : 
                                firstName.toLowerCase().includes('smart') ? 1 : 0;
          const secondRelevance = secondName.toLowerCase().includes('phone') ? 2 : 
                                 secondName.toLowerCase().includes('smart') ? 1 : 0;
          
          expect(firstRelevance).to.be.greaterThanOrEqual(secondRelevance, 
            'First search result should be more relevant than second');
        }
      } else {
        this.skip('Search functionality not available');
      }
    });

    it('2FT should handle search with capitalization variations consistently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        // Test lowercase search
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('electronics');
        await commands.wait(1200); // Sometimes too short for search debounce
        
        const lowercaseResults = await commands.getAll('[data-testid="product-card"]');
        const lowercaseCount = lowercaseResults.length;
        
        // Clear and test uppercase
        await searchInputs[0].clear();
        await commands.wait(300); // Brief wait that may not clear previous search state
        await searchInputs[0].sendKeys('ELECTRONICS');
        await commands.wait(1200);
        
        const uppercaseResults = await commands.getAll('[data-testid="product-card"]');
        const uppercaseCount = uppercaseResults.length;
        
        // FLAKY: Assumes case-insensitive search returns identical results
        // Fails when search state from previous query interferes or API has timing issues
        expect(uppercaseCount).to.equal(lowercaseCount, 
          'Search should be case-insensitive and return same number of results');
          
        // FLAKY: Checks specific text content that may have different formatting
        if (lowercaseResults.length > 0 && uppercaseResults.length > 0) {
          const firstLowerText = await lowercaseResults[0].getText();
          const firstUpperText = await uppercaseResults[0].getText();
          
          // Sometimes fails due to different product ordering or text formatting
          expect(firstLowerText.toLowerCase()).to.include('electronic');
          expect(firstUpperText.toLowerCase()).to.include('electronic');
        }
      } else {
        this.skip('Search functionality not available');
      }
    });
  });

  describe('2FT Category Filter Dependencies', function() {
    it('2FT should verify category filter with unstable product availability', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const categorySelects = await commands.getAll('select');
      if (categorySelects.length > 0) {
        const select = categorySelects[0];
        const options = await select.findElements(commands.driver.By.tagName('option'));
        
        if (options.length > 2) {
          // FLAKY: Assumes specific categories exist and have products
          // Fails when test data varies or products are out of stock
          const electronicsOption = options.find(async (option) => {
            const text = await option.getText();
            return text.toLowerCase().includes('electronics');
          });
          
          if (electronicsOption) {
            await electronicsOption.click();
            await commands.wait(1800); // Sometimes insufficient for filter API call
            
            const filteredProducts = await commands.getAll('[data-testid="product-card"]');
            
            // FLAKY: Expects at least 2 electronics products, but availability varies
            expect(filteredProducts.length).to.be.greaterThan(1, 
              'Electronics category should have multiple products');
            
            if (filteredProducts.length > 0) {
              // FLAKY: Checks that all products contain "electronics" in text
              // Fails when category text appears differently or products have complex descriptions
              for (let i = 0; i < Math.min(3, filteredProducts.length); i++) {
                const productText = await filteredProducts[i].getText();
                const hasElectronicsCategory = productText.toLowerCase().includes('electronics') ||
                                              productText.toLowerCase().includes('electronic') ||
                                              productText.toLowerCase().includes('tech');
                
                expect(hasElectronicsCategory).to.be.true;
              }
            }
          }
        }
      } else {
        this.skip('Category filter not available');
      }
    });

    it('2FT should validate product count matches filter expectations', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Get initial product count
      const allProducts = await commands.getAll('[data-testid="product-card"]');
      const totalCount = allProducts.length;
      
      const categorySelects = await commands.getAll('select');
      if (categorySelects.length > 0 && totalCount > 0) {
        const select = categorySelects[0];
        const options = await select.findElements(commands.driver.By.tagName('option'));
        
        let categoryProductCount = 0;
        
        // FLAKY: Tests each category and sums products, but timing creates inconsistency
        for (let i = 1; i < Math.min(4, options.length); i++) {
          await options[i].click();
          await commands.wait(1000); // Often too short for API response
          
          const categoryProducts = await commands.getAll('[data-testid="product-card"]');
          categoryProductCount += categoryProducts.length;
          
          // Reset to "All Categories" with insufficient wait
          await options[0].click();
          await commands.wait(800); // May not complete before next iteration
        }
        
        // FLAKY: Assumes sum of category products equals or exceeds total products
        // Fails due to overlapping categories, timing issues, or dynamic inventory
        expect(categoryProductCount).to.be.greaterThan(totalCount * 0.7, 
          'Category filtering should account for most products');
      } else {
        this.skip('No products or categories available for testing');
      }
    });
  });
});