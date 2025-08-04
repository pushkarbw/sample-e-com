import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { render, mockUser, mockProduct } from '../utils/test-utils';

jest.mock('../hooks/useAuth');
jest.mock('../hooks/useCart');

const MockedProductCard = ({ product }: { product: any }) => (
  <ProductCard product={product} />
);

describe('ProductCard Component', () => {
  const mockUseAuth = require('../hooks/useAuth').useAuth;
  const mockUseCart = require('../hooks/useCart').useCart;
  const mockAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    mockUseCart.mockReturnValue({
      addToCart: mockAddToCart,
    });
  });

  const defaultProduct = {
    ...mockProduct,
    id: 1,
    name: 'Test Product',
    price: 29.99,
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 10,
    stock: 5,
    imageUrl: 'https://example.com/image.jpg',
  };

  describe('Product Display', () => {
    test('renders product information correctly', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('(10 reviews)')).toBeInTheDocument();
    });

    test('displays product image with correct attributes', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    test('displays star rating correctly', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const stars = screen.getByText('★★★★☆');
      expect(stars).toBeInTheDocument();
    });

    test('handles different rating values', () => {
      const productWith5Stars = { ...defaultProduct, rating: 5 };
      const productWith1Star = { ...defaultProduct, rating: 1.2 };
      
      const { rerender } = render(<MockedProductCard product={productWith5Stars} />);
      expect(screen.getByText('★★★★★')).toBeInTheDocument();
      
      rerender(<MockedProductCard product={productWith1Star} />);
      expect(screen.getByText('★☆☆☆☆')).toBeInTheDocument();
    });

    test('displays price with correct formatting', () => {
      const productWithWholePrice = { ...defaultProduct, price: 30 };
      const productWithDecimalPrice = { ...defaultProduct, price: 29.95 };
      
      const { rerender } = render(<MockedProductCard product={productWithWholePrice} />);
      expect(screen.getByText('$30.00')).toBeInTheDocument();
      
      rerender(<MockedProductCard product={productWithDecimalPrice} />);
      expect(screen.getByText('$29.95')).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    test('shows placeholder when image fails to load', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const image = screen.getByAltText('Test Product');
      fireEvent.error(image);
      
      expect(image).toHaveAttribute('src', 'https://via.placeholder.com/400x200?text=No+Image');
    });
  });

  describe('View Details Button', () => {
    test('always shows view details button', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const viewButton = screen.getByText('View Details');
      expect(viewButton).toBeInTheDocument();
      expect(viewButton.closest('a')).toHaveAttribute('href', '/products/1');
    });

    test('view details link works for different product IDs', () => {
      const productWithDifferentId = { ...defaultProduct, id: 42 };
      render(<MockedProductCard product={productWithDifferentId} />);
      
      const viewButton = screen.getByText('View Details');
      expect(viewButton.closest('a')).toHaveAttribute('href', '/products/42');
    });
  });

  describe('Unauthenticated User', () => {
    test('does not show add to cart button when not authenticated', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
      expect(screen.queryByText('Out of Stock')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });
    });

    test('shows add to cart button when authenticated and in stock', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const addButton = screen.getByText('Add to Cart');
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toBeDisabled();
    });

    test('shows out of stock button when product has no stock', () => {
      const outOfStockProduct = { ...defaultProduct, stock: 0 };
      render(<MockedProductCard product={outOfStockProduct} />);
      
      const outOfStockButton = screen.getByText('Out of Stock');
      expect(outOfStockButton).toBeInTheDocument();
      expect(outOfStockButton).toBeDisabled();
    });

    test('calls addToCart when add to cart button is clicked', async () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      expect(mockAddToCart).toHaveBeenCalledWith(1, 1);
    });

    test('handles addToCart success', async () => {
      mockAddToCart.mockResolvedValue({});
      render(<MockedProductCard product={defaultProduct} />);
      
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockAddToCart).toHaveBeenCalledWith(1, 1);
      });
    });

    test('handles addToCart error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAddToCart.mockRejectedValue(new Error('Network error'));
      
      render(<MockedProductCard product={defaultProduct} />);
      
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to add to cart:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Product Variations', () => {
    test('handles products with no reviews', () => {
      const productWithNoReviews = { ...defaultProduct, reviewCount: 0 };
      render(<MockedProductCard product={productWithNoReviews} />);
      
      expect(screen.getByText('(0 reviews)')).toBeInTheDocument();
    });

    test('handles products with many reviews', () => {
      const productWithManyReviews = { ...defaultProduct, reviewCount: 1250 };
      render(<MockedProductCard product={productWithManyReviews} />);
      
      expect(screen.getByText('(1250 reviews)')).toBeInTheDocument();
    });

    test('handles very long product names', () => {
      const productWithLongName = {
        ...defaultProduct,
        name: 'This is a very long product name that might wrap to multiple lines and should still be displayed correctly',
      };
      render(<MockedProductCard product={productWithLongName} />);
      
      expect(screen.getByText(productWithLongName.name)).toBeInTheDocument();
    });

    test('handles very expensive products', () => {
      const expensiveProduct = { ...defaultProduct, price: 9999.99 };
      render(<MockedProductCard product={expensiveProduct} />);
      
      expect(screen.getByText('$9999.99')).toBeInTheDocument();
    });

    test('handles free products', () => {
      const freeProduct = { ...defaultProduct, price: 0 };
      render(<MockedProductCard product={freeProduct} />);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('image has proper alt text', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      render(<MockedProductCard product={defaultProduct} />);
      
      const addButton = screen.getByText('Add to Cart');
      expect(addButton).not.toHaveAttribute('tabindex', '-1');
    });

    test('links are keyboard accessible', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const viewButton = screen.getByText('View Details');
      expect(viewButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Hover Effects', () => {
    test('card maintains structure for hover effects', () => {
      render(<MockedProductCard product={defaultProduct} />);
      
      const productName = screen.getByText('Test Product');
      const card = productName.closest('[data-testid]') || productName.closest('div');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing image URL', () => {
      const productWithoutImage = { ...defaultProduct, imageUrl: '' };
      render(<MockedProductCard product={productWithoutImage} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', '');
    });

    test('handles zero rating', () => {
      const productWithZeroRating = { ...defaultProduct, rating: 0 };
      render(<MockedProductCard product={productWithZeroRating} />);
      
      expect(screen.getByText('☆☆☆☆☆')).toBeInTheDocument();
    });

    test('handles negative stock', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const productWithNegativeStock = { ...defaultProduct, stock: -1 };
      render(<MockedProductCard product={productWithNegativeStock} />);
      
      const button = screen.getByText('Add to Cart');
      expect(button).not.toBeDisabled();
    });
  });
});