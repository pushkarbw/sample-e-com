const { By, until, Key } = require('selenium-webdriver');
const { expect } = require('chai');

class SeleniumCommands {
  constructor(driver, config) {
    this.driver = driver;
    this.config = config;
    this.baseUrl = config.baseUrl;
  }

  // Navigation commands
  async visit(path) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    await this.driver.get(url);
    await this.driver.wait(until.elementLocated(By.tagName('body')), 10000);
  }

  async reload() {
    await this.driver.navigate().refresh();
    await this.driver.wait(until.elementLocated(By.tagName('body')), 10000);
  }

  async goBack() {
    await this.driver.navigate().back();
  }

  async goForward() {
    await this.driver.navigate().forward();
  }

  // Element interaction commands
  async get(selector, timeout = 10000) {
    const locator = this.parseSelector(selector);
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async getAll(selector) {
    try {
      // Handle complex selectors that might not be valid XPath
      if (selector.includes(',')) {
        // Split comma-separated selectors and try each one
        const selectors = selector.split(',').map(s => s.trim());
        let elements = [];
        
        for (const sel of selectors) {
          try {
            const found = await this.driver.findElements(By.css(sel));
            elements = elements.concat(found);
          } catch (error) {
            // Continue to next selector if this one fails
            continue;
          }
        }
        return elements;
      }
      
      // Try CSS selector first
      return await this.driver.findElements(By.css(selector));
    } catch (error) {
      // If CSS fails, try XPath (but only for valid XPath)
      if (selector.startsWith('//') || selector.startsWith('/')) {
        try {
          return await this.driver.findElements(By.xpath(selector));
        } catch (xpathError) {
          console.log(`Warning: Could not find elements with selector "${selector}"`);
          return [];
        }
      }
      console.log(`Warning: Could not find elements with selector "${selector}"`);
      return [];
    }
  }

  async click(selector, timeout = 10000) {
    const element = await this.get(selector, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  async type(selector, text, options = {}) {
    const element = await this.get(selector);
    
    if (options.clear !== false) {
      await element.clear();
    }
    
    if (options.slowly) {
      for (const char of text) {
        await element.sendKeys(char);
        await this.wait(100);
      }
    } else {
      await element.sendKeys(text);
    }

    if (options.submit) {
      await element.sendKeys(Key.ENTER);
    }
  }

  async clear(selector) {
    const element = await this.get(selector);
    await element.clear();
  }

  async select(selector, value) {
    const element = await this.get(selector);
    const option = await element.findElement(By.xpath(`//option[@value='${value}']`));
    await option.click();
  }

  // Authentication commands
  async loginAsTestUser(email = 'john@example.com', password = 'password123') {
    await this.visit('/login');
    await this.type('#email', email);
    await this.type('#password', password);
    await this.click('button[type="submit"]');
    
    // Wait for redirect away from login page
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      return !currentUrl.includes('/login');
    }, 15000);
  }

  async logout() {
    try {
      await this.click('button:contains("Logout")');
    } catch (e) {
      // Try alternative logout methods
      await this.get('header').then(async header => {
        const logoutBtn = await header.findElement(By.xpath('.//button[contains(text(), "Logout")]'));
        await logoutBtn.click();
      });
    }
  }

  async registerNewUser(userDetails) {
    await this.visit('/signup');
    
    if (userDetails.firstName) {
      await this.type('#firstName', userDetails.firstName);
    }
    if (userDetails.lastName) {
      await this.type('#lastName', userDetails.lastName);
    }
    await this.type('#email', userDetails.email);
    await this.type('#password', userDetails.password);
    
    await this.click('button[type="submit"]');
    
    // Wait for redirect away from signup page
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      return !currentUrl.includes('/signup');
    }, 15000);
  }

  // Shopping commands
  async addProductToCart(productIndex = 0) {
    await this.visit('/products');
    await this.waitForProductsToLoad();
    
    const addButtons = await this.getAll('button:contains("Add to Cart")');
    if (addButtons.length > productIndex) {
      await addButtons[productIndex].click();
      await this.wait(1000);
    }
  }

  async searchProducts(searchTerm) {
    const searchInput = await this.get('input[placeholder*="Search"]');
    await searchInput.clear();
    await searchInput.sendKeys(searchTerm);
    
    try {
      await this.click('button:contains("Search")');
    } catch (e) {
      await searchInput.sendKeys(Key.ENTER);
    }
  }

  async filterByCategory(categoryName) {
    const categorySelect = await this.get('select');
    const option = await categorySelect.findElement(By.xpath(`//option[contains(text(), '${categoryName}')]`));
    await option.click();
  }

  // Verification commands
  async shouldContain(selector, text) {
    const element = await this.get(selector);
    const elementText = await element.getText();
    expect(elementText).to.include(text);
  }

  async shouldHaveValue(selector, expectedValue) {
    const element = await this.get(selector);
    const value = await element.getAttribute('value');
    expect(value).to.equal(expectedValue);
  }

  async shouldBeVisible(selector) {
    const element = await this.get(selector);
    const isDisplayed = await element.isDisplayed();
    expect(isDisplayed).to.be.true;
  }

  async shouldHaveUrl(expectedUrl) {
    const currentUrl = await this.driver.getCurrentUrl();
    if (expectedUrl.startsWith('/')) {
      expect(currentUrl).to.include(expectedUrl);
    } else {
      expect(currentUrl).to.equal(expectedUrl);
    }
  }

  async shouldNotHaveUrl(url) {
    const currentUrl = await this.driver.getCurrentUrl();
    expect(currentUrl).to.not.include(url);
  }

  // Utility commands
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async waitForProductsToLoad() {
    await this.get('[data-testid="products-container"]');
    await this.wait(2000); // Allow products to fully load
  }

  async verifyPageLoad(expectedUrl) {
    await this.shouldHaveUrl(expectedUrl);
    await this.shouldBeVisible('body');
  }

  async clearAllStorage() {
    try {
      // Check if we're on a proper URL before accessing storage
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.startsWith('data:') || currentUrl === 'about:blank') {
        console.log('Skipping storage clear - not on proper URL');
        return;
      }
      
      await this.driver.executeScript(`
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        } catch (e) {
          console.log('Storage access blocked:', e.message);
        }
      `);
    } catch (error) {
      console.log('Warning: Could not clear storage:', error.message);
    }
  }

  async interceptRequest(method, url, response) {
    // Note: Selenium doesn't have built-in request interception like Cypress
    // This would require additional tools like a proxy or browser extensions
    console.warn('Request interception not implemented in basic Selenium setup');
  }

  async submitFormAndExpectValidation() {
    await this.click('button[type="submit"]');
    
    // Check for HTML5 validation
    const invalidInputs = await this.getAll('input:invalid');
    expect(invalidInputs.length).to.be.greaterThan(0);
  }

  async checkBasicAccessibility() {
    // Basic accessibility checks
    const images = await this.getAll('img');
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt) {
        console.warn('Image without alt attribute found');
      }
    }
    
    const buttons = await this.getAll('button');
    for (const button of buttons) {
      const text = await button.getText();
      const ariaLabel = await button.getAttribute('aria-label');
      if (!text && !ariaLabel) {
        console.warn('Button without accessible text found');
      }
    }
  }

  async testMobileViewport(callback) {
    await this.driver.manage().window().setRect({ width: 375, height: 667 });
    await callback();
    await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
  }

  async testTabletViewport(callback) {
    await this.driver.manage().window().setRect({ width: 768, height: 1024 });
    await callback();
    await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
  }

  async testDesktopViewport(callback) {
    await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    await callback();
  }

  // Helper method to parse different selector types
  parseSelector(selector) {
    if (selector.startsWith('#')) {
      return By.id(selector.substring(1));
    } else if (selector.startsWith('.')) {
      return By.className(selector.substring(1));
    } else if (selector.includes('[data-testid=')) {
      const testId = selector.match(/\[data-testid="([^"]+)"\]/)?.[1];
      return By.css(`[data-testid="${testId}"]`);
    } else if (selector.includes(':contains(')) {
      const text = selector.match(/:contains\("([^"]+)"\)/)?.[1];
      const tag = selector.split(':')[0] || '*';
      return By.xpath(`//${tag}[contains(text(), '${text}')]`);
    } else {
      return By.css(selector);
    }
  }

  // Screenshot and debugging
  async takeScreenshot(filename) {
    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    const path = require('path');
    
    const screenshotPath = path.join(__dirname, '../reports/screenshots', filename || `screenshot-${Date.now()}.png`);
    fs.writeFileSync(screenshotPath, screenshot, 'base64');
    
    return screenshotPath;
  }

  async log(message) {
    console.log(`[Selenium] ${message}`);
  }
}

module.exports = SeleniumCommands;