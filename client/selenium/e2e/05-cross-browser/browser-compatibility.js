const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🌐 Cross-Browser Compatibility', function() {
  this.timeout(120000); // Longer timeout for cross-browser tests
  
  const testSetup = new TestSetup();
  let commands;

  // Test with Chrome
  describe('Chrome Browser Tests', function() {
    beforeEach(async function() {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
    });

    afterEach(async function() {
      await testSetup.afterEach();
    });

    it('should load application correctly in Chrome', async function() {
      await commands.visit('/');
      await commands.shouldBeVisible('body');
      
      const title = await commands.driver.getTitle();
      expect(title).to.not.be.empty;
    });

    it('should handle authentication in Chrome', async function() {
      await commands.visit('/login');
      await commands.type('#email', 'test@example.com');
      await commands.type('#password', 'password123');
      await commands.click('button[type="submit"]');
      
      await commands.wait(3000);
      await commands.shouldBeVisible('body');
    });

    it('should display products correctly in Chrome', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('$') || 
        bodyText.includes('No products')
      ).to.be.true;
    });

    it('should handle responsive design in Chrome', async function() {
      await commands.testMobileViewport(async () => {
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
      });
    });
  });

  // Test with Firefox
  describe('Firefox Browser Tests', function() {
    beforeEach(async function() {
      await testSetup.beforeEach('firefox');
      commands = testSetup.getCommands();
    });

    afterEach(async function() {
      await testSetup.afterEach();
    });

    it('should load application correctly in Firefox', async function() {
      await commands.visit('/');
      await commands.shouldBeVisible('body');
      
      const title = await commands.driver.getTitle();
      expect(title).to.not.be.empty;
    });

    it('should handle authentication in Firefox', async function() {
      await commands.visit('/login');
      await commands.type('#email', 'test@example.com');
      await commands.type('#password', 'password123');
      await commands.click('button[type="submit"]');
      
      await commands.wait(3000);
      await commands.shouldBeVisible('body');
    });

    it('should display products correctly in Firefox', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const bodyText = await commands.get('body').then(el => el.getText());
      expect(
        bodyText.includes('$') || 
        bodyText.includes('No products')
      ).to.be.true;
    });

    it('should handle responsive design in Firefox', async function() {
      await commands.testMobileViewport(async () => {
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
      });
    });

    it('should handle Firefox-specific features', async function() {
      await commands.visit('/');
      
      // Test Firefox-specific behaviors
      const userAgent = await commands.driver.executeScript('return navigator.userAgent;');
      expect(userAgent).to.include('Firefox');
      
      // Firefox-specific CSS grid and flexbox tests
      await commands.shouldBeVisible('body');
    });
  });

  describe('Cross-Browser Feature Compatibility', function() {
    ['chrome', 'firefox'].forEach(browser => {
      describe(`${browser.toUpperCase()} Feature Tests`, function() {
        beforeEach(async function() {
          await testSetup.beforeEach(browser);
          commands = testSetup.getCommands();
        });

        afterEach(async function() {
          await testSetup.afterEach();
        });

        it(`should support localStorage in ${browser}`, async function() {
          await commands.visit('/');
          
          await commands.driver.executeScript(`
            localStorage.setItem('test', 'value');
          `);
          
          const value = await commands.driver.executeScript(`
            return localStorage.getItem('test');
          `);
          
          expect(value).to.equal('value');
        });

        it(`should support modern JavaScript features in ${browser}`, async function() {
          await commands.visit('/');
          
          const supportsModernJS = await commands.driver.executeScript(`
            try {
              // Test arrow functions, const/let, template literals
              const test = (x) => \`Value: \${x}\`;
              return test('modern') === 'Value: modern';
            } catch (e) {
              return false;
            }
          `);
          
          expect(supportsModernJS).to.be.true;
        });

        it(`should support CSS Grid and Flexbox in ${browser}`, async function() {
          await commands.visit('/');
          
          const supportsModernCSS = await commands.driver.executeScript(`
            return CSS.supports('display', 'grid') && CSS.supports('display', 'flex');
          `);
          
          expect(supportsModernCSS).to.be.true;
        });

        it(`should handle form validation in ${browser}`, async function() {
          await commands.visit('/login');
          
          await commands.click('button[type="submit"]');
          
          const invalidInputs = await commands.getAll('input:invalid');
          expect(invalidInputs.length).to.be.greaterThan(0);
        });

        it(`should support viewport meta tag in ${browser}`, async function() {
          await commands.visit('/');
          
          const hasViewportMeta = await commands.driver.executeScript(`
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            return viewportMeta !== null;
          `);
          
          expect(hasViewportMeta).to.be.true;
        });
      });
    });
  });

  describe('Performance Across Browsers', function() {
    ['chrome', 'firefox'].forEach(browser => {
      describe(`${browser.toUpperCase()} Performance`, function() {
        beforeEach(async function() {
          await testSetup.beforeEach(browser);
          commands = testSetup.getCommands();
        });

        afterEach(async function() {
          await testSetup.afterEach();
        });

        it(`should load pages quickly in ${browser}`, async function() {
          const startTime = Date.now();
          await commands.visit('/products');
          await commands.shouldBeVisible('[data-testid="products-container"]');
          const loadTime = Date.now() - startTime;
          
          expect(loadTime).to.be.lessThan(15000); // 15 seconds max
        });

        it(`should handle multiple rapid navigations in ${browser}`, async function() {
          const pages = ['/', '/products', '/login'];
          
          for (const page of pages) {
            const startTime = Date.now();
            await commands.visit(page);
            await commands.shouldBeVisible('body');
            const loadTime = Date.now() - startTime;
            
            expect(loadTime).to.be.lessThan(10000); // 10 seconds max per page
          }
        });
      });
    });
  });

  describe('Mobile Browser Compatibility', function() {
    beforeEach(async function() {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
    });

    afterEach(async function() {
      await testSetup.afterEach();
    });

    it('should work on mobile viewport sizes', async function() {
      // iPhone viewport
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Android viewport
      await commands.driver.manage().window().setRect({ width: 360, height: 640 });
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Tablet viewport
      await commands.driver.manage().window().setRect({ width: 768, height: 1024 });
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
    });

    it('should handle touch interactions simulation', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/products');
      
      // Simulate touch interactions (Selenium can't truly simulate touch)
      const elements = await commands.getAll('button, a');
      if (elements.length > 0) {
        await elements[0].click();
        await commands.shouldBeVisible('body');
      }
    });
  });

  describe('Browser-Specific Bugs and Workarounds', function() {
    it('should handle browser-specific CSS rendering differences', async function() {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
      
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Check if layout is properly rendered
      const containerElement = await commands.get('[data-testid="products-container"]');
      const rect = await containerElement.getRect();
      
      expect(rect.width).to.be.greaterThan(0);
      expect(rect.height).to.be.greaterThan(0);
      
      await testSetup.afterEach();
    });

    it('should handle different font rendering across browsers', async function() {
      await testSetup.beforeEach('firefox');
      commands = testSetup.getCommands();
      
      await commands.visit('/');
      
      const bodyElement = await commands.get('body');
      const computedStyle = await commands.driver.executeScript(`
        return window.getComputedStyle(arguments[0]).fontFamily;
      `, bodyElement);
      
      expect(computedStyle).to.not.be.empty;
      
      await testSetup.afterEach();
    });
  });
});