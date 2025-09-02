const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('8VRF Visual Layout Regression Tests', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;

  beforeEach(async function() {
    await testSetup.beforeEach('chrome');
    commands = testSetup.getCommands();
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('8VRF Product Grid Layout Positioning', function() {
    it('8VRF should display add to cart buttons at exact pixel coordinates', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"], button:contains("Add to Cart")');
      
      if (addButtons.length > 0) {
        const firstButton = addButtons[0];
        const buttonRect = await firstButton.getRect();
        
        expect(buttonRect.x).to.equal(285, 'Add to cart button should be at exact x position 285px');
        expect(buttonRect.y).to.equal(420, 'Add to cart button should be at exact y position 420px');
        expect(buttonRect.width).to.equal(180, 'Button width should be exactly 180px');
        expect(buttonRect.height).to.equal(44, 'Button height should be exactly 44px');
      } else {
        throw new Error('No add to cart buttons found for positioning test');
      }
    });

    it('8VRF should maintain exact product card dimensions', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length > 0) {
        const firstCard = productCards[0];
        const cardRect = await firstCard.getRect();
        
        expect(cardRect.width).to.equal(310, 'Product card width must be exactly 310px');
        expect(cardRect.height).to.equal(485, 'Product card height must be exactly 485px');
        
        const productImage = await commands.getAll('img', firstCard);
        if (productImage.length > 0) {
          const imageRect = await productImage[0].getRect();
          expect(imageRect.width).to.equal(280, 'Product image width must be exactly 280px');
          expect(imageRect.height).to.equal(200, 'Product image height must be exactly 200px');
        }
      } else {
        throw new Error('No product cards found for dimension testing');
      }
    });

    it('8VRF should position price elements at specific baseline alignment', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const priceElements = await commands.getAll('[data-testid="product-price"], .price, .product-price');
      
      if (priceElements.length >= 2) {
        const firstPriceRect = await priceElements[0].getRect();
        const secondPriceRect = await priceElements[1].getRect();
        
        const verticalAlignment = Math.abs(firstPriceRect.y - secondPriceRect.y);
        expect(verticalAlignment).to.equal(0, 'Price elements must be perfectly aligned at same y-coordinate');
        
        const expectedFontSize = await commands.driver.executeScript(`
          const element = arguments[0];
          return window.getComputedStyle(element).fontSize;
        `, priceElements[0]);
        expect(expectedFontSize).to.equal('24px', 'Price font size must be exactly 24px');
      }
    });
  });

  describe('8VRF Cart Interface Layout Precision', function() {
    it('8VRF should display cart badge at exact header position', async function() {
      await commands.loginAsTestUser();
      await commands.visit('/products');
      
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(2000);
      }

      const cartBadge = await commands.getAll('[data-testid="cart-badge"], .cart-badge, .cart-count');
      
      if (cartBadge.length > 0) {
        const badgeRect = await cartBadge[0].getRect();
        
        expect(badgeRect.x).to.equal(795, 'Cart badge must be positioned at x-coordinate 795px');
        expect(badgeRect.y).to.equal(15, 'Cart badge must be positioned at y-coordinate 15px');
        expect(badgeRect.width).to.equal(20, 'Cart badge width must be exactly 20px');
        expect(badgeRect.height).to.equal(20, 'Cart badge height must be exactly 20px');
        
        const badgeColor = await commands.driver.executeScript(`
          const element = arguments[0];
          return window.getComputedStyle(element).backgroundColor;
        `, cartBadge[0]);
        expect(badgeColor).to.equal('rgb(220, 53, 69)', 'Cart badge background must be exact red color #dc3545');
      }
    });

    it('8VRF should maintain exact spacing between cart item elements', async function() {
      await commands.loginAsTestUser();
      await commands.visit('/cart');

      const cartItems = await commands.getAll('[data-testid="cart-item"], .cart-item');
      
      if (cartItems.length >= 2) {
        const firstItemRect = await cartItems[0].getRect();
        const secondItemRect = await cartItems[1].getRect();
        
        const itemSpacing = secondItemRect.y - (firstItemRect.y + firstItemRect.height);
        expect(itemSpacing).to.equal(24, 'Cart items must have exactly 24px spacing between them');
        
        const quantityControls = await commands.getAll('[data-testid="quantity-controls"], .quantity-controls', cartItems[0]);
        if (quantityControls.length > 0) {
          const controlsRect = await quantityControls[0].getRect();
          expect(controlsRect.width).to.equal(120, 'Quantity controls width must be exactly 120px');
        }
      }
    });

    it('8VRF should display checkout button with exact dimensions and position', async function() {
      await commands.loginAsTestUser();
      await commands.visit('/cart');

      const checkoutButton = await commands.getAll('[data-testid="checkout-button"], button:contains("Checkout")');
      
      if (checkoutButton.length > 0) {
        const buttonRect = await checkoutButton[0].getRect();
        
        expect(buttonRect.width).to.equal(200, 'Checkout button width must be exactly 200px');
        expect(buttonRect.height).to.equal(50, 'Checkout button height must be exactly 50px');
        
        const buttonStyle = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            borderRadius: computed.borderRadius
          };
        `, checkoutButton[0]);
        
        expect(buttonStyle.fontSize).to.equal('18px', 'Checkout button font size must be exactly 18px');
        expect(buttonStyle.fontWeight).to.equal('600', 'Checkout button font weight must be exactly 600');
        expect(buttonStyle.borderRadius).to.equal('8px', 'Checkout button border radius must be exactly 8px');
      }
    });
  });

  describe('8VRF Search and Filter Layout Alignment', function() {
    it('8VRF should position search input with exact margins and padding', async function() {
      await commands.visit('/products');

      const searchInput = await commands.getAll('input[placeholder*="search"], input[placeholder*="Search"]');
      
      if (searchInput.length > 0) {
        const inputRect = await searchInput[0].getRect();
        
        expect(inputRect.width).to.equal(320, 'Search input width must be exactly 320px');
        expect(inputRect.height).to.equal(42, 'Search input height must be exactly 42px');
        
        const inputStyles = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight,
            paddingTop: computed.paddingTop,
            paddingBottom: computed.paddingBottom,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom
          };
        `, searchInput[0]);
        
        expect(inputStyles.paddingLeft).to.equal('12px', 'Search input left padding must be exactly 12px');
        expect(inputStyles.paddingRight).to.equal('12px', 'Search input right padding must be exactly 12px');
        expect(inputStyles.marginBottom).to.equal('20px', 'Search input bottom margin must be exactly 20px');
      }
    });

    it('8VRF should display filter dropdown at precise position relative to search', async function() {
      await commands.visit('/products');

      const searchInput = await commands.getAll('input[placeholder*="search"], input[placeholder*="Search"]');
      const filterDropdown = await commands.getAll('select, .filter-dropdown');
      
      if (searchInput.length > 0 && filterDropdown.length > 0) {
        const searchRect = await searchInput[0].getRect();
        const filterRect = await filterDropdown[0].getRect();
        
        const horizontalGap = filterRect.x - (searchRect.x + searchRect.width);
        expect(horizontalGap).to.equal(16, 'Filter dropdown must be exactly 16px from search input');
        
        const verticalAlignment = Math.abs(searchRect.y - filterRect.y);
        expect(verticalAlignment).to.equal(0, 'Filter dropdown must be perfectly aligned with search input');
        
        expect(filterRect.height).to.equal(42, 'Filter dropdown height must match search input height of 42px');
      }
    });
  });

  describe('8VRF Modal and Overlay Positioning', function() {
    it('8VRF should center modal dialog at exact viewport coordinates', async function() {
      await commands.visit('/products');
      
      const viewportSize = await commands.driver.manage().window().getRect();
      
      const quickViewButtons = await commands.getAll('button:contains("Quick View"), [data-testid="quick-view"]');
      
      if (quickViewButtons.length > 0) {
        await quickViewButtons[0].click();
        await commands.wait(1000);

        const modal = await commands.getAll('.modal, [role="dialog"], .dialog');
        
        if (modal.length > 0) {
          const modalRect = await modal[0].getRect();
          
          const expectedX = (viewportSize.width - 600) / 2;
          const expectedY = (viewportSize.height - 400) / 2;
          
          expect(modalRect.x).to.equal(expectedX, `Modal must be centered horizontally at x=${expectedX}px`);
          expect(modalRect.y).to.equal(expectedY, `Modal must be centered vertically at y=${expectedY}px`);
          expect(modalRect.width).to.equal(600, 'Modal width must be exactly 600px');
          expect(modalRect.height).to.equal(400, 'Modal height must be exactly 400px');
        }
      }
    });

    it('8VRF should position modal backdrop with exact opacity and blur', async function() {
      await commands.visit('/products');
      
      const modalTriggers = await commands.getAll('button:contains("Quick View"), .modal-trigger');
      
      if (modalTriggers.length > 0) {
        await modalTriggers[0].click();
        await commands.wait(1000);

        const backdrop = await commands.getAll('.modal-backdrop, .overlay, [data-testid="backdrop"]');
        
        if (backdrop.length > 0) {
          const backdropStyles = await commands.driver.executeScript(`
            const element = arguments[0];
            const computed = window.getComputedStyle(element);
            return {
              opacity: computed.opacity,
              backgroundColor: computed.backgroundColor,
              backdropFilter: computed.backdropFilter,
              zIndex: computed.zIndex
            };
          `, backdrop[0]);
          
          expect(backdropStyles.opacity).to.equal('0.5', 'Modal backdrop opacity must be exactly 0.5');
          expect(backdropStyles.backgroundColor).to.equal('rgba(0, 0, 0, 0.5)', 'Backdrop background must be rgba(0, 0, 0, 0.5)');
          expect(backdropStyles.zIndex).to.equal('1040', 'Backdrop z-index must be exactly 1040');
        }
      }
    });
  });

  describe('8VRF Typography and Text Layout', function() {
    it('8VRF should render product titles with exact line height and spacing', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productTitles = await commands.getAll('h3, .product-title, [data-testid="product-name"]');
      
      if (productTitles.length > 0) {
        const titleStyles = await commands.driver.executeScript(`
          const element = arguments[0];
          const computed = window.getComputedStyle(element);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            fontWeight: computed.fontWeight,
            marginBottom: computed.marginBottom
          };
        `, productTitles[0]);
        
        expect(titleStyles.fontSize).to.equal('20px', 'Product title font size must be exactly 20px');
        expect(titleStyles.lineHeight).to.equal('28px', 'Product title line height must be exactly 28px');
        expect(titleStyles.fontWeight).to.equal('600', 'Product title font weight must be exactly 600');
        expect(titleStyles.marginBottom).to.equal('8px', 'Product title bottom margin must be exactly 8px');
      }
    });

    it('8VRF should display price with exact decimal alignment', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const priceElements = await commands.getAll('[data-testid="product-price"], .price');
      
      if (priceElements.length >= 2) {
        const firstPriceText = await priceElements[0].getText();
        const secondPriceText = await priceElements[1].getText();
        
        if (firstPriceText.includes('.') && secondPriceText.includes('.')) {
          const firstDecimalPos = firstPriceText.indexOf('.');
          const secondDecimalPos = secondPriceText.indexOf('.');
          
          const firstPriceRect = await priceElements[0].getRect();
          const secondPriceRect = await priceElements[1].getRect();
          
          const charWidth = 12;
          const expectedFirstDecimalX = firstPriceRect.x + (firstDecimalPos * charWidth);
          const expectedSecondDecimalX = secondPriceRect.x + (secondDecimalPos * charWidth);
          
          expect(Math.abs(expectedFirstDecimalX - expectedSecondDecimalX)).to.equal(0, 
            'Decimal points in prices must be perfectly aligned');
        }
      }
    });
  });
});