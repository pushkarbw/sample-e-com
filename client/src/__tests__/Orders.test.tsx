import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Orders from '../pages/Orders';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock hooks and API
const mockUseAuth = jest.fn();
const mockApiClient = {
  getOrders: jest.fn(),
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../services/apiClient', () => mockApiClient);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockOrders = [
  {
    id: 'order-1',
    status: 'delivered',
    total: 89.97,
    createdAt: '2024-01-15T10:30:00Z',
    items: [
      {
        id: 'item-1',
        product: { id: 'product-1', name: 'Test Product 1', price: 29.99 },
        quantity: 2,
        price: 29.99
      },
      {
        id: 'item-2', 
        product: { id: 'product-2', name: 'Test Product 2', price: 29.99 },
        quantity: 1,
        price: 29.99
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
    total: 49.99,
    createdAt: '2024-01-20T14:15:00Z',
    items: [
      {
        id: 'item-3',
        product: { id: 'product-3', name: 'Another Product', price: 49.99 },
        quantity: 1,
        price: 49.99
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

describe('Orders Page', () => {
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
    mockApiClient.getOrders.mockResolvedValue(mockOrders);
  });

  describe('Initial Load', () => {
    test('displays orders page title', () => {
      render(<Orders />);
      
      expect(screen.getByText('Order History')).toBeInTheDocument();
    });

    test('fetches and displays orders', async () => {
      render(<Orders />);
      
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-002')).toBeInTheDocument();
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
        expect(screen.getByText('Product 3')).toBeInTheDocument();
      });

      expect(mockApiClient.getOrders).toHaveBeenCalled();
    });

    test('redirects unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<Orders />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Order Display', () => {
    test('displays order status with appropriate styling', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const deliveredStatus = screen.getByText('Delivered');
        const processingStatus = screen.getByText('Processing');
        
        expect(deliveredStatus).toHaveClass('status-delivered');
        expect(processingStatus).toHaveClass('status-processing');
      });
    });

    test('displays order totals correctly', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('$129.97')).toBeInTheDocument();
        expect(screen.getByText('$49.99')).toBeInTheDocument();
      });
    });

    test('displays order dates in readable format', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('January 20, 2025')).toBeInTheDocument();
      });
    });

    test('displays item quantities and names', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Qty: 2')).toBeInTheDocument();
        expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      });
    });

    test('displays shipping addresses', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        expect(screen.getByText('Anytown, CA 12345')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
        expect(screen.getByText('Another City, NY 67890')).toBeInTheDocument();
      });
    });
  });

  describe('Order Actions', () => {
    test('displays view details button for each order', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        expect(viewDetailsButtons).toHaveLength(2);
      });
    });

    test('view details button links to order detail page', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        expect(viewDetailsButtons[0].closest('a')).toHaveAttribute('href', '/orders/order-1');
        expect(viewDetailsButtons[1].closest('a')).toHaveAttribute('href', '/orders/order-2');
      });
    });

    test('displays reorder button for delivered orders', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        // Should only show reorder for delivered orders
        const reorderButtons = screen.getAllByText('Reorder');
        expect(reorderButtons).toHaveLength(1);
      });
    });

    test('hides reorder button for non-delivered orders', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        // Processing order should not have reorder button
        const processingOrderCard = screen.getByText('ORD-002').closest('.order-card');
        expect(processingOrderCard).not.toHaveTextContent('Reorder');
      });
    });
  });

  describe('Empty State', () => {
    test('displays empty state when no orders exist', async () => {
      mockApiClient.getOrders.mockResolvedValue([]);
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('No Orders Yet')).toBeInTheDocument();
        expect(screen.getByText('You haven\'t placed any orders yet.')).toBeInTheDocument();
        expect(screen.getByText('Start Shopping')).toBeInTheDocument();
      });
    });

    test('start shopping button links to products page', async () => {
      mockApiClient.getOrders.mockResolvedValue([]);
      
      render(<Orders />);
      
      await waitFor(() => {
        const startShoppingButton = screen.getByText('Start Shopping');
        expect(startShoppingButton.closest('a')).toHaveAttribute('href', '/products');
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when orders fail to load', async () => {
      mockApiClient.getOrders.mockRejectedValue(new Error('Network error'));
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
      });
    });

    test('displays generic error for unknown errors', async () => {
      mockApiClient.getOrders.mockRejectedValue('Unknown error');
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
      });
    });

    test('shows retry button on error', async () => {
      mockApiClient.getOrders.mockRejectedValue(new Error('Network error'));
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Order Filtering and Sorting', () => {
    test('displays filter options', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('All Orders')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
      });
    });

    test('filters orders by status', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const deliveredFilter = screen.getByText('Delivered');
        fireEvent.click(deliveredFilter);
        
        // Should only show delivered orders
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
      });
    });

    test('sorts orders by date (newest first by default)', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const orderCards = screen.getAllByTestId('order-card');
        // ORD-002 (Jan 20) should appear before ORD-001 (Jan 15)
        expect(orderCards[0]).toHaveTextContent('ORD-002');
        expect(orderCards[1]).toHaveTextContent('ORD-001');
      });
    });
  });

  describe('Order Status Display', () => {
    test('shows different status badges with appropriate colors', async () => {
      const ordersWithAllStatuses = [
        { ...mockOrders[0], status: 'pending', id: 'order-pending' },
        { ...mockOrders[0], status: 'processing', id: 'order-processing' },
        { ...mockOrders[0], status: 'shipped', id: 'order-shipped' },
        { ...mockOrders[0], status: 'delivered', id: 'order-delivered' },
        { ...mockOrders[0], status: 'cancelled', id: 'order-cancelled' }
      ];

      mockApiClient.getOrders.mockResolvedValue(ordersWithAllStatuses);
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Pending')).toHaveClass('status-pending');
        expect(screen.getByText('Processing')).toHaveClass('status-processing');
        expect(screen.getByText('Shipped')).toHaveClass('status-shipped');
        expect(screen.getByText('Delivered')).toHaveClass('status-delivered');
        expect(screen.getByText('Cancelled')).toHaveClass('status-cancelled');
      });
    });
  });

  describe('Performance', () => {
    test('only fetches orders once on mount', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      expect(mockApiClient.getOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Orders />);
      
      await waitFor(() => {
        const container = screen.getByTestId('orders-container');
        expect(container).toHaveClass('mobile-layout');
      });
    });

    test('stacks order information on smaller screens', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const orderCards = screen.getAllByTestId('order-card');
        orderCards.forEach(card => {
          expect(card).toHaveClass('responsive-card');
        });
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      render(<Orders />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Order History');
      
      await waitFor(() => {
        const orderHeadings = screen.getAllByRole('heading', { level: 2 });
        expect(orderHeadings.length).toBeGreaterThan(0);
      });
    });

    test('has proper ARIA labels for interactive elements', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        viewDetailsButtons.forEach(button => {
          expect(button).toHaveAccessibleName();
        });
      });
    });

    test('supports keyboard navigation', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        const firstButton = screen.getAllByText('View Details')[0];
        firstButton.focus();
        expect(document.activeElement).toBe(firstButton);
      });
    });
  });

  describe('SEO and Meta', () => {
    test('sets appropriate page title', () => {
      render(<Orders />);
      
      expect(document.title).toContain('Order History');
    });
  });

  describe('Order Item Display', () => {
    test('handles orders with many items', async () => {
      const orderWithManyItems = {
        ...mockOrders[0],
        items: Array(10).fill(null).map((_, index) => ({
          id: `item-${index}`,
          productId: `product-${index}`,
          quantity: 1,
          price: 10.00,
          product: { ...mockProduct, name: `Product ${index + 1}` }
        }))
      };

      mockApiClient.getOrders.mockResolvedValue([orderWithManyItems]);
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 10')).toBeInTheDocument();
      });
    });

    test('handles missing product information gracefully', async () => {
      const orderWithMissingProduct = {
        ...mockOrders[0],
        items: [{
          id: 'item-missing',
          productId: 'missing-product',
          quantity: 1,
          price: 29.99,
          product: null
        }]
      };

      mockApiClient.getOrders.mockResolvedValue([orderWithMissingProduct]);
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('Product Unavailable')).toBeInTheDocument();
      });
    });
  });
});