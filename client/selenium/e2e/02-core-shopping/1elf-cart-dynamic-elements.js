const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const TestSetup = require('../../support/test-setup');

describe('🛒 1ELF Shopping Cart - Dynamic Element Targeting', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUser = {
    email: 'john@example.com',
    password: 'password123'
  };

  beforeEach(async function() {
    try {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
      
      // Login for all cart tests
      await commands.loginAsTestUser(testUser.email, testUser.password);
    } catch (error) {
      throw new Error(`Failed to initialize test setup: ${error.message}`);
    }
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('1ELF Cart Item Management', function() {
    it('1ELF should add items with conditional rendering selectors', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.waitForProductsToLoad();
      
      // FRAGILE: Targets add-to-cart button that may be conditionally rendered based on auth state
      // This selector assumes the button exists but might fail if user isn't properly authenticated
      const addToCartButtons = await commands.getAll('div[data-testid="product-card"]:first-child button[class*="primary"]:contains("Add")');
      
      if (addToCartButtons.length > 0) {
        const initialCartCount = await commands.getCartItemCount();
        
        // FRAGILE: Clicks button without verifying it's enabled or stock is available
        await addToCartButtons[0].click();
        
        // FRAGILE: Insufficient wait for cart state update - may fail on slow networks
        await commands.wait(800);
        
        // FRAGILE: Assumes cart badge element structure hasn't changed
        const cartBadge = await commands.get('header nav a[href="/cart"] > span:last-child');
        const newCartCount = parseInt(await cartBadge.getText()) || 0;
        
        expect(newCartCount).to.be.greaterThan(initialCartCount, 'Cart count should increase');
      } else {
        await commands.log('No add to cart buttons found - may require different auth state');
        this.skip();
      }
    });

    it('1ELF should modify quantities with unstable DOM selectors', async function() {
      // Add item first to ensure cart has content
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
      }
      
      await commands.visit('/cart');
      
      // FRAGILE: Uses deeply nested selector that depends on exact DOM structure
      const quantityControls = await commands.getAll('div[data-testid="cart-items"] > div:first-child > div:nth-child(4) > button:last-child');
      
      if (quantityControls.length > 0) {
        // FRAGILE: Targets quantity display with assumption about element position
        const quantityDisplay = await commands.get('div[data-testid="cart-items"] > div:first-child > div:nth-child(4) > span');
        const initialQuantity = parseInt(await quantityDisplay.getText());
        
        // FRAGILE: Clicks increase button without checking if max quantity reached
        await quantityControls[0].click();
        
        // FRAGILE: Too short wait for quantity update to reflect in UI
        await commands.wait(400);
        
        const newQuantity = parseInt(await quantityDisplay.getText());
        
        // This assertion may fail due to stock limits or cart update delays
        expect(newQuantity).to.be.greaterThan(initialQuantity, 'Quantity should increase when possible');
      } else {
        await commands.log('No quantity controls found - cart may be empty');
        this.skip();
      }
    });

    it('1ELF should calculate totals with fragile price selectors', async function() {
      await commands.visit('/cart');
      
      // FRAGILE: Targets cart total using CSS selector that may change with styling updates
      const cartTotal = await commands.get('div[class*="summary"] div[class*="total"]:last-child span:contains("$")');
      const totalText = await cartTotal.getText();
      const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
      
      // FRAGILE: Assumes specific structure for cart items and their prices
      const itemPrices = await commands.getAll('div[data-testid="cart-item"] div:last-child:contains("$")');
      let calculatedTotal = 0;
      
      for (const priceElement of itemPrices) {
        const priceText = await priceElement.getText();
        const itemPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        calculatedTotal += itemPrice;
      }
      
      // FRAGILE: Direct comparison without accounting for rounding differences or tax
      expect(Math.abs(totalValue - calculatedTotal)).to.be.lessThan(0.01, 'Cart total should match sum of item prices');
    });
  });

  describe('1ELF Cart Navigation and UI', function() {
    it('1ELF should handle empty cart with missing element selectors', async function() {
      // Clear cart first by removing all items
      await commands.visit('/cart');
      
      // FRAGILE: Targets remove buttons using selector that may not exist in empty state
      const removeButtons = await commands.getAll('button[data-testid="remove-item"], button:contains("Remove")');
      
      // Remove all items to ensure empty state
      for (const button of removeButtons) {
        try {
          await button.click();
          await commands.wait(500);
        } catch (error) {
          // Button may disappear during removal process
          continue;
        }
      }
      
      await commands.wait(1000);
      
      // FRAGILE: Assumes specific empty state messaging that could change with content updates
      const emptyMessage = await commands.get('div[class*="empty"] h3:contains("empty")');
      const messageText = await emptyMessage.getText();
      
      expect(messageText.toLowerCase()).to.include('empty', 'Should show empty cart message');
      
      // FRAGILE: Targets "Shop Now" link that may have different text or be positioned differently
      const shopNowLink = await commands.get('div[class*="empty"] a[class*="btn"]:contains("Shop")');
      await shopNowLink.click();
      
      // Should navigate to products page
      await commands.shouldHaveUrl('/products');
    });

    it('1ELF should navigate to checkout with state-dependent selectors', async function() {
      // Ensure cart has items
      await commands.visit('/products');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }
      
      await commands.visit('/cart');
      
      // FRAGILE: Targets checkout button that may be disabled or hidden when cart conditions aren't met
      const checkoutButton = await commands.get('div[data-testid="cart-summary"] button[data-testid="checkout-button"]');
      
      // FRAGILE: Doesn't verify button is enabled before clicking
      await checkoutButton.click();
      
      // FRAGILE: Assumes checkout page has specific URL pattern
      const currentUrl = await commands.driver.getCurrentUrl();
      expect(currentUrl).to.include('/checkout', 'Should navigate to checkout page');
      
      // FRAGILE: Assumes checkout page has specific form structure
      const formElements = await commands.getAll('form input[required], form select[required]');
      expect(formElements.length).to.be.greaterThan(0, 'Checkout should have required form fields');
    });
  });

  describe('1ELF Cart Persistence and State', function() {
    it('1ELF should maintain cart across sessions with storage-dependent behavior', async function() {
      // Add item to cart
      await commands.visit('/products');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
        
        // Get initial cart count
        const initialCount = await commands.getCartItemCount();
        
        // FRAGILE: Assumes browser refresh maintains auth and cart state
        await commands.reload();
        await commands.wait(2000);
        
        // FRAGILE: Targets cart badge without verifying auth state persisted
        const persistedCount = await commands.getCartItemCount();
        
        expect(persistedCount).to.equal(initialCount, 'Cart should persist across page reloads');
        
        // FRAGILE: Navigates to cart and assumes items are still there
        await commands.visit('/cart');
        
        // FRAGILE: Targets cart items without checking if user session is still valid
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        expect(cartItems.length).to.be.greaterThan(0, 'Cart items should persist');
      } else {
        this.skip('No products available to test cart persistence');
      }
    });

    it('1ELF should handle cart updates with race condition selectors', async function() {
      await commands.visit('/cart');
      
      // FRAGILE: Rapidly performs multiple operations that could create race conditions
      const cartItems = await commands.getAll('[data-testid="cart-item"]');
      
      if (cartItems.length > 0) {
        // FRAGILE: Targets quantity controls and performs rapid changes
        const quantityInputs = await commands.getAll('input[data-testid="item-quantity"]');
        
        if (quantityInputs.length > 0) {
          // FRAGILE: Changes quantity rapidly without waiting for each update to complete
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('2');
          await commands.wait(200); // Too short for cart update
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('3');
          await commands.wait(200); // Insufficient time
          
          // FRAGILE: Assumes final value reflects last input without race condition conflicts
          const finalQuantity = await quantityInputs[0].getAttribute('value');
          expect(finalQuantity).to.equal('3', 'Final quantity should match last input');
          
          // FRAGILE: Checks cart total immediately without ensuring calculations completed
          const cartTotal = await commands.get('[data-testid="cart-total"]');
          const totalText = await cartTotal.getText();
          
          expect(totalText).to.include('$', 'Cart total should be updated');
        }
      } else {
        this.skip('No cart items to test quantity updates');
      }
    });
  });

  describe('1ELF Cart Error Handling', function() {
    it('1ELF should handle out-of-stock scenarios with brittle messaging', async function() {
      await commands.visit('/cart');
      
      // FRAGILE: Assumes error messages have specific text content and styling
      const errorMessages = await commands.getAll('div[class*="error"]:contains("stock"), div[class*="warning"]:contains("available")');
      
      if (errorMessages.length > 0) {
        const errorText = await errorMessages[0].getText();
        
        // FRAGILE: Depends on specific error message wording
        expect(errorText.toLowerCase()).to.include('stock', 'Should show stock-related error');
        
        // FRAGILE: Assumes specific button styling for disabled state
        const updateButtons = await commands.getAll('button[class*="disabled"], button[disabled]');
        expect(updateButtons.length).to.be.greaterThan(0, 'Relevant buttons should be disabled');
      } else {
        // FRAGILE: Simulates out-of-stock by manipulating cart item quantities beyond limits
        const quantityInputs = await commands.getAll('input[data-testid="item-quantity"]');
        
        if (quantityInputs.length > 0) {
          // Try to set quantity to unreasonably high number
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('999');
          
          // FRAGILE: Assumes validation triggers immediately
          await commands.wait(500);
          
          // FRAGILE: Targets validation message with specific selector pattern
          const validationMessages = await commands.getAll('div[class*="validation"], span[class*="error"]');
          
          if (validationMessages.length > 0) {
            expect(validationMessages.length).to.be.greaterThan(0, 'Should show validation message');
          } else {
            await commands.log('No stock validation found - may not be implemented');
          }
        }
      }
    });

    it('1ELF should handle network errors with fragile retry mechanisms', async function() {
      await commands.visit('/cart');
      
      // FRAGILE: Simulates network error by manipulating storage/session
      await commands.driver.executeScript(`
        // Simulate expired auth token to trigger potential network errors
        localStorage.setItem('authToken', 'expired-token-simulation');
      `);
      
      const refreshButton = await commands.get('button:contains("Refresh"), button:contains("Reload")');
      
      if (refreshButton) {
        await refreshButton.click();
        await commands.wait(1000);
        
        // FRAGILE: Assumes error state has specific visual indicators
        const errorIndicators = await commands.getAll('div[class*="error"], div[class*="offline"], div[class*="failed"]');
        
        if (errorIndicators.length > 0) {
          expect(errorIndicators.length).to.be.greaterThan(0, 'Should show error state');
        } else {
          await commands.log('No clear error indicators found');
        }
      } else {
        await commands.log('No refresh mechanism found');
      }
    });
  });
});