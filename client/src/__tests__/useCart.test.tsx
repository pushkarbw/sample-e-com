import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../hooks/useCart';
import apiClient from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';

// Mock API client
jest.mock('../services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

const mockCart = {
  id: 'cart-1',
  userId: 'user-1',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      subtotal: 59.98,
      product: {
        id: 'product-1',
        name: 'Test Product 1',
        price: 29.99,
        imageUrl: 'https://example.com/product1.jpg',
        stock: 10,
        category: 'Electronics',
        description: 'A test product',
      },
    },
  ],
  totalItems: 2,
  totalAmount: 59.98,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('useCart Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockApiClient.getCart.mockResolvedValue(mockCart);
    mockApiClient.addToCart.mockResolvedValue(mockCart);
    mockApiClient.updateCartItem.mockResolvedValue(mockCart);
    mockApiClient.removeFromCart.mockResolvedValue(mockCart);
    mockApiClient.clearCart.mockResolvedValue(undefined);
  });

  describe('Hook Context', () => {
    test('throws error when used outside CartProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        expect(() => {
          renderHook(() => useCart());
        }).toThrow('useCart must be used within a CartProvider');
      } finally {
        consoleError.mockRestore();
      }
    });

    test('provides context when used within CartProvider', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.cart).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.addToCart).toBe('function');
      expect(typeof result.current.updateQuantity).toBe('function');
      expect(typeof result.current.updateCartItem).toBe('function');
      expect(typeof result.current.removeFromCart).toBe('function');
      expect(typeof result.current.clearCart).toBe('function');
      expect(typeof result.current.refreshCart).toBe('function');
    });
  });

  describe('Initial State', () => {
    test('initializes with null cart when not authenticated', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current.cart).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('loads cart when user becomes authenticated', async () => {
      const { result, rerender } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current.cart).toBe(null);
      
      await act(async () => {
        mockUseAuth.isAuthenticated = true;
        rerender(); // Trigger effect with new auth state
      });
      
      // The test needs to wait for the async effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockApiClient.getCart).toHaveBeenCalledTimes(1);
    });

    test('clears cart when user becomes unauthenticated', async () => {
      mockUseAuth.isAuthenticated = true;
      
      // Set up a cart first
      mockApiClient.getCart.mockResolvedValue(mockCart);
      
      const { result, rerender } = renderHook(() => useCart(), { wrapper });
      
      // Wait for initial cart load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify we have a cart
      expect(result.current.cart).toEqual(mockCart);
      
      // Now simulate logout
      await act(async () => {
        mockUseAuth.isAuthenticated = false;
        rerender(); // Trigger effect with new auth state
      });
      
      expect(result.current.cart).toBe(null);
    });
  });

  describe('Cart Refresh', () => {
    test('successfully refreshes cart when authenticated', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.refreshCart();
      });
      
      expect(mockApiClient.getCart).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
      expect(result.current.cart).toEqual(mockCart);
      expect(result.current.error).toBe(null);
    });

    test('does not refresh cart when not authenticated', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.refreshCart();
      });
      
      expect(mockApiClient.getCart).not.toHaveBeenCalled();
    });

    test('handles refresh errors gracefully', async () => {
      mockUseAuth.isAuthenticated = true;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApiClient.getCart.mockRejectedValue(new Error('Failed to load cart'));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.refreshCart();
      });
      
      expect(result.current.error).toBe('Failed to load cart');
      expect(result.current.isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh cart:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Add to Cart', () => {
    test('successfully adds item to cart when authenticated', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.addToCart('product-1', 2);
      });
      
      expect(mockApiClient.addToCart).toHaveBeenCalledWith('product-1', 2);
      expect(result.current.cart).toEqual(mockCart);
      expect(result.current.error).toBe(null);
    });

    test('throws error when not authenticated', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.addToCart('product-1', 2)).rejects.toThrow(
          'Please login to add items to cart'
        );
      });
      
      expect(mockApiClient.addToCart).not.toHaveBeenCalled();
    });

    test('handles add to cart errors', async () => {
      mockUseAuth.isAuthenticated = true;
      mockApiClient.addToCart.mockRejectedValue(new Error('Product out of stock'));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.addToCart('product-1', 2)).rejects.toThrow(
          'Product out of stock'
        );
      });
      
      expect(result.current.error).toBe('Product out of stock');
      expect(result.current.isLoading).toBe(false);
    });

    test('sets loading state during add to cart', async () => {
      mockUseAuth.isAuthenticated = true;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.addToCart.mockReturnValue(promise);
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addToCart('product-1', 2);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      await act(async () => {
        resolvePromise!(mockCart);
        await promise;
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Update Quantity', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('successfully updates item quantity', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.updateQuantity('item-1', 3);
      });
      
      expect(mockApiClient.updateCartItem).toHaveBeenCalledWith('item-1', 3);
      expect(result.current.cart).toEqual(mockCart);
    });

    test('removes item when quantity is 0 or negative', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.updateQuantity('item-1', 0);
      });
      
      expect(mockApiClient.removeFromCart).toHaveBeenCalledWith('item-1');
      expect(mockApiClient.updateCartItem).not.toHaveBeenCalled();
    });

    test('updateCartItem is alias for updateQuantity', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.updateCartItem('item-1', 2);
      });
      
      expect(mockApiClient.updateCartItem).toHaveBeenCalledWith('item-1', 2);
    });

    test('does nothing when not authenticated', async () => {
      mockUseAuth.isAuthenticated = false;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.updateQuantity('item-1', 3);
      });
      
      expect(mockApiClient.updateCartItem).not.toHaveBeenCalled();
    });

    test('handles update quantity errors', async () => {
      mockApiClient.updateCartItem.mockRejectedValue(new Error('Invalid quantity'));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.updateQuantity('item-1', 3)).rejects.toThrow(
          'Invalid quantity'
        );
      });
      
      expect(result.current.error).toBe('Invalid quantity');
    });
  });

  describe('Remove from Cart', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('successfully removes item from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.removeFromCart('item-1');
      });
      
      expect(mockApiClient.removeFromCart).toHaveBeenCalledWith('item-1');
      expect(result.current.cart).toEqual(mockCart);
    });

    test('does nothing when not authenticated', async () => {
      mockUseAuth.isAuthenticated = false;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.removeFromCart('item-1');
      });
      
      expect(mockApiClient.removeFromCart).not.toHaveBeenCalled();
    });

    test('handles remove from cart errors', async () => {
      mockApiClient.removeFromCart.mockRejectedValue(new Error('Item not found'));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.removeFromCart('item-1')).rejects.toThrow(
          'Item not found'
        );
      });
      
      expect(result.current.error).toBe('Item not found');
    });
  });

  describe('Clear Cart', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('successfully clears cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.clearCart();
      });
      
      expect(mockApiClient.clearCart).toHaveBeenCalledTimes(1);
      expect(result.current.cart).toBe(null);
    });

    test('does nothing when not authenticated', async () => {
      mockUseAuth.isAuthenticated = false;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.clearCart();
      });
      
      expect(mockApiClient.clearCart).not.toHaveBeenCalled();
    });

    test('handles clear cart errors', async () => {
      mockApiClient.clearCart.mockRejectedValue(new Error('Clear failed'));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.clearCart()).rejects.toThrow('Clear failed');
      });
      
      expect(result.current.error).toBe('Clear failed');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('loading and isLoading are equivalent', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current.loading).toBe(result.current.isLoading);
    });

    test('sets loading state during operations', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.addToCart.mockReturnValue(promise);
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addToCart('product-1', 1);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        resolvePromise!(mockCart);
        await promise;
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('clears error on successful operations', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      // First cause an error
      mockApiClient.addToCart.mockRejectedValue(new Error('First error'));
      
      await act(async () => {
        await expect(result.current.addToCart('product-1', 1)).rejects.toThrow();
      });
      
      expect(result.current.error).toBe('First error');
      
      // Then perform successful operation
      mockApiClient.addToCart.mockResolvedValue(mockCart);
      
      await act(async () => {
        await result.current.addToCart('product-1', 1);
      });
      
      expect(result.current.error).toBe(null);
    });

    test('handles non-Error objects in catch blocks', async () => {
      mockApiClient.addToCart.mockRejectedValue('String error');
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await expect(result.current.addToCart('product-1', 1)).rejects.toBe('String error');
      });
      
      expect(result.current.error).toBe('Failed to add item to cart');
    });
  });

  describe('Authentication Integration', () => {
    test('refreshes cart when authentication status changes to true', async () => {
      const { rerender } = renderHook(() => useCart(), { wrapper });
      
      expect(mockApiClient.getCart).not.toHaveBeenCalled();
      
      await act(async () => {
        mockUseAuth.isAuthenticated = true;
        rerender();
      });
      
      expect(mockApiClient.getCart).toHaveBeenCalledTimes(1);
    });

    test('clears cart when authentication status changes to false', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result, rerender } = renderHook(() => useCart(), { wrapper });
      
      // Set initial cart state
      await act(async () => {
        await result.current.refreshCart();
      });
      
      expect(result.current.cart).toEqual(mockCart);
      
      // Change auth status to false
      await act(async () => {
        mockUseAuth.isAuthenticated = false;
        rerender();
      });
      
      expect(result.current.cart).toBe(null);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    test('handles multiple simultaneous add operations', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      const promises = [
        result.current.addToCart('product-1', 1),
        result.current.addToCart('product-2', 2),
        result.current.addToCart('product-3', 1),
      ];
      
      await act(async () => {
        await Promise.allSettled(promises);
      });
      
      expect(mockApiClient.addToCart).toHaveBeenCalledTimes(3);
    });

    test('maintains state consistency during rapid operations', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.addToCart('product-1', 1);
        await result.current.updateQuantity('item-1', 3);
        await result.current.removeFromCart('item-1');
      });
      
      expect(mockApiClient.addToCart).toHaveBeenCalledTimes(1);
      expect(mockApiClient.updateCartItem).toHaveBeenCalledTimes(1);
      expect(mockApiClient.removeFromCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined or null product IDs gracefully', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.addToCart('', 1);
        await result.current.addToCart(undefined as any, 1);
      });
      
      expect(mockApiClient.addToCart).toHaveBeenCalledWith('', 1);
      expect(mockApiClient.addToCart).toHaveBeenCalledWith(undefined, 1);
    });

    test('handles negative quantities in updateQuantity', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.updateQuantity('item-1', -1);
      });
      
      expect(mockApiClient.removeFromCart).toHaveBeenCalledWith('item-1');
      expect(mockApiClient.updateCartItem).not.toHaveBeenCalled();
    });

    test('handles very large quantities', async () => {
      mockUseAuth.isAuthenticated = true;
      const { result } = renderHook(() => useCart(), { wrapper });
      
      await act(async () => {
        await result.current.addToCart('product-1', 999999);
      });
      
      expect(mockApiClient.addToCart).toHaveBeenCalledWith('product-1', 999999);
    });
  });
});