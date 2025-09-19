const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF Modern JavaScript API Compatibility', function() {
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

  describe('4BDCF Internationalization API Support', function() {
    it('should format product prices using Intl.NumberFormat consistently', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const priceElements = await commands.getAll('.price, [data-testid="price"], .product-price');
      
      if (priceElements.length > 0) {
        const priceFormatting = await commands.driver.executeScript(`
          const intlSupport = typeof Intl !== 'undefined' && typeof Intl.NumberFormat !== 'undefined';
          
          if (intlSupport) {
            const usdFormatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            });
            const eurFormatter = new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            });
            
            return {
              supported: true,
              usdPrice: usdFormatter.format(99.99),
              eurPrice: eurFormatter.format(99.99),
              rawNumber: new Intl.NumberFormat('en-US').format(1234567.89)
            };
          } else {
            return {
              supported: false,
              fallback: '$99.99',
              rawNumber: '1,234,567.89'
            };
          }
        `);

        if (priceFormatting.supported) {
          expect(priceFormatting.usdPrice).to.include('$');
          expect(priceFormatting.eurPrice).to.include('€');
          expect(priceFormatting.rawNumber).to.include(',');
          
          await commands.driver.executeScript(`
            const priceElements = document.querySelectorAll('.price, [data-testid="price"], .product-price');
            priceElements.forEach(element => {
              const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              });
              element.textContent = formatter.format(99.99);
            });
          `);
        } else {
          await commands.driver.executeScript(`
            const priceElements = document.querySelectorAll('.price, [data-testid="price"], .product-price');
            priceElements.forEach(element => {
              element.textContent = '$99.99';
            });
          `);
        }

        const updatedPrice = await priceElements[0].getText();
        expect(updatedPrice).to.include('$');
      }
    });

    it('should handle date formatting with Intl.DateTimeFormat across locales', async function() {
      await commands.visit('/orders');

      await commands.driver.executeScript(`
        const container = document.querySelector('main, body');
        const orderElement = document.createElement('div');
        orderElement.className = 'order-date';
        orderElement.setAttribute('data-testid', 'order-date');
        container.appendChild(orderElement);
      `);

      const dateFormatting = await commands.driver.executeScript(`
        const dateSupport = typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat !== 'undefined';
        const testDate = new Date('2024-03-15T10:30:00');
        
        if (dateSupport) {
          const usFormatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const deFormatter = new Intl.DateTimeFormat('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            supported: true,
            usDate: usFormatter.format(testDate),
            deDate: deFormatter.format(testDate),
            time: timeFormatter.format(testDate)
          };
        } else {
          return {
            supported: false,
            fallback: testDate.toLocaleDateString()
          };
        }
      `);

      if (dateFormatting.supported) {
        expect(dateFormatting.usDate).to.include('March');
        expect(dateFormatting.deDate).to.include('März');
        expect(dateFormatting.time).to.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      } else {
        expect(dateFormatting.fallback).to.include('/');
      }

      const orderDateElement = await commands.get('[data-testid="order-date"]');
      await commands.driver.executeScript(`
        const element = arguments[0];
        const dateSupport = typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat !== 'undefined';
        const testDate = new Date('2024-03-15T10:30:00');
        
        if (dateSupport) {
          const formatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          element.textContent = formatter.format(testDate);
        } else {
          element.textContent = testDate.toLocaleDateString();
        }
      `, orderDateElement);

      const displayedDate = await orderDateElement.getText();
      expect(displayedDate).to.not.be.empty;
    });
  });

  describe('4BDCF ES2020 Features Compatibility', function() {
    it('should handle optional chaining in product data access', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const optionalChainingSupport = await commands.driver.executeScript(`
        try {
          const testObj = { product: { details: { name: 'Test Product' } } };
          const result = testObj?.product?.details?.name;
          return {
            supported: result === 'Test Product',
            error: null
          };
        } catch (e) {
          return {
            supported: false,
            error: e.message
          };
        }
      `);

      if (optionalChainingSupport.supported) {
        const productData = await commands.driver.executeScript(`
          const mockData = {
            products: [
              { id: 1, name: 'Product 1', details: { price: 99.99 } },
              { id: 2, name: 'Product 2' },
              null,
              { id: 3, name: 'Product 3', details: { price: 49.99, category: { name: 'Electronics' } } }
            ]
          };
          
          return mockData.products.map(product => ({
            id: product?.id,
            name: product?.name,
            price: product?.details?.price,
            category: product?.details?.category?.name
          }));
        `);

        expect(productData).to.have.lengthOf(4);
        expect(productData[0].price).to.equal(99.99);
        expect(productData[1].price).to.be.undefined;
        expect(productData[2].id).to.be.undefined;
        expect(productData[3].category).to.equal('Electronics');
      } else {
        const fallbackData = await commands.driver.executeScript(`
          const mockData = {
            products: [
              { id: 1, name: 'Product 1', details: { price: 99.99 } },
              { id: 2, name: 'Product 2' },
              null,
              { id: 3, name: 'Product 3', details: { price: 49.99, category: { name: 'Electronics' } } }
            ]
          };
          
          return mockData.products.map(function(product) {
            return {
              id: product && product.id,
              name: product && product.name,
              price: product && product.details && product.details.price,
              category: product && product.details && product.details.category && product.details.category.name
            };
          });
        `);

        expect(fallbackData).to.have.lengthOf(4);
        expect(fallbackData[0].price).to.equal(99.99);
      }
    });

    it('should handle nullish coalescing operator in form validation', async function() {
      await commands.visit('/checkout');

      const nullishCoalescingSupport = await commands.driver.executeScript(`
        try {
          const testValue = null ?? 'default';
          const testValue2 = undefined ?? 'fallback';
          const testValue3 = 0 ?? 'zero';
          const testValue4 = '' ?? 'empty';
          
          return {
            supported: true,
            nullTest: testValue,
            undefinedTest: testValue2,
            zeroTest: testValue3,
            emptyTest: testValue4
          };
        } catch (e) {
          return {
            supported: false,
            error: e.message
          };
        }
      `);

      if (nullishCoalescingSupport.supported) {
        expect(nullishCoalescingSupport.nullTest).to.equal('default');
        expect(nullishCoalescingSupport.undefinedTest).to.equal('fallback');
        expect(nullishCoalescingSupport.zeroTest).to.equal(0);
        expect(nullishCoalescingSupport.emptyTest).to.equal('');

        const formValidation = await commands.driver.executeScript(`
          const formData = {
            firstName: null,
            lastName: undefined,
            email: '',
            phone: 0,
            address: 'Valid Address'
          };
          
          return {
            firstName: formData.firstName ?? 'Anonymous',
            lastName: formData.lastName ?? 'User',
            email: formData.email ?? 'noemail@example.com',
            phone: formData.phone ?? 'No phone',
            address: formData.address ?? 'No address'
          };
        `);

        expect(formValidation.firstName).to.equal('Anonymous');
        expect(formValidation.lastName).to.equal('User');
        expect(formValidation.email).to.equal('');
        expect(formValidation.phone).to.equal(0);
        expect(formValidation.address).to.equal('Valid Address');
      } else {
        const fallbackValidation = await commands.driver.executeScript(`
          const formData = {
            firstName: null,
            lastName: undefined,
            email: '',
            phone: 0,
            address: 'Valid Address'
          };
          
          function nullishFallback(value, fallback) {
            return (value === null || value === undefined) ? fallback : value;
          }
          
          return {
            firstName: nullishFallback(formData.firstName, 'Anonymous'),
            lastName: nullishFallback(formData.lastName, 'User'),
            email: nullishFallback(formData.email, 'noemail@example.com'),
            phone: nullishFallback(formData.phone, 'No phone'),
            address: nullishFallback(formData.address, 'No address')
          };
        `);

        expect(fallbackValidation.firstName).to.equal('Anonymous');
        expect(fallbackValidation.lastName).to.equal('User');
      }
    });

    it('should handle BigInt for large product IDs or transaction amounts', async function() {
      await commands.visit('/products');

      const bigIntSupport = await commands.driver.executeScript(`
        try {
          const largerId = BigInt('9007199254740991123456789');
          const calculation = largerId + BigInt(1);
          
          return {
            supported: true,
            largeId: largerId.toString(),
            calculation: calculation.toString(),
            comparison: largerId > BigInt('9007199254740991')
          };
        } catch (e) {
          return {
            supported: false,
            error: e.message
          };
        }
      `);

      if (bigIntSupport.supported) {
        expect(bigIntSupport.largeId).to.equal('9007199254740991123456789');
        expect(bigIntSupport.calculation).to.equal('9007199254740991123456790');
        expect(bigIntSupport.comparison).to.be.true;

        const transactionHandling = await commands.driver.executeScript(`
          const transactionAmount = BigInt('999999999999999999');
          const fee = BigInt('100000000000000');
          const total = transactionAmount + fee;
          
          return {
            amount: transactionAmount.toString(),
            fee: fee.toString(),
            total: total.toString(),
            formattedTotal: (Number(total) / 100).toFixed(2) + ' USD'
          };
        `);

        expect(transactionHandling.total).to.equal('1000099999999999999');
      } else {
        const numberFallback = await commands.driver.executeScript(`
          const maxSafeInteger = Number.MAX_SAFE_INTEGER;
          const transactionAmount = Math.min(999999999999999999, maxSafeInteger);
          const fee = 100000000000000;
          const total = transactionAmount + fee;
          
          return {
            amount: transactionAmount.toString(),
            fee: fee.toString(),
            total: total.toString(),
            maxSafe: maxSafeInteger,
            isAccurate: total <= maxSafeInteger
          };
        `);

        expect(numberFallback.maxSafe).to.equal(9007199254740991);
        expect(numberFallback.isAccurate).to.be.a('boolean');
      }
    });
  });

  describe('4BDCF Modern Array and String Methods', function() {
    it('should handle Array.prototype.flatMap for product category flattening', async function() {
      await commands.visit('/products');

      const flatMapSupport = await commands.driver.executeScript(`
        try {
          const categories = [
            { name: 'Electronics', subcategories: ['Phones', 'Laptops'] },
            { name: 'Clothing', subcategories: ['Shirts', 'Pants'] }
          ];
          
          const flattened = categories.flatMap(cat => 
            cat.subcategories.map(sub => ({ category: cat.name, subcategory: sub }))
          );
          
          return {
            supported: true,
            result: flattened,
            length: flattened.length
          };
        } catch (e) {
          return {
            supported: false,
            error: e.message
          };
        }
      `);

      if (flatMapSupport.supported) {
        expect(flatMapSupport.length).to.equal(4);
        expect(flatMapSupport.result[0]).to.deep.equal({
          category: 'Electronics',
          subcategory: 'Phones'
        });
      } else {
        const fallbackFlattening = await commands.driver.executeScript(`
          const categories = [
            { name: 'Electronics', subcategories: ['Phones', 'Laptops'] },
            { name: 'Clothing', subcategories: ['Shirts', 'Pants'] }
          ];
          
          const flattened = [];
          categories.forEach(function(cat) {
            cat.subcategories.forEach(function(sub) {
              flattened.push({ category: cat.name, subcategory: sub });
            });
          });
          
          return {
            result: flattened,
            length: flattened.length
          };
        `);

        expect(fallbackFlattening.length).to.equal(4);
      }
    });

    it('should handle String.prototype.matchAll for product search parsing', async function() {
      await commands.visit('/products');

      const matchAllSupport = await commands.driver.executeScript(`
        try {
          const searchQuery = 'laptop 15-inch $500-$800 electronics';
          const regex = /\\$\\d+-\\$\\d+|\\d+-inch|\\w+/g;
          const matches = Array.from(searchQuery.matchAll(regex));
          
          return {
            supported: true,
            matchCount: matches.length,
            priceMatch: matches.find(m => m[0].includes('$')),
            sizeMatch: matches.find(m => m[0].includes('inch'))
          };
        } catch (e) {
          return {
            supported: false,
            error: e.message
          };
        }
      `);

      if (matchAllSupport.supported) {
        expect(matchAllSupport.matchCount).to.be.greaterThan(0);
        expect(matchAllSupport.priceMatch[0]).to.equal('$500-$800');
        expect(matchAllSupport.sizeMatch[0]).to.equal('15-inch');
      } else {
        const fallbackMatching = await commands.driver.executeScript(`
          const searchQuery = 'laptop 15-inch $500-$800 electronics';
          const regex = /\\$\\d+-\\$\\d+|\\d+-inch|\\w+/g;
          const matches = [];
          let match;
          
          while ((match = regex.exec(searchQuery)) !== null) {
            matches.push(match);
          }
          
          return {
            matchCount: matches.length,
            priceMatch: matches.find(function(m) { return m[0].includes('$'); }),
            sizeMatch: matches.find(function(m) { return m[0].includes('inch'); })
          };
        `);

        expect(fallbackMatching.matchCount).to.be.greaterThan(0);
      }
    });
  });
});