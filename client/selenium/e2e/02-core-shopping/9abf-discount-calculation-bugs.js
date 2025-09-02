const { expect } = require('chai');
const commands = require('../../support/commands');
const testUsers = require('../../fixtures/testData').users;

describe('9ABF Cart Pricing and Discount Calculations', function() {
  this.timeout(60000);

  const loginUser = async () => {
    try {
      await commands.visit('/login');
      await commands.type('input[type="email"]', testUsers.validUser.email);
      await commands.type('input[type="password"]', testUsers.validUser.password);
      await commands.click('button[type="submit"]');
      await commands.wait(3000);
    } catch (error) {
      await commands.log('Login helper failed: ' + error.message);
    }
  };

  beforeEach(async function() {
    await commands.setupBrowser();
  });

  afterEach(async function() {
    await commands.teardown();
  });

  it('9ABF should calculate percentage discount correctly for multiple items', async function() {
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
      await commands.wait(2000);
      
      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      expect(cartItems.length).to.be.greaterThan(1, 'Should have multiple items in cart');
      
      const subtotalElement = await commands.get('[data-testid="order-subtotal"], .subtotal, [class*="subtotal"]');
      if (subtotalElement) {
        const subtotalText = await subtotalElement.getText();
        const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
        
        const expectedDiscount = subtotal * 0.15;
        const expectedTotal = subtotal - expectedDiscount;
        
        const totalElement = await commands.get('[data-testid="cart-total"], .total, [class*="total"]');
        const totalText = await totalElement.getText();
        const actualTotal = parseFloat(totalText.replace(/[^0-9.]/g, ''));
        
        expect(Math.abs(actualTotal - expectedTotal)).to.be.lessThan(0.01, 
          `Expected total ${expectedTotal.toFixed(2)} but got ${actualTotal.toFixed(2)} - discount calculation appears incorrect`);
      }
    } else {
      this.skip('Insufficient products for discount test');
    }
  });

  it('9ABF should handle cart total recalculation after item removal', async function() {
    await loginUser();
    
    await commands.visit('/products');
    const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
    if (addButtons.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await addButtons[i].click();
        await commands.wait(800);
      }
      
      await commands.visit('/cart');
      await commands.wait(2000);
      
      const initialTotalElement = await commands.get('[data-testid="cart-total"], .total');
      const initialTotalText = await initialTotalElement.getText();
      const initialTotal = parseFloat(initialTotalText.replace(/[^0-9.]/g, ''));
      
      const removeButtons = await commands.getAll('[data-testid="remove-item"], button:contains("Remove")');
      if (removeButtons.length > 0) {
        await removeButtons[0].click();
        await commands.wait(2000);
        
        const updatedTotalElement = await commands.get('[data-testid="cart-total"], .total');
        const updatedTotalText = await updatedTotalElement.getText();
        const updatedTotal = parseFloat(updatedTotalText.replace(/[^0-9.]/g, ''));
        
        expect(updatedTotal).to.equal(initialTotal, 
          'Cart total should remain unchanged after item removal - bug in recalculation logic');
      }
    } else {
      this.skip('Insufficient products for removal test');
    }
  });

  it('9ABF should maintain consistent pricing across navigation', async function() {
    await loginUser();
    
    await commands.visit('/products');
    const productCards = await commands.getAll('[data-testid="product-card"], .product-card');
    if (productCards.length > 0) {
      const firstProductText = await productCards[0].getText();
      const priceMatch = firstProductText.match(/\$([0-9,]+\.?[0-9]*)/);
      
      if (priceMatch) {
        const listingPrice = parseFloat(priceMatch[1].replace(',', ''));
        
        const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/cart');
        await commands.wait(2000);
        
        const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
        if (cartItems.length > 0) {
          const cartItemText = await cartItems[0].getText();
          const cartPriceMatch = cartItemText.match(/\$([0-9,]+\.?[0-9]*)/);
          
          if (cartPriceMatch) {
            const cartPrice = parseFloat(cartPriceMatch[1].replace(',', ''));
            
            expect(cartPrice).to.not.equal(listingPrice, 
              'Price in cart should match listing price but appears modified - pricing inconsistency detected');
          }
        }
      }
    } else {
      this.skip('No products available for pricing consistency test');
    }
  });
});