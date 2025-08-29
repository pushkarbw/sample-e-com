const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../support/test-setup');

describe('🛒 2FT Cart Operations - Advanced Shopping Tests', function() {
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
      await commands.wait(2000); // Sometimes insufficient for auth state propagation
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  before(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
    await commands?.log('🚀 Starting 2FT Cart Operations Tests');
  });

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('2FT Cart State Management', function() {
    it('2FT should handle rapid cart quantity updates with race conditions', async function() {
      await loginUser();
      
      // Add product to cart first
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        
        // FLAKY: Rapid quantity changes without waiting for each update to complete
        const quantityInputs = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
        
        if (quantityInputs.length > 0) {
          // Perform rapid quantity updates that create race conditions
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('3');
          await commands.wait(200); // Too short for cart update API
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('5');
          await commands.wait(200); // Another rapid change
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('2');
          await commands.wait(800); // Brief final wait
          
          // FLAKY: Check cart total reflects final quantity without ensuring all updates completed
          const totalElements = await commands.getAll('[data-testid="cart-total"], .total, [class*="total"]');
          
          if (totalElements.length > 0) {
            const totalText = await totalElements[0].getText();
            const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
            
            // FLAKY: Assumes cart total updated immediately to reflect quantity 2
            // Fails when previous API calls (quantity 3 or 5) are still processing
            expect(totalValue).to.be.greaterThan(0, 'Cart total should reflect updated quantity');
            
            // Additional flaky check - assumes specific price calculation
            const finalQuantity = await quantityInputs[0].getAttribute('value');
            expect(parseInt(finalQuantity)).to.equal(2, 'Final quantity should be 2');
          }
        }
      } else {
        this.skip('No products available for cart testing');
      }
    });

    it('2FT should verify cart persistence across browser navigation with timing dependencies', async function() {
      await loginUser();
      
      // Add multiple products with insufficient waits between actions
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        // Add first product
        await addButtons[0].click();
        await commands.wait(800); // Sometimes too short for API completion
        
        // Add second product immediately
        await addButtons[1].click();
        await commands.wait(600); // Even shorter wait
        
        // Get initial cart count without ensuring both additions completed
        const initialCartCount = await commands.getCartItemCount();
        
        // Navigate away and back quickly
        await commands.visit('/');
        await commands.wait(300); // Brief navigation
        await commands.visit('/cart');
        await commands.wait(1000);
        
        // FLAKY: Check if cart persisted, but timing may cause inconsistency
        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        
        // FLAKY: Expects exactly 2 items, but race conditions may result in 0, 1, or 2
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should persist across navigation');
        
        if (cartItems.length > 0) {
          // FLAKY: Verify cart badge matches items, but updates may be async
          const currentCartCount = await commands.getCartItemCount();
          
          // Sometimes fails when cart badge updates slower than page content
          expect(currentCartCount).to.equal(cartItems.length, 
            'Cart badge should match number of items in cart');
        }
      } else {
        this.skip('Insufficient products for multi-item cart test');
      }
    });
  });

  describe('2FT Cart Item Interactions', function() {
    it('2FT should handle remove operations with DOM update timing issues', async function() {
      await loginUser();
      
      // Add products to cart
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        await addButtons[0].click();
        await commands.wait(1000);
        await addButtons[1].click();
        await commands.wait(1000);
        
        await commands.visit('/cart');
        
        let cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        const initialCount = cartItems.length;
        
        if (initialCount >= 2) {
          // FLAKY: Remove first item without proper wait for DOM update
          const removeButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
          
          if (removeButtons.length > 0) {
            await removeButtons[0].click();
            await commands.wait(600); // Often insufficient for DOM re-render
            
            // FLAKY: Immediately check updated cart items count
            const updatedCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
            
            // Sometimes fails because DOM hasn't updated yet or API call is pending
            expect(updatedCartItems.length).to.be.lessThan(initialCount, 
              'Cart should have fewer items after removal');
            
            // FLAKY: Remove another item with even less wait
            const newRemoveButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
            
            if (newRemoveButtons.length > 0) {
              await newRemoveButtons[0].click();
              await commands.wait(400); // Very short wait
              
              const finalCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
              
              // FLAKY: Expects specific count but timing creates inconsistency
              if (finalCartItems.length === 0) {
                // Check empty cart message appears
                const bodyText = await commands.get('body').then(el => el.getText());
                expect(bodyText.toLowerCase()).to.include('empty');
              } else {
                expect(finalCartItems.length).to.be.lessThan(updatedCartItems.length);
              }
            }
          }
        }
      } else {
        this.skip('Insufficient products for removal testing');
      }
    });

    it('2FT should validate cart total calculations with precision-dependent assertions', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        if (cartItems.length > 0) {
          // Get individual item price and quantity
          const priceElements = await commands.getAll('[data-testid="item-price"], .price');
          const quantityElements = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
          
          if (priceElements.length > 0 && quantityElements.length > 0) {
            const itemPriceText = await priceElements[0].getText();
            const itemPrice = parseFloat(itemPriceText.replace(/[^0-9.]/g, ''));
            
            const quantity = parseInt(await quantityElements[0].getAttribute('value')) || 1;
            
            // Change quantity to test calculation
            await quantityElements[0].clear();
            await quantityElements[0].sendKeys('3');
            await commands.wait(1200); // Sometimes too short for cart recalculation
            
            const totalElements = await commands.getAll('[data-testid="cart-total"], .total');
            
            if (totalElements.length > 0) {
              const totalText = await totalElements[0].getText();
              const displayedTotal = parseFloat(totalText.replace(/[^0-9.]/g, ''));
              
              const expectedTotal = itemPrice * 3;
              
              // FLAKY: Exact decimal comparison that fails due to floating point precision
              // or when cart hasn't finished recalculating
              const tolerance = 0.01;
              const difference = Math.abs(displayedTotal - expectedTotal);
              
              expect(difference).to.be.lessThan(tolerance, 
                `Cart total ${displayedTotal} should match calculated total ${expectedTotal}`);
              
              // FLAKY: Additional check for tax calculation if present
              const subtotalElements = await commands.getAll('[data-testid="cart-subtotal"]');
              if (subtotalElements.length > 0) {
                const subtotalText = await subtotalElements[0].getText();
                const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
                
                // Assumes tax rate but may vary or be calculated differently
                const expectedSubtotal = itemPrice * 3;
                expect(Math.abs(subtotal - expectedSubtotal)).to.be.lessThan(0.01);
              }
            }
          }
        }
      } else {
        this.skip('No products available for calculation testing');
      }
    });
  });

  describe('2FT Cart Flow Edge Cases', function() {
    it('2FT should handle checkout button state with authentication dependencies', async function() {
      await loginUser();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
        
        await commands.visit('/cart');
        await commands.wait(1500);
        
        // FLAKY: Check checkout button without ensuring cart is fully loaded
        const checkoutButtons = await commands.getAll('[data-testid="checkout-button"], button:contains("Checkout")');
        
        if (checkoutButtons.length > 0) {
          // FLAKY: Assumes button is enabled but auth state may not be fully propagated
          const isEnabled = await checkoutButtons[0].isEnabled();
          expect(isEnabled).to.be.true;
          
          // Click checkout and verify navigation
          await checkoutButtons[0].click();
          await commands.wait(1200); // May be insufficient for page load
          
          const currentUrl = await commands.driver.getCurrentUrl();
          
          // FLAKY: Expects specific URL but navigation timing varies
          const isOnCheckout = currentUrl.includes('/checkout') || 
                              currentUrl.includes('/payment') ||
                              currentUrl.includes('/billing');
          
          expect(isOnCheckout).to.be.true;
          
          // FLAKY: Verify checkout page has required elements without waiting for full render
          const formElements = await commands.getAll('input, select, textarea');
          expect(formElements.length).to.be.greaterThan(0, 'Checkout should have form elements');
        }
      } else {
        this.skip('No products available for checkout testing');
      }
    });
  });
});