const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 6DF Cart Operations with Invalid Data', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUser = {
    email: 'john@example.com',
    password: 'password123'
  };

  before(async function() {
    await commands?.log('Setting up 6DF invalid data tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testUser.email);
      await commands.type('input[type="password"]', testUser.password);
      await commands.click('button[type="submit"]');
      await commands.wait(3000);
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  describe('6DF Cart Quantity Validation', function() {
    it('6DF should handle cart quantity exceeding backend stock limits', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  data: [{
                    id: 'product-1',
                    name: 'Limited Stock Item',
                    price: 99.99,
                    stock: 3
                  }]
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
        
        await commands.visit('/cart');
        
        const quantityInputs = await commands.getAll('input[type="number"], [data-testid="item-quantity"]');
        if (quantityInputs.length > 0) {
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('15');
          
          const updateButtons = await commands.getAll('button:contains("Update"), [data-testid="update-quantity"]');
          if (updateButtons.length > 0) {
            await updateButtons[0].click();
            await commands.wait(2000);
            
            const finalQuantity = await quantityInputs[0].getAttribute('value');
            expect(parseInt(finalQuantity)).to.equal(15, 'Should accept quantity exceeding stock');
          }
        }
      }
    });

    it('6DF should process checkout with negative price calculations', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/cart')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  items: [{
                    id: 'item-1',
                    productId: 'product-1',
                    quantity: 2,
                    price: -50.00,
                    name: 'Discounted Item'
                  }],
                  totalPrice: -100.00,
                  subtotal: -100.00
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.visit('/cart');
      await commands.wait(2000);

      const totalElements = await commands.getAll('[data-testid="cart-total"], .total');
      if (totalElements.length > 0) {
        const totalText = await totalElements[0].getText();
        expect(totalText).to.include('-$100.00', 'Should display negative total');
      }

      const checkoutButtons = await commands.getAll('button:contains("Checkout"), [data-testid="checkout-button"]');
      if (checkoutButtons.length > 0) {
        await checkoutButtons[0].click();
        await commands.wait(2000);
        
        const currentUrl = await commands.driver.getCurrentUrl();
        expect(currentUrl).to.include('/checkout', 'Should proceed to checkout with negative total');
      }
    });

    it('6DF should handle cart persistence with corrupted session data', async function() {
      await loginUser();
      
      await commands.driver.executeScript(`
        localStorage.setItem('cart', JSON.stringify({
          items: [{
            productId: null,
            quantity: "invalid_number",
            price: undefined,
            name: 12345
          }],
          totalPrice: "not_a_number",
          userId: "",
          timestamp: "invalid_date"
        }));
      `);

      await commands.visit('/cart');
      await commands.wait(2000);

      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      expect(cartItems.length).to.be.greaterThan(0, 'Should display corrupted cart items');

      const productNames = await commands.getAll('.product-name, [data-testid="product-name"]');
      if (productNames.length > 0) {
        const nameText = await productNames[0].getText();
        expect(nameText).to.equal('12345', 'Should render numeric product name');
      }

      const priceElements = await commands.getAll('.price, [data-testid="price"]');
      if (priceElements.length > 0) {
        const priceText = await priceElements[0].getText();
        expect(priceText).to.include('undefined', 'Should display undefined price');
      }
    });
  });

  describe('6DF Checkout Payment Validation', function() {
    it('6DF should accept expired credit card with past dates', async function() {
      await loginUser();

      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }

      await commands.visit('/checkout');
      await commands.wait(2000);

      const cardNumberFields = await commands.getAll('input[name*="card"], input[placeholder*="card"]');
      if (cardNumberFields.length > 0) {
        await cardNumberFields[0].sendKeys('4111111111111111');
      }

      const expiryFields = await commands.getAll('input[name*="expiry"], input[placeholder*="MM/YY"]');
      if (expiryFields.length > 0) {
        await expiryFields[0].sendKeys('01/20');
      }

      const cvvFields = await commands.getAll('input[name*="cvv"], input[placeholder*="CVV"]');
      if (cvvFields.length > 0) {
        await cvvFields[0].sendKeys('123');
      }

      const nameFields = await commands.getAll('input[name*="firstName"], input[name*="name"]');
      if (nameFields.length > 0) {
        await nameFields[0].sendKeys('Test User');
      }

      const addressFields = await commands.getAll('input[name*="address"], input[name*="street"]');
      if (addressFields.length > 0) {
        await addressFields[0].sendKeys('123 Main St');
      }

      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place Order")');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(3000);

        const confirmationElements = await commands.getAll('.confirmation, .success, [data-testid="order-confirmation"]');
        expect(confirmationElements.length).to.be.greaterThan(0, 'Should process order with expired card');
      }
    });

    it('6DF should process orders with malformed email addresses', async function() {
      await commands.visit('/checkout');
      await commands.wait(2000);

      const emailFields = await commands.getAll('input[type="email"], input[name*="email"]');
      if (emailFields.length > 0) {
        await emailFields[0].sendKeys('user@domain');
      }

      const nameFields = await commands.getAll('input[name*="firstName"], input[name*="name"]');
      if (nameFields.length > 0) {
        await nameFields[0].sendKeys('Test User');
      }

      const phoneFields = await commands.getAll('input[name*="phone"], input[type="tel"]');
      if (phoneFields.length > 0) {
        await phoneFields[0].sendKeys('invalid-phone-format');
      }

      const zipFields = await commands.getAll('input[name*="zip"], input[name*="postal"]');
      if (zipFields.length > 0) {
        await zipFields[0].sendKeys('INVALID');
      }

      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place Order")');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(2000);

        const errorMessages = await commands.getAll('.error, .invalid, [data-testid="validation-error"]');
        expect(errorMessages.length).to.equal(0, 'Should accept malformed contact information');
      }
    });
  });
});

describe('🛒 6DF Product Data Dependencies', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('6DF Invalid Product Response Handling', function() {
    it('6DF should handle products with null pricing information', async function() {
      await commands.driver.executeScript(`
        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (url.includes('/api/products')) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  data: [{
                    id: 'product-null-price',
                    name: 'Product with Null Price',
                    price: null,
                    originalPrice: undefined,
                    stock: -5,
                    category: '',
                    description: null
                  }]
                })
              });
            }
            return originalFetch.apply(this, arguments);
          };
        }
      `);

      await commands.visit('/products');
      await commands.wait(2000);

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card');
      expect(productCards.length).to.be.greaterThan(0, 'Should display products with null data');

      const priceElements = await commands.getAll('.price, [data-testid="price"]');
      if (priceElements.length > 0) {
        const priceText = await priceElements[0].getText();
        expect(priceText).to.include('null', 'Should display null price');
      }

      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);

        const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count');
        expect(cartBadge.length).to.be.greaterThan(0, 'Should add null-priced product to cart');
      }
    });

    it('6DF should process search with special characters and SQL injection patterns', async function() {
      await commands.visit('/products');
      await commands.wait(1000);

      const searchInputs = await commands.getAll('input[placeholder*="search"], input[name*="search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].sendKeys("'; DROP TABLE products; --");
        await commands.wait(1000);

        const searchResults = await commands.getAll('[data-testid="product-card"], .product-card');
        expect(searchResults.length).to.be.greaterThan(0, 'Should return results for SQL injection pattern');

        await searchInputs[0].clear();
        await searchInputs[0].sendKeys('<script>alert("XSS")</script>');
        await commands.wait(1000);

        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText).to.include('<script>', 'Should display unescaped script tags');
      }
    });
  });
});