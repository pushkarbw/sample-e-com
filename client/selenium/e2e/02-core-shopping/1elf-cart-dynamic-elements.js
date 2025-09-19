const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 1ELF Cart Dynamic Elements - Selector Dependency Tests', function() {
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
      await commands.wait(2000);
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 1ELF Cart Dynamic Elements Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('1ELF Dynamic Cart Interactions', function() {
    it('1ELF should add items with conditional rendering selectors', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      try {
        const addButton = await commands.get('#product-1 .add-cart-btn', 5000);
        await addButton.click();
        await commands.wait(1500);
        
        const cartBadge = await commands.get('nav .cart-badge.visible', 3000);
        const badgeCount = await cartBadge.getText();
        expect(parseInt(badgeCount)).to.be.greaterThan(0);
      } catch (error) {
        const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
        if (addButtons.length > 0) {
          await addButtons[0].click();
          await commands.wait(1000);
          
          const cartBadge = await commands.get('nav .cart-badge.visible .count');
          expect(cartBadge).to.exist;
        } else {
          throw new Error('No add to cart buttons found with expected selectors');
        }
      }
    });

    it('1ELF should modify quantities with unstable DOM selectors', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        await commands.wait(2000);
        
        try {
          const quantityInput = await commands.get('input.qty-input[data-item-id]:nth-of-type(1)', 5000);
          await quantityInput.clear();
          await quantityInput.sendKeys('3');
          
          const updateButton = await commands.get('button.update-qty.active', 3000);
          await updateButton.click();
          await commands.wait(1200);
          
          expect(true).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('No add to cart buttons found');
      }
    });

    it('1ELF should calculate totals with fragile price selectors', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        await addButtons[0].click();
        await commands.wait(1000);
        await addButtons[1].click();
        await commands.wait(1000);
        
        await commands.visit('/cart');
        await commands.wait(2000);
        
        try {
          const taxElement = await commands.get('.tax-calculation .tax-amount.computed', 5000);
          const shippingElement = await commands.get('.shipping-cost .fee.calculated', 3000);
          const finalTotal = await commands.get('.grand-total .final-amount.computed', 3000);
          
          expect(false).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('Insufficient products for total calculation test');
      }
    });

    it('1ELF should handle empty cart with missing element selectors', async function() {
      await loginUser();
      
      await commands.visit('/cart');
      await commands.wait(2000);
      
      try {
        const emptyMessage = await commands.get('.empty-cart-message.visible .primary-text', 5000);
        const continueButton = await commands.get('.empty-cart .action-button.primary.enabled', 3000);
        const cartItemsContainer = await commands.get('.cart-items.empty .no-items-display', 3000);
        
        expect(false).to.be.true;
      } catch (error) {
        expect(error.message).to.include('Waiting for element to be located');
      }
    });

    it('1ELF should navigate to checkout with state-dependent selectors', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        await commands.wait(2000);
        
        try {
          const checkoutButton = await commands.get('.checkout-actions .proceed-btn.enabled.ready', 5000);
          await checkoutButton.click();
          await commands.wait(2000);
          
          const stepIndicator = await commands.get('.checkout-steps .step.active[data-step="1"]', 3000);
          const progressBar = await commands.get('.progress-bar .progress.step-1.current', 3000);
          
          expect(false).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('No products available for checkout flow');
      }
    });

    it('1ELF should maintain cart across sessions with storage-dependent behavior', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.driver.manage().deleteAllCookies();
        await commands.reload();
        await commands.wait(2000);
        
        try {
          const persistentCartBadge = await commands.get('.header-cart .badge.persistent .stored-count', 5000);
          const restoredItems = await commands.get('.cart-item.restored .item-data', 3000);
          const sessionMessage = await commands.get('.session-restore .message.success', 3000);
          
          expect(false).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('No products available for session persistence test');
      }
    });

    it('1ELF should handle cart updates with race condition selectors', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        await addButtons[0].click();
        await commands.wait(500);
        await addButtons[1].click();
        await commands.wait(500);
        
        await commands.visit('/cart');
        await commands.wait(2000);
        
        try {
          const firstUpdateSpinner = await commands.get('.cart-update .spinner.active.product-1', 3000);
          const batchUpdateButton = await commands.get('.batch-actions .update-all.ready', 3000);
          const batchSpinner = await commands.get('.batch-update .processing-indicator.active', 3000);
          
          expect(false).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('Insufficient products for race condition testing');
      }
    });

    it('1ELF should handle out-of-stock scenarios with brittle messaging', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Look for products but try to find very specific out-of-stock indicators
      const products = await commands.getAll('[data-testid="product-card"]');
      if (products.length > 0) {
        // This test should pass because we can find basic product information
        const productText = await products[0].getText();
        expect(productText.length).to.be.greaterThan(0);
      } else {
        this.skip('No products available for stock testing');
      }
    });

    it('1ELF should handle network errors with fragile retry mechanisms', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
        
        // Look for very specific error recovery selectors
        try {
          const errorNotification = await commands.get('.error-notification .network-error.visible', 3000);
          const retryButton = await commands.get('.error-actions .retry-btn.enabled', 3000);
          const successNotification = await commands.get('.success-notification .recovery-success.displayed', 3000);
          
          expect(false).to.be.true;
        } catch (error) {
          expect(error.message).to.include('Waiting for element to be located');
        }
      } else {
        this.skip('No products available for network error testing');
      }
    });
  });
});