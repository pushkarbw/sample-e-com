import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import apiClient from '../services/apiClient';
import { render, mockUser, mockProduct } from '../utils/test-utils';

jest.mock('../hooks/useAuth');
jest.mock('../hooks/useCart');
jest.mock('../services/apiClient');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

describe('ProductDetail Page', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;
  const mockAddToCart = jest.fn();

  const detailedProduct = {
    ...mockProduct,
    id: 'product-1',
    name: 'Detailed Test Product',
    description: 'This is a detailed description of the test product with all the features and benefits.',
    price: 99.99,
    originalPrice: 129.99,
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 42,
    stock: 15,
    imageUrl: 'https://example.com/product.jpg',
    images: [
      'https://example.com/product-1.jpg',
      'https://example.com/product-2.jpg',
      'https://example.com/product-3.jpg'
    ],
    specifications: {
      'Brand': 'Test Brand',
      'Model': 'TB-001',
      'Weight': '2.5 lbs',
      'Dimensions': '10" x 8" x 2"',
      'Warranty': '1 Year'
    },
    features: [
      'High-quality materials',
      'Easy to use',
      'Durable construction',
      'Excellent performance'
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'product-1' });
    
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
      cart: null,
      addToCart: mockAddToCart,
      updateQuantity: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      isLoading: false,
      error: null,
      refreshCart: jest.fn(),
    });

    mockApiClient.getProduct.mockResolvedValue(detailedProduct);
  });

  describe('Initial Load', () => {
    test('fetches and displays product details', async () => {
      render(<ProductDetail />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Detailed Test Product')).toBeInTheDocument();
        expect(screen.getByText(/This is a detailed description/)).toBeInTheDocument();
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.getByText('$129.99')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(mockApiClient.getProduct).toHaveBeenCalledWith('product-1');
    });

    test('displays product rating and reviews', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('★★★★☆')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('(42 reviews)')).toBeInTheDocument();
      });
    });

    test('displays stock information', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('In Stock (15 available)')).toBeInTheDocument();
      });
    });

    test('displays product specifications', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Specifications')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('TB-001')).toBeInTheDocument();
        expect(screen.getByText('2.5 lbs')).toBeInTheDocument();
        expect(screen.getByText('1 Year')).toBeInTheDocument();
      });
    });

    test('displays product features', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('High-quality materials')).toBeInTheDocument();
        expect(screen.getByText('Easy to use')).toBeInTheDocument();
        expect(screen.getByText('Durable construction')).toBeInTheDocument();
        expect(screen.getByText('Excellent performance')).toBeInTheDocument();
      });
    });
  });

  describe('Image Gallery', () => {
    test('displays main product image', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const mainImage = screen.getByAltText('Detailed Test Product');
        expect(mainImage).toHaveAttribute('src', 'https://example.com/product.jpg');
      });
    });

    test('displays thumbnail images when available', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const thumbnails = screen.getAllByRole('img');
        expect(thumbnails.length).toBeGreaterThan(1);
      });
    });

    test('switches main image when thumbnail is clicked', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const thumbnails = screen.getAllByTestId('thumbnail');
        if (thumbnails.length > 0) {
          fireEvent.click(thumbnails[1]);
          
          const mainImage = screen.getByAltText('Detailed Test Product');
          expect(mainImage).toHaveAttribute('src', 'https://example.com/product-2.jpg');
        }
      });
    });

    test('handles image loading errors', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const mainImage = screen.getByAltText('Detailed Test Product');
        fireEvent.error(mainImage);
        
        expect(mainImage).toHaveAttribute('src', 'https://via.placeholder.com/400x400?text=No+Image');
      });
    });
  });

  describe('Add to Cart Functionality', () => {
    test('shows add to cart button for authenticated users', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });
    });

    test('hides add to cart button for unauthenticated users', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
        expect(screen.getByText('Login to Purchase')).toBeInTheDocument();
      });
    });

    test('allows quantity selection', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/quantity/i);
        expect(quantityInput).toBeInTheDocument();
        expect(quantityInput).toHaveValue(1);
        
        fireEvent.change(quantityInput, { target: { value: '3' } });
        expect(quantityInput).toHaveValue(3);
      });
    });

    test('adds product to cart with selected quantity', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/quantity/i);
        fireEvent.change(quantityInput, { target: { value: '2' } });
        
        const addToCartButton = screen.getByText('Add to Cart');
        fireEvent.click(addToCartButton);
        
        expect(mockAddToCart).toHaveBeenCalledWith('product-1', 2);
      });
    });

    test('shows out of stock when product unavailable', async () => {
      const outOfStockProduct = { ...detailedProduct, stock: 0 };
      mockApiClient.getProduct.mockResolvedValue(outOfStockProduct);

      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
        expect(screen.getByText('Add to Cart')).toBeDisabled();
      });
    });

    test('limits quantity to available stock', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/quantity/i);
        expect(quantityInput).toHaveAttribute('max', '15');
        
        fireEvent.change(quantityInput, { target: { value: '20' } });
        expect(quantityInput).toHaveValue(15);
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error when product not found', async () => {
      mockApiClient.getProduct.mockRejectedValue(new Error('Product not found'));
      
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Product not found')).toBeInTheDocument();
      });
    });

    test('displays generic error for other failures', async () => {
      mockApiClient.getProduct.mockRejectedValue(new Error('Network error'));
      
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load product details')).toBeInTheDocument();
      });
    });

    test('handles missing product ID', () => {
      mockUseParams.mockReturnValue({});
      
      render(<ProductDetail />);
      
      expect(screen.getByText('Invalid product ID')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    test('shows discount when original price is higher', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.getByText('$129.99')).toHaveClass('original-price');
        expect(screen.getByText('Save $30.00')).toBeInTheDocument();
      });
    });

    test('hides original price when no discount', async () => {
      const regularProduct = { ...detailedProduct, originalPrice: 99.99 };
      mockApiClient.getProduct.mockResolvedValue(regularProduct);

      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });
  });

  describe('Breadcrumb Navigation', () => {
    test('displays breadcrumb navigation', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Detailed Test Product')).toBeInTheDocument();
      });
    });

    test('breadcrumb links are functional', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const homeLink = screen.getByText('Home');
        expect(homeLink.closest('a')).toHaveAttribute('href', '/');
        
        const productsLink = screen.getByText('Products');
        expect(productsLink.closest('a')).toHaveAttribute('href', '/products');
      });
    });
  });

  describe('Related Products', () => {
    test('fetches and displays related products', async () => {
      const relatedProducts = [
        { ...mockProduct, id: 'related-1', name: 'Related Product 1' },
        { ...mockProduct, id: 'related-2', name: 'Related Product 2' }
      ];
      
      mockApiClient.getRelatedProducts.mockResolvedValue(relatedProducts);

      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Related Products')).toBeInTheDocument();
        expect(screen.getByText('Related Product 1')).toBeInTheDocument();
        expect(screen.getByText('Related Product 2')).toBeInTheDocument();
      });
    });

    test('handles no related products gracefully', async () => {
      mockApiClient.getRelatedProducts.mockResolvedValue([]);

      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.queryByText('Related Products')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ProductDetail />);
      
      await waitFor(() => {
        const container = screen.getByTestId('product-detail-container');
        expect(container).toHaveClass('mobile-layout');
      });
    });

    test('stacks image and details on smaller screens', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const productLayout = screen.getByTestId('product-layout');
        expect(productLayout).toHaveClass('responsive-layout');
      });
    });
  });

  describe('SEO and Metadata', () => {
    test('sets page title from product name', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(document.title).toContain('Detailed Test Product');
      });
    });

    test('has proper heading hierarchy', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Detailed Test Product');
        expect(screen.getByRole('heading', { level: 2, name: /specifications/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /features/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and descriptions', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const addToCartButton = screen.getByText('Add to Cart');
        expect(addToCartButton).toHaveAttribute('aria-describedby');
        
        const quantityInput = screen.getByLabelText(/quantity/i);
        expect(quantityInput).toHaveAccessibleName();
      });
    });

    test('supports keyboard navigation', async () => {
      render(<ProductDetail />);
      
      await waitFor(() => {
        const addToCartButton = screen.getByText('Add to Cart');
        addToCartButton.focus();
        expect(document.activeElement).toBe(addToCartButton);
      });
    });
  });
});