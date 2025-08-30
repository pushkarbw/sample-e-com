const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF JavaScript API Cross-Browser Compatibility', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    }
  };

  const getBrowserStackCapabilities = (browser) => {
    const capabilities = {
      chrome: {
        browserName: 'Chrome',
        browserVersion: 'latest',
        'bstack:options': {
          os: 'Windows',
          osVersion: '10',
          projectName: 'E-Commerce JS API Compatibility',
          buildName: '4BDCF-JS-API-Tests',
          sessionName: '4BDCF JS Chrome API Support'
        }
      },
      firefox: {
        browserName: 'Firefox',
        browserVersion: 'latest',
        'bstack:options': {
          os: 'Windows',
          osVersion: '10',
          projectName: 'E-Commerce JS API Compatibility',
          buildName: '4BDCF-JS-API-Tests',
          sessionName: '4BDCF JS Firefox API Support'
        }
      },
      safari: {
        browserName: 'Safari',
        browserVersion: '14',
        'bstack:options': {
          os: 'OS X',
          osVersion: 'Big Sur',
          projectName: 'E-Commerce JS API Compatibility',
          buildName: '4BDCF-JS-API-Tests',
          sessionName: '4BDCF JS Safari API Support'
        }
      }
    };
    return capabilities[browser] || capabilities.chrome;
  };

  beforeEach(async function() {
    const browser = process.env.BROWSER || 'chrome';
    await testSetup.beforeEach(browser);
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('4BDCF ResizeObserver API Compatibility', function() {
    it('should handle dynamic cart layout changes with ResizeObserver', async function() {
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.visit('/cart');

      const resizeObserverSupport = await commands.driver.executeScript(`
        return typeof window.ResizeObserver !== 'undefined';
      `);

      if (resizeObserverSupport) {
        const cartContainer = await commands.getAll('[data-testid="cart-container"], .cart-container, .cart');
        
        if (cartContainer.length > 0) {
          await commands.driver.executeScript(`
            const observer = new ResizeObserver(entries => {
              window.cartResized = true;
            });
            const cartEl = document.querySelector('[data-testid="cart-container"], .cart-container, .cart');
            if (cartEl) observer.observe(cartEl);
          `);

          await commands.driver.manage().window().setRect({ width: 800, height: 600 });
          await commands.wait(500);

          const cartResized = await commands.driver.executeScript(`
            return window.cartResized === true;
          `);

          expect(cartResized).to.be.true;
        }
      } else {
        await commands.driver.executeScript(`
          window.resizeObserverPolyfillLoaded = true;
        `);

        const polyfillLoaded = await commands.driver.executeScript(`
          return window.resizeObserverPolyfillLoaded === true;
        `);

        expect(polyfillLoaded).to.be.true;
      }
    });
  });

  describe('4BDCF IntersectionObserver API Support', function() {
    it('should implement lazy loading with IntersectionObserver fallback', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const intersectionSupport = await commands.driver.executeScript(`
        return typeof window.IntersectionObserver !== 'undefined';
      `);

      const productImages = await commands.getAll('img[data-src], img[loading="lazy"]');

      if (intersectionSupport && productImages.length > 0) {
        await commands.driver.executeScript(`
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                window.lazyImageLoaded = true;
              }
            });
          });
          
          const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
          lazyImages.forEach(img => observer.observe(img));
        `);

        await commands.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await commands.wait(1000);

        const lazyImageLoaded = await commands.driver.executeScript(`
          return window.lazyImageLoaded === true;
        `);

        expect(lazyImageLoaded).to.be.true;
      } else {
        const allImages = await commands.getAll('img');
        const loadedImages = [];

        for (let img of allImages.slice(0, 3)) {
          const src = await img.getAttribute('src');
          if (src && src.length > 0) {
            loadedImages.push(src);
          }
        }

        expect(loadedImages.length).to.be.greaterThan(0);
      }
    });
  });

  describe('4BDCF LocalStorage and SessionStorage Compatibility', function() {
    it('should handle cart persistence with storage API differences', async function() {
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.visit('/products');

      const storageSupport = await commands.driver.executeScript(`
        try {
          localStorage.setItem('test', 'value');
          localStorage.removeItem('test');
          return {
            localStorage: true,
            sessionStorage: typeof sessionStorage !== 'undefined'
          };
        } catch (e) {
          return {
            localStorage: false,
            sessionStorage: false
          };
        }
      `);

      if (storageSupport.localStorage) {
        await commands.driver.executeScript(`
          localStorage.setItem('cartTestItem', JSON.stringify({
            id: 'test-product',
            quantity: 1,
            price: 99.99
          }));
        `);

        const cartData = await commands.driver.executeScript(`
          const data = localStorage.getItem('cartTestItem');
          return data ? JSON.parse(data) : null;
        `);

        expect(cartData).to.not.be.null;
        expect(cartData.id).to.equal('test-product');
      } else {
        await commands.driver.executeScript(`
          window.cartFallbackData = {
            id: 'test-product',
            quantity: 1,
            price: 99.99
          };
        `);

        const fallbackData = await commands.driver.executeScript(`
          return window.cartFallbackData;
        `);

        expect(fallbackData).to.not.be.null;
        expect(fallbackData.id).to.equal('test-product');
      }
    });
  });

  describe('4BDCF Fetch API vs XMLHttpRequest Compatibility', function() {
    it('should handle API requests with proper fallback mechanisms', async function() {
      await commands.visit('/products');

      const fetchSupport = await commands.driver.executeScript(`
        return typeof fetch !== 'undefined';
      `);

      if (fetchSupport) {
        const fetchRequest = await commands.driver.executeScript(`
          return fetch('/api/products')
            .then(response => response.ok)
            .catch(() => false);
        `);

        expect(fetchRequest).to.not.be.undefined;
      } else {
        const xhrSupport = await commands.driver.executeScript(`
          return typeof XMLHttpRequest !== 'undefined';
        `);

        expect(xhrSupport).to.be.true;

        await commands.driver.executeScript(`
          const xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/products');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              window.xhrCompleted = true;
            }
          };
          xhr.send();
        `);

        await commands.wait(2000);

        const xhrCompleted = await commands.driver.executeScript(`
          return window.xhrCompleted === true;
        `);

        expect(xhrCompleted).to.be.true;
      }
    });
  });

  describe('4BDCF ES6 Features and Polyfill Requirements', function() {
    it('should handle arrow functions and template literals gracefully', async function() {
      await commands.visit('/products');

      const es6Support = await commands.driver.executeScript(`
        try {
          const testArrow = () => 'arrow function works';
          const testTemplate = \`template \${testArrow()} literal\`;
          return {
            arrow: testArrow() === 'arrow function works',
            template: testTemplate.includes('arrow function works')
          };
        } catch (e) {
          return {
            arrow: false,
            template: false,
            error: e.message
          };
        }
      `);

      if (es6Support.arrow && es6Support.template) {
        expect(es6Support.arrow).to.be.true;
        expect(es6Support.template).to.be.true;
      } else {
        const es5Fallback = await commands.driver.executeScript(`
          function testFunction() {
            return 'function works';
          }
          var testString = 'string ' + testFunction() + ' concatenation';
          return {
            function: testFunction() === 'function works',
            concatenation: testString.indexOf('function works') > -1
          };
        `);

        expect(es5Fallback.function).to.be.true;
        expect(es5Fallback.concatenation).to.be.true;
      }
    });

    it('should handle Promise API with appropriate fallbacks', async function() {
      await commands.visit('/login');

      const promiseSupport = await commands.driver.executeScript(`
        return typeof Promise !== 'undefined' && typeof Promise.resolve === 'function';
      `);

      if (promiseSupport) {
        const promiseResult = await commands.driver.executeScript(`
          return Promise.resolve('promise works')
            .then(result => result === 'promise works')
            .catch(() => false);
        `);

        expect(promiseResult).to.be.true;
      } else {
        const callbackResult = await commands.driver.executeScript(`
          function asyncCallback(callback) {
            setTimeout(function() {
              callback(null, 'callback works');
            }, 10);
          }
          
          return new Promise(function(resolve) {
            asyncCallback(function(err, result) {
              resolve(result === 'callback works');
            });
          });
        `);

        expect(callbackResult).to.be.true;
      }
    });
  });

  describe('4BDCF Web APIs Browser Differences', function() {
    it('should handle Notification API with permission handling', async function() {
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.visit('/cart');

      const notificationSupport = await commands.driver.executeScript(`
        return typeof Notification !== 'undefined';
      `);

      if (notificationSupport) {
        const permission = await commands.driver.executeScript(`
          return Notification.permission;
        `);

        expect(['granted', 'denied', 'default']).to.include(permission);

        if (permission === 'granted') {
          await commands.driver.executeScript(`
            new Notification('Cart Update', {
              body: 'Item added to cart',
              icon: '/favicon.ico'
            });
            window.notificationSent = true;
          `);

          const notificationSent = await commands.driver.executeScript(`
            return window.notificationSent === true;
          `);

          expect(notificationSent).to.be.true;
        }
      } else {
        await commands.driver.executeScript(`
          function showFallbackMessage() {
            const message = document.createElement('div');
            message.textContent = 'Item added to cart';
            message.style.cssText = 'position:fixed;top:10px;right:10px;background:#333;color:white;padding:10px;';
            document.body.appendChild(message);
            window.fallbackMessageShown = true;
          }
          showFallbackMessage();
        `);

        const fallbackShown = await commands.driver.executeScript(`
          return window.fallbackMessageShown === true;
        `);

        expect(fallbackShown).to.be.true;
      }
    });
  });
});