import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data utilities
export const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

export const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  price: 29.99,
  imageUrl: 'test.jpg',
  category: 'Electronics',
  description: 'A test product',
  stock: 10,
  rating: 4.5,
  reviewCount: 123,
};

export const mockCartItem = {
  id: 'item-1',
  productId: 'product-1',
  name: 'Test Product',
  price: 29.99,
  quantity: 2,
  imageUrl: 'test.jpg',
};

// Add a basic test to prevent empty test suite error
describe('Test Utils', () => {
  test('exports render function', () => {
    expect(customRender).toBeDefined();
  });

  test('exports mock data', () => {
    expect(mockUser).toBeDefined();
    expect(mockProduct).toBeDefined();
    expect(mockCartItem).toBeDefined();
  });
});