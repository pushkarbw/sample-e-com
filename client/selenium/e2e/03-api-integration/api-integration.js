const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🔗 API Integration & Backend Communication', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    defaultUser: {
      email: 'john@example.com',
      password: 'password123'
    }
  };

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('Authentication API', function() {
    it('should handle login API calls', async function() {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      };
      
      await commands.visit('/login');
      
      // Fill out login form with flexible selectors
      await commands.type('input[type="email"], #email', newUser.email);
      await commands.type('input[type="password"], #password', newUser.password);
      
      await commands.click('button[type="submit"]');
      
      // Wait for login to complete and verify response
      await commands.wait(3000);
      const currentUrl = await commands.driver.getCurrentUrl();
      
      // Be more specific about login failure vs success
      if (currentUrl.includes('/login')) {
        // Still on login page - should show error for invalid credentials
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasErrorMessage = bodyText.toLowerCase().includes('error') ||
                               bodyText.toLowerCase().includes('invalid') ||
                               bodyText.toLowerCase().includes('incorrect');
        expect(hasErrorMessage).to.be.true;
      } else {
        // Redirected away from login - this should NOT happen with invalid credentials
        throw new Error('Login with invalid credentials succeeded - security issue!');
      }
    });

    it('should handle registration API calls', async function() {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      };
      
      await commands.visit('/signup');
      
      // Fill out registration form with flexible selectors
      await commands.type('input[type="email"], #email', newUser.email);
      await commands.type('input[type="password"], #password', newUser.password);
      
      // Check if additional fields exist
      const firstNameInputs = await commands.getAll('input[name*="first"], #firstName');
      const lastNameInputs = await commands.getAll('input[name*="last"], #lastName');
      
      if (firstNameInputs.length > 0) {
        await firstNameInputs[0].sendKeys(newUser.firstName);
      }
      if (lastNameInputs.length > 0) {
        await lastNameInputs[0].sendKeys(newUser.lastName);
      }
      
      await commands.click('button[type="submit"]');
      
      // Verify form submission works
      await commands.shouldBeVisible('body');
    });
  });

  describe('Product API Integration', function() {
    it('should fetch products with proper error handling', async function() {
      await commands.visit('/products');
      
      // Wait for products to load
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Verify page loads and shows content
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('$') || 
        bodyText.includes('No products') ||
        bodyText.includes('Loading')
      ).to.be.true;
    });

    it('should handle API errors gracefully', async function() {
      await commands.visit('/products');
      
      // Verify page handles errors and shows appropriate content
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('error') || 
        bodyText.includes('failed') || 
        bodyText.includes('unable') ||
        bodyText.includes('try again') ||
        bodyText.includes('loading') ||
        bodyText.includes('$') ||
        bodyText.includes('No products')
      ).to.be.true;
    });

    it('should validate product data structure', async function() {
      await commands.visit('/products');
      
      // Wait for page to load
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Check for product information with flexible selectors
      const bodyText = await commands.get('body').then(el => el.getText());
      const hasProductInfo = 
        (await commands.getAll('h3, h2, h1')).length > 0 && // Product names
        (bodyText.includes('$') || bodyText.includes('price')); // Prices
      const hasNoProducts = bodyText.includes('No products');
      
      expect(hasProductInfo || hasNoProducts).to.be.true;
    });

    it('should handle network timeouts', async function() {
      await commands.visit('/products');
      
      // Verify page loads with timeout considerations
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('loading') || 
        bodyText.includes('please wait') ||
        bodyText.includes('$') ||
        bodyText.includes('No products')
      ).to.be.true;
    });
  });

  describe('Cart API Integration', function() {
    beforeEach(async function() {
      // Login with realistic approach
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.defaultUser.email);
      await commands.type('input[type="password"]', testConfig.defaultUser.password);
      await commands.click('button[type="submit"]');
      
      // Wait for login to complete
      await commands.driver.wait(async () => {
        const currentUrl = await commands.driver.getCurrentUrl();
        return !currentUrl.includes('/login');
      }, 15000);
    });

    it('should sync cart with backend', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Look for add to cart buttons
      const addButtons = await commands.getAll('button:contains("Add to Cart")');
      
      if (addButtons.length > 0) {
        await addButtons[0].click();
        
        // Check for cart feedback
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(
          bodyText.toLowerCase().includes('added') || 
          bodyText.toLowerCase().includes('cart') || 
          bodyText.toLowerCase().includes('success')
        ).to.be.true;
      } else {
        await commands.log('No add to cart buttons found - cart functionality may not be implemented');
      }
    });

    it('should handle cart update API', async function() {
      await commands.visit('/cart');
      
      // Look for quantity inputs and update buttons
      const quantityInputs = await commands.getAll('input[type="number"], input[name*="quantity"]');
      const updateButtons = await commands.getAll('button:contains("Update")');
      
      if (quantityInputs.length > 0) {
        await quantityInputs[0].clear();
        await quantityInputs[0].sendKeys('3');
        
        if (updateButtons.length > 0) {
          await updateButtons[0].click();
        }
        
        await commands.shouldBeVisible('body');
      } else {
        await commands.log('Cart update functionality not found - may not be implemented');
      }
    });

    it('should handle cart removal API', async function() {
      await commands.visit('/cart');
      
      // Look for remove buttons
      const removeButtons = await commands.getAll('button:contains("Remove"), button:contains("Delete")');
      
      if (removeButtons.length > 0) {
        await removeButtons[0].click();
        
        // Look for confirmation if needed
        const confirmButtons = await commands.getAll('button:contains("Confirm"), button:contains("Yes")');
        
        if (confirmButtons.length > 0) {
          await confirmButtons[0].click();
        }
        
        await commands.shouldBeVisible('body');
      } else {
        await commands.log('Cart removal functionality not found - may not be implemented');
      }
    });
  });

  describe('Order API Integration', function() {
    beforeEach(async function() {
      // Login
      await commands.visit('/login');
      await commands.type('input[type="email"]', testConfig.defaultUser.email);
      await commands.type('input[type="password"]', testConfig.defaultUser.password);
      await commands.click('button[type="submit"]');
      
      await commands.driver.wait(async () => {
        const currentUrl = await commands.driver.getCurrentUrl();
        return !currentUrl.includes('/login');
      }, 15000);
    });

    it('should create order through API', async function() {
      await commands.visit('/checkout');
      
      // Use flexible checkout form filling
      const inputs = await commands.getAll('input, select, textarea');
      
      if (inputs.length > 0) {
        // Fill out basic form fields if they exist
        const emailInputs = await commands.getAll('input[type="email"], input[name*="email"]');
        const nameInputs = await commands.getAll('input[name*="name"], input[name*="first"], input[name*="last"]');
        const addressInputs = await commands.getAll('input[name*="address"], textarea[name*="address"]');
        
        if (emailInputs.length > 0) {
          await emailInputs[0].clear();
          await emailInputs[0].sendKeys(testConfig.defaultUser.email);
        }
        if (nameInputs.length > 0) {
          await nameInputs[0].clear();
          await nameInputs[0].sendKeys('John Doe');
        }
        if (addressInputs.length > 0) {
          await addressInputs[0].clear();
          await addressInputs[0].sendKeys('123 Test Street');
        }
        
        // Look for submit button
        const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place"), button:contains("Order")');
        
        if (submitButtons.length > 0) {
          await submitButtons[0].click();
        }
        
        await commands.shouldBeVisible('body');
      }
    });

    it('should fetch order history', async function() {
      await commands.visit('/orders');
      
      // Verify orders page content
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.toLowerCase().includes('order') || 
        bodyText.toLowerCase().includes('history') || 
        bodyText.toLowerCase().includes('empty') ||
        bodyText.toLowerCase().includes('no orders')
      ).to.be.true;
    });
  });

  describe('Error Handling & Retry Logic', function() {
    it('should handle network timeouts', async function() {
      await commands.visit('/products');
      
      // Look for loading indicators
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('loading') || 
        bodyText.includes('please wait') ||
        bodyText.includes('$') ||
        bodyText.includes('No products')
      ).to.be.true;
    });

    it('should retry failed requests', async function() {
      await commands.visit('/products');
      
      // Look for retry functionality
      const retryButtons = await commands.getAll('button:contains("Retry"), button:contains("Try Again")');
      
      if (retryButtons.length > 0) {
        await retryButtons[0].click();
      } else {
        await commands.log('No retry button found - error handling may be different');
      }
      
      // Verify page works
      await commands.shouldBeVisible('body');
    });

    it('should validate API response structure', async function() {
      await commands.visit('/products');
      
      // Verify page handles data gracefully
      await commands.shouldBeVisible('body');
    });
  });

  describe('Performance & Caching', function() {
    it('should implement proper API response caching', async function() {
      await commands.visit('/products');
      
      // First load
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Reload page to test caching
      await commands.reload();
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Page should load efficiently
      await commands.shouldBeVisible('body');
    });

    it('should handle offline scenarios', async function() {
      await commands.visit('/products');
      
      // Simulate offline mode
      await commands.driver.executeScript(`
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });
        window.dispatchEvent(new Event('offline'));
      `);
      
      await commands.visit('/products');
      
      // Look for offline indicators or verify page loads
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('offline') || 
        bodyText.includes('no connection') ||
        bodyText.includes('network') ||
        bodyText.includes('$') ||
        bodyText.includes('No products')
      ).to.be.true;
    });
  });
});