const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('4BDCF CSS Rendering Cross-Browser Compatibility', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'password123' }
    },
    browsers: ['chrome', 'firefox', 'safari']
  };

  const getBrowserStackCapabilities = (browser) => {
    const capabilities = {
      chrome: {
        browserName: 'Chrome',
        browserVersion: 'latest',
        'bstack:options': {
          os: 'Windows',
          osVersion: '10',
          projectName: 'E-Commerce CSS Compatibility',
          buildName: '4BDCF-CSS-Rendering-Tests',
          sessionName: '4BDCF CSS Chrome Rendering'
        }
      },
      firefox: {
        browserName: 'Firefox',
        browserVersion: 'latest',
        'bstack:options': {
          os: 'Windows',
          osVersion: '10',
          projectName: 'E-Commerce CSS Compatibility',
          buildName: '4BDCF-CSS-Rendering-Tests',
          sessionName: '4BDCF CSS Firefox Rendering'
        }
      },
      safari: {
        browserName: 'Safari',
        browserVersion: 'latest',
        'bstack:options': {
          os: 'OS X',
          osVersion: 'Monterey',
          projectName: 'E-Commerce CSS Compatibility',
          buildName: '4BDCF-CSS-Rendering-Tests',
          sessionName: '4BDCF CSS Safari Rendering'
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

  describe('4BDCF Button Visibility and Clipping Issues', function() {
    it('should display add to cart buttons without overflow clipping', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add to Cart")');
      
      if (addButtons.length > 0) {
        const firstButton = addButtons[0];
        const buttonRect = await firstButton.getRect();
        const parentElement = await firstButton.findElement(commands.driver.By.xpath('..'));
        const parentRect = await parentElement.getRect();

        const isFullyVisible = buttonRect.x >= parentRect.x && 
                              buttonRect.y >= parentRect.y &&
                              (buttonRect.x + buttonRect.width) <= (parentRect.x + parentRect.width) &&
                              (buttonRect.y + buttonRect.height) <= (parentRect.y + parentRect.height);

        expect(isFullyVisible).to.be.true;

        const buttonText = await firstButton.getText();
        expect(buttonText.length).to.be.greaterThan(0);
      }
    });

    it('should render product cards with consistent flex layout', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 2) {
        const firstCardRect = await productCards[0].getRect();
        const secondCardRect = await productCards[1].getRect();

        const heightDifference = Math.abs(firstCardRect.height - secondCardRect.height);
        expect(heightDifference).to.be.lessThan(50);

        const isAligned = Math.abs(firstCardRect.y - secondCardRect.y) < 10;
        expect(isAligned).to.be.true;
      }
    });

    it('should display cart badge with proper z-index layering', async function() {
      await commands.loginAsTestUser(testConfig.users.valid.email, testConfig.users.valid.password);
      await commands.visit('/products');

      const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-badge, .cart-count');
      
      if (cartBadge.length > 0) {
        const badge = cartBadge[0];
        const isDisplayed = await badge.isDisplayed();
        expect(isDisplayed).to.be.true;

        const badgeRect = await badge.getRect();
        expect(badgeRect.width).to.be.greaterThan(0);
        expect(badgeRect.height).to.be.greaterThan(0);

        const backgroundColor = await badge.getCssValue('background-color');
        expect(backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
      }
    });
  });

  describe('4BDCF Form Input Rendering Differences', function() {
    it('should render form inputs with consistent styling across browsers', async function() {
      await commands.visit('/login');

      const emailInput = await commands.get('input[type="email"]');
      const passwordInput = await commands.get('input[type="password"]');

      const emailRect = await emailInput.getRect();
      const passwordRect = await passwordInput.getRect();

      expect(Math.abs(emailRect.width - passwordRect.width)).to.be.lessThan(5);

      const emailBorder = await emailInput.getCssValue('border-width');
      const passwordBorder = await passwordInput.getCssValue('border-width');
      expect(emailBorder).to.equal(passwordBorder);

      const emailPadding = await emailInput.getCssValue('padding');
      const passwordPadding = await passwordInput.getCssValue('padding');
      expect(emailPadding).to.equal(passwordPadding);
    });

    it('should display search input with proper placeholder alignment', async function() {
      await commands.visit('/products');

      const searchInputs = await commands.getAll('input[placeholder*="search"], input[placeholder*="Search"]');
      
      if (searchInputs.length > 0) {
        const searchInput = searchInputs[0];
        const placeholder = await searchInput.getAttribute('placeholder');
        expect(placeholder.length).to.be.greaterThan(0);

        const inputRect = await searchInput.getRect();
        expect(inputRect.height).to.be.greaterThan(30);

        const lineHeight = await searchInput.getCssValue('line-height');
        const fontSize = await searchInput.getCssValue('font-size');
        
        const lineHeightValue = parseFloat(lineHeight);
        const fontSizeValue = parseFloat(fontSize);
        expect(lineHeightValue).to.be.greaterThan(fontSizeValue * 0.8);
      }
    });
  });

  describe('4BDCF Modal and Overlay Rendering', function() {
    it('should render modal dialogs with proper backdrop positioning', async function() {
      await commands.visit('/products');
      
      const modalTriggers = await commands.getAll('button:contains("Quick View"), [data-testid="quick-view"], .quick-view');
      
      if (modalTriggers.length > 0) {
        await modalTriggers[0].click();
        await commands.wait(1000);

        const modals = await commands.getAll('.modal, [role="dialog"], .dialog');
        
        if (modals.length > 0) {
          const modal = modals[0];
          const isDisplayed = await modal.isDisplayed();
          expect(isDisplayed).to.be.true;

          const modalRect = await modal.getRect();
          const viewportSize = await commands.driver.manage().window().getRect();

          const isCentered = Math.abs((viewportSize.width / 2) - (modalRect.x + modalRect.width / 2)) < 50;
          expect(isCentered).to.be.true;

          const zIndex = await modal.getCssValue('z-index');
          const zIndexValue = parseInt(zIndex);
          expect(zIndexValue).to.be.greaterThan(1000);
        }
      }
    });
  });

  describe('4BDCF Grid Layout Consistency', function() {
    it('should maintain product grid alignment across different screen sizes', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const desktopSize = { width: 1920, height: 1080 };
      await commands.driver.manage().window().setRect(desktopSize);
      await commands.wait(500);

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 3) {
        const firstRowCards = productCards.slice(0, 3);
        const rects = [];
        
        for (let card of firstRowCards) {
          rects.push(await card.getRect());
        }

        const topPositions = rects.map(rect => rect.y);
        const maxTopDifference = Math.max(...topPositions) - Math.min(...topPositions);
        expect(maxTopDifference).to.be.lessThan(10);

        const gaps = [];
        for (let i = 1; i < rects.length; i++) {
          gaps.push(rects[i].x - (rects[i-1].x + rects[i-1].width));
        }

        if (gaps.length > 1) {
          const gapDifference = Math.max(...gaps) - Math.min(...gaps);
          expect(gapDifference).to.be.lessThan(20);
        }
      }
    });
  });

  describe('4BDCF Text Rendering and Font Fallbacks', function() {
    it('should render product prices with consistent decimal alignment', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const priceElements = await commands.getAll('[data-testid="product-price"], .price, .product-price');
      
      if (priceElements.length >= 2) {
        const prices = [];
        
        for (let priceEl of priceElements.slice(0, 3)) {
          const priceText = await priceEl.getText();
          const priceRect = await priceEl.getRect();
          const fontFamily = await priceEl.getCssValue('font-family');
          
          prices.push({
            text: priceText,
            rect: priceRect,
            fontFamily: fontFamily
          });
        }

        const pricesWithDecimals = prices.filter(p => p.text.includes('.'));
        
        if (pricesWithDecimals.length >= 2) {
          const fontFamilies = pricesWithDecimals.map(p => p.fontFamily);
          const uniqueFonts = [...new Set(fontFamilies)];
          expect(uniqueFonts.length).to.be.lessThan(3);

          const heights = pricesWithDecimals.map(p => p.rect.height);
          const heightDifference = Math.max(...heights) - Math.min(...heights);
          expect(heightDifference).to.be.lessThan(5);
        }
      }
    });
  });
});