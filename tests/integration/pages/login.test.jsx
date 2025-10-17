import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../../app/login/page';
import { authAPI } from '../../../lib/api';
import { useRouter } from 'next/navigation';

jest.mock('../../../lib/api');
jest.mock('next/navigation');

describe('Login Page', () => {
  let mockPush;

  beforeEach(() => {
    mockPush = jest.fn();
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render register link', () => {
      render(<LoginPage />);

      const registerLink = screen.getByText(/register/i);
      expect(registerLink).toBeInTheDocument();
    });

    it('should have email and password fields', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toBeInvalid();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeInvalid();
      });
    });

    it('should show error for empty password', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'test@test.com');

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toBeInvalid();
      });
    });
  });

  describe('Login Functionality', () => {
    it('should submit form with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: 'Password123!',
        });
      });
    });

    it('should redirect to patient dashboard after successful patient login', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Patient User',
        email: 'patient@test.com',
        role: 'patient',
      };

      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'patient@test.com');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/patient/dashboard');
      });
    });

    it('should redirect to doctor dashboard after successful doctor login', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Dr. Test',
        email: 'doctor@test.com',
        role: 'healthcare_professional',
      };

      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'doctor@test.com');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/doctor/dashboard');
      });
    });

    it('should show error message on failed login', async () => {
      authAPI.login.mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'wrong@test.com');
      await userEvent.type(passwordInput, 'WrongPassword');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while logging in', async () => {
      authAPI.login.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors', async () => {
      authAPI.login.mockRejectedValue(new Error('Network Error'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should trim whitespace from email', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, '  test@test.com  ');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: expect.stringMatching(/^test@test.com$/),
          password: 'Password123!',
        });
      });
    });

    it('should handle special characters in password', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      const specialPassword = 'P@ssw0rd!#$%';
      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, specialPassword);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: specialPassword,
        });
      });
    });

    it('should handle very long inputs', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const longEmail = 'a'.repeat(300) + '@test.com';

      await userEvent.type(emailInput, longEmail);

      expect(emailInput.value.length).toBeGreaterThan(100);
    });

    it('should prevent multiple simultaneous login attempts', async () => {
      authAPI.login.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'Password123!');

      // Click multiple times
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should only be called once
        expect(authAPI.login).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAccessibleName();
      expect(passwordInput).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Tab through elements
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await userEvent.tab();
      expect(passwordInput).toHaveFocus();

      await userEvent.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<LoginPage />);

      const form = screen.getByRole('form', { hidden: true }) || document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});

