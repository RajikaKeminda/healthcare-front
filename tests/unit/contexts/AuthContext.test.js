import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../lib/api';
import Cookies from 'js-cookie';

// Mock dependencies
jest.mock('../../../lib/api');
jest.mock('js-cookie');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Cookies.get.mockReturnValue(null);
    Cookies.set.mockImplementation(() => {});
    Cookies.remove.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should have default values', async () => {
      authAPI.verifyToken.mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.login).toBeInstanceOf(Function);
      expect(result.current.register).toBeInstanceOf(Function);
      expect(result.current.logout).toBeInstanceOf(Function);
    });

    it('should check authentication on mount', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.verifyToken.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authAPI.verifyToken).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
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

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'password');
      });

      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(loginResult).toEqual({ success: true, data: { user: mockUser } });
    });

    it('should handle login failure', async () => {
      authAPI.login.mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@test.com', 'wrongpassword');
        })
      ).rejects.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle missing credentials', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('', '');
        })
      ).rejects.toThrow();
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        _id: '123',
        userName: 'New User',
        email: 'new@test.com',
        role: 'patient',
      };

      authAPI.register.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userData = {
        userName: 'New User',
        email: 'new@test.com',
        password: 'Password123!',
        phone: '+94771234567',
        dateOfBirth: '1990-01-01',
        role: 'patient',
      };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(authAPI.register).toHaveBeenCalledWith(userData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(registerResult).toEqual({ success: true, data: { user: mockUser } });
    });

    it('should handle registration failure', async () => {
      authAPI.register.mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'Email already exists',
          },
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userData = {
        userName: 'Existing User',
        email: 'existing@test.com',
        password: 'Password123!',
        phone: '+94771234567',
      };

      await expect(
        act(async () => {
          await result.current.register(userData);
        })
      ).rejects.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.verifyToken.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      authAPI.logout.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(authAPI.logout).toHaveBeenCalled();
      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear state even if logout API fails', async () => {
      const mockUser = {
        _id: '123',
        userName: 'Test User',
        email: 'test@test.com',
        role: 'patient',
      };

      authAPI.verifyToken.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      authAPI.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent login attempts', async () => {
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

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await Promise.all([
          result.current.login('test@test.com', 'password1'),
          result.current.login('test@test.com', 'password2'),
        ]);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle network errors', async () => {
      authAPI.verifyToken.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle malformed API responses', async () => {
      authAPI.verifyToken.mockResolvedValue({
        data: {
          success: true,
          // Missing data.user
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle gracefully
      expect(result.current.isAuthenticated).toBeDefined();
    });
  });
});

