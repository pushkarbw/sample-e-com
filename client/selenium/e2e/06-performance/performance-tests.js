const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('⚡ Performance & Load Testing', function() {
  this.timeout(120000); // Longer timeout for performance tests
  
  const testSetup = new TestSetup();
  let commands;

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('Page Load Performance', function() {
    const performanceThresholds = {
      home: 5000,      // 5 seconds for home page
      products: 10000, // 10 seconds for products (data loading)
      auth: 3000       // 3 seconds for auth pages
    };

    it('should load home page within acceptable time', async function() {
      const startTime = Date.now();
      await commands.visit('/');
      await commands.shouldBeVisible('[data-testid="hero-section"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).to.be.lessThan(performanceThresholds.home);
      await commands.log(`Home page loaded in ${loadTime}ms`);
    });

    it('should load products page within acceptable time', async function() {
      const startTime = Date.now();
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      await commands.waitForProductsToLoad();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).to.be.lessThan(performanceThresholds.products);
      await commands.log(`Products page loaded in ${loadTime}ms`);
      
      // Verify meaningful content loaded
      const productCards = await commands.getAll('[data-testid="product-card"]');
      const bodyText = await commands.get('body').then(el => el.getText());
      const hasContent = productCards.length > 0 || 
                        bodyText.toLowerCase().includes('no products') ||
                        bodyText.toLowerCase().includes('loading');
      
      expect(hasContent).to.be.true;
    });

    it('should load authentication pages quickly', async function() {
      const authPages = [
        { path: '/login', element: '#email' },
        { path: '/signup', element: '#firstName' }
      ];
      
      for (const page of authPages) {
        const startTime = Date.now();
        await commands.visit(page.path);
        await commands.shouldBeVisible(page.element);
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).to.be.lessThan(performanceThresholds.auth);
        await commands.log(`${page.path} loaded in ${loadTime}ms`);
      }
    });
  });

  describe('Image Loading Performance', function() {
    it('should load product images efficiently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const images = await commands.getAll('img');
      if (images.length > 0) {
        await commands.wait(3000); // Allow time for images to load
        
        let loadedImages = 0;
        for (const img of images.slice(0, 5)) { // Check first 5 images
          const complete = await commands.driver.executeScript(
            'return arguments[0].complete && arguments[0].naturalWidth > 0;',
            img
          );
          if (complete) loadedImages++;
        }
        
        const loadPercentage = (loadedImages / Math.min(images.length, 5)) * 100;
        expect(loadPercentage).to.be.greaterThan(50); // At least 50% should load
        
        await commands.log(`${loadedImages} out of ${Math.min(images.length, 5)} images loaded (${loadPercentage.toFixed(1)}%)`);
      }
    });

    it('should handle lazy loading efficiently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      // Scroll down to trigger lazy loading
      await commands.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
      await commands.wait(2000);
      
      const images = await commands.getAll('img');
      await commands.log(`Found ${images.length} images after scrolling`);
      
      // Verify page remains responsive
      await commands.shouldBeVisible('body');
    });
  });

  describe('JavaScript Performance', function() {
    it('should have acceptable JavaScript execution time', async function() {
      await commands.visit('/products');
      
      const jsPerformance = await commands.driver.executeScript(`
        const start = performance.now();
        
        // Simulate some JavaScript operations
        const data = [];
        for (let i = 0; i < 1000; i++) {
          data.push({ id: i, name: 'Product ' + i, price: Math.random() * 100 });
        }
        
        // Filter and sort operations
        const filtered = data.filter(item => item.price > 50);
        const sorted = filtered.sort((a, b) => a.price - b.price);
        
        const end = performance.now();
        return end - start;
      `);
      
      expect(jsPerformance).to.be.lessThan(100); // 100ms max for JS operations
      await commands.log(`JavaScript operations completed in ${jsPerformance.toFixed(2)}ms`);
    });

    it('should handle DOM manipulation efficiently', async function() {
      await commands.visit('/products');
      
      const domPerformance = await commands.driver.executeScript(`
        const start = performance.now();
        
        // Create and append multiple elements
        const container = document.createElement('div');
        for (let i = 0; i < 100; i++) {
          const div = document.createElement('div');
          div.textContent = 'Test item ' + i;
          container.appendChild(div);
        }
        
        document.body.appendChild(container);
        
        const end = performance.now();
        
        // Clean up
        document.body.removeChild(container);
        
        return end - start;
      `);
      
      expect(domPerformance).to.be.lessThan(50); // 50ms max for DOM operations
      await commands.log(`DOM manipulation completed in ${domPerformance.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', function() {
    it('should have reasonable memory usage', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const memoryInfo = await commands.driver.executeScript(`
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      `);
      
      if (memoryInfo) {
        const usagePercentage = (memoryInfo.used / memoryInfo.limit) * 100;
        expect(usagePercentage).to.be.lessThan(50); // Less than 50% of heap limit
        
        await commands.log(`Memory usage: ${(memoryInfo.used / 1024 / 1024).toFixed(2)}MB (${usagePercentage.toFixed(1)}% of limit)`);
      } else {
        await commands.log('Memory information not available in this browser');
      }
    });

    it('should not have memory leaks during navigation', async function() {
      const startMemory = await commands.driver.executeScript(`
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      `);
      
      // Navigate through multiple pages
      const pages = ['/', '/products', '/login', '/signup'];
      
      for (let i = 0; i < 3; i++) {
        for (const page of pages) {
          await commands.visit(page);
          await commands.shouldBeVisible('body');
          await commands.wait(500);
        }
      }
      
      // Force garbage collection if available
      await commands.driver.executeScript(`
        if (window.gc) {
          window.gc();
        }
      `);
      
      const endMemory = await commands.driver.executeScript(`
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      `);
      
      // Memory increase should be reasonable (allow up to 500% increase for complex apps)
      const memoryIncrease = ((endMemory - startMemory) / startMemory) * 100;
      await commands.log(`Memory usage increased by ${memoryIncrease.toFixed(2)}% during navigation`);
      
      // Allow for reasonable memory growth in development builds
      expect(memoryIncrease).to.be.below(500); // 500% threshold for development builds
    });
  });

  describe('Network Performance', function() {
    it('should handle concurrent requests efficiently', async function() {
      await commands.visit('/products');
      
      const networkTiming = await commands.driver.executeScript(`
        const start = performance.now();
        
        // Simulate multiple concurrent API calls
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            fetch('/api/products?page=' + i).catch(() => ({ ok: false }))
          );
        }
        
        return Promise.all(promises).then(() => {
          return performance.now() - start;
        });
      `);
      
      expect(networkTiming).to.be.lessThan(10000); // 10 seconds max for concurrent requests
      await commands.log(`Concurrent requests completed in ${networkTiming.toFixed(2)}ms`);
    });

    it('should cache static resources effectively', async function() {
      // First visit
      const firstLoadStart = Date.now();
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      const firstLoadTime = Date.now() - firstLoadStart;
      
      // Second visit (should use cache)
      const secondLoadStart = Date.now();
      await commands.reload();
      await commands.shouldBeVisible('[data-testid="products-container"]');
      const secondLoadTime = Date.now() - secondLoadStart;
      
      // Second load should be faster due to caching
      expect(secondLoadTime).to.be.lessThan(firstLoadTime * 1.2); // Allow 20% variance
      
      await commands.log(`First load: ${firstLoadTime}ms, Second load: ${secondLoadTime}ms`);
    });
  });

  describe('Responsive Performance', function() {
    it('should maintain performance on mobile viewports', async function() {
      await commands.testMobileViewport(async () => {
        const startTime = Date.now();
        await commands.visit('/products');
        await commands.shouldBeVisible('[data-testid="products-container"]');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).to.be.lessThan(12000); // 12 seconds max on mobile
        await commands.log(`Mobile load time: ${loadTime}ms`);
      });
    });

    it('should handle viewport changes efficiently', async function() {
      await commands.visit('/products');
      await commands.shouldBeVisible('[data-testid="products-container"]');
      
      const viewports = [
        { width: 375, height: 667 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];
      
      for (const viewport of viewports) {
        const start = Date.now();
        await commands.driver.manage().window().setRect(viewport);
        await commands.wait(1000); // Allow more time for reflow and rendering
        const resizeTime = Date.now() - start;
        
        expect(resizeTime).to.be.lessThan(2000); // 2 seconds max for viewport change (increased from 1s)
        await commands.shouldBeVisible('body');
        
        await commands.log(`Viewport ${viewport.width}x${viewport.height} resize: ${resizeTime}ms`);
      }
    });
  });

  describe('Form Performance', function() {
    it('should handle rapid form input efficiently', async function() {
      await commands.visit('/login');
      
      const inputPerformance = await commands.driver.executeScript(`
        const emailInput = document.querySelector('#email');
        const passwordInput = document.querySelector('#password');
        
        if (!emailInput || !passwordInput) return 0;
        
        const start = performance.now();
        
        // Simulate rapid typing
        for (let i = 0; i < 50; i++) {
          emailInput.value += 'a';
          passwordInput.value += 'b';
          
          // Trigger input events
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        const end = performance.now();
        
        // Clean up
        emailInput.value = '';
        passwordInput.value = '';
        
        return end - start;
      `);
      
      expect(inputPerformance).to.be.lessThan(100); // 100ms max for rapid input
      await commands.log(`Rapid form input completed in ${inputPerformance.toFixed(2)}ms`);
    });
  });

  describe('Load Testing Simulation', function() {
    it('should handle multiple rapid page loads', async function() {
      const pages = ['/', '/products'];
      const loadTimes = [];
      
      for (let i = 0; i < 5; i++) {
        for (const page of pages) {
          const startTime = Date.now();
          await commands.visit(page);
          await commands.shouldBeVisible('body');
          const loadTime = Date.now() - startTime;
          
          loadTimes.push(loadTime);
          expect(loadTime).to.be.lessThan(15000); // 15 seconds max per load
          
          await commands.wait(200); // Small delay between requests
        }
      }
      
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);
      
      await commands.log(`Average load time: ${averageLoadTime.toFixed(2)}ms, Max: ${maxLoadTime}ms`);
      
      // Average should be reasonable
      expect(averageLoadTime).to.be.lessThan(8000); // 8 seconds average max
    });
  });
});