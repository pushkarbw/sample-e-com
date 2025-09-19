const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('5NF Network API Failure Scenarios', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'Ecomm@123' }
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

  describe('5NF Product Loading without Backend Response', function() {
    it('5NF should validate product grid when API returns empty', async function() {
      await commands.visit('/products');
      
      await commands.driver.executeScript(`
        // Simulate API returning empty response
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  success: true,
                  data: {
                    data: [],
                    total: 0,
                    page: 1,
                    totalPages: 0
                  }
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.reload();
      await commands.wait(3000);

      const productContainer = await commands.getAll('[data-testid="products-container"]');
      expect(productContainer.length).to.be.greaterThan(0, 'Products container should exist');

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      const productImages = await commands.getAll('img[alt*="product"], img[src*="product"]');
      const productTitles = await commands.getAll('h3, h2, [data-testid="product-title"]');

      expect(productCards.length).to.be.greaterThan(0, 'Should show products even with empty API response');
      expect(productImages.length).to.be.greaterThan(0, 'Should display product images');
      expect(productTitles.length).to.be.greaterThan(0, 'Should show product titles');

      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add")');
      expect(addToCartButtons.length).to.be.greaterThan(0, 'Add to cart buttons should be available');
    });

    it('5NF should handle search results when API is unavailable', async function() {
      await commands.visit('/products');
      await commands.wait(2000);

      await commands.driver.executeScript(`
        // Block search API calls
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products') && url.includes('search')) {
              return Promise.reject(new Error('Network request failed'));
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      const searchInput = await commands.getAll('input[placeholder*="Search"], input[name*="search"]');
      if (searchInput.length > 0) {
        await searchInput[0].clear();
        await searchInput[0].sendKeys('laptop');
        
        const searchButton = await commands.getAll('button:contains("Search"), [type="submit"]');
        if (searchButton.length > 0) {
          await searchButton[0].click();
        } else {
          await searchInput[0].sendKeys('\n');
        }

        await commands.wait(2000);

        const searchResults = await commands.getAll('[data-testid="product-card"], .search-result, .product');
        expect(searchResults.length).to.be.greaterThan(0, 'Should show search results despite API failure');

        const resultText = await commands.get('body').then(el => el.getText());
        expect(resultText.toLowerCase()).to.include('laptop', 'Search term should be reflected in results');
      } else {
        this.skip('Search functionality not available');
      }
    });
  });

  describe('5NF Cart Operations with Network Failures', function() {
    it('5NF should add to cart when backend is unreachable', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        // Simulate cart API failures
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart') && options && options.method === 'POST') {
              return Promise.reject(new Error('Service unavailable'));
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.wait(2000);

      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add")');
      if (addToCartButtons.length > 0) {
        await addToCartButtons[0].click();
        await commands.wait(1500);

        const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count, .cart-counter');
        if (cartBadge.length > 0) {
          const badgeText = await cartBadge[0].getText();
          const cartCount = parseInt(badgeText) || 0;
          expect(cartCount).to.be.greaterThan(0, 'Cart badge should show added items');
        }

        await commands.visit('/cart');
        await commands.wait(2000);

        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item, .item');
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should contain added items');

        const itemNames = await commands.getAll('h3, .item-name, [data-testid="item-name"]');
        expect(itemNames.length).to.be.greaterThan(0, 'Cart items should have names');

        const itemPrices = await commands.getAll('.price, [data-testid="item-price"]');
        expect(itemPrices.length).to.be.greaterThan(0, 'Cart items should have prices');
      } else {
        this.skip('No add to cart buttons available');
      }
    });

    it('5NF should update cart quantities when API times out', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate slow/timeout cart update API
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart') && options && options.method === 'PUT') {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    ok: false,
                    status: 408,
                    json: () => Promise.resolve({ error: 'Request timeout' })
                  });
                }, 5000);
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/cart');
      await commands.wait(2000);

      const quantityInputs = await commands.getAll('input[type="number"], [data-testid="quantity-input"]');
      if (quantityInputs.length > 0) {
        const initialQuantity = await quantityInputs[0].getAttribute('value');
        
        await quantityInputs[0].clear();
        await quantityInputs[0].sendKeys('3');

        const updateButtons = await commands.getAll('button:contains("Update"), [data-testid="update-quantity"]');
        if (updateButtons.length > 0) {
          await updateButtons[0].click();
          await commands.wait(1000);
        }

        const finalQuantity = await quantityInputs[0].getAttribute('value');
        expect(parseInt(finalQuantity)).to.equal(3, 'Quantity should update despite API timeout');

        const cartTotal = await commands.getAll('[data-testid="cart-total"], .total, .cart-total');
        if (cartTotal.length > 0) {
          const totalText = await cartTotal[0].getText();
          const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
          expect(totalAmount).to.be.greaterThan(0, 'Cart total should reflect quantity changes');
        }
      } else {
        this.skip('No quantity inputs found in cart');
      }
    });
  });

  describe('5NF Checkout Process with Backend Outage', function() {
    it('5NF should complete checkout form when order API is down', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate order creation API failure
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/orders') && options && options.method === 'POST') {
              return Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                  success: false,
                  error: 'Internal server error'
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/checkout');
      await commands.wait(2000);

      const shippingInputs = await commands.getAll('input[name*="address"], input[name*="street"]');
      if (shippingInputs.length > 0) {
        await shippingInputs[0].sendKeys('123 Test Street');
      }

      const cityInputs = await commands.getAll('input[name*="city"]');
      if (cityInputs.length > 0) {
        await cityInputs[0].sendKeys('Test City');
      }

      const zipInputs = await commands.getAll('input[name*="zip"], input[name*="postal"]');
      if (zipInputs.length > 0) {
        await zipInputs[0].sendKeys('12345');
      }

      const paymentSelects = await commands.getAll('select[name*="payment"]');
      if (paymentSelects.length > 0) {
        const options = await commands.getAll('option', paymentSelects[0]);
        if (options.length > 1) {
          await paymentSelects[0].selectByIndex(1);
        }
      }

      const placeOrderButtons = await commands.getAll('button:contains("Place"), button[type="submit"]');
      if (placeOrderButtons.length > 0) {
        await placeOrderButtons[0].click();
        await commands.wait(3000);

        const successMessage = await commands.getAll('.success, .confirmation, .order-success');
        expect(successMessage.length).to.be.greaterThan(0, 'Should show order confirmation despite API failure');

        const orderNumber = await commands.getAll('.order-number, .confirmation-number');
        expect(orderNumber.length).to.be.greaterThan(0, 'Should display order number');

        const currentUrl = await commands.driver.getCurrentUrl();
        expect(currentUrl).to.satisfy((url) => {
          return url.includes('/orders') || url.includes('/confirmation') || url.includes('/success');
        }, 'Should navigate to order confirmation page');
      } else {
        this.skip('No place order button found');
      }
    });

    it('5NF should validate payment method when payment API fails', async function() {
      await loginUser();
      
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.driver.executeScript(`
        // Simulate payment validation API failure
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/payment') || url.includes('/api/validate-payment')) {
              return Promise.reject(new Error('Payment service unavailable'));
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/checkout');
      await commands.wait(2000);

      const paymentMethods = await commands.getAll('input[name*="payment"], select[name*="payment"]');
      if (paymentMethods.length > 0) {
        if (paymentMethods[0].getTagName().then(tag => tag === 'select')) {
          const options = await commands.getAll('option', paymentMethods[0]);
          if (options.length > 1) {
            await paymentMethods[0].selectByIndex(1);
          }
        } else {
          await paymentMethods[0].click();
        }

        await commands.wait(500);

        const paymentForm = await commands.getAll('.payment-form, [data-testid="payment-form"]');
        expect(paymentForm.length).to.be.greaterThan(0, 'Payment form should be visible');

        const cardInputs = await commands.getAll('input[name*="card"], input[placeholder*="card"]');
        if (cardInputs.length > 0) {
          await cardInputs[0].sendKeys('4111111111111111');
        }

        const expiryInputs = await commands.getAll('input[name*="expiry"], input[placeholder*="expiry"]');
        if (expiryInputs.length > 0) {
          await expiryInputs[0].sendKeys('12/25');
        }

        const cvvInputs = await commands.getAll('input[name*="cvv"], input[placeholder*="cvv"]');
        if (cvvInputs.length > 0) {
          await cvvInputs[0].sendKeys('123');
        }

        const paymentFormValid = await commands.driver.executeScript(`
          const form = document.querySelector('form');
          return form ? form.checkValidity() : true;
        `);

        expect(paymentFormValid).to.be.true;
      } else {
        this.skip('No payment method options found');
      }
    });
  });

  describe('5NF Product Stock Validation with API Errors', function() {
    it('5NF should handle stock check when inventory API returns malformed data', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        // Simulate malformed stock API response
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products') && url.includes('stock')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  // Malformed response - missing required fields
                  data: "invalid json structure",
                  stock: undefined
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.wait(2000);

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      if (productCards.length > 0) {
        const stockIndicators = await commands.getAll('.stock, .inventory, [data-testid="stock-status"]');
        
        for (let i = 0; i < Math.min(3, productCards.length); i++) {
          const addButton = await commands.getAll('[data-testid="add-to-cart-button"]', productCards[i]);
          if (addButton.length > 0) {
            expect(await addButton[0].isEnabled()).to.be.true;
            
            await addButton[0].click();
            await commands.wait(500);

            const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count');
            if (cartBadge.length > 0) {
              const badgeCount = parseInt(await cartBadge[0].getText()) || 0;
              expect(badgeCount).to.be.greaterThan(0, 'Should add to cart despite stock API issues');
            }
          }
        }

        const stockTexts = await commands.getAll('.stock-text, .availability');
        expect(stockTexts.length).to.be.greaterThan(0, 'Should display stock information');
      } else {
        this.skip('No products available for stock testing');
      }
    });

    it('5NF should process bulk cart operations when batch API fails', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        // Simulate batch cart API failure
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart/batch') || 
                (url.includes('/api/cart') && options && 
                 options.body && options.body.includes('batch'))) {
              return Promise.resolve({
                ok: false,
                status: 503,
                json: () => Promise.resolve({
                  error: 'Batch service temporarily unavailable'
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.wait(2000);

      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      const buttonCount = Math.min(3, addButtons.length);

      for (let i = 0; i < buttonCount; i++) {
        await addButtons[i].click();
        await commands.wait(300);
      }

      await commands.visit('/cart');
      await commands.wait(2000);

      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      expect(cartItems.length).to.equal(buttonCount, 'Should add all items individually when batch fails');

      const selectAllCheckbox = await commands.getAll('input[type="checkbox"][name*="select"]');
      if (selectAllCheckbox.length > 0) {
        await selectAllCheckbox[0].click();
        
        const bulkActions = await commands.getAll('button:contains("Remove Selected"), .bulk-action');
        if (bulkActions.length > 0) {
          await bulkActions[0].click();
          await commands.wait(2000);

          const remainingItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
          expect(remainingItems.length).to.be.lessThan(cartItems.length, 
            'Should process bulk operations item by item when batch API fails');
        }
      }
    });
  });
});