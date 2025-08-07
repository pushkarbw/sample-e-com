import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from '../components/Header';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock navigation
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock hooks
const mockUseAuth = {
  isAuthenticated: false,
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.user = null;
    mockUseCart.cart = null;
  });

  describe('Basic Navigation', () => {
    test('displays logo and basic navigation links', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      
      // Check links have correct hrefs
      expect(screen.getByText('E-Commerce').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('Products').closest('a')).toHaveAttribute('href', '/products');
    });

    test('displays login and signup links when not authenticated', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      
      expect(screen.getByText('Login').closest('a')).toHaveAttribute('href', '/login');
      expect(screen.getByText('Sign Up').closest('a')).toHaveAttribute('href', '/signup');
    });

    test('does not display authenticated user links when not logged in', () => {
      renderWithRouter(<Header />);
      
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
      expect(screen.queryByText('Orders')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User State', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
    });

    test('displays user greeting when authenticated', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
    });

    test('displays logout button when authenticated', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });

    test('displays cart and orders links when authenticated', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      
      expect(screen.getByText('Cart').closest('a')).toHaveAttribute('href', '/cart');
      expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/orders');
    });

    test('hides login and signup links when authenticated', () => {
      renderWithRouter(<Header />);
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    test('handles logout action correctly', () => {
      renderWithRouter(<Header />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockUseAuth.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Cart Badge Functionality', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
    });

    test('shows cart badge when cart has items', () => {
      mockUseCart.cart = {
        id: 'cart-1',
        items: [
          { id: 'item-1', productId: 'product-1', quantity: 2, price: 29.99 },
          { id: 'item-2', productId: 'product-2', quantity: 1, price: 49.99 },
        ],
        totalItems: 3,
        totalAmount: 109.97,
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('does not show cart badge when cart is empty', () => {
      mockUseCart.cart = {
        id: 'cart-1',
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    test('does not show cart badge when cart is null', () => {
      mockUseCart.cart = null;
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Cart')).toBeInTheDocument();
      // Should not show any badge
      const cartLink = screen.getByText('Cart').closest('a');
      expect(cartLink?.querySelector('span')).not.toBeInTheDocument();
    });

    test('updates cart badge when cart items change', () => {
      mockUseCart.cart = {
        id: 'cart-1',
        items: [{ id: 'item-1', productId: 'product-1', quantity: 5, price: 29.99 }],
        totalItems: 5,
        totalAmount: 149.95,
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    test('handles user with no firstName gracefully', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 'user-1',
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, !')).toBeInTheDocument();
    });

    test('handles user with undefined firstName', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 'user-1',
        firstName: undefined,
        lastName: 'Doe',
        email: 'john@example.com',
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, !')).toBeInTheDocument();
    });

    test('displays correct user name with special characters', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 'user-1',
        firstName: 'José',
        lastName: 'García',
        email: 'jose@example.com',
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, José!')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('renders all navigation elements on desktop', () => {
      renderWithRouter(<Header />);
      
      // All main navigation should be visible
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    test('maintains functionality when viewport changes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter(<Header />);
      
      // All functionality should remain
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper header landmark', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('has proper navigation landmark', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('all links are keyboard accessible', () => {
      renderWithRouter(<Header />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('logout button is keyboard accessible', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      
      renderWithRouter(<Header />);
      
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      expect(logoutButton).not.toHaveAttribute('tabindex', '-1');
    });

    test('cart badge has proper accessibility attributes', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      mockUseCart.cart = {
        id: 'cart-1',
        items: [{ id: 'item-1', productId: 'product-1', quantity: 3, price: 29.99 }],
        totalItems: 3,
        totalAmount: 89.97,
      };
      
      renderWithRouter(<Header />);
      
      const cartBadge = screen.getByText('3');
      expect(cartBadge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles null user object when authenticated', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = null;
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, !')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('handles large cart item counts', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      mockUseCart.cart = {
        id: 'cart-1',
        items: [],
        totalItems: 999,
        totalAmount: 9999.99,
      };
      
      renderWithRouter(<Header />);
      
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    test('handles authentication state changes', () => {
      const { rerender } = renderWithRouter(<Header />);
      
      // Initially not authenticated
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      
      // Become authenticated
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      
      rerender(<BrowserRouter><Header /></BrowserRouter>);
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with auth hook', () => {
      renderWithRouter(<Header />);
      
      // Should reflect auth state correctly
      expect(mockUseAuth.isAuthenticated).toBe(false);
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('integrates properly with cart hook', () => {
      mockUseAuth.isAuthenticated = true;
      renderWithRouter(<Header />);
      
      // Should access cart from hook
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });

    test('handles hook state updates correctly', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      
      const { rerender } = renderWithRouter(<Header />);
      
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
      
      // Update user
      mockUseAuth.user = { id: 'user-1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' };
      
      rerender(<BrowserRouter><Header /></BrowserRouter>);
      
      expect(screen.getByText('Hi, Jane!')).toBeInTheDocument();
    });
  });
});