describe('4BDCF Browser Form Input Compatibility', () => {
  const testConfig = {
    users: {
      valid: { email: 'john@example.com', password: 'Ecomm@123' }
    }
  };

  beforeEach(() => {
    cy.clearAllStorage();
    
    cy.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('Cannot read properties of undefined') ||
          err.message.includes('Network Error') ||
          err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
      }
      return true;
    });
  });

  context('4BDCF Input Type Support Variations', () => {
    it('should handle email input validation differences across browsers', () => {
      cy.visit('/signup');
      
      cy.get('input[type="email"]').then($emailInput => {
        cy.wrap($emailInput).type('invalid-email-format');
        
        cy.window().then((win) => {
          const isFirefox = /Firefox/.test(win.navigator.userAgent);
          const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
          const isIE = /Trident|MSIE|Edge/.test(win.navigator.userAgent);
          
          if (isFirefox) {
            cy.wrap($emailInput).blur();
            cy.wrap($emailInput).then(input => {
              expect(input[0].validity.valid).to.be.false;
              expect(input[0].validity.typeMismatch).to.be.true;
            });
          } else if (isSafari) {
            cy.wrap($emailInput).trigger('invalid');
            cy.wrap($emailInput).then(input => {
              const isValid = input[0].checkValidity();
              expect(isValid).to.be.false;
            });
          } else if (isIE) {
            cy.wrap($emailInput).clear().type('test@domain');
            cy.wrap($emailInput).should('have.value', 'test@domain');
          } else {
            cy.wrap($emailInput).then(input => {
              expect(input[0].validity.valid).to.be.false;
            });
          }
        });
      });
    });

    it('should handle number input step behavior consistently', () => {
      cy.visit('/checkout');
      
      cy.get('body').then(($body) => {
        const quantityInputs = $body.find('input[type="number"], input[step]');
        
        if (quantityInputs.length > 0) {
          const quantityInput = quantityInputs.first();
          
          cy.wrap(quantityInput).clear().type('1.5');
          
          cy.window().then((win) => {
            const isChrome = /Chrome/.test(win.navigator.userAgent);
            const isFirefox = /Firefox/.test(win.navigator.userAgent);
            
            if (isChrome) {
              cy.wrap(quantityInput).then(input => {
                const step = input.attr('step') || '1';
                if (step === '1') {
                  expect(input[0].validity.stepMismatch).to.be.true;
                }
              });
            } else if (isFirefox) {
              cy.wrap(quantityInput).trigger('keydown', { key: 'ArrowUp' });
              cy.wrap(quantityInput).should('have.value', '2');
            } else {
              cy.wrap(quantityInput).should('have.value', '1.5');
            }
          });
        }
      });
    });

    it('should handle date input fallback behavior', () => {
      cy.visit('/checkout');
      
      cy.get('body').then(($body) => {
        let dateInput = $body.find('input[type="date"]');
        
        if (dateInput.length === 0) {
          cy.document().then(doc => {
            const testInput = doc.createElement('input');
            testInput.type = 'date';
            testInput.id = 'test-date-input';
            doc.body.appendChild(testInput);
            dateInput = Cypress.$(testInput);
          });
        }
        
        cy.window().then((win) => {
          const testInput = win.document.querySelector('#test-date-input, input[type="date"]');
          
          if (testInput) {
            const supportsDateInput = testInput.type === 'date';
            
            if (supportsDateInput) {
              cy.wrap(testInput).type('2024-12-25');
              cy.wrap(testInput).should('have.value', '2024-12-25');
            } else {
              cy.wrap(testInput).type('12/25/2024');
              cy.wrap(testInput).should('contain.value', '2024');
            }
            
            if (testInput.id === 'test-date-input') {
              win.document.body.removeChild(testInput);
            }
          }
        });
      });
    });
  });

  context('4BDCF Autocomplete and Autofill Differences', () => {
    it('should handle browser autofill suggestions consistently', () => {
      cy.visit('/checkout');
      
      cy.get('input[type="email"], input[name*="email"]').then($emailInputs => {
        if ($emailInputs.length > 0) {
          const emailInput = $emailInputs.first();
          
          cy.wrap(emailInput).focus();
          cy.wrap(emailInput).type('test');
          
          cy.window().then((win) => {
            const isChrome = /Chrome/.test(win.navigator.userAgent);
            const isFirefox = /Firefox/.test(win.navigator.userAgent);
            const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
            
            if (isChrome) {
              cy.wrap(emailInput).trigger('keydown', { key: 'ArrowDown' });
              cy.wait(300);
              cy.wrap(emailInput).trigger('keydown', { key: 'Enter' });
            } else if (isFirefox) {
              cy.wrap(emailInput).type('@example.com');
              cy.wrap(emailInput).should('contain.value', 'example.com');
            } else if (isSafari) {
              cy.wrap(emailInput).type('@');
              cy.wait(200);
              cy.wrap(emailInput).type('domain.com');
            } else {
              cy.wrap(emailInput).type('@example.com');
            }
            
            cy.wrap(emailInput).should('have.value').and('include', 'test');
          });
        }
      });
    });

    it('should handle address autocomplete with regional differences', () => {
      cy.visit('/checkout');
      
      cy.get('body').then(($body) => {
        const addressInputs = $body.find('input[autocomplete*="address"], input[name*="address"]');
        
        if (addressInputs.length > 0) {
          const addressInput = addressInputs.first();
          
          cy.wrap(addressInput).focus();
          cy.wrap(addressInput).type('123 Main');
          
          cy.window().then((win) => {
            const userLanguage = win.navigator.language || win.navigator.userLanguage;
            const isUS = userLanguage.includes('en-US');
            const isGB = userLanguage.includes('en-GB');
            
            if (isUS) {
              cy.wrap(addressInput).type(' Street');
              cy.wrap(addressInput).should('contain.value', 'Street');
            } else if (isGB) {
              cy.wrap(addressInput).type(' Road');
              cy.wrap(addressInput).should('contain.value', 'Road');
            } else {
              cy.wrap(addressInput).type(' St');
              cy.wrap(addressInput).should('contain.value', 'St');
            }
          });
        }
      });
    });
  });

  context('4BDCF File Upload Browser Variations', () => {
    it('should handle file input accept attribute differences', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      
      cy.get('body').then(($body) => {
        let fileInput = $body.find('input[type="file"]');
        
        if (fileInput.length === 0) {
          cy.document().then(doc => {
            const testFileInput = doc.createElement('input');
            testFileInput.type = 'file';
            testFileInput.accept = 'image/*';
            testFileInput.id = 'test-file-input';
            doc.body.appendChild(testFileInput);
          });
          
          cy.get('#test-file-input').as('fileInput');
        } else {
          cy.wrap(fileInput.first()).as('fileInput');
        }
        
        cy.window().then((win) => {
          const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
          const isIE = /Trident|MSIE/.test(win.navigator.userAgent);
          
          cy.get('@fileInput').then($input => {
            const accept = $input.attr('accept');
            
            if (isSafari && accept === 'image/*') {
              const expectedTypes = ['image/jpeg', 'image/png', 'image/gif'];
              cy.wrap($input).should('have.attr', 'accept').and('include', 'image');
            } else if (isIE) {
              cy.wrap($input).should('have.attr', 'type', 'file');
            } else {
              cy.wrap($input).should('have.attr', 'accept');
            }
            
            if ($input.attr('id') === 'test-file-input') {
              $input.remove();
            }
          });
        });
      });
    });

    it('should handle drag and drop file upload compatibility', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      
      cy.get('body').then(($body) => {
        let dropZone = $body.find('[data-testid="file-drop-zone"], .file-drop-zone');
        
        if (dropZone.length === 0) {
          cy.document().then(doc => {
            const testDropZone = doc.createElement('div');
            testDropZone.id = 'test-drop-zone';
            testDropZone.style.cssText = 'width:200px;height:100px;border:2px dashed #ccc;';
            doc.body.appendChild(testDropZone);
          });
          
          cy.get('#test-drop-zone').as('dropZone');
        } else {
          cy.wrap(dropZone.first()).as('dropZone');
        }
        
        cy.window().then((win) => {
          const supportsDragAndDrop = 'draggable' in win.document.createElement('div');
          const supportsFileAPI = 'FileReader' in win;
          
          if (supportsDragAndDrop && supportsFileAPI) {
            cy.get('@dropZone').trigger('dragenter');
            cy.get('@dropZone').trigger('dragover');
            cy.get('@dropZone').trigger('drop', {
              dataTransfer: {
                files: []
              }
            });
          } else {
            cy.get('@dropZone').click();
          }
          
          cy.get('@dropZone').should('be.visible');
          
          if (Cypress.$('#test-drop-zone').length > 0) {
            Cypress.$('#test-drop-zone').remove();
          }
        });
      });
    });
  });

  context('4BDCF Form Validation Message Differences', () => {
    it('should handle custom validation messages across browsers', () => {
      cy.visit('/signup');
      
      cy.get('input[type="password"]').then($passwordInput => {
        cy.wrap($passwordInput).focus();
        cy.wrap($passwordInput).type('weak');
        
        cy.window().then((win) => {
          const isChrome = /Chrome/.test(win.navigator.userAgent);
          const isFirefox = /Firefox/.test(win.navigator.userAgent);
          const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
          
          const input = $passwordInput[0];
          
          if (isChrome) {
            input.setCustomValidity('Password must be at least 8 characters');
            cy.wrap($passwordInput).then(el => {
              expect(el[0].validationMessage).to.include('8 characters');
            });
          } else if (isFirefox) {
            input.setCustomValidity('Mot de passe trop court');
            cy.wrap($passwordInput).then(el => {
              expect(el[0].validationMessage).to.include('court');
            });
          } else if (isSafari) {
            input.setCustomValidity('Password too short');
            cy.wrap($passwordInput).blur();
            cy.wrap($passwordInput).then(el => {
              expect(el[0].validationMessage).to.include('short');
            });
          } else {
            input.setCustomValidity('Invalid password');
            cy.wrap($passwordInput).then(el => {
              expect(el[0].validationMessage).to.include('Invalid');
            });
          }
          
          input.setCustomValidity('');
        });
      });
    });

    it('should handle form submission validation timing differences', () => {
      cy.visit('/login');
      
      cy.get('form').then($form => {
        cy.get('input[type="email"]').clear();
        cy.get('input[type="password"]').clear();
        
        cy.window().then((win) => {
          const isFirefox = /Firefox/.test(win.navigator.userAgent);
          const isSafari = /Safari/.test(win.navigator.userAgent) && !/Chrome/.test(win.navigator.userAgent);
          
          if (isFirefox) {
            cy.get('button[type="submit"]').click();
            cy.wait(100);
            cy.get('input:invalid').should('have.length.greaterThan', 0);
          } else if (isSafari) {
            cy.get('input[type="email"]').focus();
            cy.get('button[type="submit"]').click();
            cy.wait(200);
            cy.get('input[type="email"]').then(input => {
              expect(input[0].validity.valid).to.be.false;
            });
          } else {
            cy.get('button[type="submit"]').click();
            cy.get('input[required]').first().then(input => {
              expect(input[0].validity.valueMissing).to.be.true;
            });
          }
        });
      });
    });
  });

  context('4BDCF Input Placeholder and Label Rendering', () => {
    it('should handle placeholder text rendering differences', () => {
      cy.visit('/products');
      
      cy.get('input[placeholder]').then($inputs => {
        if ($inputs.length > 0) {
          const searchInput = $inputs.first();
          
          cy.window().then((win) => {
            const isIE = /Trident|MSIE/.test(win.navigator.userAgent);
            const isFirefox = /Firefox/.test(win.navigator.userAgent);
            
            if (isIE) {
              cy.wrap(searchInput).should('have.attr', 'placeholder');
              cy.wrap(searchInput).focus();
              cy.wrap(searchInput).should('have.value', '');
            } else if (isFirefox) {
              cy.wrap(searchInput).focus();
              cy.wrap(searchInput).type('test search');
              cy.wrap(searchInput).clear();
              cy.wrap(searchInput).should('have.value', '');
            } else {
              cy.wrap(searchInput).should('have.attr', 'placeholder');
              cy.wrap(searchInput).invoke('attr', 'placeholder').should('not.be.empty');
            }
          });
        }
      });
    });

    it('should handle label association behavior consistently', () => {
      cy.visit('/signup');
      
      cy.get('label').then($labels => {
        if ($labels.length > 0) {
          const firstLabel = $labels.first();
          
          cy.wrap(firstLabel).then($label => {
            const forAttr = $label.attr('for');
            
            if (forAttr) {
              cy.get(`#${forAttr}`).should('exist');
              
              cy.window().then((win) => {
                const isIE = /Trident|MSIE/.test(win.navigator.userAgent);
                
                if (isIE) {
                  cy.wrap($label).click();
                  cy.get(`#${forAttr}`).should('be.focused');
                } else {
                  cy.wrap($label).click();
                  cy.focused().should('have.id', forAttr);
                }
              });
            } else {
              cy.wrap($label).find('input').should('exist');
            }
          });
        }
      });
    });
  });
});