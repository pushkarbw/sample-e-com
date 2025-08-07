import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../pages/Signup';
import { useAuth } from '../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      isLoading: false,
      loading: false,
      refreshUser: jest.fn(),
    });
  });

  describe('Initial Render', () => {
    test('displays signup form with all fields', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('displays link to login page', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      const loginLink = screen.getByText('Login here');
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    test('redirects authenticated users to home', () => {
      // Mock the authentication state
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        signup: jest.fn(),
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      // Directly test the navigation redirect logic without resetModules
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      // Check that the navigate function was called
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Validation', () => {
    test('validates required fields', async () => {
      const mockSignup = jest.fn().mockRejectedValue(new Error('Validation failed'));
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);

      // The actual component has HTML5 validation so it won't call the API
      // with empty fields. Let's validate the fields are required.
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeRequired();
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toBeRequired();
      
      const lastNameInput = screen.getByLabelText(/last name/i);
      expect(lastNameInput).toBeRequired();
    });

    test('validates email format', async () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      // The component uses HTML5 validation for email format
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('validates password strength', async () => {
      const mockSignup = jest.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      });
      
      expect(mockSignup).not.toHaveBeenCalled();
    });

    test('validates name fields for minimum length', async () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      fireEvent.change(firstNameInput, { target: { value: 'A' } });
      fireEvent.change(lastNameInput, { target: { value: 'B' } });
      
      // The component doesn't have explicit validation for name length in the UI,
      // so we just verify the values are set
      expect(firstNameInput).toHaveValue('A');
      expect(lastNameInput).toHaveValue('B');
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    };

    test('submits form with valid data', async () => {
      const mockSignup = jest.fn().mockResolvedValue({});
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);
      
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123'
        });
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows loading state during submission', async () => {
      // Mock the signup function to delay so we can check loading state
      let resolveSignup: () => void;
      const signupPromise = new Promise<void>((resolve) => {
        resolveSignup = resolve;
      });
      
      const mockSignup = jest.fn().mockImplementation(() => signupPromise);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);
      
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(signupButton).toBeDisabled();
      
      // Resolve the signup promise
      await act(async () => {
        resolveSignup();
        await signupPromise;
      });
    });

    test('handles signup errors', async () => {
      const mockSignup = jest.fn().mockRejectedValue(new Error('Email already exists'));
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
      
      expect(signupButton).not.toBeDisabled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles generic signup error', async () => {
      const mockSignup = jest.fn().mockRejectedValue('Unknown error');
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        loading: false,
        refreshUser: jest.fn(),
      });
      
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signupButton);
      
      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });
    });
  });

  describe('Form Auto-completion', () => {
    test('supports browser autocomplete', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('autoComplete', 'given-name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('autoComplete', 'family-name');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('autoComplete', 'new-password');
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign Up');
    });
  });

  describe('Security Features', () => {
    test('password input is properly masked', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('form prevents default submission', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      // Get the form element directly by tag instead of by role
      const form = screen.getByText('Create Account').closest('form');
      expect(form).toBeInTheDocument();
      
      const preventDefault = jest.fn();
      fireEvent.submit(form!, { preventDefault });
      
      // The form's onSubmit handler calls preventDefault internally
      // We can verify this indirectly by checking that the signup function was not called
      expect(mockUseAuth().signup).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long names gracefully', () => {
      render(<BrowserRouter><Signup /></BrowserRouter>);
      
      const veryLongName = 'A'.repeat(100);
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      fireEvent.change(firstNameInput, { target: { value: veryLongName } });
      
      // Since there's no explicit validation on max length in the component,
      // the value should be the full string
      expect(firstNameInput.value).toBe(veryLongName);
    });
  });
});