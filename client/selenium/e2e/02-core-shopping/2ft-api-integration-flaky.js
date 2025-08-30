const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 2FT API Integration - Data Dependency Tests', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    }
  };

  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.users.valid.email);
      await commands.type('input[type="password"]', testConfig.users.valid.password);
      await commands.click('button[type="submit"]');
      await commands.wait(1800); // Sometimes insufficient for auth token generation
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 2FT API Integration Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('2FT Search API Reliability', function() {
    it('2FT should handle search API response timing with result validation', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        // FLAKY: Search for term that may or may not exist in current dataset
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('laptop');
        await commands.wait(1100); // Often too short for search API debounce + response
        
        const searchResults = await commands.getAll('[data-testid="product-card"]');
        
        if (searchResults.length > 0) {
          // FLAKY: Assumes search results contain the search term
          // Fails when API returns related products or fuzzy matches
          let relevantResults = 0;
          
          for (let i = 0; i < Math.min(3, searchResults.length); i++) {
            const resultText = await searchResults[i].getText();
            const isRelevant = resultText.toLowerCase().includes('laptop') ||
                              resultText.toLowerCase().includes('computer') ||
                              resultText.toLowerCase().includes('notebook') ||
                              resultText.toLowerCase().includes('electronics');
            
            if (isRelevant) {
              relevantResults++;
            }
          }
          
          // FLAKY: Expects at least 70% relevance but API may return broader results
          const relevancePercentage = (relevantResults / Math.min(3, searchResults.length)) * 100;
          expect(relevancePercentage).to.be.greaterThan(60, 
            `Search results should be relevant, got ${relevancePercentage}% relevance`);
          
        } else {
          // FLAKY: Assumes "no results found" message appears quickly
          await commands.wait(800); // Brief additional wait
          const bodyText = await commands.get('body').then(el => el.getText());
          
          const hasNoResultsMessage = bodyText.toLowerCase().includes('no products found') ||
                                     bodyText.toLowerCase().includes('no results') ||
                                     bodyText.toLowerCase().includes('not found');
          
          expect(hasNoResultsMessage).to.be.true;
        }
        
        // FLAKY: Clear search and verify original products return
        await searchInputs[0].clear();
        await commands.wait(1000); // May be insufficient for search clear + API call
        
        const clearedResults = await commands.getAll('[data-testid="product-card"]');
        expect(clearedResults.length).to.be.greaterThan(searchResults.length, 
          'Clearing search should show more products');
          
      } else {
        this.skip('Search functionality not available');
      }
    });

    it('2FT should validate search API with special characters and edge cases', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const searchInputs = await commands.getAll('input[placeholder*="Search"]');
      if (searchInputs.length > 0) {
        // Get baseline product count
        const baselineProducts = await commands.getAll('[data-testid="product-card"]');
        const baselineCount = baselineProducts.length;
        
        // FLAKY: Search with special characters that may break API
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('MacBook "Pro"');
        await commands.wait(1300); // Sometimes insufficient for complex search processing
        
        const specialCharResults = await commands.getAll('[data-testid="product-card"]');
        
        // FLAKY: Assumes API handles quotes correctly
        expect(specialCharResults.length).to.be.greaterThanOrEqual(0);
        
        // FLAKY: Test empty search
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('   '); // Spaces only
        await commands.wait(900);
        
        const spaceResults = await commands.getAll('[data-testid="product-card"]');
        
        // FLAKY: Assumes empty/space search returns all products or handles gracefully
        expect(spaceResults.length).to.be.greaterThanOrEqual(baselineCount * 0.8);
        
        // FLAKY: Test very long search term
        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('this is a very long search term that probably does not exist in any product');
        await commands.wait(1200);
        
        const longSearchResults = await commands.getAll('[data-testid="product-card"]');
        
        // FLAKY: Assumes long invalid search returns empty or shows message
        if (longSearchResults.length === 0) {
          const bodyText = await commands.get('body').then(el => el.getText());
          expect(bodyText.toLowerCase()).to.include('no products found');
        }
        
      } else {
        this.skip('Search functionality not available');
      }
    });
  });

  describe('2FT Cart API State Management', function() {
    it('2FT should verify cart API consistency with rapid state changes', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        // FLAKY: Rapid cart operations that may create API race conditions
        await addButtons[0].click();
        await commands.wait(600); // Too short for first API call to complete
        
        await addButtons[1].click();
        await commands.wait(400); // Even shorter wait
        
        // Check cart without ensuring all API calls completed
        await commands.visit('/cart');
        await commands.wait(1200);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        
        // FLAKY: Expects 2 items but race conditions may result in 0, 1, or 2
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should have items after adding');
        
        if (cartItems.length > 0) {
          // FLAKY: Test quantity update API timing
          const quantityInputs = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
          
          if (quantityInputs.length > 0) {
            const originalQuantity = await quantityInputs[0].getAttribute('value');
            
            // Rapid quantity changes
            await quantityInputs[0].clear();
            await quantityInputs[0].sendKeys('4');
            await commands.wait(500); // Too short for API update
            
            await quantityInputs[0].clear();
            await quantityInputs[0].sendKeys('2');
            await commands.wait(700); // Brief wait
            
            // FLAKY: Verify cart total updated correctly
            const totalElements = await commands.getAll('[data-testid="cart-total"]');
            
            if (totalElements.length > 0) {
              const totalText = await totalElements[0].getText();
              const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
              
              // FLAKY: Assumes total reflects final quantity (2) not intermediate states
              expect(total).to.be.greaterThan(0, 'Cart total should reflect quantity changes');
              
              // FLAKY: Check if quantity input shows final value
              const finalQuantity = await quantityInputs[0].getAttribute('value');
              expect(parseInt(finalQuantity)).to.equal(2, 'Quantity should be 2');
            }
          }
        }
      } else {
        this.skip('Insufficient products for cart API testing');
      }
    });

    it('2FT should validate cart persistence across session boundaries', async function() {
      await loginUser();
      
      // Add item to cart
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        // Get cart count
        const initialCartCount = await commands.getCartItemCount();
        
        // FLAKY: Navigate away and back quickly without ensuring cart save completed
        await commands.visit('/');
        await commands.wait(500);
        await commands.visit('/products');
        await commands.wait(800); // May be insufficient for cart state reload
        
        // FLAKY: Check if cart badge persisted
        const persistedCartCount = await commands.getCartItemCount();
        
        expect(persistedCartCount).to.equal(initialCartCount, 
          'Cart should persist across navigation');
        
        // FLAKY: Verify cart contents by visiting cart page
        await commands.visit('/cart');
        await commands.wait(1000);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        expect(cartItems.length).to.be.greaterThan(0, 'Cart items should persist');
        
        // FLAKY: Test browser refresh cart persistence
        await commands.reload();
        await commands.wait(1200); // Sometimes insufficient for full cart reload
        
        const refreshedCartItems = await commands.getAll('[data-testid="cart-item"]');
        
        // FLAKY: Assumes cart survives page refresh via API/storage
        expect(refreshedCartItems.length).to.equal(cartItems.length, 
          'Cart should survive page refresh');
          
      } else {
        this.skip('No products available for persistence testing');
      }
    });
  });

  describe('2FT Product Data Dependencies', function() {
    it('2FT should verify product availability affects cart operations', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        // FLAKY: Check stock status and add to cart based on stock info
        for (let i = 0; i < Math.min(3, productCards.length); i++) {
          const card = productCards[i];
          const cardText = await card.getText();
          
          const addButtons = await card.findElements(commands.driver.By.css('[data-testid="add-to-cart-button"], button'));
          
          if (addButtons.length > 0) {
            const button = addButtons[0];
            const buttonText = await button.getText();
            const isEnabled = await button.isEnabled();
            
            // FLAKY: Assumes button state reflects actual stock availability
            const appearsInStock = cardText.toLowerCase().includes('in stock') || 
                                  buttonText.toLowerCase().includes('add to cart');
            
            if (appearsInStock && isEnabled) {
              await button.click();
              await commands.wait(1000); // May be insufficient for stock check API
              
              // FLAKY: Verify successful addition or stock error
              const bodyText = await commands.get('body').then(el => el.getText());
              
              const hasSuccessIndicator = bodyText.toLowerCase().includes('added') ||
                                        bodyText.toLowerCase().includes('success') ||
                                        bodyText.toLowerCase().includes('cart');
              
              const hasErrorIndicator = bodyText.toLowerCase().includes('out of stock') ||
                                      bodyText.toLowerCase().includes('not available') ||
                                      bodyText.toLowerCase().includes('error');
              
              // FLAKY: Expects either success or clear error message
              expect(hasSuccessIndicator || hasErrorIndicator).to.be.true;
              
              if (hasErrorIndicator) {
                // FLAKY: If stock error, verify button becomes disabled
                await commands.wait(500);
                const updatedButton = await commands.getAll('[data-testid="add-to-cart-button"]');
                if (updatedButton.length > i) {
                  const newButtonState = await updatedButton[i].isEnabled();
                  expect(newButtonState).to.be.false;
                }
              }
              
              break; // Only test one addition to avoid stock depletion
            }
          }
        }
      } else {
        this.skip('No products available for stock testing');
      }
    });

    it('2FT should handle product price consistency across cart operations', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const productCards = await commands.getAll('[data-testid="product-card"]');
      
      if (productCards.length > 0) {
        // Get product price from listing
        const firstCard = productCards[0];
        const cardText = await firstCard.getText();
        const priceMatch = cardText.match(/\$([0-9,]+\.?[0-9]*)/);
        
        if (priceMatch) {
          const listingPrice = parseFloat(priceMatch[1].replace(',', ''));
          
          // Add to cart
          const addButtons = await firstCard.findElements(commands.driver.By.css('[data-testid="add-to-cart-button"], button'));
          
          if (addButtons.length > 0) {
            await addButtons[0].click();
            await commands.wait(1500);
            
            // Check price in cart
            await commands.visit('/cart');
            await commands.wait(1200); // Sometimes insufficient for cart data load
            
            const cartItems = await commands.getAll('[data-testid="cart-item"]');
            
            if (cartItems.length > 0) {
              const cartItemText = await cartItems[0].getText();
              const cartPriceMatch = cartItemText.match(/\$([0-9,]+\.?[0-9]*)/);
              
              if (cartPriceMatch) {
                const cartPrice = parseFloat(cartPriceMatch[1].replace(',', ''));
                
                // FLAKY: Exact price comparison that may fail due to discounts, tax, or formatting
                const priceDifference = Math.abs(cartPrice - listingPrice);
                const tolerance = 0.01;
                
                expect(priceDifference).to.be.lessThan(tolerance, 
                  `Cart price ${cartPrice} should match listing price ${listingPrice}`);
                
                // FLAKY: Verify total calculation
                const totalElements = await commands.getAll('[data-testid="cart-total"]');
                
                if (totalElements.length > 0) {
                  const totalText = await totalElements[0].getText();
                  const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
                  
                  // FLAKY: Assumes simple total = item price (ignores tax, shipping, etc.)
                  expect(Math.abs(total - cartPrice)).to.be.lessThan(tolerance);
                }
              }
            }
          }
        }
      } else {
        this.skip('No products available for price testing');
      }
    });
  });
});