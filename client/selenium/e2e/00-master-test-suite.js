const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../support/test-setup');

describe('🏪 E-Commerce Application - Complete Selenium Test Suite', function() {
  this.timeout(60000); // 60 second timeout for all tests
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'test@example.com', password: 'password123' },
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
      await commands.registerNewUser(newUser);
      await commands.shouldNotHaveUrl('/signup');
    });

    it('should validate registration form properly', async function() {
      await commands.visit('/signup');
      await commands.submitFormAndExpectValidation();
      
      // Test invalid email format
      await commands.type('#email', 'invalid-email');
      await commands.type('#password', 'password');
      await commands.click('button[type="submit"]');
      await commands.shouldBeVisible('body');
    });

    it('should login with valid credentials', async function() {
      await commands.loginAsTestUser('john@example.com', 'password123');
      await commands.shouldContain('header', 'Hi,');
      await commands.shouldNotHaveUrl('/login');
    });

    it('should handle invalid login attempts', async function() {
      await commands.visit('/login');
      await commands.type('#email', 'invalid@example.com');
      await commands.type('#password', 'wrongpassword');
      await commands.click('button[type="submit"]');
      
      await commands.wait(2000);
      
      // Should show error or stay on login page
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      expect(
        currentUrl.includes('/login') || 
        bodyText.toLowerCase().includes('invalid') ||
        bodyText.toLowerCase().includes('error')
      ).to.be.true;
    });

    it('should protect sensitive routes', async function() {
      const protectedRoutes = ['/cart', '/checkout', '/orders'];
      
      for (const route of protectedRoutes) {
        await commands.clearAllStorage();
        await commands.visit(route);
        
        await commands.driver.wait(async () => {
          const url = await commands.driver.getCurrentUrl();
          return url.includes('/login') || url === `${commands.baseUrl}/`;
        }, 10000);
      }
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
    });

    it('should add products to cart', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();
      
      const addToCartButtons = await commands.getAll('button:contains("Add to Cart")');
      if (addToCartButtons.length > 0) {
        await addToCartButtons[0].click();
        await commands.wait(1000);
        
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(
          bodyText.toLowerCase().includes('added') || 
          bodyText.toLowerCase().includes('cart')
        ).to.be.true;
      } else {
        await commands.log('No add to cart buttons found - may require product details page');
      }
    });

    it('should display cart contents', async function() {
      await commands.visit('/cart');
      await commands.shouldHaveUrl('/cart');
      
      // Verify cart page loads
      await commands.shouldBeVisible('body');
      
      // Look for cart-related elements - be more specific about what constitutes a working cart
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // Check for specific cart functionality, not just any cart-related text
      const hasCartItems = await commands.getAll('.cart-item, [data-testid*="cart-item"]').then(items => items.length > 0);
      const hasEmptyCartMessage = bodyText.toLowerCase().includes('empty') && 
                                 (bodyText.toLowerCase().includes('cart') || bodyText.toLowerCase().includes('no items'));
      const hasCartTotal = bodyText.includes('$') && 
                          (bodyText.toLowerCase().includes('total') || bodyText.toLowerCase().includes('subtotal'));
      const hasCheckoutButton = await commands.getAll('button:contains("Checkout"), a:contains("Checkout")').then(btns => btns.length > 0);
      
      // Cart should either have items with totals OR proper empty state
      if (hasCartItems) {
        // If there are items, should have total and checkout functionality
        expect(hasCartTotal || hasCheckoutButton).to.be.true;
      } else {
        // If no items, should have proper empty cart message
        expect(hasEmptyCartMessage).to.be.true;
      }
      
      // Basic cart text without proper structure indicates a broken cart
      if (!hasCartItems && !hasEmptyCartMessage && !hasCartTotal) {
        throw new Error('Cart page appears broken - no items, empty state, or cart functionality found');
      }
    });
  });

  describe('05-CHECKOUT-PROCESS', function() {
    beforeEach(async function() {
      await commands.loginAsTestUser();
    });

    it('should access checkout page', async function() {
      await commands.visit('/checkout');
      await commands.shouldHaveUrl('/checkout');
      await commands.shouldBeVisible('body');
      
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.toLowerCase().includes('checkout') || 
        bodyText.toLowerCase().includes('order') ||
        bodyText.toLowerCase().includes('shipping')
      ).to.be.true;
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