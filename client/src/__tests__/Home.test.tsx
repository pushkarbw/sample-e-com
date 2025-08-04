import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../pages/Home';
import { render as customRender } from '../utils/test-utils';

// Mock API client
const mockApiClient = {
  getFeaturedProducts: jest.fn(),
};

jest.mock('../services/apiClient', () => mockApiClient);

const mockFeaturedProducts = [
  {
    id: 'product-1',
    name: 'Featured Product 1',
    price: 29.99,
    image: 'featured1.jpg',
    category: 'Electronics',
    description: 'A great featured product',
    inStock: true,
    featured: true,
  },
  {
    id: 'product-2',
    name: 'Featured Product 2',
    price: 49.99,
    image: 'featured2.jpg',
    category: 'Clothing',
    description: 'Another featured product',
    inStock: true,
    featured: true,
  },
];

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.getFeaturedProducts.mockResolvedValue(mockFeaturedProducts);
  });

  describe('Initial Load', () => {
    test('displays hero section', () => {
      render(<Home />);
      
      expect(screen.getByText('Welcome to Our Store')).toBeInTheDocument();
      expect(screen.getByText('Discover amazing products at great prices')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    test('hero shop now button links to products page', () => {
      render(<Home />);
      
      const shopNowButton = screen.getByText('Shop Now');
      expect(shopNowButton.closest('a')).toHaveAttribute('href', '/products');
    });

    test('loads and displays featured products', async () => {
      render(<Home />);
      
      expect(screen.getByText('Featured Products')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
        expect(screen.getByText('Featured Product 2')).toBeInTheDocument();
      });

      expect(mockApiClient.getFeaturedProducts).toHaveBeenCalledWith(4);
    });

    test('displays view all products link when featured products exist', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const viewAllLink = screen.getByText('View All Products');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/products');
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state for featured products', () => {
      render(<Home />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('hides loading state after products load', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when featured products fail to load', async () => {
      mockApiClient.getFeaturedProducts.mockRejectedValue(new Error('Network error'));
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load featured products')).toBeInTheDocument();
      });
    });

    test('displays generic error for unknown errors', async () => {
      mockApiClient.getFeaturedProducts.mockRejectedValue('Unknown error');
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load featured products')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    test('handles no featured products gracefully', async () => {
      mockApiClient.getFeaturedProducts.mockResolvedValue([]);
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured Products')).toBeInTheDocument();
        // Should not show "View All Products" link when no products
        expect(screen.queryByText('View All Products')).not.toBeInTheDocument();
      });
    });
  });

  describe('Product Grid Layout', () => {
    test('displays products in responsive grid', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const productGrid = screen.getByTestId('featured-products-grid');
        expect(productGrid).toBeInTheDocument();
      });
    });

    test('handles different numbers of featured products', async () => {
      // Test with fewer products
      mockApiClient.getFeaturedProducts.mockResolvedValue([mockFeaturedProducts[0]]);
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
        expect(screen.queryByText('Featured Product 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('SEO and Meta', () => {
    test('has proper page structure for SEO', () => {
      render(<Home />);
      
      // Check for main content area
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('only requests featured products once on mount', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      });

      expect(mockApiClient.getFeaturedProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    test('adapts hero section for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Home />);
      
      expect(screen.getByText('Welcome to Our Store')).toBeInTheDocument();
    });

    test('product grid adapts to screen size', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const productGrid = screen.getByTestId('featured-products-grid');
        expect(productGrid).toHaveClass('responsive-grid');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper landmarks and navigation', () => {
      render(<Home />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('product links are keyboard accessible', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const productLinks = screen.getAllByRole('link');
        productLinks.forEach(link => {
          expect(link).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });

    test('images have proper alt text', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
          expect(img.getAttribute('alt')).not.toBe('');
        });
      });
    });
  });

  describe('Call-to-Action Buttons', () => {
    test('hero CTA button has proper styling and behavior', () => {
      render(<Home />);
      
      const ctaButton = screen.getByText('Shop Now');
      expect(ctaButton).toHaveClass('btn-primary');
      expect(ctaButton.closest('a')).toHaveAttribute('href', '/products');
    });

    test('view all products button appears when products exist', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const viewAllButton = screen.getByText('View All Products');
        expect(viewAllButton).toHaveClass('btn-outline');
      });
    });
  });
});