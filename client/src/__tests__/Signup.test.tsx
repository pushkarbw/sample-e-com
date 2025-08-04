import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import Signup from '../pages/Signup';
import { useAuth } from '../hooks/useAuth';
import { render } from '../utils/test-utils';

jest.mock('../hooks/useAuth');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Signup Page', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockSignup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      signup: mockSignup,
      isLoading: false,
      refreshUser: jest.fn(),
    });
  });

  describe('Initial Render', () => {
    test('displays signup form with all fields', () => {
      render(<Signup />);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    test('displays link to login page', () => {
      render(<Signup />);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      const loginLink = screen.getByText('Sign in');
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    test('redirects authenticated users to home', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: false,
        refreshUser: jest.fn(),
      });

      render(<Signup />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Validation', () => {
    test('validates required fields', async () => {
      render(<Signup />);
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      render(<Signup />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('validates password strength', async () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    test('validates password confirmation match', async () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('validates name fields for minimum length', async () => {
      render(<Signup />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      fireEvent.change(firstNameInput, { target: { value: 'A' } });
      fireEvent.change(lastNameInput, { target: { value: 'B' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
        expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    test('validates names contain only letters', async () => {
      render(<Signup />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      fireEvent.change(firstNameInput, { target: { value: 'John123' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe!' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('First name can only contain letters')).toBeInTheDocument();
        expect(screen.getByText('Last name can only contain letters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    };

    test('submits form with valid data', async () => {
      mockSignup.mockResolvedValue(undefined);
      
      render(<Signup />);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
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
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        signup: mockSignup,
        isLoading: true,
        refreshUser: jest.fn(),
      });

      render(<Signup />);
      
      const signupButton = screen.getByRole('button', { name: /creating account/i });
      expect(signupButton).toBeDisabled();
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    });

    test('handles signup errors', async () => {
      mockSignup.mockRejectedValue(new Error('Email already exists'));
      
      render(<Signup />);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(signupButton).not.toBeDisabled();
    });

    test('handles generic signup error', async () => {
      mockSignup.mockRejectedValue('Unknown error');
      
      render(<Signup />);
      
      fillValidForm();
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create account. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    test('shows password strength indicator', () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    test('updates strength as password improves', () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      expect(screen.getByText('Medium')).toBeInTheDocument();
      
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('Form Auto-completion', () => {
    test('supports browser autocomplete', () => {
      render(<Signup />);
      
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('autoComplete', 'given-name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('autoComplete', 'family-name');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('autoComplete', 'new-password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('autoComplete', 'new-password');
    });
  });

  describe('Real-time Validation', () => {
    test('validates email format on blur', async () => {
      render(<Signup />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('validates password confirmation on blur', async () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('clears validation errors when field is corrected', async () => {
      render(<Signup />);
      
      const emailInput = screen.getByLabelText(/email/i);
      
      // First enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Then correct it
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and ARIA attributes', () => {
      render(<Signup />);
      
      const formInputs = screen.getAllByRole('textbox');
      formInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });

      const passwordInputs = screen.getAllByLabelText(/password/i);
      passwordInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    test('displays validation errors with proper ARIA attributes', async () => {
      render(<Signup />);
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    test('supports keyboard navigation', () => {
      render(<Signup />);
      
      const firstInput = screen.getByLabelText(/first name/i);
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
    });

    test('has proper heading hierarchy', () => {
      render(<Signup />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create Account');
    });
  });

  describe('Security Features', () => {
    test('password input is properly masked', () => {
      render(<Signup />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('form prevents default submission', () => {
      render(<Signup />);
      
      const form = screen.getByRole('form') || screen.getByTestId('signup-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      fireEvent(form, submitEvent);
      
      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Signup />);
      
      const container = screen.getByTestId('signup-container');
      expect(container).toHaveClass('mobile-layout');
    });
  });

  describe('Edge Cases', () => {
    test('handles very long names gracefully', async () => {
      render(<Signup />);
      
      const veryLongName = 'A'.repeat(100);
      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: veryLongName } });

      expect(firstNameInput.value).toBe(veryLongName.substring(0, 50)); // Assuming max length
    });

    test('handles special characters in names', async () => {
      render(<Signup />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: "O'Connor" } });
      
      // Should handle apostrophes in names
      expect(firstNameInput.value).toBe("O'Connor");
    });

    test('trims whitespace from inputs', async () => {
      render(<Signup />);
      
      fillValidForm();
      
      // Add extra whitespace
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: '  john.doe@example.com  ' } });
      
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john.doe@example.com' // Should be trimmed
          })
        );
      });
    });
  });
});