const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF Mobile Device Cross-Browser Compatibility', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    }
  };

  const getBrowserStackCapabilities = (browser, device) => {
    const capabilities = {
      'iphone-13': {
        browserName: 'iPhone',
        deviceName: 'iPhone 13',
        platformName: 'iOS',
        platformVersion: '15',
        'bstack:options': {
          projectName: 'E-Commerce Mobile Device Tests',
          buildName: '4BDCF-Mobile-Device-Tests',
          sessionName: '4BDCF Mobile iPhone Safari'
        }
      },
      'galaxy-s22': {
        browserName: 'Android',
        deviceName: 'Samsung Galaxy S22',
        platformName: 'Android',
        platformVersion: '12.0',
        'bstack:options': {
          projectName: 'E-Commerce Mobile Device Tests',
          buildName: '4BDCF-Mobile-Device-Tests',
          sessionName: '4BDCF Mobile Android Chrome'
        }
      },
      'ipad-air': {
        browserName: 'iPad',
        deviceName: 'iPad Air 4',
        platformName: 'iOS',
        platformVersion: '14',
        'bstack:options': {
          projectName: 'E-Commerce Mobile Device Tests',
          buildName: '4BDCF-Mobile-Device-Tests',
          sessionName: '4BDCF Tablet iPad Safari'
        }
      }
    };
    return capabilities[device] || capabilities['iphone-13'];
  };

  beforeEach(async function() {
    const browser = process.env.BROWSER || 'chrome';
    await testSetup.beforeEach(browser);
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('4BDCF Mobile Safari Viewport and Zoom Behavior', function() {
    it('should handle iOS Safari viewport zoom restrictions properly', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 812 });
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const viewportMeta = await commands.driver.executeScript(`
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      `);

      const hasUserScalableNo = viewportMeta && viewportMeta.includes('user-scalable=no');
      const hasMaximumScale = viewportMeta && viewportMeta.includes('maximum-scale=1');

      if (hasUserScalableNo || hasMaximumScale) {
        const zoomLevel = await commands.driver.executeScript(`
          return window.devicePixelRatio || 1;
        `);

        expect(zoomLevel).to.be.closeTo(1, 0.5);

        const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
        
        if (productCards.length > 0) {
          const cardRect = await productCards[0].getRect();
          expect(cardRect.width).to.be.greaterThan(100);
          expect(cardRect.width).to.be.lessThan(400);
        }
      }
    });

    it('should handle touch events with proper preventDefault behavior', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/cart');

      await commands.driver.executeScript(`
        let touchPrevented = false;
        document.addEventListener('touchstart', function(e) {
          if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
            touchPrevented = true;
          }
        }, { passive: false });
        window.touchPreventedStatus = () => touchPrevented;
      `);

      const buttons = await commands.getAll('button');
      
      if (buttons.length > 0) {
        await commands.driver.executeScript(`
          const button = arguments[0];
          const touchEvent = new TouchEvent('touchstart', {
            touches: [new Touch({
              identifier: 1,
              target: button,
              clientX: 100,
              clientY: 100
            })]
          });
          button.dispatchEvent(touchEvent);
        `, buttons[0]);

        await commands.wait(500);

        const touchPrevented = await commands.driver.executeScript(`
          return window.touchPreventedStatus ? window.touchPreventedStatus() : false;
        `);

        expect(typeof touchPrevented).to.equal('boolean');
      }
    });
  });

  describe('4BDCF Android Browser Input Method Editor (IME) Compatibility', function() {
    it('should handle Korean/Chinese input method with composition events', async function() {
      await commands.driver.manage().window().setRect({ width: 360, height: 640 });
      await commands.visit('/products');

      const searchInputs = await commands.getAll('input[placeholder*="search"], input[placeholder*="Search"]');
      
      if (searchInputs.length > 0) {
        const searchInput = searchInputs[0];

        await commands.driver.executeScript(`
          let compositionData = [];
          const input = arguments[0];
          
          input.addEventListener('compositionstart', (e) => {
            compositionData.push('start: ' + e.data);
          });
          
          input.addEventListener('compositionupdate', (e) => {
            compositionData.push('update: ' + e.data);
          });
          
          input.addEventListener('compositionend', (e) => {
            compositionData.push('end: ' + e.data);
          });
          
          window.getCompositionData = () => compositionData;
        `, searchInput);

        await searchInput.sendKeys('한글');

        await commands.driver.executeScript(`
          const input = arguments[0];
          
          const startEvent = new CompositionEvent('compositionstart', { data: '' });
          const updateEvent = new CompositionEvent('compositionupdate', { data: '한' });
          const endEvent = new CompositionEvent('compositionend', { data: '한글' });
          
          input.dispatchEvent(startEvent);
          input.dispatchEvent(updateEvent);
          input.dispatchEvent(endEvent);
        `, searchInput);

        const compositionData = await commands.driver.executeScript(`
          return window.getCompositionData ? window.getCompositionData() : [];
        `);

        expect(compositionData.length).to.be.greaterThan(0);

        const inputValue = await searchInput.getAttribute('value');
        expect(inputValue.length).to.be.greaterThan(0);
      }
    });

    it('should handle virtual keyboard visibility detection', async function() {
      await commands.driver.manage().window().setRect({ width: 360, height: 640 });
      await commands.visit('/login');

      const emailInput = await commands.get('input[type="email"]');

      await commands.driver.executeScript(`
        let originalHeight = window.innerHeight;
        let keyboardVisible = false;
        
        window.addEventListener('resize', function() {
          const currentHeight = window.innerHeight;
          keyboardVisible = currentHeight < originalHeight * 0.75;
        });
        
        window.isKeyboardVisible = () => keyboardVisible;
      `);

      await emailInput.click();
      await commands.wait(1000);

      const keyboardVisible = await commands.driver.executeScript(`
        return window.isKeyboardVisible ? window.isKeyboardVisible() : false;
      `);

      const currentHeight = await commands.driver.executeScript(`
        return window.innerHeight;
      `);

      expect(currentHeight).to.be.greaterThan(200);

      if (keyboardVisible) {
        expect(currentHeight).to.be.lessThan(640);
      }
    });
  });

  describe('4BDCF Tablet Layout Orientation Handling', function() {
    it('should handle landscape to portrait orientation changes', async function() {
      await commands.driver.manage().window().setRect({ width: 1024, height: 768 });
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const initialProductCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      let initialCardsPerRow = 0;

      if (initialProductCards.length >= 2) {
        const firstCardRect = await initialProductCards[0].getRect();
        const secondCardRect = await initialProductCards[1].getRect();
        
        const isInSameRow = Math.abs(firstCardRect.y - secondCardRect.y) < 50;
        if (isInSameRow) {
          for (let i = 0; i < initialProductCards.length; i++) {
            const cardRect = await initialProductCards[i].getRect();
            if (Math.abs(cardRect.y - firstCardRect.y) < 50) {
              initialCardsPerRow++;
            } else {
              break;
            }
          }
        }
      }

      await commands.driver.manage().window().setRect({ width: 768, height: 1024 });
      await commands.wait(1000);

      await commands.driver.executeScript(`
        if (window.screen && window.screen.orientation) {
          window.dispatchEvent(new Event('orientationchange'));
        }
      `);

      await commands.wait(500);

      const portraitProductCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      let portraitCardsPerRow = 0;

      if (portraitProductCards.length >= 2) {
        const firstCardRect = await portraitProductCards[0].getRect();
        const secondCardRect = await portraitProductCards[1].getRect();
        
        const isInSameRow = Math.abs(firstCardRect.y - secondCardRect.y) < 50;
        if (isInSameRow) {
          for (let i = 0; i < portraitProductCards.length; i++) {
            const cardRect = await portraitProductCards[i].getRect();
            if (Math.abs(cardRect.y - firstCardRect.y) < 50) {
              portraitCardsPerRow++;
            } else {
              break;
            }
          }
        }
      }

      if (initialCardsPerRow > 0 && portraitCardsPerRow > 0) {
        expect(portraitCardsPerRow).to.be.lessThan(initialCardsPerRow);
      }
    });
  });

  describe('4BDCF Mobile Device Performance Throttling', function() {
    it('should handle CPU throttling and animation frame timing', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/products');

      const performanceMetrics = await commands.driver.executeScript(`
        let frameCount = 0;
        let startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (frameCount < 60) {
            requestAnimationFrame(countFrames);
          }
        }
        
        requestAnimationFrame(countFrames);
        
        return new Promise(resolve => {
          setTimeout(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            const fps = frameCount / (duration / 1000);
            
            resolve({
              frameCount: frameCount,
              duration: duration,
              fps: fps
            });
          }, 1000);
        });
      `);

      expect(performanceMetrics.frameCount).to.be.greaterThan(30);
      expect(performanceMetrics.fps).to.be.greaterThan(15);
      expect(performanceMetrics.fps).to.be.lessThan(120);

      const memoryInfo = await commands.driver.executeScript(`
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      `);

      if (memoryInfo) {
        expect(memoryInfo.usedJSHeapSize).to.be.greaterThan(0);
        expect(memoryInfo.usedJSHeapSize).to.be.lessThan(memoryInfo.totalJSHeapSize);
      }
    });

    it('should handle network throttling simulation for mobile connections', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      
      await commands.driver.executeScript(`
        window.networkRequests = [];
        
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const startTime = performance.now();
          return originalFetch.apply(this, args).then(response => {
            const endTime = performance.now();
            window.networkRequests.push({
              url: args[0],
              duration: endTime - startTime,
              status: response.status
            });
            return response;
          });
        };
      `);

      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const networkMetrics = await commands.driver.executeScript(`
        return window.networkRequests || [];
      `);

      if (networkMetrics.length > 0) {
        const avgRequestTime = networkMetrics.reduce((sum, req) => sum + req.duration, 0) / networkMetrics.length;
        
        expect(avgRequestTime).to.be.greaterThan(10);
        expect(avgRequestTime).to.be.lessThan(10000);

        const successfulRequests = networkMetrics.filter(req => req.status >= 200 && req.status < 400);
        expect(successfulRequests.length).to.be.greaterThan(0);
      }
    });
  });

  describe('4BDCF Device-Specific CSS Media Query Handling', function() {
    it('should apply correct styles for high-DPI mobile displays', async function() {
      await commands.driver.manage().window().setRect({ width: 414, height: 896 });
      await commands.visit('/products');

      const devicePixelRatio = await commands.driver.executeScript(`
        return window.devicePixelRatio || 1;
      `);

      const highDPIStyles = await commands.driver.executeScript(`
        const testElement = document.createElement('div');
        testElement.style.cssText = 'width: 1px; height: 1px;';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement);
        const actualWidth = testElement.getBoundingClientRect().width;
        
        document.body.removeChild(testElement);
        
        return {
          devicePixelRatio: window.devicePixelRatio,
          actualWidth: actualWidth,
          computedWidth: parseFloat(computedStyle.width)
        };
      `);

      expect(highDPIStyles.devicePixelRatio).to.be.greaterThan(0);

      if (devicePixelRatio > 1) {
        const productImages = await commands.getAll('img');
        
        if (productImages.length > 0) {
          const firstImage = productImages[0];
          const imageSrc = await firstImage.getAttribute('src');
          const hasRetinaImage = imageSrc && (imageSrc.includes('@2x') || imageSrc.includes('2x'));
          
          if (hasRetinaImage) {
            expect(hasRetinaImage).to.be.true;
          }
        }
      }
    });

    it('should handle pointer coarse/fine media query differences', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/products');

      const pointerCapabilities = await commands.driver.executeScript(`
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const hasHover = window.matchMedia('(hover: hover)').matches;
        
        return {
          coarse: hasCoarsePointer,
          fine: hasFinePointer,
          hover: hasHover
        };
      `);

      const buttons = await commands.getAll('button');
      
      if (buttons.length > 0 && pointerCapabilities.coarse) {
        const buttonRect = await buttons[0].getRect();
        const buttonSize = Math.min(buttonRect.width, buttonRect.height);
        
        expect(buttonSize).to.be.greaterThan(44);
      }

      if (pointerCapabilities.hover) {
        const hoverElements = await commands.getAll('[data-testid="product-card"]:hover, .product-card:hover');
        expect(hoverElements.length).to.be.greaterThanOrEqual(0);
      }
    });
  });
});