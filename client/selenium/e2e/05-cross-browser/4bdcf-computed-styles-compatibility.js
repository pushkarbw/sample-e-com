const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF Computed Styles Cross-Browser Compatibility', function() {
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

  describe('4BDCF Flexbox Computed Properties', function() {
    it('should calculate flex item dimensions consistently across browsers', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productContainer = await commands.getAll('[data-testid="products-container"], .products-container, .product-list');
      
      if (productContainer.length > 0) {
        await commands.driver.executeScript(`
          const container = arguments[0];
          container.style.display = 'flex';
          container.style.flexWrap = 'wrap';
          container.style.justifyContent = 'space-between';
          container.style.gap = '16px';
          container.style.width = '800px';
        `, productContainer[0]);

        const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
        
        if (productCards.length >= 3) {
          await commands.driver.executeScript(`
            const cards = arguments[0];
            cards.forEach(card => {
              card.style.flex = '1 1 200px';
              card.style.minWidth = '200px';
              card.style.maxWidth = '300px';
            });
          `, productCards.slice(0, 3));

          await commands.wait(300);

          const computedDimensions = await commands.driver.executeScript(`
            const cards = arguments[0];
            return cards.map(card => {
              const computed = window.getComputedStyle(card);
              const rect = card.getBoundingClientRect();
              return {
                width: rect.width,
                height: rect.height,
                computedWidth: computed.width,
                computedMinWidth: computed.minWidth,
                computedMaxWidth: computed.maxWidth,
                flexGrow: computed.flexGrow,
                flexShrink: computed.flexShrink,
                flexBasis: computed.flexBasis
              };
            });
          `, productCards.slice(0, 3));

          expect(computedDimensions).to.have.lengthOf(3);
          
          computedDimensions.forEach(dim => {
            expect(dim.width).to.be.within(180, 320);
            expect(dim.flexGrow).to.equal('1');
            expect(dim.flexShrink).to.equal('1');
          });

          const gapSupport = await commands.driver.executeScript(`
            return CSS.supports('gap', '16px');
          `);

          if (gapSupport) {
            const actualGap = computedDimensions[1].width > 0 && computedDimensions[0].width > 0 
              ? Math.abs(computedDimensions[1].width - computedDimensions[0].width) 
              : 0;
            expect(actualGap).to.be.lessThan(50);
          }
        }
      }
    });

    it('should handle flex direction changes with proper dimension recalculation', async function() {
      await commands.visit('/cart');

      await commands.driver.executeScript(`
        const container = document.querySelector('main, body');
        const flexContainer = document.createElement('div');
        flexContainer.className = 'test-flex-container';
        flexContainer.innerHTML = \`
          <div class="flex-item">Item 1</div>
          <div class="flex-item">Item 2</div>
          <div class="flex-item">Item 3</div>
        \`;
        container.appendChild(flexContainer);
      `);

      const flexContainer = await commands.get('.test-flex-container');
      
      await commands.driver.executeScript(`
        const container = arguments[0];
        container.style.display = 'flex';
        container.style.flexDirection = 'row';
        container.style.height = '100px';
        container.style.width = '600px';
        
        const items = container.querySelectorAll('.flex-item');
        items.forEach(item => {
          item.style.flex = '1';
          item.style.padding = '10px';
          item.style.border = '1px solid #ccc';
        });
      `, flexContainer);

      await commands.wait(200);

      const rowDimensions = await commands.driver.executeScript(`
        const container = arguments[0];
        const items = container.querySelectorAll('.flex-item');
        return Array.from(items).map(item => {
          const rect = item.getBoundingClientRect();
          const computed = window.getComputedStyle(item);
          return {
            width: rect.width,
            height: rect.height,
            computedWidth: computed.width,
            computedHeight: computed.height
          };
        });
      `, flexContainer);

      await commands.driver.executeScript(`
        const container = arguments[0];
        container.style.flexDirection = 'column';
      `, flexContainer);

      await commands.wait(200);

      const columnDimensions = await commands.driver.executeScript(`
        const container = arguments[0];
        const items = container.querySelectorAll('.flex-item');
        return Array.from(items).map(item => {
          const rect = item.getBoundingClientRect();
          const computed = window.getComputedStyle(item);
          return {
            width: rect.width,
            height: rect.height,
            computedWidth: computed.width,
            computedHeight: computed.height
          };
        });
      `, flexContainer);

      expect(rowDimensions).to.have.lengthOf(3);
      expect(columnDimensions).to.have.lengthOf(3);

      const rowWidth = rowDimensions[0].width;
      const columnWidth = columnDimensions[0].width;
      expect(Math.abs(rowWidth - columnWidth)).to.be.greaterThan(50);
    });
  });

  describe('4BDCF Font and Typography Rendering', function() {
    it('should calculate line height and font metrics consistently', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productTitles = await commands.getAll('h1, h2, h3, .product-title, [data-testid="product-name"]');
      
      if (productTitles.length > 0) {
        const title = productTitles[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.fontSize = '24px';
          element.style.lineHeight = '1.5';
          element.style.fontFamily = 'Arial, sans-serif';
          element.textContent = 'Test Product Title for Measurement';
        `, title);

        await commands.wait(200);

        const fontMetrics = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            fontFamily: computed.fontFamily,
            actualHeight: rect.height,
            actualWidth: rect.width,
            computedHeight: computed.height,
            computedWidth: computed.width
          };
        `, title);

        expect(fontMetrics.fontSize).to.equal('24px');
        expect(parseFloat(fontMetrics.lineHeight)).to.be.within(30, 40);
        expect(fontMetrics.actualHeight).to.be.greaterThan(20);

        const expectedLineHeight = 24 * 1.5;
        const actualLineHeight = parseFloat(fontMetrics.lineHeight);
        expect(Math.abs(actualLineHeight - expectedLineHeight)).to.be.lessThan(5);

        const textWidth = await commands.driver.executeScript(`
          const element = arguments[0];
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const computed = window.getComputedStyle(element);
          context.font = computed.fontSize + ' ' + computed.fontFamily;
          return context.measureText(element.textContent).width;
        `, title);

        expect(textWidth).to.be.greaterThan(100);
        expect(Math.abs(textWidth - fontMetrics.actualWidth)).to.be.lessThan(50);
      }
    });

    it('should handle font weight and style computed values correctly', async function() {
      await commands.visit('/products');

      await commands.driver.executeScript(`
        const container = document.querySelector('main, body');
        const testElement = document.createElement('div');
        testElement.className = 'font-test-element';
        testElement.textContent = 'Font Weight Test';
        container.appendChild(testElement);
      `);

      const testElement = await commands.get('.font-test-element');

      const fontWeightTests = [
        { weight: 'normal', expectedNumeric: '400' },
        { weight: 'bold', expectedNumeric: '700' },
        { weight: '300', expectedNumeric: '300' },
        { weight: '600', expectedNumeric: '600' }
      ];

      for (const test of fontWeightTests) {
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.fontWeight = arguments[1];
        `, testElement, test.weight);

        await commands.wait(100);

        const computedWeight = await commands.driver.executeScript(`
          const element = arguments[0];
          return window.getComputedStyle(element).fontWeight;
        `, testElement);

        const weightNumber = parseInt(computedWeight);
        const expectedNumber = parseInt(test.expectedNumeric);
        expect(Math.abs(weightNumber - expectedNumber)).to.be.lessThan(100);
      }

      await commands.driver.executeScript(`
        const element = arguments[0];
        element.style.fontStyle = 'italic';
        element.style.textDecoration = 'underline';
      `, testElement);

      const styleProperties = await commands.driver.executeScript(`
        const element = arguments[0];
        const computed = window.getComputedStyle(element);
        return {
          fontStyle: computed.fontStyle,
          textDecoration: computed.textDecoration,
          textDecorationLine: computed.textDecorationLine
        };
      `, testElement);

      expect(styleProperties.fontStyle).to.equal('italic');
      expect(styleProperties.textDecoration).to.include('underline');
    });
  });

  describe('4BDCF Box Model and Border Calculations', function() {
    it('should calculate border-radius with consistent rendering', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length > 0) {
        const card = productCards[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.width = '200px';
          element.style.height = '150px';
          element.style.borderRadius = '12px';
          element.style.border = '2px solid #333';
          element.style.padding = '16px';
          element.style.boxSizing = 'border-box';
        `, card);

        await commands.wait(200);

        const borderMetrics = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return {
            borderRadius: computed.borderRadius,
            borderTopLeftRadius: computed.borderTopLeftRadius,
            borderTopRightRadius: computed.borderTopRightRadius,
            borderBottomLeftRadius: computed.borderBottomLeftRadius,
            borderBottomRightRadius: computed.borderBottomRightRadius,
            borderWidth: computed.borderWidth,
            borderTopWidth: computed.borderTopWidth,
            borderRightWidth: computed.borderRightWidth,
            borderBottomWidth: computed.borderBottomWidth,
            borderLeftWidth: computed.borderLeftWidth,
            actualWidth: rect.width,
            actualHeight: rect.height,
            computedWidth: computed.width,
            computedHeight: computed.height,
            boxSizing: computed.boxSizing
          };
        `, card);

        expect(borderMetrics.borderRadius).to.equal('12px');
        expect(borderMetrics.borderTopLeftRadius).to.equal('12px');
        expect(borderMetrics.borderWidth).to.equal('2px');
        expect(borderMetrics.actualWidth).to.be.within(195, 205);
        expect(borderMetrics.actualHeight).to.be.within(145, 155);
        expect(borderMetrics.boxSizing).to.equal('border-box');

        const contentDimensions = await commands.driver.executeScript(`
          const element = arguments[0];
          return {
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            scrollWidth: element.scrollWidth,
            scrollHeight: element.scrollHeight
          };
        `, card);

        expect(contentDimensions.offsetWidth).to.equal(200);
        expect(contentDimensions.offsetHeight).to.equal(150);
        expect(contentDimensions.clientWidth).to.be.within(194, 198);
        expect(contentDimensions.clientHeight).to.be.within(144, 148);
      }
    });

    it('should handle box-shadow and outline calculations consistently', async function() {
      await commands.visit('/login');

      const inputElements = await commands.getAll('input[type="email"], input[type="password"], #email, #password');
      
      if (inputElements.length > 0) {
        const input = inputElements[0];
        
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.width = '250px';
          element.style.height = '40px';
          element.style.padding = '8px 12px';
          element.style.border = '1px solid #ddd';
          element.style.borderRadius = '6px';
          element.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          element.style.outline = '2px solid transparent';
        `, input);

        await input.click();
        await commands.wait(200);

        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.borderColor = '#007bff';
          element.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.25)';
          element.style.outline = '2px solid #007bff';
          element.style.outlineOffset = '2px';
        `, input);

        await commands.wait(200);

        const shadowAndOutlineMetrics = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return {
            boxShadow: computed.boxShadow,
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            outlineStyle: computed.outlineStyle,
            outlineColor: computed.outlineColor,
            outlineOffset: computed.outlineOffset,
            borderColor: computed.borderColor,
            actualWidth: rect.width,
            actualHeight: rect.height
          };
        `, input);

        expect(shadowAndOutlineMetrics.boxShadow).to.not.equal('none');
        expect(shadowAndOutlineMetrics.outline).to.not.equal('none');
        expect(shadowAndOutlineMetrics.outlineWidth).to.equal('2px');
        expect(shadowAndOutlineMetrics.outlineOffset).to.equal('2px');
        expect(shadowAndOutlineMetrics.actualWidth).to.be.within(245, 255);
        expect(shadowAndOutlineMetrics.actualHeight).to.be.within(35, 45);

        const visualBounds = await commands.driver.executeScript(`
          const element = arguments[0];
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          const outlineWidth = parseInt(computedStyle.outlineWidth) || 0;
          const outlineOffset = parseInt(computedStyle.outlineOffset) || 0;
          
          return {
            elementBounds: {
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom
            },
            visualBounds: {
              left: rect.left - outlineWidth - outlineOffset,
              top: rect.top - outlineWidth - outlineOffset,
              right: rect.right + outlineWidth + outlineOffset,
              bottom: rect.bottom + outlineWidth + outlineOffset
            }
          };
        `, input);

        const totalVisualWidth = visualBounds.visualBounds.right - visualBounds.visualBounds.left;
        const elementWidth = visualBounds.elementBounds.right - visualBounds.elementBounds.left;
        expect(totalVisualWidth).to.be.greaterThan(elementWidth);
      }
    });
  });

  describe('4BDCF Transform and Position Calculations', function() {
    it('should calculate transform matrix values consistently', async function() {
      await commands.visit('/products');

      await commands.driver.executeScript(`
        const container = document.querySelector('main, body');
        const transformElement = document.createElement('div');
        transformElement.className = 'transform-test-element';
        transformElement.style.width = '100px';
        transformElement.style.height = '100px';
        transformElement.style.backgroundColor = '#f0f0f0';
        transformElement.textContent = 'Transform Test';
        container.appendChild(transformElement);
      `);

      const transformElement = await commands.get('.transform-test-element');

      const transformTests = [
        { transform: 'scale(1.2)', expectedScale: 1.2 },
        { transform: 'rotate(45deg)', expectedRotation: 45 },
        { transform: 'translate(50px, 30px)', expectedX: 50, expectedY: 30 },
        { transform: 'scale(0.8) rotate(30deg) translate(20px, 10px)', expectedScale: 0.8 }
      ];

      for (const test of transformTests) {
        await commands.driver.executeScript(`
          const element = arguments[0];
          element.style.transform = arguments[1];
        `, transformElement, test.transform);

        await commands.wait(200);

        const transformMetrics = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return {
            transform: computed.transform,
            transformOrigin: computed.transformOrigin,
            actualWidth: rect.width,
            actualHeight: rect.height,
            x: rect.x,
            y: rect.y
          };
        `, transformElement);

        expect(transformMetrics.transform).to.not.equal('none');
        
        if (test.expectedScale) {
          const matrix = transformMetrics.transform.match(/matrix\(([^)]+)\)/);
          if (matrix) {
            const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
            const scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
            expect(Math.abs(scaleX - test.expectedScale)).to.be.lessThan(0.1);
          }
        }

        if (test.expectedX !== undefined) {
          expect(transformMetrics.actualWidth).to.be.within(95, 105);
          expect(transformMetrics.actualHeight).to.be.within(95, 105);
        }
      }

      await commands.driver.executeScript(`
        const element = arguments[0];
        element.style.transformOrigin = 'top left';
        element.style.transform = 'scale(1.5)';
      `, transformElement);

      await commands.wait(200);

      const originMetrics = await commands.driver.executeScript(`
        const element = arguments[0];
        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return {
          transformOrigin: computed.transformOrigin,
          actualWidth: rect.width,
          actualHeight: rect.height
        };
      `, transformElement);

      expect(originMetrics.transformOrigin).to.include('0px');
      expect(originMetrics.actualWidth).to.be.within(145, 155);
      expect(originMetrics.actualHeight).to.be.within(145, 155);
    });
  });
});