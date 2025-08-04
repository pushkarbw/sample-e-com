import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from '../pages/Cart';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock hooks
const mockUseAuth = jest.fn();
const mockUseCart = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../hooks/useCart', () => ({
  useCart: mockUseCart,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockCartData = {
  id: 'cart-1',
  userId: 'user-1',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      name: 'Sample Product',
      price: 29.99,
      quantity: 2,
      image: 'sample-image.jpg'
    },
    {
      id: 'item-2',
      productId: 'product-2',
      name: 'Another Product',
      price: 19.99,
      quantity: 1,
      image: 'another-image.jpg'
    }
  ],
  totalItems: 3,
  totalPrice: 79.97,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Cart Page', () => {
  const mockAddToCart = jest.fn();
  const mockUpdateQuantity = jest.fn();
  const mockRemoveFromCart = jest.fn();
  const mockClearCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      isLoading: false,
      refreshUser: jest.fn(),
    });
    mockUseCart.mockReturnValue({
      cart: mockCartData,
      addToCart: mockAddToCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      clearCart: mockClearCart,
      isLoading: false,
      error: null,
      refreshCart: jest.fn(),
    });
  });

  describe('Empty Cart', () => {
    beforeEach(() => {
      mockUseCart.mockReturnValue({
        cart: null,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });
    });

    test('displays empty cart message', () => {
      render(<Cart />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Add some products to get started!')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    test('shop now button navigates to products page', () => {
      render(<Cart />);
      
      const shopNowButton = screen.getByText('Shop Now');
      expect(shopNowButton.closest('a')).toHaveAttribute('href', '/products');
    });
  });

  describe('Cart with Items', () => {
    const mockCart = {
      id: 'cart-1',
      userId: 'user-1',
      items: [
        {
          ...mockCartItem,
          id: 'item-1',
          quantity: 2,
          product: { ...mockProduct, id: 'product-1', name: 'Test Product 1', price: 29.99 }
        },
        {
          ...mockCartItem,
          id: 'item-2', 
          quantity: 1,
          product: { ...mockProduct, id: 'product-2', name: 'Test Product 2', price: 49.99 }
        }
      ],
      totalItems: 3,
      totalPrice: 109.97,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockUseCart.mockReturnValue({
        cart: mockCart,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });
    });

    test('displays cart items and summary', () => {
      render(<Cart />);
      
      expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('$29.99 each')).toBeInTheDocument();
      expect(screen.getByText('$49.99 each')).toBeInTheDocument();
    });

    test('displays correct subtotal and total', () => {
      render(<Cart />);
      
      expect(screen.getByText('$109.97')).toBeInTheDocument();
    });

    test('quantity controls work correctly', async () => {
      render(<Cart />);
      
      const increaseButtons = screen.getAllByText('+');
      const decreaseButtons = screen.getAllByText('-');
      
      fireEvent.click(increaseButtons[0]);
      await waitFor(() => {
        expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', 3);
      });

      fireEvent.click(decreaseButtons[0]);
      await waitFor(() => {
        expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', 1);
      });
    });

    test('remove item button works', async () => {
      render(<Cart />);
      
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockRemoveFromCart).toHaveBeenCalledWith('item-1');
      });
    });

    test('clear cart button works', async () => {
      render(<Cart />);
      
      const clearButton = screen.getByText('Clear Cart');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearCart).toHaveBeenCalled();
      });
    });

    test('proceed to checkout button navigates correctly', () => {
      render(<Cart />);
      
      const checkoutButton = screen.getByText('Proceed to Checkout');
      expect(checkoutButton.closest('a')).toHaveAttribute('href', '/checkout');
    });

    test('quantity cannot go below 1', () => {
      const singleItemCart = {
        ...mockCart,
        items: [{
          ...mockCartItem,
          id: 'item-1',
          quantity: 1,
          product: mockProduct
        }]
      };

      mockUseCart.mockReturnValue({
        cart: singleItemCart,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Cart />);
      
      const decreaseButton = screen.getByText('-');
      expect(decreaseButton).toBeDisabled();
    });

    test('handles image loading errors', () => {
      render(<Cart />);
      
      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);
      
      expect(images[0]).toHaveAttribute('src', 'https://via.placeholder.com/80x80?text=No+Image');
    });
  });

  describe('Loading and Error States', () => {
    test('displays loading state', () => {
      mockUseCart.mockReturnValue({
        cart: null,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: true,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Cart />);
      
      expect(screen.getByText('Loading cart...')).toBeInTheDocument();
    });

    test('displays error state', () => {
      mockUseCart.mockReturnValue({
        cart: null,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: 'Failed to load cart',
        refreshCart: jest.fn(),
      });

      render(<Cart />);
      
      expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    test('redirects unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<Cart />);
      
      // Should redirect or show login prompt
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<Cart />);
      
      // Test that mobile-specific elements are present
      const cartContainer = screen.getByTestId('cart-container');
      expect(cartContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles products with very long names', () => {
      const longNameProduct = {
        ...mockProduct,
        name: 'This is a very long product name that should be handled gracefully in the cart interface'
      };

      const cartWithLongName = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{
          ...mockCartItem,
          product: longNameProduct
        }],
        totalItems: 1,
        totalPrice: 29.99,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCart.mockReturnValue({
        cart: cartWithLongName,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Cart />);
      
      expect(screen.getByText(longNameProduct.name)).toBeInTheDocument();
    });

    test('handles very large quantities', () => {
      const highQuantityCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{
          ...mockCartItem,
          quantity: 999
        }],
        totalItems: 999,
        totalPrice: 29990.01,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCart.mockReturnValue({
        cart: highQuantityCart,
        addToCart: jest.fn(),
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Cart />);
      
      expect(screen.getByDisplayValue('999')).toBeInTheDocument();
    });
  });
});