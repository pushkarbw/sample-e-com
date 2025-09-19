const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class SeleniumConfig {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5005';
    this.timeout = {
      implicit: 10000,
      explicit: 15000,
      pageLoad: 30000
    };
    this.browserConfig = {
      chrome: {
        options: new chrome.Options()
          .addArguments('--no-sandbox')
          .addArguments('--disable-dev-shm-usage')
          .addArguments('--disable-gpu')
          .addArguments('--window-size=1920,1080')
      },
      firefox: {
        options: new firefox.Options()
          .addArguments('--width=1920')
          .addArguments('--height=1080')
      }
    };

    // Add headless mode for CI
    if (process.env.CI || process.env.HEADLESS) {
      this.browserConfig.chrome.options.addArguments('--headless');
      this.browserConfig.firefox.options.addArguments('--headless');
    }
  }

  async createDriver(browserName = 'chrome') {
    const browser = browserName.toLowerCase();
    let driver;

    switch (browser) {
      case 'firefox':
        driver = await new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(this.browserConfig.firefox.options)
          .build();
        break;
      case 'chrome':
      default:
        driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(this.browserConfig.chrome.options)
          .build();
        break;
    }

    // Set timeouts
    await driver.manage().setTimeouts({
      implicit: this.timeout.implicit,
      pageLoad: this.timeout.pageLoad
    });

    return driver;
  }

  getTestData() {
    return {
      users: {
        valid: {
          email: 'test@example.com',
          password: 'Ecomm@123',
          firstName: 'Test',
          lastName: 'User'
        },
        admin: {
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin'
        },
        newUser: () => ({
          email: `test-${Date.now()}@example.com`,
          password: 'Test123!',
          firstName: 'New',
          lastName: 'User'
        })
      },
      endpoints: {
        auth: {
          login: '/api/auth/login',
          signup: '/api/auth/signup',
          logout: '/api/auth/logout'
        },
        products: {
          list: '/api/products',
          details: '/api/products/:id',
          search: '/api/products/search'
        },
        cart: {
          get: '/api/cart',
          add: '/api/cart/add',
          update: '/api/cart/update',
          remove: '/api/cart/remove'
        },
        orders: {
          list: '/api/orders',
          create: '/api/orders',
          details: '/api/orders/:id'
        }
      }
    };
  }
}

module.exports = SeleniumConfig;