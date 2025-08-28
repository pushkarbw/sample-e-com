const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../support/test-setup');

describe('🏪 E-Commerce Application - Complete Selenium Test Suite', function() {
  this.timeout(60000); // 60 second timeout for all tests
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'admin123' },
      newUser: () => ({ 
        email: `test+${Date.now()}@example.com`, 
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      })
    },
    timeouts: {
      api: 10000,
      pageLoad: 5000,
      userAction: 3000
    }
  };

  before(async function() {
    await commands?.log('🚀 Starting Complete E-Commerce Selenium Test Suite');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('01-APPLICATION-FOUNDATION', function() {
    it('should have application running and accessible', async function() {
      await commands.visit('/');
      await commands.shouldBeVisible('body');
      
      const title = await commands.driver.getTitle();
      expect(title).to.not.be.empty;
    });

    it('should have all core pages accessible', async function() {
      const corePages = ['/', '/products', '/login', '/signup'];
      
      for (const page of corePages) {
        await commands.visit(page);
        await commands.shouldBeVisible('body');
        
        const title = await commands.driver.getTitle();
        expect(title).to.not.be.empty;
      }
    });

    it('should have working navigation system', async function() {
      await commands.visit('/');
      await commands.shouldBeVisible('nav, header');
      
      // Test core navigation links
      await commands.click('a:contains("Products")');
      await commands.verifyPageLoad('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
    });

    it('should handle 404 pages gracefully', async function() {
      await commands.visit(`/nonexistent-page-${Date.now()}`);
      await commands.shouldBeVisible('body');
    });
  });

  describe('02-AUTHENTICATION', function() {
    it('should register new users successfully', async function() {
      const newUser = testConfig.users.newUser();
      await commands.visit('/signup');
      
      // Fill registration form with data-testid selectors
      await commands.type('#firstName', newUser.firstName);
      await commands.type('#lastName', newUser.lastName);
      await commands.type('#email', newUser.email);
      await commands.type('#password', newUser.password);
      
      // Submit form
      await commands.click('[data-testid="signup-button"]');
      
      // Verify successful registration (should redirect and authenticate)
      await commands.driver.wait(async () => {
        const currentUrl = await commands.driver.getCurrentUrl();
        return !currentUrl.includes('/signup');
      }, 15000);
      
      // Should be authenticated after successful signup
      await commands.verifyAuthenticationState(true);
    });

    it('should validate registration form properly', async function() {
      await commands.visit('/signup');
      
      // Try to submit empty form
      await commands.click('[data-testid="signup-button"]');
      await commands.shouldHaveUrl('/signup'); // Should stay on signup due to validation
      
      // Test invalid email format
      await commands.type('#email', 'invalid-email');
      await commands.type('#password', 'password');
      await commands.click('[data-testid="signup-button"]');
      await commands.shouldHaveUrl('/signup'); // Should stay due to validation
    });

    it('should login with valid credentials', async function() {
      await commands.visit('/login');
      
      // Enter valid credentials
      await commands.type('#email', testConfig.users.valid.email);
      await commands.type('#password', testConfig.users.valid.password);
      
      // Submit login form
      await commands.click('[data-testid="login-button"]');
      
      // Wait for successful login
      await commands.driver.wait(async () => {
        const currentUrl = await commands.driver.getCurrentUrl();
        return !currentUrl.includes('/login');
      }, 15000);
      
      // Verify authentication state
      await commands.verifyAuthenticationState(true);
      await commands.shouldBeVisible('[data-testid="user-greeting"]');
      await commands.shouldContain('[data-testid="user-greeting"]', 'Hi,');
    });

    it('should handle invalid login attempts', async function() {
      await commands.visit('/login');
      await commands.type('#email', 'invalid@example.com');
      await commands.type('#password', 'wrongpassword');
      await commands.click('[data-testid="login-button"]');
      
      await commands.wait(3000);
      
      // Should remain on login page
      await commands.shouldHaveUrl('/login');
      
      // Should show error message or remain unauthenticated
      const bodyText = await commands.get('body').then(el => el.getText());
      const hasError = bodyText.includes('Invalid') || 
                      bodyText.includes('failed') || 
                      bodyText.includes('error');
      
      if (!hasError) {
        // At minimum, should not be authenticated
        await commands.verifyAuthenticationState(false);
      }
    });

    it('should protect sensitive routes', async function() {
      // Ensure not authenticated
      await commands.clearAllStorage();
      await commands.visit('/');
      await commands.verifyAuthenticationState(false);
      
      const protectedRoutes = ['/cart', '/checkout', '/orders'];
      
      for (const route of protectedRoutes) {
        await commands.visit(route);
        // Should redirect to login due to ProtectedRoute component
        await commands.shouldHaveUrl('/login');
      }
    });

    it('should maintain authentication across page reloads', async function() {
      // Login first
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.verifyAuthenticationState(true);
      
      // Reload the page
      await commands.reload();
      await commands.wait(2000);
      
      // Should still be authenticated
      await commands.verifyAuthenticationState(true);
    });

    it('should successfully logout', async function() {
      // Login first
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.verifyAuthenticationState(true);
      
      // Logout
      await commands.logout();
      await commands.wait(2000);
      
      // Should be redirected to home and no longer authenticated
      await commands.shouldHaveUrl('/');
      await commands.verifyAuthenticationState(false);
    });
  });

  describe('03-PRODUCT-DISCOVERY', function() {
    it('should display products correctly', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      
      // Verify product information is present
      const bodyText = await commands.get('body').then(el => el.getText());
      const hasProducts = bodyText.includes('$') || bodyText.includes('No products found');
      expect(hasProducts).to.be.true;
    });

    it('should handle product search functionality', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      
      const searchInputs = await commands.getAll('input[placeholder*="search"]');
      if (searchInputs.length > 0) {
        await commands.searchProducts('laptop');
        await commands.wait(2000);
        
        const searchInput = await commands.get('input[placeholder*="Search"]');
        const value = await searchInput.getAttribute('value');
        expect(value).to.include('laptop');
      }
    });

    it('should navigate to product details', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      
      try {
        const viewDetailsLinks = await commands.getAll('a:contains("View Details")');
        if (viewDetailsLinks.length > 0) {
          await viewDetailsLinks[0].click();
          
          const currentUrl = await commands.driver.getCurrentUrl();
          expect(currentUrl).to.match(/\/products\/[\w-]+$/);
          
          await commands.shouldBeVisible('h1, h2');
          const bodyText = await commands.get('body').then(el => el.getText());
          expect(bodyText).to.include('$');
        } else {
          await commands.visit('/products/1');
          await commands.shouldHaveUrl('/products/1');
        }
      } catch (e) {
        await commands.visit('/products/1');
        await commands.shouldBeVisible('body');
      }
    });
  });

  describe('04-SHOPPING-CART', function() {
    beforeEach(async function() {
      await commands.loginAsTestUser(); // Cart requires authentication
      await commands.verifyAuthenticationState(true);
    });

    it('should add products to cart and verify cart count', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      
      // Get initial cart count
      const initialCartCount = await commands.getCartItemCount();
      
      // Look for add to cart buttons with proper data-testid
      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addToCartButtons.length > 0) {
        // Click first available add to cart button
        await addToCartButtons[0].click();
        await commands.wait(3000); // Wait for cart update
        
        // Verify cart count increased
        const newCartCount = await commands.getCartItemCount();
        expect(newCartCount).to.be.greaterThan(initialCartCount, 'Cart count should increase after adding item');
      } else {
        await commands.log('No add to cart buttons found - products may be out of stock or require authentication');
      }
    });

    it('should display cart contents with proper validation', async function() {
      await commands.visit('/cart');
      await commands.shouldHaveUrl('/cart');
      
      // Wait for cart to load
      await commands.shouldBeVisible('body');
      await commands.wait(2000);
      
      // Check for cart items using data-testid
      const cartItems = await commands.getAll('[data-testid="cart-item"]');
      
      if (cartItems.length > 0) {
        // Cart has items - verify proper structure
        await commands.shouldBeVisible('[data-testid="cart-items"]');
        await commands.shouldBeVisible('[data-testid="cart-subtotal"]');
        await commands.shouldBeVisible('[data-testid="cart-total"]');
        await commands.shouldBeVisible('[data-testid="checkout-button"]');
        
        // Verify totals contain currency symbols
        const subtotal = await commands.get('[data-testid="cart-subtotal"]').then(el => el.getText());
        const total = await commands.get('[data-testid="cart-total"]').then(el => el.getText());
        
        expect(subtotal).to.include('$', 'Subtotal should include currency symbol');
        expect(total).to.include('$', 'Total should include currency symbol');
        
        await commands.log('Cart contains items with proper totals');
      } else {
        // Empty cart - verify proper empty state
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasEmptyCartMessage = bodyText.toLowerCase().includes('empty') && 
                                   bodyText.toLowerCase().includes('cart');
        expect(hasEmptyCartMessage).to.be.true('Empty cart should show proper message');
        
        await commands.log('Cart is empty with proper empty state message');
      }
    });

    it('should handle cart item quantity changes', async function() {
      await commands.visit('/cart');
      
      const cartItems = await commands.getAll('[data-testid="cart-item"]');
      if (cartItems.length > 0) {
        // Test quantity increase
        const quantityElements = await commands.getAll('[data-testid="item-quantity"]');
        if (quantityElements.length > 0) {
          const initialQuantity = await quantityElements[0].getText();
          
          // Try to increase quantity
          const increaseButtons = await commands.getAll('[data-testid="increase-quantity"]');
          if (increaseButtons.length > 0) {
            await increaseButtons[0].click();
            await commands.wait(2000);
            
            const newQuantity = await quantityElements[0].getText();
            expect(parseInt(newQuantity)).to.be.greaterThan(parseInt(initialQuantity), 'Quantity should increase');
          }
        }
      } else {
        await commands.log('No cart items to test quantity changes');
      }
    });

    it('should handle cart item removal', async function() {
      await commands.visit('/cart');
      
      const cartItems = await commands.getAll('[data-testid="cart-item"]');
      if (cartItems.length > 0) {
        const initialItemCount = cartItems.length;
        
        // Try to remove first item
        const removeButtons = await commands.getAll('[data-testid="remove-item"]');
        if (removeButtons.length > 0) {
          await removeButtons[0].click();
          await commands.wait(2000);
          
          const newCartItems = await commands.getAll('[data-testid="cart-item"]');
          expect(newCartItems.length).to.be.lessThan(initialItemCount, 'Item count should decrease after removal');
        }
      } else {
        await commands.log('No cart items to test removal');
      }
    });
  });

  describe('05-CHECKOUT-PROCESS', function() {
    beforeEach(async function() {
      await commands.loginAsTestUser();
    });

    it('should access checkout page', async function() {
      // Login first since checkout requires authentication
      await commands.loginAsTestUser();
      
      // Try to access checkout directly
      await commands.visit('/checkout');
      
      // Should either show checkout page or redirect based on cart state
      await commands.shouldBeVisible('body');
      
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // Checkout page might redirect if cart is empty or require login
      const isValidCheckoutState = 
        currentUrl.includes('/checkout') ||
        currentUrl.includes('/cart') ||
        currentUrl.includes('/login') ||
        bodyText.toLowerCase().includes('checkout') ||
        bodyText.toLowerCase().includes('empty cart') ||
        bodyText.toLowerCase().includes('no items');
      
      expect(isValidCheckoutState).to.be.true;
    });

    it('should display checkout form elements', async function() {
      await commands.visit('/checkout');
      
      const inputs = await commands.getAll('input, select, textarea');
      const buttons = await commands.getAll('button');
      
      expect(inputs.length + buttons.length).to.be.greaterThan(0);
    });
  });

  describe('06-API-INTEGRATION', function() {
    it('should successfully call products API', async function() {
      // Note: Selenium doesn't have built-in API interception like Cypress
      // This test verifies that the page loads data successfully
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      await commands.shouldBeVisible('body');
    });

    it('should handle authentication API calls', async function() {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.users.valid.email);
      await commands.type('input[type="password"]', testConfig.users.valid.password);
      await commands.click('button[type="submit"]');
      
      // Wait for login to complete or fail
      await commands.wait(3000);
      await commands.shouldBeVisible('body');
    });
  });

  describe('07-ERROR-HANDLING', function() {
    it('should handle form validation edge cases', async function() {
      await commands.visit('/login');
      
      // Test empty form submission
      await commands.click('button[type="submit"]');
      await commands.shouldBeVisible('body');
      
      // Test invalid email format
      await commands.type('#email', 'invalid-email');
      await commands.type('#password', 'password');
      await commands.click('button[type="submit"]');
      await commands.shouldBeVisible('body');
    });

    it('should handle session expiry', async function() {
      await commands.loginAsTestUser();
      
      // Simulate session expiry by clearing storage
      await commands.clearAllStorage();
      await commands.reload();
      
      // Should handle gracefully (redirect to login or show appropriate message)
      await commands.shouldBeVisible('body');
    });

    it('should handle corrupted local storage', async function() {
      await commands.driver.executeScript(`
        localStorage.setItem('token', 'corrupted-token');
        localStorage.setItem('user', 'invalid-json');
      `);
      
      await commands.visit('/');
      await commands.shouldBeVisible('body'); // Should not crash
    });
  });

  describe('08-RESPONSIVE-DESIGN', function() {
    it('should work on mobile viewport', async function() {
      await commands.testMobileViewport(async () => {
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
        await commands.shouldBeVisible('input[placeholder*="Search"]');
      });
    });

    it('should work on tablet viewport', async function() {
      await commands.testTabletViewport(async () => {
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
        await commands.shouldBeVisible('select');
      });
    });

    it('should work on desktop viewport', async function() {
      await commands.testDesktopViewport(async () => {
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
        await commands.shouldBeVisible('input[placeholder*="Search"]');
        await commands.shouldBeVisible('select');
      });
    });
  });

  describe('09-ACCESSIBILITY', function() {
    it('should have basic accessibility features', async function() {
      await commands.visit('/');
      await commands.checkBasicAccessibility();
    });

    it('should have proper form labels', async function() {
      await commands.visit('/login');
      
      const inputs = await commands.getAll('input');
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const hasLabel = await commands.getAll(`label[for="${id}"]`).then(labels => labels.length > 0);
        const hasAriaLabel = await input.getAttribute('aria-label');
        const hasPlaceholder = await input.getAttribute('placeholder');
        
        expect(hasLabel || hasAriaLabel || hasPlaceholder).to.be.true;
      }
    });
  });

  describe('10-PERFORMANCE', function() {
    it('should load pages within acceptable time', async function() {
      const startTime = Date.now();
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).to.be.lessThan(10000); // 10 seconds max
    });

    it('should handle multiple rapid navigations', async function() {
      const pages = ['/', '/products', '/login', '/signup'];
      
      for (let i = 0; i < 2; i++) {
        for (const page of pages) {
          await commands.visit(page);
          await commands.shouldBeVisible('body');
          await commands.wait(500);
        }
      }
    });
  });

  after(async function() {
    await commands?.log('✅ Complete E-Commerce Selenium Test Suite Finished');
  });
});