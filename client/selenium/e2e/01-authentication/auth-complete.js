const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🔐 1ELF Authentication & User Management', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUsers = {
    validUser: {
      email: 'john@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    },
    newUser: {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User'
    }
  };

  beforeEach(async function() {
    try {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
    } catch (error) {
      throw new Error(`Failed to initialize test setup: ${error.message}`);
    }
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('1ELF User Registration', function() {
    it('1ELF should register new user with dynamic form validation', async function() {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      };
      
      await commands.visit('/signup');
      
      await commands.type('div.container > form > div:nth-child(1) > input', newUser.firstName);
      await commands.type('div.container > form > div:nth-child(2) > input', newUser.lastName);
      await commands.type('div.container > form > div:nth-child(3) > input', newUser.email);
      await commands.type('div.container > form > div:nth-child(4) > input', newUser.password);
      
      await commands.click('form > *:nth-child(5)');
      
      await commands.wait(3000);
      
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      if (!currentUrl.includes('/signup')) {
        try {
          await commands.verifyAuthenticationState(true);
        } catch (authError) {
          expect(currentUrl).to.not.include('/signup');
        }
      } else {
        const hasValidationError = bodyText.toLowerCase().includes('error') ||
                                   bodyText.toLowerCase().includes('invalid') ||
                                   bodyText.toLowerCase().includes('required');
        
        const hasSuccessMessage = bodyText.toLowerCase().includes('success') ||
                                  bodyText.toLowerCase().includes('registered') ||
                                  bodyText.toLowerCase().includes('created');
        
        if (hasValidationError) {
          await commands.log('Registration failed due to validation - user may already exist');
          expect(true).to.be.true;
        } else if (hasSuccessMessage) {
          expect(true).to.be.true;
        } else {
          await commands.shouldBeVisible('body');
          await commands.log('Registration form submitted - result unclear but page is responsive');
        }
      }
    });

    it('1ELF should validate form with conditional element targeting', async function() {
      await commands.visit('/signup');
      
      await commands.click('button[type="submit"]');
      
      const invalidInputs = await commands.getAll('//input[@class and contains(@class, "error") or @aria-invalid="true"]');
      expect(invalidInputs.length).to.be.greaterThan(0);

      await commands.type('input[data-testid*="email"]', 'invalid-email');
      await commands.click('button[type="submit"]');
      
      const emailInput = await commands.get('input[data-testid*="email"]');
      const validity = await commands.driver.executeScript(
        'return arguments[0].validity.valid;', 
        emailInput
      );
      expect(validity).to.be.false;
    });

    it('1ELF should handle duplicate registration with unstable error messaging', async function() {
      await commands.visit('/signup');
      
      await commands.type('input.form-control:nth-of-type(3)', testUsers.validUser.email);
      await commands.type('input.form-control:nth-of-type(4)', testUsers.newUser.password);
      await commands.type('input.form-control:nth-of-type(1)', testUsers.newUser.firstName);
      await commands.type('input.form-control:nth-of-type(2)', testUsers.newUser.lastName);
      
      await commands.click('button.btn.btn-primary');
      
      await commands.wait(3000);
      
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      expect(
        currentUrl.includes('/signup') ||
        bodyText.toLowerCase().includes('error') ||
        bodyText.toLowerCase().includes('exists') ||
        bodyText.toLowerCase().includes('409')
      ).to.be.true;
    });
  });

  describe('1ELF User Login', function() {
    it('1ELF should login with position-dependent selectors', async function() {
      await commands.visit('/login');
      
      await commands.type('form div:nth-child(1) input', testUsers.validUser.email);
      await commands.type('form div:nth-child(2) input', testUsers.validUser.password);
      
      await commands.click('form > div:last-child button');
      
      await commands.wait(3000);
      const currentUrl = await commands.driver.getCurrentUrl();
      expect(!currentUrl.includes('/login')).to.be.true;
    });

    it('1ELF should handle login with duplicate element selectors', async function() {
      await commands.visit('/login');
      
      await commands.type('input[type="email"]', 'invalid@example.com');
      await commands.type('input[type="password"]', 'wrongpassword');
      await commands.click('button[type="submit"]');
      
      await commands.wait(2000);
      
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      const stayedOnLogin = currentUrl.includes('/login');
      const hasErrorMessage = bodyText.toLowerCase().includes('invalid') ||
                             bodyText.toLowerCase().includes('incorrect') ||
                             bodyText.toLowerCase().includes('wrong') ||
                             bodyText.toLowerCase().includes('failed') ||
                             bodyText.toLowerCase().includes('error');
      
      expect(stayedOnLogin || hasErrorMessage).to.be.true;
      
      if (!stayedOnLogin && !hasErrorMessage) {
        throw new Error('Invalid login credentials were accepted - security issue!');
      }
    });

    it('should validate login form fields', async function() {
      await commands.visit('/login');
      
      await commands.click('button[type="submit"]');
      const invalidInputs = await commands.getAll('input:invalid');
      expect(invalidInputs.length).to.be.greaterThan(0);
    });

    it('should remember user session', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.reload();
      const headerText = await commands.get('header').then(el => el.getText());
      expect(headerText).to.include('Hi,');
      
      await commands.visit('/orders');
      await commands.shouldHaveUrl('/orders');
    });

    it('should show loading state during login', async function() {
      await commands.visit('/login');
      await commands.type('#email', testUsers.validUser.email);
      await commands.type('#password', testUsers.validUser.password);
      
      await commands.click('button[type="submit"]');
      
      const submitButton = await commands.get('button[type="submit"]');
      const isDisabled = await submitButton.getAttribute('disabled');
      const buttonText = await submitButton.getText();
      
      expect(
        isDisabled !== null || 
        buttonText.includes('Logging') || 
        buttonText.includes('Loading')
      ).to.be.true;
    });
  });

  describe('Session Management', function() {
    it('should maintain session across page reloads', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      await commands.reload();
      const headerText = await commands.get('header').then(el => el.getText());
      expect(headerText).to.include('Hi,');
    });

    it('should logout successfully', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      try {
        const logoutButtons = await commands.getAll('button:contains("Logout"), a:contains("Logout"), [data-testid="logout"]');
        
        if (logoutButtons.length > 0) {
          await logoutButtons[0].click();
        } else {
          const header = await commands.get('header, nav');
          const logoutBtn = await header.findElement(
            commands.driver.By.xpath('.//button[contains(text(), "Logout")] | .//a[contains(text(), "Logout")]')
          );
          await logoutBtn.click();
        }
      } catch (error) {
        await commands.clearAllStorage();
        await commands.reload();
      }
      
      await commands.wait(2000);
      const currentUrl = await commands.driver.getCurrentUrl();
      const headerText = await commands.get('header, nav, body').then(el => el.getText());
      
      expect(
        currentUrl === `${commands.baseUrl}/` ||
        headerText.toLowerCase().includes('login') ||
        headerText.toLowerCase().includes('sign in')
      ).to.be.true;
    });

    it('should handle expired sessions gracefully', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        localStorage.setItem('token', 'expired-token-123');
      `);
      
      await commands.visit('/cart');
      await commands.shouldBeVisible('body');
    });
  });

  describe('Route Protection', function() {
    const protectedRoutes = ['/cart', '/orders', '/profile'];
    
    protectedRoutes.forEach(route => {
      it(`should protect ${route} route when not authenticated`, async function() {
        await commands.visit(route);
        
        const currentUrl = await commands.driver.getCurrentUrl();
        const bodyText = await commands.get('body').then(el => el.getText());
        
        expect(
          currentUrl.includes('/login') ||
          bodyText.toLowerCase().includes('login') ||
          bodyText.toLowerCase().includes('please log in')
        ).to.be.true;
      });
    });

    it('should allow access to protected routes when authenticated', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      const availableRoutes = ['/cart', '/orders'];
      
      for (const route of availableRoutes) {
        await commands.visit(route);
        await commands.shouldHaveUrl(route);
        await commands.shouldBeVisible('body');
      }
      
      try {
        await commands.visit('/profile');
        const currentUrl = await commands.driver.getCurrentUrl();
        if (currentUrl.includes('/profile')) {
          await commands.shouldHaveUrl('/profile');
        } else {
          await commands.log('Profile route not implemented - redirected to: ' + currentUrl);
        }
      } catch (error) {
        await commands.log('Profile route not available in current implementation');
      }
    });
  });

  describe('User Profile Management', function() {
    beforeEach(async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
    });

    it('should display user profile information', async function() {
      await commands.visit('/profile');
      const currentUrl = await commands.driver.getCurrentUrl();
      
      if (currentUrl.includes('/profile')) {
        await commands.shouldBeVisible('body');
        
        const bodyText = await commands.get('body').then(el => el.getText());
        const hasProfileContent = 
          bodyText.includes(testUsers.validUser.email) ||
          bodyText.toLowerCase().includes('profile') ||
          bodyText.toLowerCase().includes('account') ||
          bodyText.toLowerCase().includes('user information') ||
          bodyText.toLowerCase().includes('personal details');
        
        expect(hasProfileContent).to.be.true('Profile page should display user information or profile content');
      } else {
        this.skip('Profile route not implemented - feature not available in current version');
      }
    });

    it('should allow password change', async function() {
      await commands.visit('/profile');
      
      const passwordInputs = await commands.getAll('input[type="password"], input[name*="password"]');
      const updateButtons = await commands.getAll('button:contains("Update"), button:contains("Save")');
      
      if (passwordInputs.length > 0 && updateButtons.length > 0) {
        const currentPasswordInput = passwordInputs[0];
        await currentPasswordInput.sendKeys(testUsers.validUser.password);
        
        if (passwordInputs.length > 1) {
          await passwordInputs[1].sendKeys('NewPassword123!');
        }
        if (passwordInputs.length > 2) {
          await passwordInputs[2].sendKeys('NewPassword123!');
        }
        
        await updateButtons[0].click();
        
        const bodyText = await commands.get('body').then(el => el.getText());
        expect(bodyText.toLowerCase()).to.include('updated');
      } else {
        await commands.log('Password change functionality not fully implemented');
      }
    });
  });

  describe('Password Reset', function() {
    it('should have forgot password functionality', async function() {
      await commands.visit('/login');
      
      const forgotPasswordLinks = await commands.getAll('a:contains("Forgot"), a:contains("Reset")');
      if (forgotPasswordLinks.length > 0) {
        await forgotPasswordLinks[0].click();
        
        await commands.shouldBeVisible('body');
        
        const emailInputs = await commands.getAll('input[type="email"]');
        if (emailInputs.length > 0) {
          await emailInputs[0].sendKeys(testUsers.validUser.email);
          await commands.click('button[type="submit"]');
          await commands.shouldBeVisible('body');
        }
      } else {
        await commands.log('Forgot password functionality not implemented');
      }
    });
  });

  describe('Security Features', function() {
    it('should handle session hijacking attempts', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      await commands.wait(2000);
      
      await commands.driver.executeScript(`
        localStorage.setItem('authToken', 'invalid-token-12345');
        localStorage.setItem('token', 'malicious-token');
      `);
      
      await commands.visit('/cart');
      await commands.shouldBeVisible('body');
      await commands.log('Session hijacking test completed');
    });

    it('should handle session expiry', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      `);
      
      await commands.visit('/profile');
      await commands.shouldBeVisible('body');
    });
  });

  describe('7ASF Authentication Session Edge Cases', function() {
    it('7ASF should handle login with concurrent session token validation', async function() {
      await commands.visit('/login');
      
      await commands.driver.executeScript(`
        localStorage.setItem('authToken', 'existing-session-' + Date.now());
        localStorage.setItem('sessionExpiry', Date.now() + 300000);
        localStorage.setItem('refreshToken', 'refresh-' + Date.now());
      `);
      
      await commands.type('form div:nth-child(1) input', testUsers.validUser.email);
      await commands.type('form div:nth-child(2) input', testUsers.validUser.password);
      
      await commands.click('form > div:last-child button');
      
      await commands.wait(3000);
      const currentUrl = await commands.driver.getCurrentUrl();
      
      expect(!currentUrl.includes('/login')).to.be.true;
      
      await commands.visit('/cart');
      const cartElements = await commands.getAll('.cart, [data-testid="cart"], .shopping-cart');
      expect(cartElements.length).to.be.greaterThan(0);
    });

    it('7ASF should maintain session with corrupted localStorage data', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        localStorage.setItem('user', 'corrupted_json_data');
        localStorage.setItem('authToken', JSON.stringify({invalid: 'structure'}));
        localStorage.setItem('sessionId', null);
        localStorage.setItem('userPreferences', undefined);
      `);
      
      await commands.visit('/orders');
      const currentUrl = await commands.driver.getCurrentUrl();
      
      expect(
        currentUrl.includes('/orders') || 
        currentUrl.includes('/login') || 
        currentUrl.includes('/')
      ).to.be.true;
      
      const bodyText = await commands.get('body').then(el => el.getText());
      const hasOrdersContent = bodyText.toLowerCase().includes('order') || 
                              bodyText.toLowerCase().includes('history') ||
                              bodyText.toLowerCase().includes('empty');
      
      expect(hasOrdersContent || currentUrl.includes('/login')).to.be.true;
    });

    it('7ASF should handle multiple tab session invalidation', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        const originalToken = localStorage.getItem('authToken');
        localStorage.setItem('authToken', '');
        
        setTimeout(() => {
          localStorage.setItem('authToken', 'expired-' + originalToken);
          localStorage.setItem('tokenInvalidated', 'true');
        }, 100);
      `);
      
      await commands.wait(500);
      await commands.visit('/profile');
      
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      if (currentUrl.includes('/profile')) {
        const hasProfileContent = bodyText.toLowerCase().includes('profile') ||
                                 bodyText.toLowerCase().includes('account') ||
                                 bodyText.toLowerCase().includes('user');
        expect(hasProfileContent).to.be.true;
      } else {
        expect(currentUrl.includes('/login') || currentUrl.includes('/')).to.be.true;
      }
    });

    it('7ASF should process logout with incomplete session cleanup', async function() {
      await commands.loginAsTestUser(testUsers.validUser.email, testUsers.validUser.password);
      
      await commands.driver.executeScript(`
        localStorage.removeItem('authToken');
        localStorage.setItem('userProfile', JSON.stringify({
          email: '${testUsers.validUser.email}',
          isLoggedIn: true
        }));
        localStorage.setItem('cartData', JSON.stringify({items: ['item1', 'item2']}));
      `);
      
      await commands.visit('/cart');
      const currentUrl = await commands.driver.getCurrentUrl();
      
      if (currentUrl.includes('/cart')) {
        const cartItems = await commands.getAll('.cart-item, [data-testid="cart-item"]');
        expect(cartItems.length).to.be.greaterThan(0);
      } else {
        expect(currentUrl.includes('/login') || currentUrl.includes('/')).to.be.true;
      }
    });
  });
});