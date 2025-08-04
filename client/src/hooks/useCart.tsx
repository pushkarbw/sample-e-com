import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import apiClient from '../services/apiClient';
import { Cart } from '../types';
import { useAuth } from './useAuth';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const cartData = await apiClient.getCart();
      setCart(cartData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart';
      setError(errorMessage);
      console.error('Failed to refresh cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedCart = await apiClient.addToCart(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      
      const updatedCart = await apiClient.updateCartItem(itemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      const updatedCart = await apiClient.removeFromCart(itemId);
      setCart(updatedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      await apiClient.clearCart();
      setCart(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cart,
    isLoading,
    loading: isLoading,
    error,
    addToCart,
    updateQuantity,
    updateCartItem: updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};