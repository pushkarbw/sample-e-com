const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('5NF Cart Network Dependencies', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    }
  };

  beforeEach(async function() {
    const browser = process.env.BROWSER || 'chrome';
    await testSetup.beforeEach(browser);
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.users.valid.email);
      await commands.type('input[type="password"]', testConfig.users.valid.password);
      await commands.click('button[type="submit"]');
      await commands.wait(2000);
    } catch (error) {
      await commands.log('Login helper warning: ' + error.message);
    }
  };

  describe('5NF Cart Synchronization Failures', function() {
    it('5NF should display cart items when sync API returns empty response', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate cart sync returning empty
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart') && (!options || options.method === 'GET')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  success: true,
                  data: {
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                  }
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/cart');
      await commands.wait(2000);

      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item, .item');
      expect(cartItems.length).to.be.greaterThan(0, 'Should show cached cart items when API returns empty');

      const cartTotal = await commands.getAll('[data-testid="cart-total"], .cart-total, .total');
      if (cartTotal.length > 0) {
        const totalText = await cartTotal[0].getText();
        const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
        expect(totalAmount).to.be.greaterThan(0, 'Should display cached cart total');
      }

      const checkoutButton = await commands.getAll('button:contains("Checkout"), [data-testid="checkout-button"]');
      expect(checkoutButton.length).to.be.greaterThan(0, 'Checkout button should be available');
      expect(await checkoutButton[0].isEnabled()).to.be.true;
    });

    it('5NF should handle cart item removal when delete API is unresponsive', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        await addButtons[0].click();
        await commands.wait(500);
        await addButtons[1].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate cart item delete API hanging
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart/') && options && options.method === 'DELETE') {
              return new Promise(() => {}); // Never resolves
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/cart');
      await commands.wait(2000);

      const initialCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      const initialItemCount = initialCartItems.length;

      const removeButtons = await commands.getAll('button:contains("Remove"), [data-testid="remove-item"]');
      if (removeButtons.length > 0) {
        await removeButtons[0].click();
        await commands.wait(3000);

        const remainingItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        expect(remainingItems.length).to.equal(initialItemCount - 1, 
          'Should optimistically remove item from UI when API hangs');

        const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count');
        if (cartBadge.length > 0) {
          const badgeCount = parseInt(await cartBadge[0].getText()) || 0;
          expect(badgeCount).to.equal(initialItemCount - 1, 
            'Cart badge should reflect optimistic removal');
        }

        const undoButtons = await commands.getAll('button:contains("Undo"), .undo-button');
        expect(undoButtons.length).to.be.greaterThan(0, 'Should show undo option for failed removal');
      } else {
        this.skip('No remove buttons found in cart');
      }
    });
  });

  describe('5NF Checkout Flow with Service Dependencies', function() {
    it('5NF should proceed with checkout when shipping calculation fails', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate shipping API failure
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/shipping') || url.includes('/api/calculate-shipping')) {
              return Promise.resolve({
                ok: false,
                status: 503,
                json: () => Promise.resolve({
                  error: 'Shipping service temporarily unavailable'
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/checkout');
      await commands.wait(2000);

      const addressInputs = await commands.getAll('input[name*="address"], input[name*="street"]');
      if (addressInputs.length > 0) {
        await addressInputs[0].sendKeys('123 Main Street');
      }

      const cityInputs = await commands.getAll('input[name*="city"]');
      if (cityInputs.length > 0) {
        await cityInputs[0].sendKeys('Springfield');
      }

      const stateInputs = await commands.getAll('input[name*="state"], select[name*="state"]');
      if (stateInputs.length > 0) {
        if (await stateInputs[0].getTagName() === 'select') {
          const options = await commands.getAll('option', stateInputs[0]);
          if (options.length > 1) {
            await stateInputs[0].selectByIndex(1);
          }
        } else {
          await stateInputs[0].sendKeys('CA');
        }
      }

      await commands.wait(2000);

      const shippingOptions = await commands.getAll('input[name*="shipping"], .shipping-option');
      expect(shippingOptions.length).to.be.greaterThan(0, 
        'Should show default shipping options when calculation fails');

      const orderSummary = await commands.getAll('.order-summary, [data-testid="order-summary"]');
      expect(orderSummary.length).to.be.greaterThan(0, 'Order summary should be visible');

      const totalDisplay = await commands.getAll('.order-total, [data-testid="order-total"]');
      if (totalDisplay.length > 0) {
        const totalText = await totalDisplay[0].getText();
        expect(totalText).to.match(/\$\d+\.\d{2}/, 'Should display order total with standard shipping');
      }

      const continueButton = await commands.getAll('button:contains("Continue"), button:contains("Next")');
      if (continueButton.length > 0) {
        expect(await continueButton[0].isEnabled()).to.be.true;
      }
    });

    it('5NF should complete order when payment gateway times out', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate payment gateway timeout
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/payment/process') || url.includes('/api/charge')) {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    ok: false,
                    status: 408,
                    json: () => Promise.resolve({
                      error: 'Payment gateway timeout',
                      code: 'GATEWAY_TIMEOUT'
                    })
                  });
                }, 8000);
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/checkout');
      await commands.wait(2000);

      const nameInputs = await commands.getAll('input[name*="name"], input[name*="firstName"]');
      if (nameInputs.length > 0) {
        await nameInputs[0].sendKeys('John Doe');
      }

      const emailInputs = await commands.getAll('input[type="email"], input[name*="email"]');
      if (emailInputs.length > 0) {
        await emailInputs[0].sendKeys('john@example.com');
      }

      const addressInputs = await commands.getAll('input[name*="address"]');
      if (addressInputs.length > 0) {
        await addressInputs[0].sendKeys('123 Main St');
      }

      const paymentMethod = await commands.getAll('select[name*="payment"], input[name*="payment"]');
      if (paymentMethod.length > 0 && await paymentMethod[0].getTagName() === 'select') {
        const options = await commands.getAll('option', paymentMethod[0]);
        if (options.length > 1) {
          await paymentMethod[0].selectByIndex(1);
        }
      }

      const placeOrderButton = await commands.getAll('button:contains("Place Order"), button[type="submit"]');
      if (placeOrderButton.length > 0) {
        await placeOrderButton[0].click();
        await commands.wait(10000);

        const orderConfirmation = await commands.getAll('.order-confirmation, .success-message');
        expect(orderConfirmation.length).to.be.greaterThan(0, 
          'Should show order confirmation even with payment timeout');

        const orderDetails = await commands.getAll('.order-details, .order-number');
        expect(orderDetails.length).to.be.greaterThan(0, 'Should display order details');

        const retryPaymentButton = await commands.getAll('button:contains("Retry Payment"), .retry-payment');
        expect(retryPaymentButton.length).to.be.greaterThan(0, 
          'Should offer payment retry option');
      } else {
        this.skip('No place order button found');
      }
    });
  });

  describe('5NF Product Availability with Stock API Issues', function() {
    it('5NF should allow adding out-of-stock items when stock API fails', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        // Simulate stock API returning error
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products') && url.includes('stock')) {
              return Promise.reject(new Error('Stock service unavailable'));
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.wait(2000);

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card');
      if (productCards.length > 0) {
        for (let i = 0; i < Math.min(3, productCards.length); i++) {
          const addButton = await commands.getAll('[data-testid="add-to-cart-button"]', productCards[i]);
          if (addButton.length > 0) {
            expect(await addButton[0].isEnabled()).to.be.true;
            
            await addButton[0].click();
            await commands.wait(500);

            const stockWarning = await commands.getAll('.stock-warning, .availability-warning');
            expect(stockWarning.length).to.equal(0, 
              'Should not show stock warnings when API is unavailable');
          }
        }

        await commands.visit('/cart');
        await commands.wait(2000);

        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        expect(cartItems.length).to.be.greaterThan(0, 
          'Should successfully add items when stock check fails');

        const quantityInputs = await commands.getAll('input[type="number"]');
        if (quantityInputs.length > 0) {
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('99');

          const updateButton = await commands.getAll('button:contains("Update")');
          if (updateButton.length > 0) {
            await updateButton[0].click();
            await commands.wait(1000);

            const finalQuantity = await quantityInputs[0].getAttribute('value');
            expect(parseInt(finalQuantity)).to.equal(99, 
              'Should allow high quantities when stock validation fails');
          }
        }
      } else {
        this.skip('No products available for stock testing');
      }
    });

    it('5NF should handle cart persistence when session API is interrupted', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate session/auth API interruption
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/auth') || url.includes('/api/session')) {
              return Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                  error: 'Session expired'
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/cart');
      await commands.wait(2000);

      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      expect(cartItems.length).to.be.greaterThan(0, 
        'Should preserve cart items when session validation fails');

      const loginPrompt = await commands.getAll('.login-prompt, .auth-required');
      if (loginPrompt.length > 0) {
        const loginButton = await commands.getAll('button:contains("Login"), a[href*="login"]');
        expect(loginButton.length).to.be.greaterThan(0, 'Should provide login option');
      }

      const cartTotal = await commands.getAll('[data-testid="cart-total"], .cart-total');
      if (cartTotal.length > 0) {
        const totalText = await cartTotal[0].getText();
        expect(totalText).to.match(/\$\d+/, 'Should display cart total');
      }

      const saveCartButton = await commands.getAll('button:contains("Save Cart"), .save-cart');
      if (saveCartButton.length > 0) {
        expect(await saveCartButton[0].isEnabled()).to.be.true;
      }
    });
  });
});