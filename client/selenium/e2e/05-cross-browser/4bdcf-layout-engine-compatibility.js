const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF Layout Engine Cross-Browser Compatibility', function() {
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

  describe('4BDCF Grid Layout Engine Differences', function() {
    it('should handle product grid gap calculations consistently', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 3) {
        const gridContainer = await commands.get('[data-testid="products-container"], .products-grid, .product-grid');
        
        await commands.driver.executeScript(`
          const container = arguments[0];
          container.style.display = 'grid';
          container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
          container.style.gap = '20px';
        `, gridContainer);

        await commands.wait(500);

        const cardPositions = [];
        for (let i = 0; i < Math.min(3, productCards.length); i++) {
          const rect = await productCards[i].getRect();
          cardPositions.push(rect);
        }

        if (cardPositions.length >= 2) {
          const actualGap = cardPositions[1].x - (cardPositions[0].x + cardPositions[0].width);
          expect(actualGap).to.be.within(15, 25);
        }

        const gridSupport = await commands.driver.executeScript(`
          return CSS.supports('display', 'grid');
        `);
        expect(gridSupport).to.be.true;
      }
    });

    it('should maintain consistent flexbox wrap behavior across viewports', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productContainer = await commands.getAll('[data-testid="products-container"], .products-container, .product-list');
      
      if (productContainer.length > 0) {
        await commands.driver.executeScript(`
          const container = arguments[0];
          container.style.display = 'flex';
          container.style.flexWrap = 'wrap';
          container.style.justifyContent = 'space-between';
        `, productContainer[0]);

        await commands.driver.manage().window().setRect({ width: 1200, height: 800 });
        await commands.wait(300);

        const wideViewProducts = await commands.getAll('[data-testid="product-card"], .product-card, .product');
        const wideViewCount = wideViewProducts.length;

        await commands.driver.manage().window().setRect({ width: 800, height: 600 });
        await commands.wait(300);

        const narrowViewProducts = await commands.getAll('[data-testid="product-card"], .product-card, .product');
        const narrowViewCount = narrowViewProducts.length;

        expect(wideViewCount).to.equal(narrowViewCount);

        if (narrowViewProducts.length >= 2) {
          const firstRect = await narrowViewProducts[0].getRect();
          const secondRect = await narrowViewProducts[1].getRect();
          
          const flexWrapSupport = await commands.driver.executeScript(`
            return CSS.supports('flex-wrap', 'wrap');
          `);
          expect(flexWrapSupport).to.be.true;
        }
      }
    });
  });

  describe('4BDCF Typography and Font Rendering', function() {
    it('should render custom font fallbacks with consistent metrics', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productTitles = await commands.getAll('h1, h2, h3, .product-title, [data-testid="product-name"]');
      
      if (productTitles.length > 0) {
        const firstTitle = productTitles[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.fontFamily = '"CustomFont", "Arial", sans-serif';
          element.style.fontSize = '18px';
          element.style.lineHeight = '1.4';
        `, firstTitle);

        await commands.wait(200);

        const computedStyles = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            fontWeight: computed.fontWeight
          };
        `, firstTitle);

        expect(computedStyles.fontSize).to.include('18px');
        
        const titleRect = await firstTitle.getRect();
        expect(titleRect.height).to.be.within(20, 30);

        const fontDisplay = await commands.driver.executeScript(`
          return CSS.supports('font-display', 'swap');
        `);
        
        if (!fontDisplay) {
          expect(computedStyles.fontFamily).to.include('Arial');
        }
      }
    });

    it('should handle text overflow and ellipsis consistently', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productDescriptions = await commands.getAll('.product-description, [data-testid="product-description"], p');
      
      if (productDescriptions.length > 0) {
        const description = productDescriptions[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.width = '200px';
          element.style.whiteSpace = 'nowrap';
          element.style.overflow = 'hidden';
          element.style.textOverflow = 'ellipsis';
          element.textContent = 'This is a very long product description that should be truncated with ellipsis';
        `, description);

        await commands.wait(200);

        const computedOverflow = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            overflow: computed.overflow,
            textOverflow: computed.textOverflow,
            whiteSpace: computed.whiteSpace,
            width: computed.width
          };
        `, description);

        expect(computedOverflow.overflow).to.equal('hidden');
        expect(computedOverflow.textOverflow).to.equal('ellipsis');

        const textWidth = await commands.driver.executeScript(`
          const element = arguments[0];
          return element.scrollWidth;
        `, description);

        const elementWidth = await commands.driver.executeScript(`
          const element = arguments[0];
          return element.clientWidth;
        `, description);

        expect(textWidth).to.be.greaterThan(elementWidth);
      }
    });
  });

  describe('4BDCF Transform and Animation Compatibility', function() {
    it('should handle CSS transforms with vendor prefix fallbacks', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length > 0) {
        const card = productCards[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.transform = 'scale(1.05)';
          element.style.transition = 'transform 0.3s ease';
        `, card);

        await commands.wait(400);

        const transformValue = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return computed.transform;
        `, card);

        expect(transformValue).to.not.equal('none');

        const cardRect = await card.getRect();
        expect(cardRect.width).to.be.greaterThan(200);

        const transformSupport = await commands.driver.executeScript(`
          return CSS.supports('transform', 'scale(1.05)');
        `);
        expect(transformSupport).to.be.true;
      }
    });

    it('should handle viewport units with consistent behavior', async function() {
      await commands.visit('/');

      const heroSection = await commands.getAll('.hero, .banner, [data-testid="hero"], header');
      
      if (heroSection.length > 0) {
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.height = '50vh';
          element.style.width = '100vw';
          element.style.minHeight = '300px';
        `, heroSection[0]);

        await commands.wait(300);

        const viewportHeight = await commands.driver.executeScript(`
          return window.innerHeight;
        `);

        const elementHeight = await commands.driver.executeScript(`
          const element = arguments[0];
          return element.getBoundingClientRect().height;
        `, heroSection[0]);

        const expectedHeight = Math.max(viewportHeight * 0.5, 300);
        expect(elementHeight).to.be.within(expectedHeight - 10, expectedHeight + 10);

        const vhSupport = await commands.driver.executeScript(`
          return CSS.supports('height', '50vh');
        `);
        expect(vhSupport).to.be.true;
      }
    });
  });

  describe('4BDCF Filter and Backdrop Support', function() {
    it('should handle CSS filters with graceful degradation', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productImages = await commands.getAll('img');
      
      if (productImages.length > 0) {
        const image = productImages[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.filter = 'brightness(1.2) contrast(1.1)';
          element.style.transition = 'filter 0.3s ease';
        `, image);

        await commands.wait(400);

        const filterValue = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return computed.filter;
        `, image);

        const filterSupport = await commands.driver.executeScript(`
          return CSS.supports('filter', 'brightness(1.2)');
        `);

        if (filterSupport) {
          expect(filterValue).to.include('brightness');
        } else {
          const opacity = await commands.driver.executeScript(`
            const element = arguments[0];
            return window.getComputedStyle(element).opacity;
          `, image);
          expect(parseFloat(opacity)).to.be.within(0.8, 1.0);
        }
      }
    });

    it('should handle backdrop blur effects with fallback behavior', async function() {
      await commands.visit('/products');

      const modalTriggers = await commands.getAll('button[data-testid="quick-view"], .quick-view-btn, button:contains("Quick")');
      
      if (modalTriggers.length > 0) {
        await modalTriggers[0].click();
        await commands.wait(500);

        const modals = await commands.getAll('.modal, [role="dialog"], .overlay');
        
        if (modals.length > 0) {
          const modal = modals[0];
          
          await commands.driver.executeScript(`
            const element = arguments[0];
            element.style.backdropFilter = 'blur(10px)';
            element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          `, modal);

          await commands.wait(300);

          const backdropSupport = await commands.driver.executeScript(`
            return CSS.supports('backdrop-filter', 'blur(10px)');
          `);

          if (backdropSupport) {
            const backdropValue = await commands.driver.executeScript(`
              const element = arguments[0];
              return window.getComputedStyle(element).backdropFilter;
            `, modal);
            expect(backdropValue).to.include('blur');
          } else {
            const backgroundColor = await commands.driver.executeScript(`
              const element = arguments[0];
              return window.getComputedStyle(element).backgroundColor;
            `, modal);
            expect(backgroundColor).to.include('rgba');
          }
        }
      }
    });
  });
});