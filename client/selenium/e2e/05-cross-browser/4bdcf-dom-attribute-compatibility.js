const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF DOM Attribute Cross-Browser Compatibility', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'Ecomm@123' }
    }
  };

  beforeEach(async function() {
    const browser = process.env.BROWSER || 'chrome';
    await testSetup.beforeEach(browser);
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('4BDCF Data Attribute Case Sensitivity', function() {
    it('should handle product data attributes consistently across browsers', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length > 0) {
        const firstCard = productCards[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.setAttribute('data-ProductId', '12345');
          element.setAttribute('data-categoryname', 'electronics');
          element.setAttribute('data-PRICE', '99.99');
        `, firstCard);

        await commands.wait(200);

        const attributeValues = await commands.driver.executeScript(`
          const element = arguments[0];
          return {
            productId: element.getAttribute('data-ProductId'),
            categoryName: element.getAttribute('data-categoryname'),
            price: element.getAttribute('data-PRICE'),
            productIdLower: element.getAttribute('data-productid'),
            categoryNameUpper: element.getAttribute('data-CATEGORYNAME'),
            priceLower: element.getAttribute('data-price')
          };
        `, firstCard);

        expect(attributeValues.productId).to.equal('12345');
        expect(attributeValues.categoryName).to.equal('electronics');
        expect(attributeValues.price).to.equal('99.99');

        const datasetValues = await commands.driver.executeScript(`
          const element = arguments[0];
          return {
            productId: element.dataset.ProductId,
            categoryname: element.dataset.categoryname,
            price: element.dataset.PRICE
          };
        `, firstCard);

        expect(datasetValues.categoryname).to.equal('electronics');
      }
    });

    it('should handle form input name attributes with case variations', async function() {
      await commands.visit('/checkout');

      const nameInput = await commands.getAll('input[name="firstName"], input[name="firstname"], input[name="FIRSTNAME"]');
      
      if (nameInput.length === 0) {
        await commands.driver.executeScript(`
          const form = document.querySelector('form') || document.body;
          const input = document.createElement('input');
          input.setAttribute('name', 'FirstName');
          input.setAttribute('type', 'text');
          input.setAttribute('id', 'test-firstName');
          form.appendChild(input);
        `);

        const testInput = await commands.get('#test-firstName');
        await testInput.sendKeys('John');

        const formData = await commands.driver.executeScript(`
          const form = document.querySelector('form') || document.body;
          const formData = new FormData(form);
          return {
            firstName: formData.get('FirstName'),
            firstNameLower: formData.get('firstname'),
            firstNameUpper: formData.get('FIRSTNAME')
          };
        `);

        expect(formData.firstName).to.equal('John');
      } else {
        await nameInput[0].sendKeys('TestUser');
        
        const inputName = await nameInput[0].getAttribute('name');
        expect(inputName).to.be.oneOf(['firstName', 'firstname', 'FIRSTNAME', 'FirstName']);
      }
    });
  });

  describe('4BDCF CSS Class Name Handling', function() {
    it('should handle CSS class matching with case sensitivity', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productContainer = await commands.getAll('[data-testid="products-container"], .products-container');
      
      if (productContainer.length > 0) {
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.className = 'Product-Grid FEATURED-items active-STATE';
        `, productContainer[0]);

        await commands.wait(200);

        const hasClasses = await commands.driver.executeScript(`
          const element = arguments[0];
          return {
            productGrid: element.classList.contains('Product-Grid'),
            productGridLower: element.classList.contains('product-grid'),
            featured: element.classList.contains('FEATURED-items'),
            featuredLower: element.classList.contains('featured-items'),
            activeState: element.classList.contains('active-STATE'),
            activeStateLower: element.classList.contains('active-state')
          };
        `, productContainer[0]);

        expect(hasClasses.productGrid).to.be.true;
        expect(hasClasses.featured).to.be.true;
        expect(hasClasses.activeState).to.be.true;

        const cssMatching = await commands.driver.executeScript(`
          const style = document.createElement('style');
          style.textContent = \`
            .Product-Grid { background: red; }
            .product-grid { background: blue; }
            .FEATURED-items { color: green; }
            .featured-items { color: yellow; }
          \`;
          document.head.appendChild(style);
          
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          };
        `, productContainer[0]);

        expect(cssMatching.backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
      }
    });

    it('should handle querySelector with case-sensitive selectors', async function() {
      await commands.visit('/cart');

      const cartItems = await commands.getAll('.cart-item, [data-testid="cart-item"]');
      
      if (cartItems.length === 0) {
        await commands.driver.executeScript(`
          const container = document.querySelector('main, body');
          const item = document.createElement('div');
          item.className = 'Cart-Item PRODUCT-row Selected-ITEM';
          item.setAttribute('data-ItemId', 'test123');
          item.innerHTML = '<span>Test Product</span>';
          container.appendChild(item);
        `);
      }

      const selectorTests = await commands.driver.executeScript(`
        return {
          cartItem: document.querySelector('.Cart-Item') !== null,
          cartItemLower: document.querySelector('.cart-item') !== null,
          productRow: document.querySelector('.PRODUCT-row') !== null,
          productRowLower: document.querySelector('.product-row') !== null,
          selectedItem: document.querySelector('.Selected-ITEM') !== null,
          selectedItemLower: document.querySelector('.selected-item') !== null
        };
      `);

      expect(selectorTests.cartItem).to.be.true;
      
      const attributeSelector = await commands.driver.executeScript(`
        return {
          itemId: document.querySelector('[data-ItemId="test123"]') !== null,
          itemIdLower: document.querySelector('[data-itemid="test123"]') !== null,
          itemIdUpper: document.querySelector('[data-ITEMID="test123"]') !== null
        };
      `);

      expect(attributeSelector.itemId).to.be.true;
    });
  });

  describe('4BDCF Event Handling Case Sensitivity', function() {
    it('should handle event listener registration with case variations', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const addToCartButtons = await commands.getAll('button:contains("Add"), [data-testid="add-to-cart"], .add-to-cart');
      
      if (addToCartButtons.length > 0) {
        const button = addToCartButtons[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          let clickCount = 0;
          
          element.addEventListener('click', () => { window.normalClick = true; });
          element.addEventListener('Click', () => { window.capitalClick = true; });
          element.addEventListener('CLICK', () => { window.upperClick = true; });
          
          element.addEventListener('mousedown', () => { window.mouseDown = true; });
          element.addEventListener('MouseDown', () => { window.mouseDownCapital = true; });
          element.addEventListener('MOUSEDOWN', () => { window.mouseDownUpper = true; });
        `, button);

        await button.click();
        await commands.wait(300);

        const eventResults = await commands.driver.executeScript(`
          return {
            normalClick: window.normalClick === true,
            capitalClick: window.capitalClick === true,
            upperClick: window.upperClick === true,
            mouseDown: window.mouseDown === true,
            mouseDownCapital: window.mouseDownCapital === true,
            mouseDownUpper: window.mouseDownUpper === true
          };
        `);

        expect(eventResults.normalClick).to.be.true;
      }
    });

    it('should handle DOM property access with case sensitivity', async function() {
      await commands.visit('/login');

      const emailInput = await commands.getAll('input[type="email"], #email, input[name="email"]');
      
      if (emailInput.length > 0) {
        const input = emailInput[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.Value = 'test@example.com';
          element.setAttribute('customProp', 'testValue');
          element.setAttribute('CUSTOMPROP', 'upperValue');
        `, input);

        await input.clear();
        await input.sendKeys('user@test.com');

        const propertyValues = await commands.driver.executeScript(`
          const element = arguments[0];
          return {
            value: element.value,
            Value: element.Value,
            customProp: element.getAttribute('customProp'),
            customPropUpper: element.getAttribute('CUSTOMPROP'),
            customPropLower: element.getAttribute('customprop'),
            type: element.type,
            Type: element.Type,
            TYPE: element.TYPE
          };
        `, input);

        expect(propertyValues.value).to.equal('user@test.com');
        expect(propertyValues.customProp).to.equal('testValue');
        expect(propertyValues.type).to.equal('email');
      }
    });
  });

  describe('4BDCF HTML Tag and Attribute Normalization', function() {
    it('should handle HTML tag case sensitivity in dynamic content', async function() {
      await commands.visit('/products');

      await commands.driver.executeScript(`
        const container = document.querySelector('main, body');
        const upperDiv = document.createElement('DIV');
        upperDiv.innerHTML = '<SPAN>Upper Case Content</SPAN>';
        upperDiv.className = 'test-CONTAINER';
        
        const lowerDiv = document.createElement('div');
        lowerDiv.innerHTML = '<span>Lower Case Content</span>';
        lowerDiv.className = 'test-container';
        
        container.appendChild(upperDiv);
        container.appendChild(lowerDiv);
      `);

      await commands.wait(200);

      const tagResults = await commands.driver.executeScript(`
        return {
          upperDivs: document.querySelectorAll('DIV.test-CONTAINER').length,
          lowerDivs: document.querySelectorAll('div.test-container').length,
          allDivs: document.querySelectorAll('div').length,
          upperSpans: document.querySelectorAll('SPAN').length,
          lowerSpans: document.querySelectorAll('span').length,
          mixedQuery: document.querySelectorAll('DIV span, div SPAN').length
        };
      `);

      expect(tagResults.allDivs).to.be.greaterThan(1);
      expect(tagResults.upperDivs + tagResults.lowerDivs).to.be.greaterThan(0);
    });

    it('should handle attribute value matching with case sensitivity', async function() {
      await commands.visit('/checkout');

      await commands.driver.executeScript(`
        const form = document.querySelector('form') || document.body;
        
        const input1 = document.createElement('input');
        input1.setAttribute('data-validation', 'Required');
        input1.setAttribute('id', 'test-input-1');
        
        const input2 = document.createElement('input');
        input2.setAttribute('data-validation', 'required');
        input2.setAttribute('id', 'test-input-2');
        
        const input3 = document.createElement('input');
        input3.setAttribute('data-validation', 'REQUIRED');
        input3.setAttribute('id', 'test-input-3');
        
        form.appendChild(input1);
        form.appendChild(input2);
        form.appendChild(input3);
      `);

      await commands.wait(200);

      const attributeMatching = await commands.driver.executeScript(`
        return {
          exactRequired: document.querySelectorAll('[data-validation="Required"]').length,
          exactrequired: document.querySelectorAll('[data-validation="required"]').length,
          exactREQUIRED: document.querySelectorAll('[data-validation="REQUIRED"]').length,
          caseInsensitiveSupport: document.querySelectorAll('[data-validation="required" i]').length > 0
        };
      `);

      expect(attributeMatching.exactRequired).to.equal(1);
      expect(attributeMatching.exactrequired).to.equal(1);
      expect(attributeMatching.exactREQUIRED).to.equal(1);
    });
  });
});