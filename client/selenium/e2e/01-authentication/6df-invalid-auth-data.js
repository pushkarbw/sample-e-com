const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const TestSetup = require('../../support/test-setup');

describe('🔐 6DF Authentication with Invalid User Data', function() {
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

  describe('6DF Registration Form Validation', function() {
    it('6DF should accept registration with inconsistent password validation', async function() {
      await commands.visit('/register');
      await commands.wait(1000);

      const emailFields = await commands.getAll('input[type="email"], input[name*="email"]');
      if (emailFields.length > 0) {
        await emailFields[0].sendKeys('test@domain.co');
      }

      const passwordFields = await commands.getAll('input[type="password"], input[name*="password"]');
      if (passwordFields.length >= 2) {
        await passwordFields[0].sendKeys('Ecomm@123');
        await passwordFields[1].sendKeys('password124');
      }

      const nameFields = await commands.getAll('input[name*="firstName"], input[name*="name"]');
      if (nameFields.length > 0) {
        await nameFields[0].sendKeys('');
      }

      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Register")');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(2000);

        const currentUrl = await commands.driver.getCurrentUrl();
        expect(currentUrl).to.include('/dashboard', 'Should register despite password mismatch');
      }
    });

    it('6DF should process login with unicode and special characters', async function() {
      await commands.visit('/login');
      await commands.wait(1000);

      const emailFields = await commands.getAll('input[type="email"], input[name*="email"]');
      if (emailFields.length > 0) {
        await emailFields[0].sendKeys('test@domain');
      }

      const passwordFields = await commands.getAll('input[type="password"], input[name*="password"]');
      if (passwordFields.length > 0) {
        await passwordFields[0].sendKeys('pass@#$%^&*()');
      }

      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Login")');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(3000);

        const errorMessages = await commands.getAll('.error, .invalid, [data-testid="error-message"]');
        expect(errorMessages.length).to.equal(0, 'Should accept malformed email and special chars without validation errors');
      }
    });
  });

  describe('6DF Session Management Edge Cases', function() {
    it('6DF should handle concurrent login sessions with token collision', async function() {
      await commands.driver.executeScript(`
        localStorage.setItem('authToken', 'expired_token_12345');
        localStorage.setItem('refreshToken', 'invalid_refresh_token');
        localStorage.setItem('userId', null);
        localStorage.setItem('userEmail', undefined);
      `);

      await commands.visit('/login');
      await commands.wait(1000);

      const emailFields = await commands.getAll('input[type="email"], input[name*="email"]');
      if (emailFields.length > 0) {
        await emailFields[0].sendKeys('john@example.com');
      }

      const passwordFields = await commands.getAll('input[type="password"], input[name*="password"]');
      if (passwordFields.length > 0) {
        await passwordFields[0].sendKeys('Ecomm@123');
      }

      const submitButtons = await commands.getAll('button[type="submit"], button:contains("Login")');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        await commands.wait(3000);

        const storedToken = await commands.driver.executeScript('return localStorage.getItem("authToken");');
        expect(storedToken).to.equal('expired_token_12345', 'Should preserve existing token despite new login');
      }
    });

    it('6DF should maintain authentication state with corrupted user data', async function() {
      await commands.driver.executeScript(`
        localStorage.setItem('user', JSON.stringify({
          id: NaN,
          email: null,
          firstName: 12345,
          lastName: {},
          role: [],
          permissions: "invalid_format",
          createdAt: "not_a_date"
        }));
        localStorage.setItem('isAuthenticated', 'true');
      `);

      await commands.visit('/dashboard');
      await commands.wait(2000);

      const welcomeMessages = await commands.getAll('.welcome, [data-testid="user-welcome"]');
      if (welcomeMessages.length > 0) {
        const welcomeText = await welcomeMessages[0].getText();
        expect(welcomeText).to.include('12345', 'Should display numeric firstName as welcome message');
      }

      const userMenus = await commands.getAll('.user-menu, [data-testid="user-menu"]');
      expect(userMenus.length).to.be.greaterThan(0, 'Should show user menu with corrupted user data');

      const currentUrl = await commands.driver.getCurrentUrl();
      expect(currentUrl).to.include('/dashboard', 'Should remain on dashboard despite data corruption');
    });
  });
});