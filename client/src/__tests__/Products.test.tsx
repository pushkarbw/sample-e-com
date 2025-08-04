import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../pages/Products';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock hooks and API
const mockUseAuth = jest.fn();
const mockApiClient = {
  getProducts: jest.fn(),
  getCategories: jest.fn(),
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../services/apiClient', () => mockApiClient);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

const mockProducts = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    price: 29.99,
    image: 'product1.jpg',
    category: 'Electronics',
    description: 'A test product',
    inStock: true,
    featured: false,
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    price: 49.99,
    image: 'product2.jpg',
    category: 'Clothing',
    description: 'Another test product',
    inStock: true,
    featured: false,
  },
];

const mockCategories = ['Electronics', 'Clothing', 'Books', 'Home & Garden'];

describe('Products Page', () => {
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
    mockApiClient.getProducts.mockResolvedValue({
      products: mockProducts,
      totalPages: 1,
      currentPage: 1,
      totalProducts: 2,
    });
    mockApiClient.getCategories.mockResolvedValue(mockCategories);
  });

  describe('Initial Load', () => {
    test('displays products and categories on load', async () => {
      render(<Products />);
      
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      });

      expect(mockApiClient.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        search: undefined,
        category: undefined
      });
      expect(mockApiClient.getCategories).toHaveBeenCalled();
    });

    test('displays loading state initially', () => {
      render(<Products />);
      
      expect(screen.getByText('Loading products...')).toBeInTheDocument();
    });

    test('displays category filter options', async () => {
      render(<Products />);
      
      await waitFor(() => {
        const categorySelect = screen.getByDisplayValue('All Categories');
        expect(categorySelect).toBeInTheDocument();
      });

      // Open select dropdown
      const select = screen.getByDisplayValue('All Categories');
      fireEvent.change(select, { target: { value: 'Electronics' } });
      
      expect(select.value).toBe('Electronics');
    });
  });

  describe('Search Functionality', () => {
    test('performs search when typing in search input', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'Electronics' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: 'Electronics',
          category: undefined
        });
      });
    });

    test('resets to page 1 when searching', async () => {
      render(<Products />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: 'test search',
          category: undefined
        });
      });
    });

    test('handles empty search results', async () => {
      mockApiClient.getProducts.mockResolvedValue({
        data: [],
        pagination: { page: 1, totalPages: 0, totalItems: 0, limit: 12 }
      });

      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('No products found.')).toBeInTheDocument();
      });
    });
  });

  describe('Category Filtering', () => {
    test('filters by category', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: undefined,
          category: 'Electronics'
        });
      });
    });

    test('resets to page 1 when changing category', async () => {
      render(<Products />);
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Clothing' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: undefined,
          category: 'Clothing'
        });
      });
    });
  });

  describe('Pagination', () => {
    test('displays pagination when multiple pages exist', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    test('navigates to next page', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 2,
          limit: 12,
          search: undefined,
          category: undefined
        });
      });
    });

    test('navigates to specific page', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      const pageButton = screen.getByText('2');
      fireEvent.click(pageButton);

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 2,
          limit: 12,
          search: undefined,
          category: undefined
        });
      });
    });

    test('disables previous button on first page', async () => {
      render(<Products />);
      
      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    test('hides pagination when only one page', async () => {
      mockApiClient.getProducts.mockResolvedValue({
        data: [mockProduct],
        pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 12 }
      });

      render(<Products />);
      
      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error when product loading fails', async () => {
      mockApiClient.getProducts.mockRejectedValue(new Error('Network error'));
      
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('handles category loading failure gracefully', async () => {
      mockApiClient.getCategories.mockRejectedValue(new Error('Failed to load categories'));
      
      render(<Products />);
      
      await waitFor(() => {
        // Should still show products even if categories fail
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });
    });

    test('retries failed requests', async () => {
      mockApiClient.getProducts
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockProducts);
      
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Simulate retry
      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'retry' } });

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    test('applies both search and category filters', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      const categorySelect = screen.getByDisplayValue('All Categories');

      fireEvent.change(searchInput, { target: { value: 'electronics' } });
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: 'electronics',
          category: 'Electronics'
        });
      });
    });

    test('clears filters when selecting "All Categories"', async () => {
      render(<Products />);
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      
      // First set a category
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
      
      // Then clear it
      fireEvent.change(categorySelect, { target: { value: '' } });

      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenLastCalledWith({
          page: 1,
          limit: 12,
          search: undefined,
          category: undefined
        });
      });
    });
  });

  describe('Product Display', () => {
    test('displays product cards for each product', async () => {
      render(<Products />);
      
      await waitFor(() => {
        expect(screen.getAllByText(/\$\d+\.\d{2}/).length).toBeGreaterThan(0);
      });
    });

    test('handles products with missing images', async () => {
      const productsWithMissingImages = {
        ...mockProducts,
        data: [{
          ...mockProduct,
          imageUrl: ''
        }]
      };

      mockApiClient.getProducts.mockResolvedValue(productsWithMissingImages);

      render(<Products />);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', '');
      });
    });
  });

  describe('Performance', () => {
    test('debounces search input', async () => {
      render(<Products />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      
      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });

      // Should only call API after debounce delay
      await waitFor(() => {
        expect(mockApiClient.getProducts).toHaveBeenCalledWith({
          page: 1,
          limit: 12,
          search: 'abc',
          category: undefined
        });
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<Products />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
      });
    });

    test('supports keyboard navigation', async () => {
      render(<Products />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      
      // Should be focusable
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Mobile Responsive', () => {
    test('adapts layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Products />);
      
      const container = screen.getByTestId('products-container');
      expect(container).toBeInTheDocument();
    });
  });
});