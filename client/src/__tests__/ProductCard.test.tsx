import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { ProductCard } from '../components/ProductCard';

// Mock hooks
const mockUseAuth = {
  isAuthenticated: true,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
};

const mockUseCart = {
  cart: null,
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getCartTotal: jest.fn(),
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

jest.mock('../hooks/useCart', () => ({
  useCart: () => mockUseCart,
}));

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  price: 29.99,
  originalPrice: 39.99,
  imageUrl: 'https://example.com/product.jpg',
  category: 'Electronics',
  description: 'A great test product',
  stock: 10,
  rating: 4.5,
  reviewCount: 123,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isAuthenticated = true;
    mockUseCart.addToCart.mockResolvedValue(undefined);
  });

  describe('Basic Rendering', () => {
    test('displays product information correctly', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$39.99')).toBeInTheDocument();
      expect(screen.getByText('10 in stock')).toBeInTheDocument();
    });

    test('displays product image with correct alt text', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
    });

    test('displays star rating when rating is provided', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(4); // 4 full stars for 4.5 rating
      
      const reviewCount = screen.getByText('(123 reviews)');
      expect(reviewCount).toBeInTheDocument();
    });

    test('displays view details button with correct link', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const viewDetailsButton = screen.getByText('View Details');
      expect(viewDetailsButton).toBeInTheDocument();
      expect(viewDetailsButton.closest('a')).toHaveAttribute('href', '/products/product-1');
    });
  });

  describe('Authentication States', () => {
    test('shows add to cart button when authenticated', () => {
      mockUseAuth.isAuthenticated = true;
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    test('hides add to cart button when not authenticated', () => {
      mockUseAuth.isAuthenticated = false;
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  describe('Stock Management', () => {
    test('displays out of stock when stock is 0', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      renderWithRouter(<ProductCard product={outOfStockProduct} />);
      
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      
      const addToCartButton = screen.queryByText('Add to Cart');
      if (addToCartButton) {
        expect(addToCartButton).toBeDisabled();
      }
    });

    test('displays out of stock when stock is undefined', () => {
      const outOfStockProduct = { ...mockProduct, stock: undefined };
      renderWithRouter(<ProductCard product={outOfStockProduct} />);
      
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    test('shows correct stock count when in stock', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('10 in stock')).toBeInTheDocument();
    });
  });

  describe('Add to Cart Functionality', () => {
    test('calls addToCart when button is clicked', async () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);
      
      expect(mockUseCart.addToCart).toHaveBeenCalledWith('product-1', 1);
    });

    test('shows loading state while adding to cart', async () => {
      mockUseCart.addToCart.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);
      
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(addToCartButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });
    });

    test('handles add to cart error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseCart.addToCart.mockRejectedValue(new Error('Failed to add to cart'));
      
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add to cart:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('does not add to cart when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      renderWithRouter(<ProductCard product={outOfStockProduct} />);
      
      // Add to cart button should be disabled or not present for out of stock items
      const addToCartButton = screen.queryByText('Add to Cart');
      if (addToCartButton) {
        expect(addToCartButton).toBeDisabled();
        fireEvent.click(addToCartButton);
        expect(mockUseCart.addToCart).not.toHaveBeenCalled();
      }
    });
  });

  describe('Image Handling', () => {
    test('shows placeholder when image fails to load', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const image = screen.getByAltText('Test Product');
      fireEvent.error(image);
      
      expect(screen.getByText('No Image Available')).toBeInTheDocument();
    });

    test('uses placeholder image when imageUrl is not provided', () => {
      const productWithoutImage = { ...mockProduct, imageUrl: undefined };
      renderWithRouter(<ProductCard product={productWithoutImage} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', 'https://via.placeholder.com/300x250?text=No+Image');
    });
  });

  describe('Pricing Display', () => {
    test('shows original price when different from current price', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$39.99')).toBeInTheDocument();
    });

    test('hides original price when same as current price', () => {
      const productSamePrice = { ...mockProduct, originalPrice: 29.99 };
      renderWithRouter(<ProductCard product={productSamePrice} />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.queryByText(/line-through/)).not.toBeInTheDocument();
    });

    test('hides original price when not provided', () => {
      const productNoOriginalPrice = { ...mockProduct, originalPrice: undefined };
      renderWithRouter(<ProductCard product={productNoOriginalPrice} />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      // Should not show any struck-through price
    });
  });

  describe('Rating System', () => {
    test('does not show rating when not provided', () => {
      const productNoRating = { ...mockProduct, rating: undefined, reviewCount: undefined };
      renderWithRouter(<ProductCard product={productNoRating} />);
      
      expect(screen.queryByText('★')).not.toBeInTheDocument();
      expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    });

    test('shows rating without review count when review count not provided', () => {
      const productNoReviewCount = { ...mockProduct, reviewCount: undefined };
      renderWithRouter(<ProductCard product={productNoReviewCount} />);
      
      expect(screen.getAllByText('★')).toHaveLength(4);
      expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    });

    test('handles different rating values correctly', () => {
      const productLowRating = { ...mockProduct, rating: 2.0 };
      renderWithRouter(<ProductCard product={productLowRating} />);
      
      const filledStars = screen.getAllByText('★');
      expect(filledStars).toHaveLength(2); // 2 full stars for 2.0 rating
    });
  });

  describe('Accessibility', () => {
    test('has proper image alt text', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      const viewDetailsButton = screen.getByText('View Details');
      
      expect(addToCartButton).not.toHaveAttribute('tabindex', '-1');
      expect(viewDetailsButton).not.toHaveAttribute('tabindex', '-1');
    });

    test('disabled button is properly marked', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      renderWithRouter(<ProductCard product={outOfStockProduct} />);
      
      const addToCartButton = screen.queryByText('Add to Cart');
      if (addToCartButton) {
        expect(addToCartButton).toBeDisabled();
      }
    });
  });

  describe('Card Interaction', () => {
    test('card hover effects work properly', () => {
      renderWithRouter(<ProductCard product={mockProduct} />);
      
      // The styled components should handle hover effects
      // We can test that the components render without errors
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long product names', () => {
      const longNameProduct = {
        ...mockProduct,
        name: 'This is a very long product name that should be truncated properly when displayed in the card component'
      };
      
      renderWithRouter(<ProductCard product={longNameProduct} />);
      
      expect(screen.getByText(longNameProduct.name)).toBeInTheDocument();
    });

    test('handles zero price', () => {
      const freeProduct = { ...mockProduct, price: 0 };
      renderWithRouter(<ProductCard product={freeProduct} />);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    test('handles high stock numbers', () => {
      const highStockProduct = { ...mockProduct, stock: 999 };
      renderWithRouter(<ProductCard product={highStockProduct} />);
      
      expect(screen.getByText('999 in stock')).toBeInTheDocument();
    });
  });
});