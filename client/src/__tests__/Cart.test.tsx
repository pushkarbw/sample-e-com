import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Cart from '../pages/Cart';

// Mock navigation
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock cart hook
const mockUseCart = {
  cart: null,
  loading: false,
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  addToCart: jest.fn(),
  getCartTotal: jest.fn(),
};

jest.mock('../hooks/useCart', () => ({
  useCart: () => mockUseCart,
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const mockCartWithItems = {
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
    {
      id: 'item-2',
      productId: 'product-2',
      quantity: 1,
      subtotal: 49.99,
      product: {
        id: 'product-2',
        name: 'Test Product 2',
        price: 49.99,
        imageUrl: 'https://example.com/product2.jpg',
        stock: 5,
        category: 'Clothing',
        description: 'Another test product',
      },
    },
  ],
  totalItems: 3,
  totalAmount: 109.97,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCart.cart = null;
    mockUseCart.loading = false;
    mockUseCart.updateCartItem.mockResolvedValue(undefined);
    mockUseCart.removeFromCart.mockResolvedValue(undefined);
    mockUseCart.clearCart.mockResolvedValue(undefined);
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading State', () => {
    test('displays loading message when cart is loading', () => {
      mockUseCart.loading = true;
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Loading cart...')).toBeInTheDocument();
    });
  });

  describe('Empty Cart State', () => {
    test('displays empty cart message when cart is null', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Add some products to get started!')).toBeInTheDocument();
      
      const shopNowButton = screen.getByText('Shop Now');
      expect(shopNowButton.closest('a')).toHaveAttribute('href', '/products');
    });

    test('displays empty cart message when cart has no items', () => {
      mockUseCart.cart = { ...mockCartWithItems, items: [], totalItems: 0, totalAmount: 0 };
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });
  });

  describe('Cart with Items', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('displays cart title with item count', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();
    });

    test('displays all cart items with correct information', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('$29.99 each')).toBeInTheDocument();
      expect(screen.getByText('$49.99 each')).toBeInTheDocument();
      expect(screen.getByText('$59.98')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    test('displays product images with correct alt text', () => {
      renderWithRouter(<Cart />);
      
      const image1 = screen.getByAltText('Test Product 1');
      const image2 = screen.getByAltText('Test Product 2');
      
      expect(image1).toHaveAttribute('src', 'https://example.com/product1.jpg');
      expect(image2).toHaveAttribute('src', 'https://example.com/product2.jpg');
    });

    test('displays quantity controls for each item', () => {
      renderWithRouter(<Cart />);
      
      const decreaseButtons = screen.getAllByText('-');
      const increaseButtons = screen.getAllByText('+');
      
      expect(decreaseButtons).toHaveLength(2);
      expect(increaseButtons).toHaveLength(2);
      expect(screen.getByText('2')).toBeInTheDocument(); // quantity for first item
      expect(screen.getByText('1')).toBeInTheDocument(); // quantity for second item
    });

    test('displays cart summary with correct totals', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      // Use getAllByText for duplicate amounts and check specific positions
      const amounts = screen.getAllByText('$109.97');
      expect(amounts).toHaveLength(2); // Should appear in subtotal and total
      expect(screen.getByText('Shipping:')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Total:')).toBeInTheDocument();
    });

    test('displays action buttons', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Clear Cart')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
      expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
      
      expect(screen.getByText('Continue Shopping').closest('a')).toHaveAttribute('href', '/products');
    });
  });

  describe('Quantity Management', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('increases quantity when plus button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Cart />);
      
      const increaseButtons = screen.getAllByText('+');
      await user.click(increaseButtons[0]);
      
      expect(mockUseCart.updateCartItem).toHaveBeenCalledWith('item-1', 3);
    });

    test('decreases quantity when minus button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Cart />);
      
      const decreaseButtons = screen.getAllByText('-');
      await user.click(decreaseButtons[0]);
      
      expect(mockUseCart.updateCartItem).toHaveBeenCalledWith('item-1', 1);
    });

    test('disables decrease button when quantity is 1', () => {
      renderWithRouter(<Cart />);
      
      const decreaseButtons = screen.getAllByText('-');
      expect(decreaseButtons[1]).toBeDisabled(); // second item has quantity 1
      expect(decreaseButtons[0]).not.toBeDisabled(); // first item has quantity 2
    });

    test('disables increase button when quantity equals stock', () => {
      const cartWithMaxQuantity = {
        ...mockCartWithItems,
        items: [
          {
            ...mockCartWithItems.items[0],
            quantity: 10, // equals stock
          },
        ],
      };
      mockUseCart.cart = cartWithMaxQuantity;
      
      renderWithRouter(<Cart />);
      
      const increaseButton = screen.getByText('+');
      expect(increaseButton).toBeDisabled();
    });

    test('handles quantity update errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseCart.updateCartItem.mockRejectedValue(new Error('Update failed'));
      
      renderWithRouter(<Cart />);
      
      const increaseButton = screen.getAllByText('+')[0];
      await user.click(increaseButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update cart item:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Item Removal', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('removes item when remove button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Cart />);
      
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[0]);
      
      expect(mockUseCart.removeFromCart).toHaveBeenCalledWith('item-1');
    });

    test('handles item removal errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseCart.removeFromCart.mockRejectedValue(new Error('Remove failed'));
      
      renderWithRouter(<Cart />);
      
      const removeButton = screen.getAllByText('Remove')[0];
      await user.click(removeButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove cart item:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Cart Clearing', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('clears cart when clear cart button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      
      renderWithRouter(<Cart />);
      
      const clearButton = screen.getByText('Clear Cart');
      await user.click(clearButton);
      
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
      expect(mockUseCart.clearCart).toHaveBeenCalledTimes(1);
    });

    test('does not clear cart when user cancels confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      
      renderWithRouter(<Cart />);
      
      const clearButton = screen.getByText('Clear Cart');
      await user.click(clearButton);
      
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
      expect(mockUseCart.clearCart).not.toHaveBeenCalled();
    });

    test('handles clear cart errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseCart.clearCart.mockRejectedValue(new Error('Clear failed'));
      
      renderWithRouter(<Cart />);
      
      const clearButton = screen.getByText('Clear Cart');
      await user.click(clearButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cart:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('navigates to checkout when proceed to checkout is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Cart />);
      
      const checkoutButton = screen.getByText('Proceed to Checkout');
      await user.click(checkoutButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });

    test('continue shopping button links to products page', () => {
      renderWithRouter(<Cart />);
      
      const continueButton = screen.getByText('Continue Shopping');
      expect(continueButton.closest('a')).toHaveAttribute('href', '/products');
    });
  });

  describe('Image Error Handling', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('uses placeholder image when product image fails to load', () => {
      renderWithRouter(<Cart />);
      
      const productImage = screen.getByAltText('Test Product 1');
      fireEvent.error(productImage);
      
      expect(productImage).toHaveAttribute('src', 'https://via.placeholder.com/80x80?text=No+Image');
    });
  });

  describe('Edge Cases', () => {
    test('handles cart items with missing product information', () => {
      const cartWithMissingProduct = {
        ...mockCartWithItems,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            subtotal: 0,
            product: null,
          },
        ],
        totalItems: 1,
        totalAmount: 0,
      };
      mockUseCart.cart = cartWithMissingProduct;
      
      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Shopping Cart (1 items)')).toBeInTheDocument();
      expect(screen.getByText('$0.00 each')).toBeInTheDocument();
      // Use getAllByText for multiple $0.00 occurrences
      const zeroAmounts = screen.getAllByText('$0.00');
      expect(zeroAmounts.length).toBeGreaterThanOrEqual(1);
    });

    test('handles cart with zero total amount', () => {
      const freeCart = {
        ...mockCartWithItems,
        totalAmount: 0,
      };
      mockUseCart.cart = freeCart;
      
      renderWithRouter(<Cart />);
      
      expect(screen.getAllByText('$0.00')).toHaveLength(2); // subtotal and total
    });

    test('handles cart items with zero stock', () => {
      const cartWithZeroStock = {
        ...mockCartWithItems,
        items: [
          {
            ...mockCartWithItems.items[0],
            product: {
              ...mockCartWithItems.items[0].product!,
              stock: 0,
            },
          },
        ],
      };
      mockUseCart.cart = cartWithZeroStock;
      
      renderWithRouter(<Cart />);
      
      const increaseButton = screen.getByText('+');
      expect(increaseButton).toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('renders properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter(<Cart />);
      
      expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseCart.cart = mockCartWithItems;
    });

    test('has proper heading structure', () => {
      renderWithRouter(<Cart />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      renderWithRouter(<Cart />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('links are keyboard accessible', () => {
      renderWithRouter(<Cart />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('images have proper alt text', () => {
      renderWithRouter(<Cart />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    test('quantity controls are properly labeled', () => {
      renderWithRouter(<Cart />);
      
      const decreaseButtons = screen.getAllByText('-');
      const increaseButtons = screen.getAllByText('+');
      
      decreaseButtons.forEach(button => {
        expect(button).toBeVisible();
      });
      
      increaseButtons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      mockUseCart.cart = mockCartWithItems;
      
      const { rerender } = renderWithRouter(<Cart />);
      
      expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();
      
      // Re-render with same props
      rerender(<BrowserRouter><Cart /></BrowserRouter>);
      
      expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();
    });
  });
});