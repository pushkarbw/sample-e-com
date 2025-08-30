const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🛒 2FT Cart Operations - Race Condition Tests', function() {
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
      await commands.wait(1800);
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
        await commands.wait(1200);
        
        const quantityInputs = await commands.getAll('[data-testid="item-quantity"], input[type="number"]');
        
        if (quantityInputs.length > 0) {
          const originalQuantity = await quantityInputs[0].getAttribute('value');
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('5');
          await commands.wait(800);
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('3');
          await commands.wait(600);
          
          await quantityInputs[0].clear();
          await quantityInputs[0].sendKeys('7');
          await commands.wait(1000);
          
          const totalElements = await commands.getAll('[data-testid="cart-total"]');
          
          if (totalElements.length > 0) {
            const totalText = await totalElements[0].getText();
            const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
            
            expect(total).to.be.greaterThan(0, 'Cart total should update after quantity changes');
            
            const finalQuantity = await quantityInputs[0].getAttribute('value');
            expect(parseInt(finalQuantity)).to.equal(7, 'Final quantity should be 7');
          }
        } else {
          this.skip('No quantity inputs found in cart');
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
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1200);
        
        const initialCartCount = await commands.getCartItemCount();
        
        await commands.visit('/');
        await commands.wait(900);
        
        await commands.visit('/products');
        await commands.wait(800);
        
        const persistedCartCount = await commands.getCartItemCount();
        
        expect(persistedCartCount).to.equal(initialCartCount, 
          'Cart count should persist across navigation');
        
        await commands.visit('/cart');
        await commands.wait(1000);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"]');
        expect(cartItems.length).to.be.greaterThan(0, 'Cart items should persist');
        
        await commands.reload();
        await commands.wait(1200);
        
        const reloadedCartItems = await commands.getAll('[data-testid="cart-item"]');
        expect(reloadedCartItems.length).to.equal(cartItems.length, 
          'Cart should survive page reload');
      } else {
        this.skip('No products available for persistence testing');
      }
    });

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
        await commands.wait(1500);
        
        const initialCartItems = await commands.getAll('[data-testid="cart-item"]');
        const initialItemCount = initialCartItems.length;
        
        const removeButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
        
        if (removeButtons.length > 0) {
          await removeButtons[0].click();
          await commands.wait(700);
          
          await removeButtons[1].click();
          await commands.wait(500);
          
          const updatedCartItems = await commands.getAll('[data-testid="cart-item"]');
          
          expect(updatedCartItems.length).to.be.lessThan(initialItemCount, 
            'Cart should have fewer items after removal');
          
          const totalElements = await commands.getAll('[data-testid="cart-total"]');
          
          if (totalElements.length > 0 && updatedCartItems.length > 0) {
            const totalText = await totalElements[0].getText();
            const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
            expect(total).to.be.greaterThan(0, 'Total should be recalculated');
          } else if (updatedCartItems.length === 0) {
            const bodyText = await commands.get('body').then(el => el.getText());
            expect(bodyText.toLowerCase()).to.include('empty');
          }
        } else {
          this.skip('No remove buttons found');
        }
      } else {
        this.skip('Insufficient products for remove operations test');
      }
    });
  });
});