import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from '../components/Header';
import { render as customRender, mockUser } from '../utils/test-utils';

// Mock hooks
const mockUseAuth = jest.fn();
const mockUseCart = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../hooks/useCart', () => ({
  useCart: mockUseCart,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Header Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: mockLogout,
      signup: jest.fn(),
      isLoading: false,
      refreshUser: jest.fn(),
    });
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
  });

  describe('Unauthenticated State', () => {
    test('renders logo and navigation links', () => {
      customRender(<Header />);
      
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    test('does not show authenticated user features', () => {
      customRender(<Header />);
      
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
      expect(screen.queryByText('Orders')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    test('logo links to home page', () => {
      customRender(<Header />);
      
      const logo = screen.getByText('E-Commerce');
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });

    test('navigation links have correct hrefs', () => {
      customRender(<Header />);
      
      expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('Products').closest('a')).toHaveAttribute('href', '/products');
      expect(screen.getByText('Login').closest('a')).toHaveAttribute('href', '/login');
      expect(screen.getByText('Sign Up').closest('a')).toHaveAttribute('href', '/signup');
    });

    test('has proper search functionality', () => {
      customRender(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      expect(searchInput).toBeInTheDocument();
      
      fireEvent.change(searchInput, { target: { value: 'laptop' } });
      expect(searchInput).toHaveValue('laptop');
    });

    test('search redirects to products page with query', () => {
      customRender(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: 'laptop' } });
      fireEvent.submit(searchForm!);
      
      expect(mockNavigate).toHaveBeenCalledWith('/products?search=laptop');
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 0, totalPrice: 0, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });
    });

    test('shows authenticated user features', () => {
      customRender(<Header />);
      
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText(`Hi, ${mockUser.firstName}!`)).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('does not show unauthenticated features', () => {
      customRender(<Header />);
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    test('cart link has correct href', () => {
      customRender(<Header />);
      
      expect(screen.getByText('Cart').closest('a')).toHaveAttribute('href', '/cart');
    });

    test('orders link has correct href', () => {
      customRender(<Header />);
      
      expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/orders');
    });

    test('calls logout and navigates to home on logout click', async () => {
      customRender(<Header />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows user dropdown menu', async () => {
      customRender(<Header />);
      
      const userButton = screen.getByText(`Hi, ${mockUser.firstName}!`);
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Cart Badge', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });
    });

    test('displays cart badge when cart has items', () => {
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 3, totalPrice: 89.97, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('does not display cart badge when cart is empty', () => {
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 0, totalPrice: 0, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('does not display cart badge when cart is null', () => {
      customRender(<Header />);
      
      const cartLink = screen.getByText('Cart');
      expect(cartLink.parentElement?.querySelector('.badge')).not.toBeInTheDocument();
    });

    test('displays correct count for large numbers', () => {
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 99, totalPrice: 2999.01, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    test('displays 99+ for very large numbers', () => {
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 150, totalPrice: 4499.50, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    test('shows mobile menu toggle on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      customRender(<Header />);
      
      const menuToggle = screen.getByRole('button', { name: /menu/i });
      expect(menuToggle).toBeInTheDocument();
    });

    test('mobile menu toggle works correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      customRender(<Header />);
      
      const menuToggle = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuToggle);
      
      expect(screen.getByTestId('mobile-menu')).toHaveClass('open');
    });

    test('mobile menu closes when clicking outside', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      customRender(<Header />);
      
      const menuToggle = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuToggle);
      
      fireEvent.click(document.body);
      
      expect(screen.getByTestId('mobile-menu')).not.toHaveClass('open');
    });
  });

  describe('Responsive Behavior', () => {
    test('maintains structure on different screen sizes', () => {
      customRender(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      const nav = header.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('adapts navigation for tablet screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      customRender(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('tablet-layout');
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      customRender(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('all links are keyboard accessible', () => {
      customRender(<Header />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('logout button is keyboard accessible', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      customRender(<Header />);
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeVisible();
      expect(logoutButton).not.toHaveAttribute('tabindex', '-1');
    });

    test('search form has proper labels', () => {
      customRender(<Header />);
      
      const searchInput = screen.getByLabelText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('cart badge has proper ARIA label', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });
      mockUseCart.mockReturnValue({
        cart: { id: 'cart-1', userId: 'user-1', items: [], totalItems: 5, totalPrice: 149.95, createdAt: new Date(), updatedAt: new Date() },
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      const cartBadge = screen.getByText('5');
      expect(cartBadge).toHaveAttribute('aria-label', 'Cart has 5 items');
    });
  });

  describe('Error Handling', () => {
    test('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', firstName: '', lastName: '', email: 'test@example.com' },
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.getByText('Hi, !')).toBeInTheDocument();
    });

    test('handles missing cart data gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        signup: jest.fn(),
        isLoading: false,
        refreshUser: jest.fn(),
      });
      mockUseCart.mockReturnValue({
        cart: undefined as any,
        addToCart: jest.fn(),
        updateQuantity: jest.fn(),
        removeFromCart: jest.fn(),
        clearCart: jest.fn(),
        isLoading: false,
        error: null,
        refreshCart: jest.fn(),
      });

      customRender(<Header />);
      
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    test('handles search with empty query gracefully', () => {
      customRender(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      const searchForm = searchInput.closest('form');
      
      fireEvent.submit(searchForm!);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    test('applies correct styling classes', () => {
      customRender(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('header');
    });

    test('supports dark mode toggle', () => {
      customRender(<Header />);
      
      const themeToggle = screen.getByRole('button', { name: /theme/i });
      expect(themeToggle).toBeInTheDocument();
      
      fireEvent.click(themeToggle);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('dark-theme');
    });
  });
});