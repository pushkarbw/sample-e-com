// 📋 E-COMMERCE TEST SUITE CONFIGURATION & DOCUMENTATION
// This file provides comprehensive testing configuration for the e-commerce application

/**
 * 🏗️ CONSOLIDATED TEST ARCHITECTURE OVERVIEW
 * 
 * Previous Structure (REMOVED):
 * ❌ Duplicate folders: 01-authentication + 02-authentication
 * ❌ Duplicate folders: 01-core-shopping + 02-shopping  
 * ❌ Duplicate folders: 04-ui-ux + 04-user-experience
 * ❌ Individual files: auth.cy.js, cart-checkout.cy.js, shopping.cy.js, etc.
 * 
 * New Organized Structure:
 * ✅ 00-master-test-suite.cy.js - Complete consolidated test suite
 * ✅ complete-app-test-suite.cy.js - Comprehensive application testing
 * ✅ 01-authentication/ - Authentication specific tests
 * ✅ 01-core-shopping/ - Core shopping functionality
 * ✅ 03-api-integration/ - API testing
 * ✅ 04-user-experience/ - UX and responsive design
 * ✅ 05-error-handling/ - Error scenarios and edge cases
 * ✅ 06-cross-browser/ - Cross-browser compatibility
 * ✅ 07-performance/ - Performance and load testing
 */

const testConfig = {
  // Application Configuration
  app: {
    name: 'E-Commerce Application',
    version: '1.0.0',
    baseUrl: Cypress.config('baseUrl') || 'http://localhost:3000',
    apiBaseUrl: Cypress.env('apiUrl') || 'http://localhost:5000/api'
  },

  // Test Users Configuration
  users: {
    // Standard test user (should exist in test database)
    valid: {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    },
    
    // Admin user for admin functionality testing
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    },
    
    // Dynamic user generator for registration tests
    newUser: () => ({
      email: `test+${Date.now()}@example.com`,
      password: 'Test123!',
      firstName: 'New',
      lastName: 'User'
    }),
    
    // Invalid credentials for negative testing
    invalid: {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }
  },

  // Timeout Configuration
  timeouts: {
    api: 10000,           // API response timeout
    pageLoad: 5000,       // Page load timeout
    userAction: 3000,     // User interaction timeout
    networkSlow: 8000,    // Slow network simulation
    elementWait: 4000     // Element visibility timeout
  },

  // Viewport Configuration for Responsive Testing
  viewports: {
    mobile: { width: 375, height: 667, device: 'iPhone SE' },
    tablet: { width: 768, height: 1024, device: 'iPad' },
    desktop: { width: 1280, height: 720, device: 'Desktop' },
    largeDesktop: { width: 1920, height: 1080, device: 'Large Desktop' }
  },

  // Performance Thresholds
  performance: {
    pageLoadMax: 5000,    // Maximum acceptable page load time (ms)
    apiResponseMax: 3000, // Maximum acceptable API response time (ms)
    firstContentfulPaint: 2000, // Target FCP time
    largestContentfulPaint: 4000 // Target LCP time
  },

  // Test Data Configuration
  testData: {
    // Sample product data for testing
    sampleProduct: {
      name: 'Test Product',
      price: 99.99,
      description: 'A test product for automated testing',
      category: 'Electronics',
      image: 'test-product.jpg'
    },
    
    // Form validation test data
    validation: {
      invalidEmails: ['invalid', 'test@', '@example.com', 'test.example.com'],
      weakPasswords: ['123', 'password', 'abc'],
      strongPasswords: ['Test123!', 'SecureP@ss1', 'MyStr0ng!Pass'],
      specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      unicodeText: '测试用户名 🛒 émojis ñañá'
    }
  },

  // API Endpoints for Testing
  endpoints: {
    auth: {
      login: '/api/auth/login',
      signup: '/api/auth/signup',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh'
    },
    products: {
      list: '/api/products',
      details: '/api/products/:id',
      search: '/api/products/search',
      categories: '/api/categories'
    },
    cart: {
      get: '/api/cart',
      add: '/api/cart/add',
      update: '/api/cart/update',
      remove: '/api/cart/remove',
      clear: '/api/cart/clear'
    },
    orders: {
      list: '/api/orders',
      create: '/api/orders',
      details: '/api/orders/:id'
    }
  },

  // Error Scenarios for Testing
  errorScenarios: [
    { status: 400, message: 'Bad Request' },
    { status: 401, message: 'Unauthorized' },
    { status: 403, message: 'Forbidden' },
    { status: 404, message: 'Not Found' },
    { status: 422, message: 'Unprocessable Entity' },
    { status: 429, message: 'Too Many Requests' },
    { status: 500, message: 'Internal Server Error' },
    { status: 502, message: 'Bad Gateway' },
    { status: 503, message: 'Service Unavailable' }
  ],

  // Security Test Scenarios
  security: {
    xssAttempts: [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      'javascript:alert("xss")',
      '<svg onload="alert(\'xss\')"></svg>'
    ],
    sqlInjectionAttempts: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; DELETE FROM products; --",
      "' UNION SELECT * FROM users --"
    ],
    sessionTokens: {
      invalid: 'invalid-token-12345',
      expired: 'expired-jwt-token',
      malformed: 'malformed.token.here'
    }
  }
};

/**
 * 🧪 TEST EXECUTION STRATEGY
 * 
 * 1. SMOKE TESTS (Quick validation)
 *    - Run: npx cypress run --spec "cypress/e2e/00-master-test-suite.cy.js"
 *    - Purpose: Validate core functionality works
 *    - Duration: ~5-10 minutes
 * 
 * 2. REGRESSION TESTS (Full suite)
 *    - Run: npx cypress run
 *    - Purpose: Comprehensive testing before releases
 *    - Duration: ~30-45 minutes
 * 
 * 3. SPECIFIC FEATURE TESTS
 *    - Authentication: cypress/e2e/01-authentication/
 *    - Shopping: cypress/e2e/01-core-shopping/
 *    - API: cypress/e2e/03-api-integration/
 *    - UX: cypress/e2e/04-user-experience/
 *    - Errors: cypress/e2e/05-error-handling/
 * 
 * 4. CROSS-BROWSER TESTING
 *    - Chrome: npx cypress run --browser chrome
 *    - Firefox: npx cypress run --browser firefox
 *    - Edge: npx cypress run --browser edge
 * 
 * 5. PERFORMANCE TESTING
 *    - Run: cypress/e2e/07-performance/
 *    - Monitor: Page load times, API response times
 */

/**
 * 🔧 CUSTOM COMMANDS AVAILABLE
 * 
 * Authentication:
 * - cy.loginAsTestUser(email, password)
 * - cy.registerNewUser(userDetails)
 * - cy.logoutUser()
 * 
 * Shopping:
 * - cy.addProductToCart()
 * - cy.searchProducts(searchTerm)
 * - cy.filterByCategory(categoryName)
 * 
 * Utilities:
 * - cy.verifyPageLoad(expectedUrl)
 * - cy.waitForProductsToLoad()
 * - cy.verifyProductsDisplay()
 * - cy.checkBasicAccessibility()
 * 
 * Testing Helpers:
 * - cy.simulateOffline()
 * - cy.simulateSlowNetwork(delay)
 * - cy.expectErrorHandling()
 * - cy.submitFormAndExpectValidation()
 * 
 * Responsive:
 * - cy.testMobileViewport(callback)
 * - cy.testTabletViewport(callback)
 * - cy.testDesktopViewport(callback)
 */

/**
 * 📊 TEST COVERAGE AREAS
 * 
 * ✅ FUNCTIONAL TESTING
 * - User authentication (login/signup/logout)
 * - Product browsing and search
 * - Shopping cart operations
 * - Checkout process
 * - Order management
 * 
 * ✅ API TESTING
 * - REST endpoint validation
 * - Request/response handling
 * - Error response handling
 * - Authentication tokens
 * 
 * ✅ UI/UX TESTING
 * - Responsive design (mobile/tablet/desktop)
 * - Navigation functionality
 * - Form validation
 * - Loading states
 * 
 * ✅ ERROR HANDLING
 * - Network failures
 * - Server errors (4xx, 5xx)
 * - Invalid data handling
 * - Edge cases and race conditions
 * 
 * ✅ SECURITY TESTING
 * - XSS prevention
 * - SQL injection protection
 * - Session management
 * - Input sanitization
 * 
 * ✅ PERFORMANCE TESTING
 * - Page load times
 * - API response times
 * - Large dataset handling
 * - Memory leak detection
 * 
 * ✅ ACCESSIBILITY TESTING
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA labels
 * - Color contrast
 */

// Export configuration for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testConfig;
}

// Make available globally in Cypress
if (typeof window !== 'undefined') {
  window.testConfig = testConfig;
}