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
      await commands.wait(2000);
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
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.wait(2000);
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        
        const quantityInputs = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
        
        if (quantityInputs.length > 0) {
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('3');
          await commands.wait(200);
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('5');
          await commands.wait(200);
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('2');
          await commands.wait(800);
          
          const totalElements = await commands.getAll('[data-testid="cart-total"], .total, [class*="total"]');
          
          if (totalElements.length > 0) {
            const totalText = await totalElements[0].getText();
            const totalValue = parseFloat(totalText.replace(/[^0-9.]/g, ''));
            
            expect(totalValue).to.be.greaterThan(0, 'Cart total should reflect updated quantity');
            
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
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length >= 2) {
        await addButtons[0].click();
        await commands.wait(800);
        
        await addButtons[1].click();
        await commands.wait(600);
        
        const initialCartCount = await commands.getCartItemCount();
        
        await commands.visit('/');
        await commands.wait(300);
        await commands.visit('/cart');
        await commands.wait(1000);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        
        expect(cartItems.length).to.be.greaterThan(0, 'Cart should persist across navigation');
        
        if (cartItems.length > 0) {
          const currentCartCount = await commands.getCartItemCount();
          
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
          const removeButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
          
          if (removeButtons.length > 0) {
            await removeButtons[0].click();
            await commands.wait(600);
            
            const updatedCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
            
            expect(updatedCartItems.length).to.be.lessThan(initialCount, 
              'Cart should have fewer items after removal');
            
            const newRemoveButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
            
            if (newRemoveButtons.length > 0) {
              await newRemoveButtons[0].click();
              await commands.wait(400);
              
              const finalCartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
              
              if (finalCartItems.length === 0) {
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
          const priceElements = await commands.getAll('[data-testid="item-price"], .price');
          const quantityElements = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
          
          if (priceElements.length > 0 && quantityElements.length > 0) {
            const itemPriceText = await priceElements[0].getText();
            const itemPrice = parseFloat(itemPriceText.replace(/[^0-9.]/g, ''));
            
            const quantity = parseInt(await quantityElements[0].getAttribute('value')) || 1;
            
            await quantityElements[0].clear();
            await quantityElements[0].sendKeys('3');
            await commands.wait(1200);
            
            const totalElements = await commands.getAll('[data-testid="cart-total"], .total');
            
            if (totalElements.length > 0) {
              const totalText = await totalElements[0].getText();
              const displayedTotal = parseFloat(totalText.replace(/[^0-9.]/g, ''));
              
              const expectedTotal = itemPrice * 3;
              
              const tolerance = 0.01;
              const difference = Math.abs(displayedTotal - expectedTotal);
              
              expect(difference).to.be.lessThan(tolerance, 
                `Cart total ${displayedTotal} should match calculated total ${expectedTotal}`);
              
              const subtotalElements = await commands.getAll('[data-testid="cart-subtotal"]');
              if (subtotalElements.length > 0) {
                const subtotalText = await subtotalElements[0].getText();
                const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
                
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
        
        const checkoutButtons = await commands.getAll('[data-testid="checkout-button"], button:contains("Checkout")');
        
        if (checkoutButtons.length > 0) {
          const isEnabled = await checkoutButtons[0].isEnabled();
          expect(isEnabled).to.be.true;
          
          await checkoutButtons[0].click();
          await commands.wait(1200);
          
          const currentUrl = await commands.driver.getCurrentUrl();
          
          const isOnCheckout = currentUrl.includes('/checkout') || 
                              currentUrl.includes('/payment') ||
                              currentUrl.includes('/billing');
          
          expect(isOnCheckout).to.be.true;
          
          const formElements = await commands.getAll('input, select, textarea');
          expect(formElements.length).to.be.greaterThan(0, 'Checkout should have form elements');
        }
      } else {
        this.skip('No products available for checkout testing');
      }
    });
  });
});