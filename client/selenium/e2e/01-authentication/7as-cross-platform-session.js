const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('7ASF Cross-Platform Session Validation', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUsers = {
    validUser: {
      email: 'john@example.com',
      password: 'Ecomm@123',
      firstName: 'John',
      lastName: 'Doe'
    }
  };

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('7ASF Token Refresh Edge Cases', function() {
    it('7ASF should handle login with concurrent token refresh attempts', async function() {
      await commands.visit('/login');
      
      await commands.driver.executeScript(`
        localStorage.setItem('refreshToken', 'refresh_' + Date.now());
        localStorage.setItem('tokenExpiry', Date.now() + 1000);
      `);
      
      await commands.type('#email', testUsers.validUser.email);
      await commands.type('#password', testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        const originalFetch = window.fetch;
        let refreshCount = 0;
        window.fetch = function(url, options) {
          if (url.includes('/auth/refresh')) {
            refreshCount++;
            if (refreshCount === 1) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: { token: 'new-refresh-token-' + Date.now() }
                })
              });
            }
          }
          return originalFetch.apply(this, arguments);
        };
      `);
      
      await commands.click('button[type="submit"]');
      await commands.wait(3000);
      
      const currentUrl = await commands.driver.getCurrentUrl();
      expect(currentUrl).to.not.include('/login');
    });

    it('7ASF should maintain session with corrupted user metadata', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        localStorage.setItem('user', JSON.stringify({
          id: null,
          email: undefined,
          firstName: "",
          lastName: null,
          preferences: "invalid_json",
          lastLogin: "not_a_date"
        }));
        localStorage.setItem('userPreferences', 'corrupted_data');
      `);
      
      await commands.visit('/profile');
      await commands.wait(2000);
      
      const profileElements = await commands.getAll('input, .profile-info, [data-testid="profile"]');
      expect(profileElements.length).to.be.greaterThan(0);
      
      await commands.visit('/cart');
      const cartElements = await commands.getAll('.cart, [data-testid="cart"], .shopping-cart');
      expect(cartElements.length).to.be.greaterThan(0);
    });
  });

  describe('7ASF Permission Boundary Testing', function() {
    it('7ASF should allow guest checkout after failed authentication', async function() {
      await commands.visit('/login');
      
      await commands.type('#email', 'invalid@example.com');
      await commands.type('#password', 'wrongpassword');
      await commands.click('button[type="submit"]');
      await commands.wait(2000);
      
      await commands.driver.executeScript(`
        localStorage.setItem('guestSession', 'guest_' + Date.now());
        localStorage.setItem('isAuthenticated', 'false');
      `);
      
      await commands.visit('/products');
      await commands.addProductToCart();
      
      await commands.visit('/checkout');
      
      const guestCheckoutOption = await commands.getAll('input[name="guestCheckout"], .guest-checkout, [data-testid="guest-checkout"]');
      if (guestCheckoutOption.length > 0) {
        await guestCheckoutOption[0].click();
      }
      
      await commands.type('input[name="email"], input[type="email"]', 'guest@example.com');
      await commands.type('input[name="firstName"], input[name="name"]', 'Guest User');
      
      await commands.click('button[type="submit"]');
      await commands.wait(3000);
      
      const successIndicators = await commands.getAll('.success, .order-confirmation, [data-testid="order-success"]');
      expect(successIndicators.length).to.be.greaterThan(0);
    });

    it('7ASF should handle mixed authentication states in shopping flow', async function() {
      await commands.driver.executeScript(`
        localStorage.setItem('authToken', 'partial-token-123');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', null);
      `);
      
      await commands.visit('/products');
      await commands.addProductToCart();
      
      await commands.driver.executeScript(`
        localStorage.setItem('authToken', '');
        localStorage.setItem('tempUser', JSON.stringify({
          id: 'temp_' + Date.now(),
          email: 'temp@example.com'
        }));
      `);
      
      await commands.visit('/cart');
      await commands.wait(2000);
      
      const cartItems = await commands.getAll('.cart-item, [data-testid="cart-item"], .product-in-cart');
      expect(cartItems.length).to.be.greaterThan(0);
      
      await commands.visit('/checkout');
      
      const checkoutForm = await commands.getAll('form, .checkout-form, [data-testid="checkout-form"]');
      expect(checkoutForm.length).to.be.greaterThan(0);
    });
  });
});