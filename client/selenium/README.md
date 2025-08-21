# Selenium E2E Testing Setup

This directory contains a complete Selenium WebDriver test suite that mirrors the existing Cypress tests, providing an alternative E2E testing solution for the e-commerce application.

## 📁 Directory Structure

```
selenium/
├── config/
│   ├── selenium.config.js    # Browser and driver configuration
│   └── mocha.config.js       # Mocha test runner configuration
├── support/
│   ├── commands.js           # Custom Selenium commands (mirrors Cypress commands)
│   └── test-setup.js         # Test setup utilities and page objects
├── e2e/
│   ├── 00-master-test-suite.js           # Comprehensive test suite
│   ├── complete-app-test-suite.js        # Full application workflow tests
│   ├── 01-authentication/
│   │   └── auth-complete.js              # Authentication & user management
│   ├── 02-core-shopping/
│   │   ├── product-discovery.js          # Product browsing & search
│   │   └── cart-checkout.js              # Cart & checkout functionality
│   ├── 03-api-integration/
│   │   └── api-integration.js            # Backend API communication
│   ├── 04-error-handling/
│   │   └── edge-cases.js                 # Error scenarios & edge cases
│   ├── 05-cross-browser/
│   │   └── browser-compatibility.js     # Cross-browser testing
│   └── 06-performance/
│       └── performance-tests.js          # Performance & load testing
├── reports/                              # Test reports and screenshots
└── run-tests.js                         # Main test runner script
```

## 🚀 Quick Start

### Prerequisites

All dependencies are already installed via the main package.json. The Selenium setup includes:

- `selenium-webdriver` - WebDriver client
- `mocha` - Test framework
- `chai` - Assertion library
- `mochawesome` - HTML reporting
- `chromedriver` & `geckodriver` - Browser drivers

### Running Tests

1. **Start the application** (in a separate terminal):
   ```bash
   npm start
   ```

2. **Run Selenium tests** with various options:

   ```bash
   # Run all tests with automatic server start/stop
   npm run selenium:with-server

   # Run tests manually (app must be running)
   npm run selenium:run

   # Run specific browser tests
   npm run selenium:chrome-server
   npm run selenium:firefox-server

   # Run in headless mode
   npm run selenium:headless-server

   # Run specific test categories
   npm run selenium:auth         # Authentication tests
   npm run selenium:shopping     # Shopping functionality
   npm run selenium:api          # API integration tests
   npm run selenium:performance  # Performance tests
   npm run selenium:cross-browser # Cross-browser tests

   # Run specific test files
   npm run selenium:master       # Master test suite
   npm run selenium:complete     # Complete app workflow
   ```

### Environment Variables

- `BROWSER` - Browser to use (chrome, firefox) - default: chrome
- `HEADLESS` - Run in headless mode (true/false) - default: false in dev, true in CI
- `BASE_URL` - Application URL - default: http://localhost:3000
- `GREP` - Filter tests by pattern

Examples:
```bash
BROWSER=firefox npm run selenium:run
HEADLESS=true npm run selenium:run
GREP="Authentication" npm run selenium:run
```

## 🧪 Test Categories

### 1. Authentication & User Management (`01-authentication/`)
- User registration and validation
- Login/logout functionality
- Session management
- Route protection
- Password reset flows
- Security edge cases

### 2. Core Shopping (`02-core-shopping/`)
- **Product Discovery**: Browsing, searching, filtering
- **Cart & Checkout**: Adding items, cart management, checkout process

### 3. API Integration (`03-api-integration/`)
- Authentication API calls
- Product data fetching
- Cart synchronization
- Order management
- Error handling and retry logic

### 4. Error Handling (`04-error-handling/`)
- Form validation edge cases
- Network error scenarios
- Session management issues
- Security testing (XSS, CSRF)
- Browser compatibility issues

### 5. Cross-Browser Testing (`05-cross-browser/`)
- Chrome and Firefox compatibility
- Mobile viewport testing
- Feature detection
- Performance across browsers

### 6. Performance Testing (`06-performance/`)
- Page load times
- JavaScript execution performance
- Memory usage monitoring
- Network request optimization
- Responsive design performance

## 🔧 Configuration

### Browser Configuration
The `selenium.config.js` file manages:
- Browser-specific options (Chrome, Firefox)
- Timeouts and waits
- Headless mode settings
- Window size and viewport
- Test data and endpoints

### Test Runner Configuration
The `mocha.config.js` file configures:
- Test timeouts and retries
- Report generation (HTML + JSON)
- Test file patterns
- Coverage settings

## 📊 Reporting

Test reports are generated in the `selenium/reports/` directory:

- **HTML Report**: `selenium-test-report.html` - Interactive test results
- **JSON Report**: `selenium-test-report.json` - Programmatic access
- **Screenshots**: `screenshots/` - Error screenshots for debugging

View reports after test completion:
```bash
open selenium/reports/selenium-test-report.html
```

## 🎯 Test Strategy

### Selenium vs Cypress Comparison

| Feature | Selenium | Cypress |
|---------|----------|---------|
| **Real Browsers** | ✅ Full browser automation | ✅ Chrome-family browsers |
| **Multi-Browser** | ✅ Chrome, Firefox, Safari, Edge | ⚠️ Limited browser support |
| **Language Support** | ✅ Multiple languages | ⚠️ JavaScript only |
| **Network Stubbing** | ⚠️ Limited built-in support | ✅ Excellent network control |
| **Debugging** | ⚠️ Traditional debugging | ✅ Time-travel debugging |
| **CI Integration** | ✅ Mature ecosystem | ✅ Good CI support |
| **Learning Curve** | ⚠️ Steeper learning curve | ✅ Developer-friendly |

### When to Use Selenium

✅ **Use Selenium for**:
- Cross-browser compatibility testing
- Testing with real browser instances
- Integration with existing Selenium infrastructure
- Testing browser-specific behaviors
- Multi-language test development

✅ **Use Cypress for**:
- Rapid test development
- Detailed debugging and troubleshooting
- API mocking and network stubbing
- Component testing
- Time-travel debugging

## 🛠️ Custom Commands

The Selenium setup includes custom commands that mirror Cypress functionality:

```javascript
// Navigation
await commands.visit('/products');
await commands.reload();

// Element interaction
await commands.click('button[type="submit"]');
await commands.type('#email', 'test@example.com');
await commands.shouldBeVisible('body');

// Authentication helpers
await commands.loginAsTestUser();
await commands.registerNewUser(userDetails);

// Shopping helpers
await commands.addProductToCart();
await commands.searchProducts('laptop');

// Assertions
await commands.shouldContain('header', 'Welcome');
await commands.shouldHaveUrl('/dashboard');
```

## 🔍 Debugging

### Taking Screenshots
```javascript
await commands.takeScreenshot('test-failure.png');
```

### Console Logging
```javascript
await commands.log('Starting authentication test');
```

### Browser DevTools
When running in non-headless mode, you can:
1. Add `await commands.wait(30000);` to pause execution
2. Manually inspect the browser state
3. Use browser developer tools

### Error Handling
```javascript
try {
  await commands.click('button[type="submit"]');
} catch (error) {
  await commands.takeScreenshot('click-failed.png');
  throw error;
}
```

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Selenium Tests
  run: |
    npm start &
    npm run selenium:headless
  env:
    HEADLESS: true
    CI: true
```

### Docker Support
```dockerfile
# Install browser dependencies
RUN apt-get update && apt-get install -y \
  chromium-browser \
  firefox
```

## 📈 Performance Monitoring

The performance tests monitor:
- Page load times
- JavaScript execution time
- Memory usage patterns
- Network request timing
- DOM manipulation performance

Performance thresholds are configurable in the test files.

## 🤝 Contributing

When adding new Selenium tests:

1. Follow the existing test structure
2. Use the custom commands for consistency
3. Add appropriate assertions and error handling
4. Include performance considerations
5. Test across multiple browsers when relevant
6. Document any new test patterns

## 📚 Resources

- [Selenium WebDriver Documentation](https://selenium-webdriver.js.org/)
- [Mocha Testing Framework](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Mochawesome Reporter](https://github.com/adamgruber/mochawesome)

## 🔗 Related Files

- `package.json` - NPM scripts and dependencies
- `cypress/` - Parallel Cypress test suite
- `src/__tests__/` - Unit and integration tests
- `TESTING.md` - Overall testing strategy