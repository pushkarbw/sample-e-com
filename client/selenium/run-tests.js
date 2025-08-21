#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(reportsDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const browser = process.env.BROWSER || 'chrome';
const headless = process.env.HEADLESS === 'true' || process.env.CI === 'true';
const grep = process.env.GREP || '';

console.log(`🚀 Starting Selenium tests with ${browser} browser`);
console.log(`📁 Test reports will be saved to: ${reportsDir}`);
console.log(`🔍 Headless mode: ${headless ? 'enabled' : 'disabled'}`);

// Set environment variables
process.env.BROWSER = browser;
if (headless) {
  process.env.HEADLESS = 'true';
}

// Mocha command with configuration
const mochaPath = path.join(__dirname, '../node_modules/.bin/mocha');
const configPath = path.join(__dirname, 'config/mocha.config.js');

const args = [
  '--config', configPath,
  '--require', path.join(__dirname, 'support/test-setup.js')
];

// Add grep filter if specified
if (grep) {
  args.push('--grep', grep);
}

// Add specific test files or patterns
const testPattern = process.argv[2] || 'selenium/e2e/**/*.js';
args.push(testPattern);

console.log(`📋 Running command: mocha ${args.join(' ')}`);

// Run Mocha
const mocha = spawn('node', [mochaPath, ...args], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env
});

mocha.on('close', (code) => {
  if (code === 0) {
    console.log('✅ All Selenium tests passed!');
    console.log(`📊 View the HTML report at: ${path.join(reportsDir, 'selenium-test-report.html')}`);
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
    console.log(`📊 Check the report at: ${path.join(reportsDir, 'selenium-test-report.html')}`);
  }
  process.exit(code);
});

mocha.on('error', (err) => {
  console.error('❌ Failed to start Selenium tests:', err);
  process.exit(1);
});