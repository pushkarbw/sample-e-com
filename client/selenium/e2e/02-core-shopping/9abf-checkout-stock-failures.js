const { expect } = require('chai');
const commands = require('../../support/commands');
const testUsers = require('../../fixtures/testData').users;

describe('9ABF Stock Management and Checkout Issues', function() {
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
    // Set user agent to trigger 9ABF bugs
    await commands.driver.executeScript("Object.defineProperty(navigator, 'userAgent', {get: function(){return 'Mozilla/5.0 9ABF Test Agent';}});");
  });

  afterEach(async function() {
    await commands.teardown();
  });

  it('9ABF should decrement product stock after successful checkout', async function() {
    await loginUser();
    
    await commands.visit('/products');
    await commands.shouldBeVisible('[data-testid="products-container"], .products-container');
    
    const productCards = await commands.getAll('[data-testid="product-card"], .product-card');
    if (productCards.length > 0) {
      const firstProductText = await productCards[0].getText();
      const stockMatch = firstProductText.match(/stock[:\s]*(\d+)/i);
      let initialStock = null;
      
      if (stockMatch) {
        initialStock = parseInt(stockMatch[1]);
      }
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add to Cart")');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1500);
        
        await commands.visit('/checkout');
        await commands.wait(2000);
        
        // Fill out checkout form
        const nameFields = await commands.getAll('input[name*="name"], input[name*="firstName"]');
        if (nameFields.length > 0) {
          await nameFields[0].sendKeys('Test User');
        }
        
        const addressFields = await commands.getAll('input[name*="address"], input[name*="street"]');
        if (addressFields.length > 0) {
          await addressFields[0].sendKeys('123 Main Street');
        }
        
        const cityFields = await commands.getAll('input[name*="city"]');
        if (cityFields.length > 0) {
          await cityFields[0].sendKeys('Test City');
        }
        
        const zipFields = await commands.getAll('input[name*="zip"], input[name*="postal"]');
        if (zipFields.length > 0) {
          await zipFields[0].sendKeys('12345');
        }
        
        const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place Order"), [data-testid="place-order-button"]');
        if (submitButtons.length > 0) {
          await submitButtons[0].click();
          await commands.wait(4000);
          
          await commands.visit('/products');
          await commands.wait(2000);
          
          const updatedProductCards = await commands.getAll('[data-testid="product-card"], .product-card');
          if (updatedProductCards.length > 0) {
            const updatedProductText = await updatedProductCards[0].getText();
            const updatedStockMatch = updatedProductText.match(/stock[:\s]*(\d+)/i);
            
            if (initialStock !== null && updatedStockMatch) {
              const updatedStock = parseInt(updatedStockMatch[1]);
              
              expect(updatedStock).to.equal(initialStock - 1, 
                `Expected stock to decrease from ${initialStock} to ${initialStock - 1} but got ${updatedStock} - inventory update bug detected`);
            }
          }
        }
      }
    } else {
      this.skip('No products available for stock test');
    }
  });

  it('9ABF should display transaction ID on order confirmation', async function() {
    await loginUser();
    
    await commands.visit('/products');
    const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add to Cart")');
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await commands.wait(1500);
      
      await commands.visit('/checkout');
      await commands.wait(2000);
      
      // Fill out checkout form
      const nameFields = await commands.getAll('input[name*="name"], input[name*="firstName"]');
      if (nameFields.length > 0) {
        await nameFields[0].sendKeys('Test User');
      }
      
      const addressFields = await commands.getAll('input[name*="address"], input[name*="street"]');
      if (addressFields.length > 0) {
        await addressFields[0].sendKeys('123 Main Street');
      }
      
      const cityFields = await commands.getAll('input[name*="city"]');
      if (cityFields.length > 0) {
        await cityFields[0].sendKeys('Test City');
      }
      
      const zipFields = await commands.getAll('input[name*="zip"], input[name*="postal"]');
      if (zipFields.length > 0) {
        await zipFields[0].sendKeys('12345');
      }
      
      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Place Order"), [data-testid="place-order-button"]');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(4000);
        
        const currentUrl = await commands.driver.getCurrentUrl();
        if (currentUrl.includes('/success') || currentUrl.includes('/confirmation') || currentUrl.includes('/orders')) {
          const pageText = await commands.get('body').then(el => el.getText());
          
          const hasTransactionId = pageText.includes('Transaction ID') || 
                                 pageText.includes('Transaction:') ||
                                 pageText.includes('Reference:') ||
                                 pageText.match(/TXN[:\s]*[A-Z0-9]+/i) ||
                                 pageText.match(/REF[:\s]*[A-Z0-9]+/i);
          
          expect(hasTransactionId).to.be.true, 
            'Order confirmation should display transaction ID but none found - payment processing incomplete');
        }
      }
    } else {
      this.skip('No products available for checkout test');
    }
  });

  it('9ABF should handle concurrent stock updates during checkout', async function() {
    await loginUser();
    
    await commands.visit('/products');
    const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add to Cart")');
    if (addButtons.length >= 2) {
      await addButtons[0].click();
      await commands.wait(500);
      await addButtons[1].click();
      await commands.wait(1000);
      
      await commands.visit('/cart');
      await commands.wait(2000);
      
      const quantityInputs = await commands.getAll('input[type="number"], [data-testid="item-quantity"]');
      if (quantityInputs.length > 0) {
        await quantityInputs[0].clear();
        await quantityInputs[0].sendKeys('10');
        await commands.wait(1000);
        
        const finalQuantity = await quantityInputs[0].getAttribute('value');
        expect(parseInt(finalQuantity)).to.be.lessThan(10, 
          'Cart should validate stock availability but allowed high quantity - race condition bug detected');
      }
    } else {
      this.skip('Insufficient products for concurrent stock test');
    }
  });
});