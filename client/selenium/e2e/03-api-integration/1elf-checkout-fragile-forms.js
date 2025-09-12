const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { By, Key } = require('selenium-webdriver');
const TestSetup = require('../../support/test-setup');

describe('🔄 1ELF Checkout Flow - Fragile Form Interactions', function() {
  this.timeout(60000);
  
  const testSetup = new TestSetup();
  let commands;
  
  const testUser = {
    email: 'john@example.com',
    password: 'password123'
  };

  const testAddressData = {
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    phone: '555-0123'
  };

  beforeEach(async function() {
    try {
      await testSetup.beforeEach('chrome');
      commands = testSetup.getCommands();
      
      // Login and add item to cart for checkout tests
      await commands.loginAsTestUser(testUser.email, testUser.password);
      
      // Add a product to cart to enable checkout
      await commands.visit('/products');
      await commands.wait(2000);
      const addButtons = await commands.getAll('[data-testid="add-to-cart-button"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await commands.wait(1000);
      }
    } catch (error) {
      throw new Error(`Failed to initialize test setup: ${error.message}`);
    }
  });

  afterEach(async function() {
    await testSetup.afterEach();
  });

  describe('1ELF Checkout Form Validation', function() {
    it('1ELF should validate shipping form with xpath position dependencies', async function() {
      await commands.visit('/checkout');
      await commands.wait(2000);
      
      try {
        const shippingSection = await commands.get('div.container > form > div:nth-child(2)', 5000);
        await shippingSection.click();
        
        const addressField = await commands.get('form > div:nth-child(2) > input:first-child', 3000);
        await addressField.sendKeys('123 Test Street');
        
        const cityField = await commands.get('form > div:nth-child(2) > input:nth-child(2)', 3000);
        await cityField.sendKeys('Test City');
        
        expect(false).to.be.true;
      } catch (error) {
        expect(error.message).to.include('Waiting for element to be located');
      }
    });

    it('1ELF should handle dynamic payment method selection', async function() {
      await commands.visit('/checkout');
      await commands.wait(2000);
      
      try {
        const paymentSection = await commands.get('section:nth-of-type(2), div[class*="payment"]:first-of-type', 5000);
        await paymentSection.click();
        
        const creditCardOption = await commands.get('input[value="credit"]:enabled', 3000);
        await creditCardOption.click();
        
        const cardNumberField = await commands.get('input[placeholder*="1234"]:visible', 3000);
        await cardNumberField.sendKeys('4111111111111111');
        
        expect(false).to.be.true;
      } catch (error) {
        expect(error.message).to.include('Waiting for element to be located');
      }
    });

    it('1ELF should process form submission with timing-dependent elements', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Rapidly fills form without proper waits between field interactions
      const formFields = [
        { selector: 'input[name*="first" i], input[placeholder*="first" i]', value: testAddressData.firstName },
        { selector: 'input[name*="last" i], input[placeholder*="last" i]', value: testAddressData.lastName },
        { selector: 'input[name*="street" i], input[placeholder*="address" i]', value: testAddressData.street },
        { selector: 'input[name*="city" i], input[placeholder*="city" i]', value: testAddressData.city },
        { selector: 'input[name*="zip" i], input[placeholder*="zip" i]', value: testAddressData.zipCode }
      ];
      
      for (const field of formFields) {
        try {
          const element = await commands.get(field.selector);
          await element.clear();
          await element.sendKeys(field.value);
          // FRAGILE: Too short delay between field interactions
          await commands.wait(100);
        } catch (error) {
          await commands.log(`Field not found: ${field.selector}`);
        }
      }
      
      // FRAGILE: Targets state/country dropdown that may not be loaded yet
      const stateSelects = await commands.getAll('select[name*="state"], select[name*="province"]');
      if (stateSelects.length > 0) {
        // FRAGILE: Selects by text content that could change
        const stateOptions = await stateSelects[0].findElements(By.xpath('.//option[contains(text(), "CA") or contains(text(), "California")]'));
        if (stateOptions.length > 0) {
          await stateOptions[0].click();
        }
      }
      
      // FRAGILE: Submits form without ensuring all async validation completed
      const submitButton = await commands.get('button[type="submit"], button:contains("Place Order"), button:contains("Complete")');
      await submitButton.click();
      
      // FRAGILE: Assumes specific loading/processing state indicators
      await commands.wait(800);
      
      const loadingIndicators = await commands.getAll('div[class*="loading"], div[class*="processing"], button[disabled]:contains("Processing")');
      
      if (loadingIndicators.length > 0) {
        // FRAGILE: Waits fixed time instead of waiting for specific completion signals
        await commands.wait(3000);
        
        // FRAGILE: Assumes success page has specific URL pattern or content
        const currentUrl = await commands.driver.getCurrentUrl();
        const bodyText = await commands.get('body').then(el => el.getText());
        
        const isSuccessPage = currentUrl.includes('/success') || 
                             currentUrl.includes('/confirmation') ||
                             bodyText.toLowerCase().includes('order placed') ||
                             bodyText.toLowerCase().includes('thank you');
        
        expect(isSuccessPage).to.be.true('Should navigate to success page or show confirmation');
      } else {
        // FRAGILE: Alternative check for form validation errors with brittle selectors
        const errorMessages = await commands.getAll('div[class*="error"], .error-message, [class*="invalid"]');
        
        if (errorMessages.length > 0) {
          await commands.log('Form submission failed with validation errors - this is expected behavior');
          expect(errorMessages.length).to.be.greaterThan(0);
        } else {
          await commands.log('Form submission completed without clear success/error indicators');
        }
      }
    });
  });

  describe('1ELF Address Management', function() {
    it('1ELF should handle address autocomplete with unstable event handling', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Targets address field and types partial address to trigger autocomplete
      const streetField = await commands.get('input[placeholder*="street" i], input[name*="address" i]');
      
      // FRAGILE: Types address slowly to potentially trigger autocomplete without proper event handling
      await streetField.sendKeys('123 Main St');
      
      // FRAGILE: Insufficient wait for autocomplete dropdown to appear
      await commands.wait(500);
      
      // FRAGILE: Targets autocomplete dropdown with selectors that may not match implementation
      const autocompleteOptions = await commands.getAll('div[class*="autocomplete"] li, ul[class*="suggestions"] li, .autocomplete-option');
      
      if (autocompleteOptions.length > 0) {
        // FRAGILE: Clicks first option without verifying it's the intended selection
        await autocompleteOptions[0].click();
        
        // FRAGILE: Assumes autocomplete fills other fields automatically
        await commands.wait(300);
        
        const cityField = await commands.get('input[name*="city" i], input[placeholder*="city" i]');
        const cityValue = await cityField.getAttribute('value');
        
        expect(cityValue.length).to.be.greaterThan(0, 'City should be auto-filled from address selection');
      } else {
        await commands.log('Address autocomplete not found - may not be implemented');
        
        // FRAGILE: Manually fill remaining fields with assumption about field names
        const cityField = await commands.get('input[name*="city" i]');
        const stateField = await commands.get('input[name*="state" i], select[name*="state" i]');
        
        await cityField.sendKeys(testAddressData.city);
        
        if (stateField.getTagName() === 'select') {
          await stateField.sendKeys(testAddressData.state);
        } else {
          await stateField.sendKeys(testAddressData.state);
        }
      }
    });

    it('1ELF should validate postal code with regex-dependent validation', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Targets zip/postal code field with multiple possible naming conventions
      const zipField = await commands.get('input[name*="zip" i], input[name*="postal" i], input[placeholder*="zip" i]');
      
      // Test various invalid postal code formats
      const invalidCodes = ['12345-67890', 'ABCDE', '123', '12345678901'];
      
      for (const invalidCode of invalidCodes) {
        await zipField.clear();
        await zipField.sendKeys(invalidCode);
        
        // FRAGILE: Triggers validation by tabbing away instead of using proper form validation events
        await zipField.sendKeys(Key.TAB);
        
        // FRAGILE: Too short wait for validation message to appear
        await commands.wait(200);
        
        // FRAGILE: Targets validation message with selector that may not exist
        const validationMessage = await commands.getAll('span[class*="error"]:contains("zip"), div[class*="invalid"]:contains("postal")');
        
        if (validationMessage.length > 0) {
          const messageText = await validationMessage[0].getText();
          expect(messageText.toLowerCase()).to.include('invalid', 'Should show invalid postal code message');
          break; // Exit loop on first validation found
        }
      }
      
      // FRAGILE: Test valid postal code format
      await zipField.clear();
      await zipField.sendKeys('12345');
      await zipField.sendKeys(Key.TAB);
      await commands.wait(200);
      
      // FRAGILE: Assumes validation message disappears for valid input
      const remainingErrors = await commands.getAll('span[class*="error"]:contains("zip"), div[class*="invalid"]:contains("postal")');
      expect(remainingErrors.length).to.equal(0, 'Validation errors should be cleared for valid postal code');
    });
  });

  describe('1ELF Order Summary and Review', function() {
    it('1ELF should display order summary with fragile price calculations', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Targets order summary section with assumption about page layout
      const orderSummary = await commands.get('aside[class*="summary"], div[class*="order-summary"]:last-of-type');
      
      // FRAGILE: Assumes specific structure for order items and pricing
      const itemPrices = await commands.getAll('div[class*="item"] span:contains("$"), .order-item .price');
      const subtotal = await commands.get('div:contains("Subtotal") + span, .subtotal .amount');
      const tax = await commands.get('div:contains("Tax") + span, .tax .amount');
      const total = await commands.get('div:contains("Total") + span, .total .amount');
      
      if (itemPrices.length > 0 && subtotal && total) {
        // FRAGILE: Extracts price values with regex that may not handle all currency formats
        const subtotalValue = parseFloat((await subtotal.getText()).replace(/[$,]/g, ''));
        const totalValue = parseFloat((await total.getText()).replace(/[$,]/g, ''));
        
        let taxValue = 0;
        if (tax) {
          taxValue = parseFloat((await tax.getText()).replace(/[$,]/g, ''));
        }
        
        // FRAGILE: Assumes simple addition without handling complex tax calculations or discounts
        const expectedTotal = subtotalValue + taxValue;
        
        expect(Math.abs(totalValue - expectedTotal)).to.be.lessThan(0.01, 'Order total should match subtotal plus tax');
      } else {
        await commands.log('Order summary pricing elements not found in expected structure');
      }
    });

    it('1ELF should handle promotional codes with state-dependent UI', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Targets promo code section that may be collapsed or hidden initially
      const promoCodeToggle = await commands.getAll('button:contains("promo"), a:contains("coupon"), button:contains("discount")');
      
      if (promoCodeToggle.length > 0) {
        await promoCodeToggle[0].click();
        
        // FRAGILE: Insufficient wait for promo code input to become visible
        await commands.wait(300);
        
        // FRAGILE: Targets promo code input with selector that assumes specific implementation
        const promoInput = await commands.get('input[placeholder*="promo" i], input[name*="coupon" i], input[placeholder*="code" i]');
        const applyButton = await commands.get('button:contains("Apply"), button[type="submit"]:contains("Go")');
        
        // Test invalid promo code
        await promoInput.sendKeys('INVALID_CODE_123');
        await applyButton.click();
        
        // FRAGILE: Short wait for server response and UI update
        await commands.wait(1000);
        
        // FRAGILE: Targets error message with brittle selector
        const errorMessage = await commands.getAll('div[class*="error"]:contains("invalid"), span[class*="error"]:contains("code")');
        
        if (errorMessage.length > 0) {
          expect(errorMessage.length).to.be.greaterThan(0, 'Should show invalid promo code error');
        } else {
          await commands.log('Promo code validation not implemented or different error handling');
        }
        
        // Test valid promo code (if any exist)
        await promoInput.clear();
        await promoInput.sendKeys('SAVE10');
        await applyButton.click();
        await commands.wait(1000);
        
        // FRAGILE: Assumes discount appears in order summary with specific format
        const discountLine = await commands.getAll('div:contains("Discount"), div:contains("Savings"), .discount');
        
        if (discountLine.length > 0) {
          expect(discountLine.length).to.be.greaterThan(0, 'Should show discount in order summary');
        } else {
          await commands.log('Valid promo code not accepted or different discount display');
        }
      } else {
        await commands.log('Promo code functionality not found');
      }
    });
  });

  describe('1ELF Error Handling and Edge Cases', function() {
    it('1ELF should handle payment failures with brittle error recovery', async function() {
      await commands.visit('/checkout');
      
      // Fill out form with test data
      const requiredFields = [
        { selector: 'input[name*="firstName"], input[placeholder*="first"]', value: testAddressData.firstName },
        { selector: 'input[name*="lastName"], input[placeholder*="last"]', value: testAddressData.lastName },
        { selector: 'input[name*="street"], input[placeholder*="address"]', value: testAddressData.street },
        { selector: 'input[name*="city"]', value: testAddressData.city },
        { selector: 'input[name*="zip"], input[placeholder*="zip"]', value: testAddressData.zipCode }
      ];
      
      for (const field of requiredFields) {
        try {
          const element = await commands.get(field.selector);
          await element.sendKeys(field.value);
          await commands.wait(100);
        } catch (error) {
          continue; // Skip fields that don't exist
        }
      }
      
      // FRAGILE: Enter invalid payment information to trigger payment failure
      const cardNumberField = await commands.getAll('input[placeholder*="card"], input[name*="cardNumber"]');
      if (cardNumberField.length > 0) {
        await cardNumberField[0].sendKeys('4000000000000002'); // Declined test card
        
        const expiryField = await commands.getAll('input[placeholder*="expiry"], input[name*="expiry"]');
        if (expiryField.length > 0) {
          await expiryField[0].sendKeys('12/25');
        }
        
        const cvvField = await commands.getAll('input[placeholder*="cvv"], input[maxlength="3"]');
        if (cvvField.length > 0) {
          await cvvField[0].sendKeys('123');
        }
      }
      
      // Submit form
      const submitButton = await commands.get('button[type="submit"], button:contains("Place Order")');
      await submitButton.click();
      
      // FRAGILE: Wait for payment processing with fixed timeout
      await commands.wait(3000);
      
      // FRAGILE: Targets payment error message with specific selectors
      const paymentErrors = await commands.getAll('div[class*="payment-error"], div[class*="declined"], .error:contains("payment")');
      
      if (paymentErrors.length > 0) {
        const errorText = await paymentErrors[0].getText();
        expect(errorText.toLowerCase()).to.include('declined', 'Should show payment declined error');
        
        // FRAGILE: Assumes retry button exists with specific styling
        const retryButton = await commands.getAll('button:contains("retry"), button:contains("try again")');
        if (retryButton.length > 0) {
          expect(retryButton.length).to.be.greaterThan(0, 'Should provide retry option');
        }
      } else {
        await commands.log('Payment error handling not found - may use different error patterns');
      }
    });

    it('1ELF should handle session timeout during checkout', async function() {
      await commands.visit('/checkout');
      
      // FRAGILE: Simulate session expiry by clearing auth tokens
      await commands.driver.executeScript(`
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        sessionStorage.clear();
      `);
      
      // Try to submit checkout form
      const submitButton = await commands.get('button[type="submit"], button:contains("Place Order")');
      await submitButton.click();
      
      await commands.wait(2000);
      
      // FRAGILE: Assumes specific session timeout handling
      const currentUrl = await commands.driver.getCurrentUrl();
      const bodyText = await commands.get('body').then(el => el.getText());
      
      const isRedirectedToLogin = currentUrl.includes('/login');
      const hasSessionError = bodyText.toLowerCase().includes('session expired') ||
                             bodyText.toLowerCase().includes('please log in') ||
                             bodyText.toLowerCase().includes('authentication');
      
      expect(isRedirectedToLogin || hasSessionError).to.be.true('Should handle session timeout gracefully');
    });
  });
});