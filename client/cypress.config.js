const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: true,
    screenshotOnRunFailure: true,
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:3001/api',
      coverage: true,
      testUser: {
        email: 'test@example.com',
        password: 'Test123!'
      }
    },

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },

    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Specs pattern - organized by category
    specPattern: [
      'cypress/e2e/01-core-shopping/**/*.cy.{js,ts}',
      'cypress/e2e/02-authentication/**/*.cy.{js,ts}',
      'cypress/e2e/03-api-integration/**/*.cy.{js,ts}',
      'cypress/e2e/04-user-experience/**/*.cy.{js,ts}',
      'cypress/e2e/05-error-handling/**/*.cy.{js,ts}',
      'cypress/e2e/06-cross-browser/**/*.cy.{js,ts}'
    ],
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    setupNodeEvents(on, config) {
      // Code coverage setup
      require('@cypress/code-coverage/task')(on, config);
      
      // Custom tasks
      on('task', {
        log(message) {
          console.log(`[${new Date().toISOString()}] ${message}`);
          return null;
        },
        
        // Database seeding task
        async seedDb(data) {
          console.log('Seeding test database...');
          // Implementation for seeding test data
          return { success: true, count: data?.length || 0 };
        },
        
        // Reset database
        async resetDb() {
          console.log('Resetting test database...');
          // Implementation for resetting test data
          return { success: true };
        },
        
        // Generate test report
        generateTestReport() {
          console.log('Generating test report...');
          return null;
        },
        
        // Clean up test data
        cleanupTestData() {
          console.log('Cleaning up test data...');
          return null;
        }
      });

      // Browser launch options
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
        }
        return launchOptions;
      });

      // Test configuration by environment
      if (config.env.ENVIRONMENT === 'CI') {
        config.video = false;
        config.defaultCommandTimeout = 8000;
      }

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
});