const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('8VRF Responsive Visual Layout Tests', function() {
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

  describe('8VRF Mobile Layout Precision', function() {
    it('8VRF should display navigation menu at exact mobile breakpoint', async function() {
      await commands.driver.manage().window().setRect({ width: 768, height: 1024 });
      await commands.visit('/');

      const navMenu = await commands.getAll('nav, .navbar, [data-testid="navigation"]');
      
      if (navMenu.length > 0) {
        const menuRect = await navMenu[0].getRect();
        
        expect(menuRect.width).to.equal(768, 'Navigation must span exactly 768px at mobile breakpoint');
        expect(menuRect.height).to.equal(60, 'Navigation height must be exactly 60px on mobile');
        
        const menuItems = await commands.getAll('nav a, .nav-link', navMenu[0]);
        if (menuItems.length > 0) {
          const firstItemRect = await menuItems[0].getRect();
          expect(firstItemRect.height).to.equal(48, 'Mobile nav items must be exactly 48px tall for touch targets');
        }
      }
    });

    it('8VRF should stack product cards in single column on mobile', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 2) {
        const firstCardRect = await productCards[0].getRect();
        const secondCardRect = await productCards[1].getRect();
        
        expect(firstCardRect.width).to.equal(343, 'Mobile product cards must be exactly 343px wide (375px - 32px margin)');
        expect(secondCardRect.width).to.equal(343, 'All mobile product cards must have identical width');
        
        const verticalSpacing = secondCardRect.y - (firstCardRect.y + firstCardRect.height);
        expect(verticalSpacing).to.equal(20, 'Mobile product cards must have exactly 20px vertical spacing');
        
        const horizontalAlignment = Math.abs(firstCardRect.x - secondCardRect.x);
        expect(horizontalAlignment).to.equal(0, 'Mobile cards must be perfectly aligned in single column');
      }
    });

    it('8VRF should position mobile cart button at exact bottom coordinates', async function() {
      await commands.driver.manage().window().setRect({ width: 375, height: 667 });
      await commands.loginAsTestUser();
      await commands.visit('/products');

      const mobileCartButton = await commands.getAll('[data-testid="mobile-cart"], .mobile-cart-button');
      
      if (mobileCartButton.length > 0) {
        const buttonRect = await mobileCartButton[0].getRect();
        
        expect(buttonRect.y).to.equal(607, 'Mobile cart button must be positioned at y=607px (667px - 60px)');
        expect(buttonRect.width).to.equal(343, 'Mobile cart button must span 343px width');
        expect(buttonRect.height).to.equal(50, 'Mobile cart button must be exactly 50px tall');
        expect(buttonRect.x).to.equal(16, 'Mobile cart button must be positioned 16px from left edge');
      }
    });
  });

  describe('8VRF Tablet Layout Constraints', function() {
    it('8VRF should display exactly two product columns on tablet', async function() {
      await commands.driver.manage().window().setRect({ width: 768, height: 1024 });
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 4) {
        const positions = [];
        for (let i = 0; i < 4; i++) {
          const rect = await productCards[i].getRect();
          positions.push(rect);
        }
        
        const leftColumnX = positions[0].x;
        const rightColumnX = positions[1].x;
        
        expect(positions[0].width).to.equal(364, 'Tablet product cards must be exactly 364px wide');
        expect(positions[1].width).to.equal(364, 'Second column cards must match first column width');
        
        const columnGap = rightColumnX - (leftColumnX + positions[0].width);
        expect(columnGap).to.equal(20, 'Tablet columns must have exactly 20px gap');
        
        expect(Math.abs(positions[2].x - leftColumnX)).to.equal(0, 'Third card must align with first (left column)');
        expect(Math.abs(positions[3].x - rightColumnX)).to.equal(0, 'Fourth card must align with second (right column)');
      }
    });

    it('8VRF should maintain exact header proportions on tablet', async function() {
      await commands.driver.manage().window().setRect({ width: 768, height: 1024 });
      await commands.visit('/');

      const header = await commands.getAll('header, .header, [data-testid="header"]');
      
      if (header.length > 0) {
        const headerRect = await header[0].getRect();
        
        expect(headerRect.width).to.equal(768, 'Header must span full tablet width');
        expect(headerRect.height).to.equal(80, 'Header height must be exactly 80px on tablet');
        
        const logo = await commands.getAll('[data-testid="logo"], .logo', header[0]);
        if (logo.length > 0) {
          const logoRect = await logo[0].getRect();
          expect(logoRect.x).to.equal(24, 'Logo must be positioned 24px from left edge on tablet');
          expect(logoRect.height).to.equal(40, 'Logo height must be exactly 40px on tablet');
        }
      }
    });
  });

  describe('8VRF Desktop Grid Layout', function() {
    it('8VRF should display exactly four product columns on desktop', async function() {
      await commands.driver.manage().window().setRect({ width: 1200, height: 800 });
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productCards = await commands.getAll('[data-testid="product-card"], .product-card, .product');
      
      if (productCards.length >= 4) {
        const firstRowCards = productCards.slice(0, 4);
        const cardPositions = [];
        
        for (let card of firstRowCards) {
          const rect = await card.getRect();
          cardPositions.push(rect);
        }
        
        expect(cardPositions[0].width).to.equal(280, 'Desktop product cards must be exactly 280px wide');
        
        for (let i = 1; i < 4; i++) {
          expect(cardPositions[i].width).to.equal(280, `Card ${i+1} must match 280px width`);
          
          const expectedX = cardPositions[0].x + (i * 300);
          expect(cardPositions[i].x).to.equal(expectedX, `Card ${i+1} must be positioned at x=${expectedX}px`);
        }
        
        const rowAlignment = Math.max(...cardPositions.map(p => p.y)) - Math.min(...cardPositions.map(p => p.y));
        expect(rowAlignment).to.equal(0, 'All cards in row must be perfectly aligned');
      }
    });

    it('8VRF should position sidebar filters at exact desktop coordinates', async function() {
      await commands.driver.manage().window().setRect({ width: 1200, height: 800 });
      await commands.visit('/products');

      const sidebar = await commands.getAll('[data-testid="filters"], .filters-sidebar, .sidebar');
      
      if (sidebar.length > 0) {
        const sidebarRect = await sidebar[0].getRect();
        
        expect(sidebarRect.x).to.equal(20, 'Sidebar must be positioned 20px from left edge');
        expect(sidebarRect.width).to.equal(240, 'Sidebar width must be exactly 240px');
        expect(sidebarRect.y).to.equal(120, 'Sidebar must start 120px from top (header + margin)');
        
        const filterSections = await commands.getAll('.filter-section, .filter-group', sidebar[0]);
        if (filterSections.length >= 2) {
          const firstSectionRect = await filterSections[0].getRect();
          const secondSectionRect = await filterSections[1].getRect();
          
          const sectionSpacing = secondSectionRect.y - (firstSectionRect.y + firstSectionRect.height);
          expect(sectionSpacing).to.equal(24, 'Filter sections must have exactly 24px spacing');
        }
      }
    });

    it('8VRF should maintain exact desktop header layout', async function() {
      await commands.driver.manage().window().setRect({ width: 1200, height: 800 });
      await commands.visit('/');

      const header = await commands.getAll('header, .header, [data-testid="header"]');
      
      if (header.length > 0) {
        const headerRect = await header[0].getRect();
        
        expect(headerRect.width).to.equal(1200, 'Header must span full desktop width');
        expect(headerRect.height).to.equal(80, 'Header height must be exactly 80px');
        
        const searchBar = await commands.getAll('input[type="search"], .search-input', header[0]);
        if (searchBar.length > 0) {
          const searchRect = await searchBar[0].getRect();
          expect(searchRect.x).to.equal(400, 'Search bar must be positioned at x=400px');
          expect(searchRect.width).to.equal(320, 'Search bar width must be exactly 320px');
        }
        
        const userMenu = await commands.getAll('[data-testid="user-menu"], .user-menu', header[0]);
        if (userMenu.length > 0) {
          const menuRect = await userMenu[0].getRect();
          expect(menuRect.x).to.equal(1040, 'User menu must be positioned at x=1040px');
        }
      }
    });
  });

  describe('8VRF Image Resolution and Aspect Ratios', function() {
    it('8VRF should display product images with exact aspect ratio', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productImages = await commands.getAll('img[alt], .product-image img');
      
      if (productImages.length > 0) {
        for (let i = 0; i < Math.min(3, productImages.length); i++) {
          const imageRect = await productImages[i].getRect();
          
          expect(imageRect.width).to.equal(280, 'Product image width must be exactly 280px');
          expect(imageRect.height).to.equal(200, 'Product image height must be exactly 200px');
          
          const aspectRatio = imageRect.width / imageRect.height;
          expect(aspectRatio).to.equal(1.4, 'Product images must maintain exact 1.4:1 aspect ratio');
          
          const imageStyles = await commands.driver.executeScript(`
            const img = arguments[0];
            const computed = window.getComputedStyle(img);
            return {
              objectFit: computed.objectFit,
              borderRadius: computed.borderRadius
            };
          `, productImages[i]);
          
          expect(imageStyles.objectFit).to.equal('cover', 'Images must use object-fit: cover');
          expect(imageStyles.borderRadius).to.equal('8px', 'Images must have exactly 8px border radius');
        }
      }
    });

    it('8VRF should load high-resolution images at correct pixel density', async function() {
      await commands.visit('/products');
      await commands.waitForProductsToLoad();

      const productImages = await commands.getAll('img[src*="@2x"], img[srcset]');
      
      if (productImages.length > 0) {
        const imageMetrics = await commands.driver.executeScript(`
          const img = arguments[0];
          return {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.width,
            displayHeight: img.height,
            devicePixelRatio: window.devicePixelRatio
          };
        `, productImages[0]);
        
        const expectedNaturalWidth = imageMetrics.displayWidth * imageMetrics.devicePixelRatio;
        expect(imageMetrics.naturalWidth).to.equal(expectedNaturalWidth, 
          'Image natural width must match display width × device pixel ratio');
        
        const expectedNaturalHeight = imageMetrics.displayHeight * imageMetrics.devicePixelRatio;
        expect(imageMetrics.naturalHeight).to.equal(expectedNaturalHeight,
          'Image natural height must match display height × device pixel ratio');
      }
    });
  });

  describe('8VRF Form Layout Precision', function() {
    it('8VRF should align checkout form fields with exact spacing', async function() {
      await commands.loginAsTestUser();
      await commands.visit('/checkout');

      const formFields = await commands.getAll('input, select, textarea');
      
      if (formFields.length >= 2) {
        const firstFieldRect = await formFields[0].getRect();
        const secondFieldRect = await formFields[1].getRect();
        
        expect(firstFieldRect.width).to.equal(340, 'Form fields must be exactly 340px wide');
        expect(secondFieldRect.width).to.equal(340, 'All form fields must have matching width');
        
        const verticalSpacing = secondFieldRect.y - (firstFieldRect.y + firstFieldRect.height);
        expect(verticalSpacing).to.equal(20, 'Form fields must have exactly 20px vertical spacing');
        
        const fieldHeight = firstFieldRect.height;
        expect(fieldHeight).to.equal(44, 'Form fields must be exactly 44px tall');
        
        const fieldStyles = await commands.driver.executeScript(`
          const field = arguments[0];
          const computed = window.getComputedStyle(field);
          return {
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight,
            borderWidth: computed.borderWidth,
            borderRadius: computed.borderRadius
          };
        `, formFields[0]);
        
        expect(fieldStyles.paddingLeft).to.equal('12px', 'Form field left padding must be exactly 12px');
        expect(fieldStyles.paddingRight).to.equal('12px', 'Form field right padding must be exactly 12px');
        expect(fieldStyles.borderRadius).to.equal('6px', 'Form field border radius must be exactly 6px');
      }
    });

    it('8VRF should position form labels with exact typography', async function() {
      await commands.visit('/signup');

      const formLabels = await commands.getAll('label, .form-label');
      
      if (formLabels.length > 0) {
        const labelStyles = await commands.driver.executeScript(`
          const label = arguments[0];
          const computed = window.getComputedStyle(label);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            marginBottom: computed.marginBottom,
            color: computed.color
          };
        `, formLabels[0]);
        
        expect(labelStyles.fontSize).to.equal('14px', 'Form labels must have exactly 14px font size');
        expect(labelStyles.fontWeight).to.equal('500', 'Form labels must have font weight of 500');
        expect(labelStyles.marginBottom).to.equal('6px', 'Form labels must have exactly 6px bottom margin');
        expect(labelStyles.color).to.equal('rgb(85, 85, 85)', 'Form labels must have exact color #555');
      }
    });
  });
});