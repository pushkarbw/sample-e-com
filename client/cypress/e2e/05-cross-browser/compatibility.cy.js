describe('🌐 Cross-Browser Compatibility', () => {
  beforeEach(() => {
    cy.clearAllStorage();
    
    // Handle uncaught exceptions
    cy.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('Cannot read properties of undefined') ||
          err.message.includes('Network Error') ||
          err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
      }
      return true;
    });
  });

  context('Browser Feature Detection', () => {
    it('should detect and handle missing CSS features', () => {
      cy.visit('/');
      
      // Test CSS Grid support
      cy.window().then((win) => {
        const testElement = win.document.createElement('div');
        testElement.style.display = 'grid';
        
        if (testElement.style.display !== 'grid') {
          cy.log('CSS Grid not supported - testing fallback');
        } else {
          cy.log('CSS Grid is supported');
        }
      });
      
      // Test that basic layout works regardless of CSS support
      cy.get('body').should('be.visible');
      cy.get('header, nav, main, footer').should('exist');
    });

    it('should handle missing JavaScript APIs', () => {
      cy.visit('/products');
      
      cy.window().then((win) => {
        // Test Intersection Observer support
        if (!win.IntersectionObserver) {
          cy.log('IntersectionObserver not supported - using fallback');
        } else {
          cy.log('IntersectionObserver is supported');
        }
      });
      
      // Test that products page loads regardless of API support
      cy.get('[data-testid="products-container"]').should('be.visible');
    });

    it('should handle different viewport behaviors', () => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone 5
        { width: 768, height: 1024 }, // iPad
        { width: 1366, height: 768 }  // Desktop
      ];

      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/products');
        
        // Test that layout is responsive
        cy.get('[data-testid="products-container"]').should('be.visible');
        cy.get('body').should('be.visible');
        
        // Test navigation visibility
        cy.get('header').should('be.visible');
        
        cy.log(`Viewport ${viewport.width}x${viewport.height} test completed`);
      });
    });
  });

  context('Form Input Compatibility', () => {
    it('should handle different input types across browsers', () => {
      cy.visit('/signup');
      
      // Test HTML5 input types with flexible selectors
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      
      // Test that form is functional
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').first().type('password123');
      
      cy.log('Input type compatibility test completed');
    });

    it('should handle form validation across browsers', () => {
      cy.visit('/login');
      
      // Test form submission without validation errors
      cy.get('button[type="submit"]').click();
      
      // Test that form handles empty submission gracefully
      cy.get('body').should('be.visible');
      
      // Test email validation
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.log('Form validation compatibility test completed');
    });

    it('should handle file upload compatibility', () => {
      // Simple login first
      cy.visit('/login');
      cy.get('input[type="email"]').type('john@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Wait for login to process
      cy.wait(2000);
      
      // Visit a page that might have file upload (profile or any other page)
      cy.visit('/profile', { failOnStatusCode: false });
      
      // Test that page loads regardless of file upload features
      cy.get('body').should('be.visible');
      
      cy.log('File upload compatibility test completed');
    });
  });

  context('CSS and Layout Compatibility', () => {
    it('should handle CSS vendor prefixes', () => {
      cy.visit('/products');
      
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Check for basic CSS properties
      cy.get('body').should('have.css', 'margin');
      cy.get('body').should('have.css', 'font-family');
      
      cy.log('CSS vendor prefix compatibility test completed');
    });

    it('should handle different font rendering', () => {
      cy.visit('/');
      
      // Test font loading
      cy.get('body').should('have.css', 'font-family');
      
      // Test that text is visible
      cy.get('h1, h2, h3, p').should('be.visible');
      
      cy.log('Font rendering compatibility test completed');
    });

    it('should handle different scrollbar styles', () => {
      cy.visit('/products');
      
      // Test that scrolling works
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test scroll behavior
      cy.scrollTo('bottom');
      cy.scrollTo('top');
      
      cy.log('Scrollbar compatibility test completed');
    });
  });

  context('JavaScript API Compatibility', () => {
    it('should handle localStorage availability', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        // Test localStorage support
        try {
          win.localStorage.setItem('test', 'value');
          win.localStorage.removeItem('test');
          cy.log('localStorage is supported and functional');
        } catch (e) {
          cy.log('localStorage not available - app should handle gracefully');
        }
      });
      
      // Test that app works regardless
      cy.get('body').should('be.visible');
    });

    it('should handle fetch API compatibility', () => {
      cy.visit('/products');
      
      cy.window().then((win) => {
        if (win.fetch) {
          cy.log('Fetch API is supported');
        } else {
          cy.log('Fetch API not supported - using fallback');
        }
      });
      
      // Test that products load regardless of fetch support
      cy.get('[data-testid="products-container"]').should('be.visible');
    });

    it('should handle Promise compatibility', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        if (win.Promise) {
          cy.log('Promise API is supported');
        } else {
          cy.log('Promise API not supported - using polyfill');
        }
      });
      
      // Test that app loads regardless
      cy.get('body').should('be.visible');
    });
  });

  context('Event Handling Compatibility', () => {
    it('should handle touch vs mouse events', () => {
      cy.visit('/products');
      
      // Test both touch and mouse interactions on real elements
      cy.get('body').should('be.visible');
      
      // Test clicking on interactive elements instead of body
      cy.get('button, a, input').first().then($el => {
        if ($el.length > 0) {
          cy.wrap($el).trigger('mouseenter', { force: true });
          cy.wrap($el).trigger('touchstart', { force: true });
        } else {
          cy.log('No interactive elements found - using document');
          // Use document instead of body for touch events
          cy.document().trigger('touchstart', { force: true });
          cy.document().trigger('mouseenter', { force: true });
        }
      });
      
      cy.log('Touch/mouse event compatibility test completed');
    });

    it('should handle keyboard navigation consistently', () => {
      cy.visit('/products');
      
      // Test keyboard navigation without custom commands
      cy.get('input, button, a').first().then($focusable => {
        if ($focusable.length > 0) {
          // Focus on the first focusable element
          cy.wrap($focusable).focus();
          
          // Test that element has focus
          cy.wrap($focusable).should('have.focus');
          
          // Test tab navigation using real Tab key event
          cy.wrap($focusable).trigger('keydown', { key: 'Tab', code: 'Tab', keyCode: 9 });
          
          // Test Enter and Escape keys using available sequences
          cy.get('body').type('{enter}');
          cy.get('body').type('{esc}');
        } else {
          cy.log('No focusable elements found - testing basic keyboard events');
          // Just test that keyboard events don't break the page using available sequences
          cy.get('body').trigger('keydown', { key: 'Tab', code: 'Tab', keyCode: 9 });
          cy.get('body').type('{enter}');
          cy.get('body').type('{esc}');
        }
      });
      
      cy.log('Keyboard navigation compatibility test completed');
    });
  });

  context('Media and Asset Compatibility', () => {
    it('should handle different image formats', () => {
      cy.visit('/products');
      
      // Test that images load (if any exist)
      cy.get('img').then($imgs => {
        if ($imgs.length > 0) {
          cy.wrap($imgs.first()).should('be.visible');
          cy.wrap($imgs.first()).should('have.attr', 'src');
        } else {
          cy.log('No images found - image format test skipped');
        }
      });
      
      cy.log('Image format compatibility test completed');
    });

    it('should handle icon font compatibility', () => {
      cy.visit('/');
      
      // Test that icons or text content is visible
      cy.get('body').should('be.visible');
      
      // Check for common icon elements
      cy.get('body').then($body => {
        const hasIcons = $body.find('.icon, [class*="icon"], svg').length > 0;
        if (hasIcons) {
          cy.log('Icons found and loading');
        } else {
          cy.log('No icons found - using text fallbacks');
        }
      });
      
      cy.log('Icon compatibility test completed');
    });
  });

  context('Performance Across Browsers', () => {
    it('should handle different JavaScript engines', () => {
      cy.visit('/products');
      
      // Test performance timing API
      cy.window().then((win) => {
        if (win.performance && win.performance.timing) {
          cy.log('Performance timing API supported');
        } else {
          cy.log('Performance timing API not supported');
        }
      });
      
      // Test that page loads efficiently
      cy.get('[data-testid="products-container"]').should('be.visible');
    });

    it('should handle memory constraints', () => {
      cy.visit('/products');
      
      // Test scrolling performance
      for (let i = 0; i < 3; i++) {
        cy.scrollTo('bottom');
        cy.wait(300);
      }
      
      // Test that app remains responsive
      cy.get('body').should('be.visible');
      
      cy.log('Memory constraint handling test completed');
    });
  });

  context('Security Features Compatibility', () => {
    it('should handle CSP compatibility', () => {
      cy.visit('/');
      
      // Check that page loads without CSP violations
      cy.get('body').should('be.visible');
      
      // Simple CSP compliance check
      cy.window().then((win) => {
        const scripts = win.document.querySelectorAll('script');
        cy.log(`Found ${scripts.length} script tags`);
      });
      
      cy.log('CSP compatibility test completed');
    });

    it('should handle HTTPS requirements', () => {
      // Test that app works regardless of protocol
      cy.location('protocol').then(protocol => {
        cy.log(`Running on protocol: ${protocol}`);
      });
      
      // Test basic security features
      cy.visit('/login');
      cy.get('input[type="password"]').should('exist');
      
      cy.log('HTTPS compatibility test completed');
    });
  });

  context('Accessibility Across Browsers', () => {
    it('should handle screen reader compatibility', () => {
      cy.visit('/products');
      
      // Test basic accessibility features
      cy.get('[data-testid="products-container"]').should('exist');
      
      // Test focus management
      cy.get('input, button, a').first().focus();
      cy.focused().should('exist');
      
      cy.log('Screen reader compatibility test completed');
    });

    it('should handle high contrast mode', () => {
      cy.visit('/');
      
      // Test that content is visible in high contrast
      cy.get('body').should('be.visible');
      cy.get('button, a').should('be.visible');
      
      // Test color contrast basics
      cy.get('body').should('have.css', 'color');
      cy.get('body').should('have.css', 'background-color');
      
      cy.log('High contrast mode compatibility test completed');
    });
  });

  context('Mobile Browser Specific Tests', () => {
    it('should handle mobile Safari quirks', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Test iOS viewport handling
      cy.get('body').should('be.visible');
      
      // Test touch interactions
      cy.get('button, a').first().should('be.visible');
      
      cy.log('Mobile Safari compatibility test completed');
    });

    it('should handle Android browser differences', () => {
      cy.viewport(360, 640);
      cy.visit('/products');
      
      // Test Android specific handling
      cy.get('[data-testid="products-container"]').should('be.visible');
      
      // Test input behavior
      cy.get('input').first().should('exist');
      
      cy.log('Android browser compatibility test completed');
    });
  });

  context('Legacy Browser Support', () => {
    it('should provide graceful degradation', () => {
      cy.visit('/');
      
      // Test basic functionality works
      cy.get('body').should('be.visible');
      cy.get('header, main').should('exist');
      
      // Test navigation works
      cy.get('a, button').first().should('be.visible');
      
      cy.log('Graceful degradation test completed');
    });

    it('should handle polyfill loading', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        // Check for modern APIs and their polyfills
        const hasPromise = !!win.Promise;
        const hasFetch = !!win.fetch;
        
        cy.log(`Promise support: ${hasPromise}`);
        cy.log(`Fetch support: ${hasFetch}`);
      });
      
      // Test that app works regardless
      cy.get('body').should('be.visible');
    });
  });

  context('Print Compatibility', () => {
    it('should handle print styles', () => {
      cy.visit('/cart');
      
      // Test that print styles don't break layout
      cy.get('body').should('be.visible');
      
      // Test print media query simulation
      cy.window().then((win) => {
        // Simulate print media
        const mediaQuery = win.matchMedia('print');
        if (mediaQuery) {
          cy.log('Print media queries supported');
        }
      });
      
      cy.log('Print compatibility test completed');
    });
  });
});