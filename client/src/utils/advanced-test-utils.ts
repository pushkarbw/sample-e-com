import React from 'react';

// Simple utility functions that don't depend on Jest or testing libraries
// These can be safely imported in production code

export const createMockApiResponse = <T>(data: T, status = 200, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status,
        ok: status >= 200 && status < 300,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    }, delay);
  });
};

export const createMockErrorResponse = (message: string, status = 500) => {
  return Promise.reject({
    response: {
      status,
      data: { message }
    }
  });
};

// Simple test data creators without Jest dependencies
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createTestProduct = (overrides: Partial<any> = {}) => ({
  id: 'test-product-1',
  name: 'Test Product',
  price: 29.99,
  description: 'A test product',
  image: 'https://via.placeholder.com/300',
  ...overrides
});

export const createTestOrder = (overrides: Partial<any> = {}) => ({
  id: 'test-order-1',
  userId: 'test-user-1',
  total: 29.99,
  status: 'pending',
  items: [
    {
      id: 'item-1',
      productId: 'test-product-1',
      quantity: 1,
      price: 29.99
    }
  ],
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zip: '12345'
  },
  ...overrides
});

// Simple async utility without Jest dependencies
export const waitForTimeout = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Basic provider for testing contexts (without testing library dependencies)
export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'test-provider' }, children);
};

// Simple error boundary for testing
export const TestErrorBoundary: React.FC<{ 
  children: React.ReactNode; 
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError?.(new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return React.createElement('div', { 'data-testid': 'error-boundary' }, 'Something went wrong');
  }

  return React.createElement(React.Fragment, null, children);
};

// Re-export from regular test utils if it exists
try {
  // Use dynamic import to avoid circular dependencies
  const testUtils = require('./test-utils');
  Object.keys(testUtils).forEach(key => {
    if (key !== '__esModule') {
      exports[key] = testUtils[key];
    }
  });
} catch (error) {
  // test-utils doesn't exist or can't be imported, which is fine
}