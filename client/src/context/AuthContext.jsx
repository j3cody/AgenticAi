/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, getProfile } from '../services/api';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          // Verify token is still valid by fetching profile
          const response = await getProfile();
          setUser(response.data.user);
        } catch (err) {
          // Token expired or invalid
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  const login = async (identifier, password) => {
    try {
      setError(null);
      const response = await apiLogin({ identifier, password });

      if (response.success) {
        const { user: userData, token: userToken } = response.data;

        // Store in localStorage
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setToken(userToken);
        setUser(userData);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  /**
   * Signup user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Signup result
   */
  const signup = async (name, email, password) => {
    try {
      setError(null);
      const response = await apiSignup({ name, email, password });

      if (response.success) {
        logout();
        return {
          success: true,
          message: response.message || 'Account created successfully. Please log in.'
        };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed';
      setError(message);
      return { success: false, message };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!token && !!user;

  /**
   * Clear error
   */
  const clearError = () => setError(null);

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
