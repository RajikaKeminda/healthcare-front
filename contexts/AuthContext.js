'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Always attempt to verify using httpOnly cookie via withCredentials
      const response = await authAPI.verifyToken();
      setUser(response.data.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      
      setUser(user);
      setIsAuthenticated(true);
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      setUser(user);
      setIsAuthenticated(true);
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      Cookies.remove('token');
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data.data.user);
      return { success: true, user: response.data.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
