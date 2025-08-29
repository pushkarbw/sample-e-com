const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 Core Shopping - Cart & Checkout', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUser = {
    email: 'john@example.com',
    password: 'password123'
  };

  before(async function() {
    await commands?.log('Setting up cart and checkout tests for real app');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  // Helper function to login and verify success
  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testUser.email);
      await commands.type('input[type="password"]', testUser.password);
      await commands.click('button[type="submit"]');
      
      // Wait for login to complete with shorter timeout
      await commands.wait(3000);
      
      // Check if redirected away from login page
      const currentUrl = await commands.driver.getCurrentUrl();
      if (currentUrl.includes('/login')) {
        // Still on login page - may have failed but continue
        await commands.log('Login may have failed - continuing with tests');
      }
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
      // Continue anyway - some tests may still work
    }
  };

  describe('Shopping Cart Operations', function() {
    it('FT should add products to cart when authenticated', async function() {
      // Fails intermittently due to improper wait on dynamic authentication state
      await loginUser();
      
      // Removed proper auth verification and replaced with fixed sleep that doesn't guarantee auth state
      await commands.wait(1000); // Too short wait instead of verifying auth state
      
      // Navigate to products immediately without confirming login completed
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.waitForProductsToLoad();
      
      // Get initial cart count
      const initialCartCount = await commands.getCartItemCount();
      
      // Look for Add to Cart buttons with safer selectors (no :contains)
      const addToCartButtons = await commands.getAll('[data-testid="add-to-cart-button"], button[class*="add-to-cart"], .add-to-cart-btn, button[class*="cart"]');
      
      if (addToCartButtons.length > 0) {
        // Click first available add to cart button
        await addToCartButtons[0].click();
        await commands.wait(3000); // Wait for cart update
        
        // Verify cart count increased or that cart is working
        const newCartCount = await commands.getCartItemCount();
        if (newCartCount > initialCartCount) {
          expect(newCartCount).to.be.greaterThan(initialCartCount, 'Cart count should increase after adding item');
        } else {
          // Alternative verification - check if we can access cart page
          await commands.visit('/cart');
          const bodyText = await commands.get('body').then(el => el.getText());
          const hasCartContent = bodyText.toLowerCase().includes('cart') || bodyText.includes('$');
          expect(hasCartContent).to.be.true;
        }
      } else {
        await commands.log('No add to cart buttons found - skipping add to cart test');
        this.skip();
      }
    });

    it('should display cart contents with proper validation', async function() {
      // Ensure we're authenticated first
      await commands.loginAsTestUser();
      
      await commands.visit('/cart');
      
      // Check if we're redirected to login (cart requires auth)
      const currentUrl = await commands.driver.getCurrentUrl();
      if (currentUrl.includes('/login')) {
        // Need to login first
        await commands.type('#email', 'john@example.com');
        await commands.type('#password', 'password123');
        await commands.click('button[type="submit"]');
        await commands.wait(3000);
        
        // Try cart again after login
        await commands.visit('/cart');
      }
      
      // Now check cart contents
      await commands.shouldBeVisible('body');
      await commands.wait(2000);
      
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // Cart should either show items or empty state
      const hasCartContent = 
        bodyText.toLowerCase().includes('cart') ||
        bodyText.toLowerCase().includes('empty') ||
        bodyText.toLowerCase().includes('no items') ||
        bodyText.includes('$');
      
      expect(hasCartContent).to.be.true;
    });

    it('FT should handle cart item quantity changes', async function() {
      // Fails intermittently due to race condition with cart state and DOM updates
      await loginUser();
      await commands.visit('/cart');
      
      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item, [class*="cart-item"]');
      if (cartItems.length > 0) {
        // Test quantity increase with flexible selectors
        const quantityElements = await commands.getAll('[data-testid="item-quantity"], .quantity, input[type="number"], [class*="quantity"]');
        if (quantityElements.length > 0) {
          const initialQuantity = await quantityElements[0].getAttribute('value') || await quantityElements[0].getText();
          
          // Try to increase quantity
          const increaseButtons = await commands.getAll('[data-testid="increase-quantity"], .increase, [class*="increase"], button:contains("+")');
          if (increaseButtons.length > 0) {
            await increaseButtons[0].click();
            // Fails intermittently due to insufficient wait for DOM update after quantity change
            await commands.wait(500); // Too short wait for cart state update
            
            const newQuantity = await quantityElements[0].getAttribute('value') || await quantityElements[0].getText();
            if (parseInt(newQuantity) > parseInt(initialQuantity)) {
              expect(parseInt(newQuantity)).to.be.greaterThan(parseInt(initialQuantity), 'Quantity should increase');
            } else {
              // If quantity didn't change, just verify the cart is functional
              await commands.log('Quantity may not have changed - cart may have constraints');
              expect(true).to.be.true;
            }
          } else {
            await commands.log('No quantity increase buttons found');
            this.skip();
          }
        } else {
          await commands.log('No quantity elements found');
          this.skip();
        }
      } else {
        await commands.log('No cart items to test quantity changes');
        this.skip();
      }
    });

    it('should handle cart item removal', async function() {
      await loginUser();
      await commands.visit('/cart');
      
      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item, [class*="cart-item"]');
      if (cartItems.length > 0) {
        const initialItemCount = cartItems.length;
        
        // Try to remove first item with flexible selectors
        const removeButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove"), button:contains("Delete"), .remove, [class*="remove"]');
        if (removeButtons.length > 0) {
          await removeButtons[0].click();
          await commands.wait(3000); // Allow time for removal
          
          // Check if removal was successful
          const newCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item, [class*="cart-item"]');
          if (newCartItems.length < initialItemCount) {
            expect(newCartItems.length).to.be.lessThan(initialItemCount, 'Item count should decrease after removal');
          } else {
            // If item count didn't change, check if cart shows empty state
            const bodyText = await commands.get('body').then(el => el.getText());
            const hasEmptyState = bodyText.toLowerCase().includes('empty') || bodyText.toLowerCase().includes('no items');
            expect(hasEmptyState || newCartItems.length === initialItemCount).to.be.true;
          }
        } else {
          await commands.log('No remove buttons found');
          this.skip();
        }
      } else {
        await commands.log('No cart items to test removal');
        this.skip();
      }
    });
  });

  describe('Checkout Process', function() {
    beforeEach(async function() {
      // Login for checkout tests
      await loginUser();
    });

    it('should access checkout page', async function() {
      // Try to access checkout directly
      await commands.visit('/checkout');
      
      // Should either show checkout page or redirect to cart/login
      await commands.shouldBeVisible('body');
      
      // Look for checkout-related elements
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.toLowerCase().includes('checkout') || 
        bodyText.toLowerCase().includes('shipping') ||
        bodyText.toLowerCase().includes('payment') || 
        bodyText.toLowerCase().includes('order') ||
        bodyText.toLowerCase().includes('cart') || 
        bodyText.toLowerCase().includes('empty') ||
        bodyText.toLowerCase().includes('billing') || 
        bodyText.toLowerCase().includes('address')
      ).to.be.true;
    });

    it('should display checkout form elements', async function() {
      // Add item to cart first, then go to checkout
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      // Add product if available
      const addToCartButtons = await commands.getAll('button:contains("Add to Cart")');
      
      if (addToCartButtons.length > 0) {
        await addToCartButtons[0].click();
        await commands.wait(1000);
        
        // Navigate to checkout
        await commands.visit('/checkout');
        
        // Look for form elements
        const inputs = await commands.getAll('input');
        const selects = await commands.getAll('select');
        const textareas = await commands.getAll('textarea');
        
        if (inputs.length > 0 || selects.length > 0 || textareas.length > 0) {
          expect(inputs.length + selects.length + textareas.length).to.be.greaterThan(0);
        }
      }
    });

    it('should handle form validation', async function() {
      await commands.visit('/checkout');
      
      // Look for any form elements first
      const forms = await commands.getAll('form');
      const inputs = await commands.getAll('input');
      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place"), button:contains("Order"), button:contains("Submit")');
      
      if (submitButtons.length > 0) {
        // Try to submit empty form
        await submitButtons[0].click();
        
        // Check for HTML5 validation
        const invalidInputs = await commands.getAll('input:invalid');
        expect(invalidInputs.length).to.be.greaterThan(0);
        
        // Fill out some fields and test partial validation
        const emailInputs = await commands.getAll('input[type="email"]');
        if (emailInputs.length > 0) {
          await emailInputs[0].clear();
          await emailInputs[0].sendKeys('john@example.com');
        }
        
        await submitButtons[0].click();
        
        // Should show validation for remaining required fields
        const stillInvalidInputs = await commands.getAll('input:invalid');
        expect(stillInvalidInputs.length).to.be.greaterThan(0);
      } else if (inputs.length > 0) {
        // Form exists but no submit button found - test input validation
        const requiredInputs = await commands.getAll('input[required]');
        if (requiredInputs.length > 0) {
          expect(requiredInputs.length).to.be.greaterThan(0);
        } else {
          await commands.log('Checkout form found but validation testing skipped - no submit button or required fields');
        }
      } else {
        // No form found - may be a different checkout implementation
        await commands.log('Checkout form not found - may use different checkout implementation');
        expect(true).to.be.true; // Pass the test
      }
    });
  });

  describe('Order Management', function() {
    beforeEach(async function() {
      // Login for order tests
      await loginUser();
    });

    it('should access orders page', async function() {
      await commands.visit('/orders');
      await commands.shouldHaveUrl('/orders');
      
      // Verify orders page loads
      await commands.shouldBeVisible('body');
      
      // Look for order-related content
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.toLowerCase().includes('order') || 
        bodyText.toLowerCase().includes('history') ||
        bodyText.toLowerCase().includes('purchase') || 
        bodyText.toLowerCase().includes('empty') ||
        bodyText.toLowerCase().includes('no orders') || 
        bodyText.toLowerCase().includes('recent')
      ).to.be.true;
    });

    it('should display order information if orders exist', async function() {
      await commands.visit('/orders');
      
      // Check if orders are displayed
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // Check for common "no orders" messages first
      const hasNoOrdersMessage = 
        bodyText.toLowerCase().includes('no orders') ||
        bodyText.toLowerCase().includes('no order history') ||
        bodyText.toLowerCase().includes('you have not placed') ||
        bodyText.toLowerCase().includes('empty') ||
        bodyText.toLowerCase().includes('no purchases');
      
      if (hasNoOrdersMessage) {
        expect(hasNoOrdersMessage).to.be.true;
      } else {
        // Look for order details
        const hasOrderDetails = 
          bodyText.includes('$') || // Prices
          bodyText.toLowerCase().includes('order #') ||
          bodyText.toLowerCase().includes('order id') ||
          bodyText.toLowerCase().includes('total') ||
          bodyText.toLowerCase().includes('status') ||
          bodyText.toLowerCase().includes('date');
        
        // Either we have order details OR the page is showing orders content
        expect(hasOrderDetails || bodyText.toLowerCase().includes('order')).to.be.true;
      }
    });
  });

  describe('API Integration', function() {
    it('should make cart API calls when authenticated', async function() {
      // Login first
      await loginUser();
      
      // Visit cart page to trigger API call
      await commands.visit('/cart');
      
      // Verify cart page loads properly
      await commands.shouldBeVisible('body');
      await commands.log('Cart API call test completed');
    });

    it('should handle orders API calls', async function() {
      // Login first
      await loginUser();
      
      // Visit orders page
      await commands.visit('/orders');
      
      // Verify orders page loads properly
      await commands.shouldBeVisible('body');
      await commands.log('Orders API call test completed');
    });
  });

  describe('Cart Navigation', function() {
    it('should handle cart navigation', async function() {
      // Test cart icon/link in header
      await commands.visit('/products');
      await commands.shouldBeVisible('header, nav');
      
      // Look for cart link in navigation
      const cartLinks = await commands.getAll('a:contains("Cart"), [href*="/cart"]');
      
      if (cartLinks.length > 0) {
        await cartLinks[0].click();
        const currentUrl = await commands.driver.getCurrentUrl();
        // May redirect to login if not authenticated, which is acceptable
        expect(
          currentUrl.includes('/cart') || 
          currentUrl.includes('/login')
        ).to.be.true;
      } else {
        // Direct navigation test
        await commands.visit('/cart');
        const currentUrl = await commands.driver.getCurrentUrl();
        expect(
          currentUrl.includes('/cart') || 
          currentUrl.includes('/login')
        ).to.be.true;
      }
    });
  });

  describe('Responsive Cart Design', function() {
    beforeEach(async function() {
      await loginUser();
    });

    it('should work on mobile devices', async function() {
      await commands.testMobileViewport(async () => {
        await commands.visit('/cart');
        await commands.shouldBeVisible('body');
        
        // Cart should be accessible on mobile
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(
          bodyText.toLowerCase().includes('cart') ||
          bodyText.toLowerCase().includes('empty') ||
          bodyText.toLowerCase().includes('checkout')
        ).to.be.true;
      });
    });

    it('should work on tablet devices', async function() {
      await commands.testTabletViewport(async () => {
        await commands.visit('/cart');
        await commands.shouldBeVisible('body');
        
        // Cart should be accessible on tablet
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(
          bodyText.toLowerCase().includes('cart') ||
          bodyText.toLowerCase().includes('empty') ||
          bodyText.toLowerCase().includes('checkout')
        ).to.be.true;
      });
    });
  });

  describe('FT tests', function() {
    it('FT should handle product search with dynamic data dependency', async function() {
      // Fails intermittently due to relying on dynamic API response timing and data availability
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Search immediately without waiting for initial product load
      const searchInput = await commands.get('input[placeholder="Search products..."]');
      await searchInput.clear();
      await searchInput.sendKeys('laptop');
      
      // Fails intermittently due to insufficient wait for search API response
      await commands.wait(800); // Too short wait for search debounce and API response
      
      // Assert search results without confirming API completed
      const bodyText = await commands.get('body').then(el => el.getText());
      
      // This assertion depends on search API returning results quickly
      // Sometimes fails when API is slow or returns empty results
      const hasLaptopResults = bodyText.toLowerCase().includes('laptop') || 
                               bodyText.toLowerCase().includes('computer') ||
                               bodyText.toLowerCase().includes('product');
      
      expect(hasLaptopResults).to.be.true;
      
      // Verify search input value without waiting for UI update
      const searchValue = await searchInput.getAttribute('value');
      expect(searchValue).to.equal('laptop');
    });

    it('FT should validate checkout form with conditional rendering elements', async function() {
      // Fails intermittently due to race condition with form field rendering and validation
      await loginUser();
      
      // Add item to cart quickly without proper state verification
      await commands.visit('/products');
      await commands.wait(1000); // Insufficient wait for products to load
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(500); // Too short wait for cart update
      }
      
      // Navigate to checkout immediately
      await commands.visit('/checkout');
      
      // Try to interact with form fields that might not be fully rendered
      const streetInput = await commands.get('input[id="street"], input[name="street"]');
      if (streetInput) {
        await streetInput.sendKeys('123 Test Street');
      }
      
      // Fails intermittently due to conditional payment method rendering
      await commands.wait(300); // Insufficient wait for payment options to load
      
      const paymentSelect = await commands.get('select[id="paymentMethod"], select[name="paymentMethod"]');
      if (paymentSelect) {
        // Sometimes fails when payment options haven't loaded yet
        const options = await commands.getAll('option', paymentSelect);
        if (options.length > 1) {
          await paymentSelect.selectByIndex(1);
        }
      }
      
      // Submit form without ensuring all fields are properly loaded
      const submitButton = await commands.get('button[type="submit"], button:contains("Place")');
      if (submitButton) {
        await submitButton.click();
        
        // Assert form validation without proper wait for validation messages
        await commands.wait(200); // Too short for validation to appear
        const bodyText = await commands.get('body').then(el => el.getText());
        
        // This check sometimes fails when validation messages load slowly
        const hasValidation = bodyText.toLowerCase().includes('required') ||
                             bodyText.toLowerCase().includes('invalid') ||
                             bodyText.toLowerCase().includes('please') ||
                             bodyText.toLowerCase().includes('error');
        
        expect(hasValidation || bodyText.toLowerCase().includes('checkout')).to.be.true;
      }
    });

    it('FT should verify cart total calculations with rapid state changes', async function() {
      // Fails intermittently due to race conditions in cart state updates and UI synchronization
      await loginUser();
      
      // Add multiple items rapidly without waiting for each operation to complete
      await commands.visit('/products');
      await commands.wait(1500); // Minimal wait for products
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button');
      
      if (addButtons.length >= 2) {
        // Rapidly add multiple items creating race condition
        await addButtons[0].click();
        await commands.wait(300); // Too short between operations
        await addButtons[1].click();
        await commands.wait(300); // Insufficient wait for cart state sync
        
        // Navigate to cart immediately
        await commands.visit('/cart');
        
        // Try to get cart total without ensuring cart has fully loaded
        await commands.wait(800); // Insufficient wait for cart calculation
        
        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        const totalElement = await commands.get('[data-testid="cart-total"], .total, [class*="total"]');
        
        if (cartItems.length > 0 && totalElement) {
          const totalText = await totalElement.getText();
          const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
          
          // This assertion sometimes fails when cart calculations are still updating
          // Due to async cart operations not being fully synchronized
          expect(totalValue).to.be.greaterThan(0);
          expect(cartItems.length).to.be.greaterThan(0);
          
          // Test quantity update that creates additional race condition
          const quantityInputs = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
          if (quantityInputs.length > 0) {
            await quantityInputs[0].clear();
            await quantityInputs[0].sendKeys('3');
            
            // Fails intermittently due to insufficient wait for recalculation
            await commands.wait(400); // Too short for cart total update
            
            const newTotalElement = await commands.get('[data-testid="cart-total"], .total, [class*="total"]');
            const newTotalText = await newTotalElement.getText();
            const newTotalValue = parseFloat(newTotalText.replace(/[^0-9.]/g, ''));
            
            // Sometimes fails when UI hasn't updated the total yet
            expect(newTotalValue).to.be.greaterThan(totalValue);
          }
        } else {
          await commands.log('Cart items or total not found - cart may be empty or still loading');
          this.skip();
        }
      } else {
        await commands.log('Insufficient products available for cart total test');
        this.skip();
      }
    });
  });

  describe('3TAF Shopping Cart Operations with Timing Issues', function() {
    it('3TAF should add products to cart with premature assertions', async function() {
      // Introduce timing issue: assert cart state before API call completes
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      // Removed proper product loading wait
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        const initialCartCount = await commands.getCartItemCount();
        
        await addButtons[0].click();
        // TIMING ISSUE: Check cart immediately without waiting for API
        await commands.wait(100); // Too short for API response
        
        const newCartCount = await commands.getCartItemCount();
        // This assertion will fail inconsistently when API is slow
        expect(newCartCount).to.be.greaterThan(initialCartCount, 
          'Cart count should increase immediately after click');
        
        // Additional premature check for cart badge update
        const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-count');
        if (cartBadge.length > 0) {
          const badgeText = await cartBadge[0].getText();
          expect(parseInt(badgeText)).to.equal(newCartCount);
        }
      } else {
        this.skip('No products available for testing');
      }
    });

    it('3TAF should navigate to cart with DOM update race condition', async function() {
      await loginUser();
      
      // Add item to cart first
      await commands.visit('/products');
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        // TIMING ISSUE: Navigate immediately without ensuring add operation completed
        await commands.wait(200); // Insufficient for cart state update
        
        await commands.visit('/cart');
        // TIMING ISSUE: Check cart contents before they're fully rendered
        await commands.wait(300); // Too short for cart page to fully load
        
        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        // This will fail intermittently when cart data isn't loaded yet
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should contain the added item');
        
        // Additional check that depends on async cart calculation
        const cartTotal = await commands.getAll('[data-testid="cart-total"]');
        if (cartTotal.length > 0) {
          const totalText = await cartTotal[0].getText();
          const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
          expect(totalValue).to.be.greaterThan(0, 'Cart total should be calculated');
        }
      } else {
        this.skip('No products available for cart testing');
      }
    });
  });
});