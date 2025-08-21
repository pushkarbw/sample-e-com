const { Builder } = require('selenium-webdriver');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumCommands = require('./commands');

class TestSetup {
  constructor() {
    this.driver = null;
    this.commands = null;
    this.config = new SeleniumConfig();
  }

  async beforeEach(browser = 'chrome') {
    // Create driver
    this.driver = await this.config.createDriver(browser);
    this.commands = new SeleniumCommands(this.driver, this.config);
    
    // Navigate to the application first before clearing storage
    await this.commands.visit('/');
    
    // Now safely clear storage since we're on the proper domain
    try {
      await this.commands.clearAllStorage();
    } catch (error) {
      // If storage clearing fails, just log it and continue
      console.log('Warning: Could not clear storage:', error.message);
    }
  }

  async afterEach() {
    if (this.driver) {
      try {
        // Take screenshot on failure if needed
        const testState = this.getCurrentTest?.() || {};
        if (testState.state === 'failed') {
          await this.commands?.takeScreenshot(`failure-${Date.now()}.png`);
        }
      } catch (error) {
        console.log('Warning: Could not take failure screenshot:', error.message);
      }
      
      await this.driver.quit();
      this.driver = null;
      this.commands = null;
    }
  }

  getCommands() {
    return this.commands;
  }

  getDriver() {
    return this.driver;
  }

  getCurrentTest() {
    // Helper to get current test context if available
    return global.currentTest || {};
  }

  getConfig() {
    return this.config;
  }

  // Helper method for handling errors and taking screenshots
  async handleTestError(testName, error) {
    if (this.commands) {
      const screenshotPath = await this.commands.takeScreenshot(`error-${testName}-${Date.now()}.png`);
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
    throw error;
  }

  // Page object models for common pages
  getLoginPage() {
    return {
      emailInput: '#email',
      passwordInput: '#password',
      submitButton: 'button[type="submit"]',
      errorMessage: '.error-message'
    };
  }

  getSignupPage() {
    return {
      firstNameInput: '#firstName',
      lastNameInput: '#lastName',
      emailInput: '#email',
      passwordInput: '#password',
      submitButton: 'button[type="submit"]'
    };
  }

  getProductsPage() {
    return {
      container: '[data-testid="products-container"]',
      searchInput: 'input[placeholder*="Search"]',
      categorySelect: 'select',
      addToCartButtons: 'button:contains("Add to Cart")',
      viewDetailsLinks: 'a:contains("View Details")'
    };
  }

  getCartPage() {
    return {
      container: '[data-testid="cart-container"]',
      items: '.cart-item',
      quantityInputs: 'input[type="number"]',
      removeButtons: 'button:contains("Remove")',
      checkoutButton: 'button:contains("Checkout")',
      totalAmount: '.total-amount'
    };
  }
}

module.exports = TestSetup;