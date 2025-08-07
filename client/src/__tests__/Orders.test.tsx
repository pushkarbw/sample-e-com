import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Orders from '../pages/Orders';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock hooks and API
const mockUseAuth = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../services/apiClient', () => {
  const mockApiClient = {
    getOrders: jest.fn(),
  };
  return mockApiClient;
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  price: 29.99,
  imageUrl: 'test.jpg',
  category: 'Electronics',
  description: 'A test product',
  stock: 10,
  rating: 4.5,
  reviewCount: 123,
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrders = [
  {
    id: 'order-1',
    status: 'delivered',
    totalAmount: 89.97,
    createdAt: '2024-01-15T10:30:00Z',
    items: [
      {
        id: 'item-1',
        productName: 'Test Product 1',
        productPrice: 29.99,
        quantity: 2,
        subtotal: 59.98
      },
      {
        id: 'item-2', 
        productName: 'Test Product 2',
        productPrice: 29.99,
        quantity: 1,
        subtotal: 29.99
      }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Test City',
      state: 'TC',
      zipCode: '12345',
      country: 'Test Country'
    }
  },
  {
    id: 'order-2',
    status: 'pending',
    totalAmount: 49.99,
    createdAt: '2024-01-20T14:15:00Z',
    items: [
      {
        id: 'item-3',
        productName: 'Another Product',
        productPrice: 49.99,
        quantity: 1,
        subtotal: 49.99
      }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Another City',
      state: 'AC',
      zipCode: '67890',
      country: 'Test Country'
    }
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Orders Page', () => {
  let mockApiClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = require('../services/apiClient');
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      isLoading: false,
      refreshUser: jest.fn(),
    });
    mockApiClient.getOrders.mockResolvedValue(mockOrders);
  });

  describe('Initial Load', () => {
    test('displays orders page title', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('My Orders')).toBeInTheDocument();
      });
    });

    test('fetches and displays orders', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Order #order-1')).toBeInTheDocument();
        expect(screen.getByText('Order #order-2')).toBeInTheDocument();
      });

      expect(mockApiClient.getOrders).toHaveBeenCalledTimes(1);
    });

    test('displays loading state initially', () => {
      renderWithRouter(<Orders />);
      
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    test('displays order status badges', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('delivered')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    test('displays order totals', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('$89.97')).toBeInTheDocument();
        // Use getAllByText since there are multiple $49.99 elements
        const priceElements = screen.getAllByText('$49.99');
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });

    test('displays order dates', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/January 20, 2024/)).toBeInTheDocument();
      });
    });

    test('displays item quantities and names', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
      });
    });

    test('displays shipping addresses', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        // Check for shipping address sections
        expect(screen.getAllByText('Shipping Address')).toHaveLength(2);
        // Check for address content
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
        expect(screen.getByText(/456 Oak Ave/)).toBeInTheDocument();
      });
    });
  });

  describe('Order Actions', () => {
    test('displays cancel button for pending orders', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Cancel Order')).toBeInTheDocument();
      });
    });

    test('does not display cancel button for delivered orders', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel Order');
        expect(cancelButtons).toHaveLength(1); // Only pending order should have cancel button
      });
    });
  });

  describe('Empty State', () => {
    test('displays empty state when no orders exist', async () => {
      mockApiClient.getOrders.mockResolvedValue([]);
      
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
        expect(screen.getByText('You haven\'t placed any orders yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when orders fail to load', async () => {
      mockApiClient.getOrders.mockRejectedValue(new Error('Failed to load orders'));
      
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
      });
    });

    test('displays generic error for unknown errors', async () => {
      mockApiClient.getOrders.mockRejectedValue('Unknown error');
      
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Display', () => {
    test('shows different status badges with appropriate colors', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        const deliveredBadge = screen.getByText('delivered');
        const pendingBadge = screen.getByText('pending');
        
        expect(deliveredBadge).toHaveAttribute('status', 'delivered');
        expect(pendingBadge).toHaveAttribute('status', 'pending');
      });
    });
  });

  describe('Performance', () => {
    test('only fetches orders once on mount', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Order #order-1')).toBeInTheDocument();
      });

      expect(mockApiClient.getOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Orders');
      });
    });

    test('has proper ARIA labels for interactive elements', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel Order');
        expect(cancelButton).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel Order');
        expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Order Item Display', () => {
    test('handles orders with many items', async () => {
      const largeOrder = {
        id: 'order-large',
        status: 'delivered',
        totalAmount: 100.00,
        createdAt: '2024-01-25T10:00:00Z',
        items: Array.from({ length: 10 }, (_, index) => ({
          id: `item-${index + 1}`,
          quantity: 1,
          productPrice: 10.00,
          productName: `Product ${index + 1}`,
          subtotal: 10.00
        })),
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      mockApiClient.getOrders.mockResolvedValue([largeOrder]);
      
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 10')).toBeInTheDocument();
      });
    });

    test('handles missing product information gracefully', async () => {
      const orderWithMissingProduct = {
        id: 'order-missing-product',
        status: 'delivered',
        totalAmount: 29.99,
        createdAt: '2024-01-25T10:00:00Z',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            productPrice: 29.99,
            productName: '',
            subtotal: 29.99
          }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      mockApiClient.getOrders.mockResolvedValue([orderWithMissingProduct]);
      
      renderWithRouter(<Orders />);
      
      await waitFor(() => {
        // Check that the product name is empty
        const productNameElement = screen.getByText('Qty: 1 × $29.99');
        expect(productNameElement).toBeInTheDocument();
      });
    });
  });
});