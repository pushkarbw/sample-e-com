import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Checkout from '../pages/Checkout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import apiClient from '../services/apiClient';
import { render, mockUser, mockCartItem, mockProduct, mockOrder } from '../utils/test-utils';

jest.mock('../hooks/useAuth');
jest.mock('../hooks/useCart');
jest.mock('../services/apiClient');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Checkout Page', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        ...mockCartItem,
        id: 'item-1',
        quantity: 2,
        product: { ...mockProduct, id: 'product-1', name: 'Test Product 1', price: 29.99 }
      },
      {
        ...mockCartItem,
        id: 'item-2',
        quantity: 1,
        product: { ...mockProduct, id: 'product-2', name: 'Test Product 2', price: 49.99 }
      }
    ],
    totalItems: 3,
    totalPrice: 109.97,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

    mockUseCart.mockReturnValue({
      cart: mockCart,
      addToCart: jest.fn(),
      updateQuantity: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      isLoading: false,
      error: null,
      refreshCart: jest.fn(),
    });

    mockApiClient.createOrder.mockResolvedValue(mockOrder);
  });

  describe('Initial Load', () => {
    test('displays checkout page title and form', () => {
      render(<Checkout />);
      
      expect(screen.getByText('Checkout')).toBeInTheDocument();
      expect(screen.getByText('Shipping Information')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    test('displays order summary with cart items', () => {
      render(<Checkout />);
      
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      expect(screen.getByText('$109.97')).toBeInTheDocument();
    });

    test('redirects to cart if cart is empty', () => {
      mockUseCart.mockReturnValue({
        cart: null,
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Checkout />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });
  });

  describe('Shipping Form', () => {
    test('renders all shipping form fields', () => {
      render(<Checkout />);
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    test('pre-fills user information from auth context', () => {
      render(<Checkout />);
      
      expect(screen.getByDisplayValue(mockUser.firstName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.lastName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      render(<Checkout />);
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Phone is required')).toBeInTheDocument();
        expect(screen.getByText('Street address is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('State is required')).toBeInTheDocument();
        expect(screen.getByText('ZIP code is required')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      render(<Checkout />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('validates phone number format', async () => {
      render(<Checkout />);
      
      const phoneInput = screen.getByLabelText(/phone/i);
      fireEvent.change(phoneInput, { target: { value: '123' } });
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    test('validates ZIP code format', async () => {
      render(<Checkout />);
      
      const zipInput = screen.getByLabelText(/zip code/i);
      fireEvent.change(zipInput, { target: { value: '123' } });
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid ZIP code')).toBeInTheDocument();
      });
    });
  });

  describe('Order Placement', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '(555) 123-4567' } });
      fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Anytown' } });
      fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } });
      fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '12345' } });
      fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'United States' } });
    };

    test('successfully places order with valid form', async () => {
      render(<Checkout />);
      
      fillValidForm();
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(mockApiClient.createOrder).toHaveBeenCalledWith({
          items: mockCart.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          })),
          shippingAddress: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'United States'
          }
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(`/orders/${mockOrder.id}`);
    });

    test('shows loading state during order placement', async () => {
      mockApiClient.createOrder.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<Checkout />);
      
      fillValidForm();
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      expect(screen.getByText('Placing Order...')).toBeInTheDocument();
      expect(placeOrderButton).toBeDisabled();
    });

    test('handles order placement error', async () => {
      mockApiClient.createOrder.mockRejectedValue(new Error('Payment failed'));
      
      render(<Checkout />);
      
      fillValidForm();
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument();
      });

      expect(placeOrderButton).not.toBeDisabled();
    });

    test('handles generic order error', async () => {
      mockApiClient.createOrder.mockRejectedValue('Unknown error');
      
      render(<Checkout />);
      
      fillValidForm();
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to place order. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    test('redirects unauthenticated users to login', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<Checkout />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Order Summary', () => {
    test('calculates and displays correct totals', () => {
      render(<Checkout />);
      
      expect(screen.getByText('Subtotal: $109.97')).toBeInTheDocument();
      expect(screen.getByText('Shipping: $9.99')).toBeInTheDocument();
      expect(screen.getByText('Tax: $9.60')).toBeInTheDocument(); // Assuming 8.75% tax
      expect(screen.getByText('Total: $129.56')).toBeInTheDocument();
    });

    test('displays free shipping for orders over threshold', () => {
      const highValueCart = {
        ...mockCart,
        totalPrice: 150.00,
        items: [{
          ...mockCartItem,
          quantity: 1,
          product: { ...mockProduct, price: 150.00 }
        }]
      };

      mockUseCart.mockReturnValue({
        cart: highValueCart,
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      render(<Checkout />);
      
      expect(screen.getByText('Shipping: FREE')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Checkout />);
      
      expect(screen.getByTestId('checkout-container')).toBeInTheDocument();
    });

    test('stacks form and summary on smaller screens', () => {
      render(<Checkout />);
      
      const checkoutLayout = screen.getByTestId('checkout-layout');
      expect(checkoutLayout).toHaveClass('responsive-layout');
    });
  });

  describe('Form Auto-completion', () => {
    test('supports browser autocomplete', () => {
      render(<Checkout />);
      
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('autoComplete', 'given-name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('autoComplete', 'family-name');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('autoComplete', 'tel');
      expect(screen.getByLabelText(/street address/i)).toHaveAttribute('autoComplete', 'street-address');
      expect(screen.getByLabelText(/city/i)).toHaveAttribute('autoComplete', 'address-level2');
      expect(screen.getByLabelText(/state/i)).toHaveAttribute('autoComplete', 'address-level1');
      expect(screen.getByLabelText(/zip code/i)).toHaveAttribute('autoComplete', 'postal-code');
      expect(screen.getByLabelText(/country/i)).toHaveAttribute('autoComplete', 'country-name');
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and ARIA attributes', () => {
      render(<Checkout />);
      
      const formInputs = screen.getAllByRole('textbox');
      formInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    test('displays validation errors with proper ARIA attributes', async () => {
      render(<Checkout />);
      
      const placeOrderButton = screen.getByText('Place Order');
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    test('supports keyboard navigation', () => {
      render(<Checkout />);
      
      const firstInput = screen.getByLabelText(/first name/i);
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing user information gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { ...mockUser, firstName: '', lastName: '', email: '' },
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<Checkout />);
      
      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });

    test('handles very long addresses', async () => {
      render(<Checkout />);
      
      const veryLongAddress = 'A'.repeat(500);
      const streetInput = screen.getByLabelText(/street address/i);
      fireEvent.change(streetInput, { target: { value: veryLongAddress } });

      expect(streetInput.value).toBe(veryLongAddress.substring(0, 255)); // Assuming max length
    });
  });
});