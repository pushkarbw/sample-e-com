module.exports = {
  timeout: 60000,
  reporter: 'mochawesome',
  'reporter-options': {
    reportDir: 'selenium/reports',
    reportFilename: 'selenium-test-report',
    reportTitle: 'Selenium E2E Test Results',
    reportPageTitle: 'E-Commerce App Selenium Tests',
    inline: false,
    json: true,
    html: true,
    overwrite: false,
    timestamp: 'mmddyyyy_HHMMss'
  },
  recursive: true,
  spec: 'selenium/e2e/**/*.js',
  bail: false,
  retries: 1,
  slow: 5000,
  grep: process.env.GREP || '',
  require: []
};