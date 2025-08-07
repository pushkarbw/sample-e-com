import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Home from '../pages/Home';

// Mock the ProductCard component
jest.mock('../components/ProductCard', () => ({
  ProductCard: ({ product }: { product: any }) => (
    <div data-testid={`product-card-${product.id}`}>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  ),
}));

// Mock API client
const mockApiClient = {
  getFeaturedProducts: jest.fn(),
};

jest.mock('../services/apiClient', () => ({
  default: mockApiClient,
}));

const mockFeaturedProducts = [
  {
    id: 'product-1',
    name: 'Featured Product 1',
    price: 29.99,
    imageUrl: 'featured1.jpg',
    category: 'Electronics',
    description: 'A great featured product',
    stock: 10,
    rating: 4.5,
    reviewCount: 123,
  },
  {
    id: 'product-2',
    name: 'Featured Product 2',
    price: 49.99,
    imageUrl: 'featured2.jpg',
    category: 'Clothing',
    description: 'Another featured product',
    stock: 5,
    rating: 4.8,
    reviewCount: 89,
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.getFeaturedProducts.mockResolvedValue(mockFeaturedProducts);
  });

  describe('Initial Render', () => {
    test('displays hero section with correct content', () => {
      renderWithRouter(<Home />);
      
      expect(screen.getByText('Welcome to Our Store')).toBeInTheDocument();
      expect(screen.getByText('Discover amazing products at great prices')).toBeInTheDocument();
      
      const shopNowButton = screen.getByText('Shop Now');
      expect(shopNowButton).toBeInTheDocument();
      expect(shopNowButton.closest('a')).toHaveAttribute('href', '/products');
    });

    test('displays featured products section title', () => {
      renderWithRouter(<Home />);
      
      expect(screen.getByText('Featured Products')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      renderWithRouter(<Home />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Featured Products Loading', () => {
    test('loads and displays featured products successfully', async () => {
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      expect(screen.getByText('Featured Product 2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-2')).toBeInTheDocument();
      
      expect(mockApiClient.getFeaturedProducts).toHaveBeenCalledTimes(1);
    });

    test('displays view all products link when products exist', async () => {
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        const viewAllLink = screen.getByText('View All Products');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/products');
      });
    });

    test('displays products in grid layout', async () => {
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        const productGrid = screen.getByTestId('featured-products-grid');
        expect(productGrid).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when featured products fail to load', async () => {
      const errorMessage = 'Network error';
      mockApiClient.getFeaturedProducts.mockRejectedValue(new Error(errorMessage));
      
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByTestId('featured-products-grid')).not.toBeInTheDocument();
    });

    test('displays generic error for non-Error objects', async () => {
      mockApiClient.getFeaturedProducts.mockRejectedValue('Unknown error');
      
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load featured products')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('handles no featured products gracefully', async () => {
      mockApiClient.getFeaturedProducts.mockResolvedValue([]);
      
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('No featured products available at the moment.')).toBeInTheDocument();
      expect(screen.queryByText('View All Products')).not.toBeInTheDocument();
      expect(screen.queryByTestId('featured-products-grid')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      renderWithRouter(<Home />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('all links are accessible', () => {
      renderWithRouter(<Home />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Component Interaction', () => {
    test('calls API only once on mount', async () => {
      renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      });

      expect(mockApiClient.getFeaturedProducts).toHaveBeenCalledTimes(1);
    });

    test('does not refetch on re-render', async () => {
      const { rerender } = renderWithRouter(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      });

      rerender(<BrowserRouter><Home /></BrowserRouter>);
      
      expect(mockApiClient.getFeaturedProducts).toHaveBeenCalledTimes(1);
    });
  });
});