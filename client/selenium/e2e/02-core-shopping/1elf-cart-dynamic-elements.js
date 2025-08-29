const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../support/test-setup');

describe('🛒 1ELF Cart Dynamic Elements - Selector Dependency Tests', function() {
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
      
      const products = await commands.getAll('[data-testid="product-card"]');
      
      if (products.length > 0) {
        const addButton = await commands.get('#product-1 .add-cart-btn', 30000);
        
        if (addButton) {
          await addButton.click();
          await commands.wait(1500);
          
          const cartBadge = await commands.get('nav .cart-badge.visible');
          const badgeCount = await cartBadge.getText();
          
          expect(parseInt(badgeCount)).to.be.greaterThan(0);
          
          const successMessage = await commands.get('.notification.success.show');
          const messageText = await successMessage.getText();
          expect(messageText).to.include('added');
          
          const addButtonAfter = await commands.get('#product-1 .add-cart-btn.disabled');
          expect(addButtonAfter).to.exist;
        } else {
          await commands.get('button[data-product-id="1"]').click();
          await commands.wait(1000);
          const cartCount = await commands.get('.cart-count:not(.hidden)').getText();
          expect(parseInt(cartCount)).to.be.greaterThan(0);
        }
      } else {
        this.skip('No products available for testing');
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
        
        const quantityInput = await commands.get('input.qty-input[data-item-id]:nth-of-type(1)');
        
        if (quantityInput) {
          await quantityInput.clear();
          await quantityInput.sendKeys('3');
          
          const updateButton = await commands.get('button.update-qty.active');
          await updateButton.click();
          await commands.wait(1200);
          
          const updatedTotal = await commands.get('.cart-total .amount.updated');
          const totalValue = parseFloat(await updatedTotal.getText().replace(/[^0-9.]/g, ''));
          
          expect(totalValue).to.be.greaterThan(0);
          
          const lineTotal = await commands.get('.line-item:first-child .line-total.calculated');
          const lineValue = parseFloat(await lineTotal.getText().replace(/[^0-9.]/g, ''));
          expect(lineValue).to.be.greaterThan(0);
        } else {
          this.skip('Quantity input not found with expected selector');
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
        
        const itemPrices = await commands.getAll('.item-price .currency .amount');
        const quantities = await commands.getAll('.quantity-display .current-qty');
        
        let expectedTotal = 0;
        for (let i = 0; i < itemPrices.length; i++) {
          const price = parseFloat(await itemPrices[i].getText());
          const qty = parseInt(await quantities[i].getText());
          expectedTotal += price * qty;
        }
        
        const taxElement = await commands.get('.tax-calculation .tax-amount.computed');
        const taxAmount = parseFloat(await taxElement.getText().replace(/[^0-9.]/g, ''));
        expectedTotal += taxAmount;
        
        const shippingElement = await commands.get('.shipping-cost .fee.calculated');
        const shippingCost = parseFloat(await shippingElement.getText().replace(/[^0-9.]/g, ''));
        expectedTotal += shippingCost;
        
        const finalTotal = await commands.get('.grand-total .final-amount.computed');
        const displayedTotal = parseFloat(await finalTotal.getText().replace(/[^0-9.]/g, ''));
        
        expect(Math.abs(displayedTotal - expectedTotal)).to.be.lessThan(0.01);
      } else {
        this.skip('Insufficient products for total calculation test');
      }
    });

    it('1ELF should handle empty cart with missing element selectors', async function() {
      await loginUser();
      
      await commands.visit('/cart');
      
      const emptyMessage = await commands.get('.empty-cart-message.visible .primary-text');
      
      if (emptyMessage) {
        const messageText = await emptyMessage.getText();
        expect(messageText.toLowerCase()).to.include('empty');
        
        const continueButton = await commands.get('.empty-cart .action-button.primary.enabled');
        expect(continueButton).to.exist;
        
        const cartItemsContainer = await commands.get('.cart-items.empty .no-items-display');
        expect(cartItemsContainer).to.exist;
        
        const checkoutButton = await commands.get('.checkout-section .checkout-btn.disabled.inactive');
        expect(checkoutButton).to.exist;
        
        const totalSection = await commands.get('.totals-section.hidden .zero-total');
        expect(totalSection).to.exist;
      } else {
        const cartItems = await commands.getAll('.cart-item.populated');
        if (cartItems.length > 0) {
          const removeButtons = await commands.getAll('.remove-item.delete-action');
          
          for (let button of removeButtons) {
            await button.click();
            await commands.wait(800);
          }
          
          await commands.wait(1500);
          
          const emptyStateMessage = await commands.get('.cart-empty-state .message.displayed');
          expect(emptyStateMessage).to.exist;
        }
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
        
        const checkoutButton = await commands.get('.checkout-actions .proceed-btn.enabled.ready');
        
        if (checkoutButton) {
          await checkoutButton.click();
          await commands.wait(2000);
          
          const checkoutForm = await commands.get('.checkout-form.loaded .form-container');
          expect(checkoutForm).to.exist;
          
          const stepIndicator = await commands.get('.checkout-steps .step.active[data-step="1"]');
          expect(stepIndicator).to.exist;
          
          const progressBar = await commands.get('.progress-bar .progress.step-1.current');
          expect(progressBar).to.exist;
        } else {
          this.skip('Checkout button not found in expected state');
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
        
        const cartBadge = await commands.get('.header-cart .badge.visible .count');
        const initialCount = parseInt(await cartBadge.getText());
        
        await commands.driver.manage().deleteAllCookies();
        
        await commands.reload();
        await commands.wait(2000);
        
        const persistentCartBadge = await commands.get('.header-cart .badge.persistent .stored-count');
        
        if (persistentCartBadge) {
          const persistedCount = parseInt(await persistentCartBadge.getText());
          expect(persistedCount).to.equal(initialCount);
          
          await commands.visit('/cart');
          
          const restoredItems = await commands.getAll('.cart-item.restored .item-data');
          expect(restoredItems.length).to.be.greaterThan(0);
          
          const sessionMessage = await commands.get('.session-restore .message.success');
          expect(sessionMessage).to.exist;
        } else {
          const guestCartBadge = await commands.get('.header-cart .badge.guest .temp-count');
          const guestCount = parseInt(await guestCartBadge.getText());
          expect(guestCount).to.equal(initialCount);
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
        const firstUpdateSpinner = await commands.get('.cart-update .spinner.active.product-1');
        await commands.wait(500);
        
        await addButtons[1].click();
        const secondUpdateSpinner = await commands.get('.cart-update .spinner.active.product-2');
        await commands.wait(500);
        
        await commands.visit('/cart');
        
        const loadingIndicator = await commands.get('.cart-loading .sync-indicator.processing');
        await commands.waitForElementToDisappear('.cart-loading .sync-indicator.processing', 5000);
        
        const cartItems = await commands.getAll('.cart-item.loaded .item-details');
        expect(cartItems.length).to.equal(2);
        
        const batchUpdateButton = await commands.get('.batch-actions .update-all.ready');
        
        if (batchUpdateButton) {
          const quantityInputs = await commands.getAll('.qty-input.editable');
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('2');
          
          await quantityInputs[1].clear();
          await quantityInputs[1].sendKeys('3');
          
          await batchUpdateButton.click();
          
          const batchSpinner = await commands.get('.batch-update .processing-indicator.active');
          await commands.waitForElementToDisappear('.batch-update .processing-indicator.active', 5000);
          
          const updatedTotals = await commands.get('.totals-section .recalculated .final-amount');
          expect(updatedTotals).to.exist;
        }
      } else {
        this.skip('Insufficient products for race condition testing');
      }
    });

    it('1ELF should handle out-of-stock scenarios with brittle messaging', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const stockElements = await commands.getAll('.product-stock .availability-status');
      
      for (let stockElement of stockElements) {
        const stockText = await stockElement.getText();
        
        if (stockText.toLowerCase().includes('out of stock') || 
            stockText.toLowerCase().includes('unavailable')) {
          
          const productCard = await stockElement.findElement(commands.driver.By.xpath('./ancestor::*[contains(@class, "product-card")]'));
          const addButton = await productCard.findElement(commands.driver.By.css('.add-to-cart.disabled.out-of-stock'));
          
          const isDisabled = !(await addButton.isEnabled());
          expect(isDisabled).to.be.true;
          
          const stockMessage = await productCard.findElement(commands.driver.By.css('.stock-message.warning.visible'));
          const messageText = await stockMessage.getText();
          expect(messageText.toLowerCase()).to.include('stock');
          
          const notifyButton = await productCard.findElement(commands.driver.By.css('.notify-available.enabled'));
          expect(notifyButton).to.exist;
          
          await notifyButton.click();
          
          const notificationForm = await commands.get('.stock-notification .email-form.visible');
          expect(notificationForm).to.exist;
          
          const emailInput = await commands.get('.stock-notification .email-input.required');
          await emailInput.sendKeys('test@example.com');
          
          const submitButton = await commands.get('.stock-notification .submit-btn.enabled');
          await submitButton.click();
          
          const confirmationMessage = await commands.get('.notification .success-message.shown');
          expect(confirmationMessage).to.exist;
          
          break;
        }
      }
    });

    it('1ELF should handle network errors with fragile retry mechanisms', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      await commands.driver.executeScript(`
        const originalFetch = window.fetch;
        let callCount = 0;
        window.fetch = function(...args) {
          callCount++;
          if (callCount <= 2 && args[0].includes('/api/cart')) {
            return Promise.reject(new Error('Network error'));
          }
          return originalFetch.apply(this, args);
        };
      `);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        
        const errorNotification = await commands.get('.error-notification .network-error.visible');
        expect(errorNotification).to.exist;
        
        const retryButton = await commands.get('.error-actions .retry-btn.enabled');
        expect(retryButton).to.exist;
        
        await retryButton.click();
        
        const retrySpinner = await commands.get('.retry-action .spinner.active');
        await commands.waitForElementToDisappear('.retry-action .spinner.active', 5000);
        
        const secondErrorNotification = await commands.get('.error-notification .retry-failed.shown');
        
        if (secondErrorNotification) {
          const manualRetryButton = await commands.get('.error-actions .manual-retry.available');
          await manualRetryButton.click();
          await commands.wait(1000);
        }
        
        const finalRetryButton = await commands.get('.error-actions .final-retry.enabled');
        await finalRetryButton.click();
        
        const successNotification = await commands.get('.success-notification .recovery-success.displayed');
        expect(successNotification).to.exist;
        
        const cartBadge = await commands.get('.header-cart .badge.updated .final-count');
        const badgeCount = parseInt(await cartBadge.getText());
        expect(badgeCount).to.be.greaterThan(0);
      } else {
        this.skip('No products available for network error testing');
      }
    });
  });
});