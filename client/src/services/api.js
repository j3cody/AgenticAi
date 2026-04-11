/**
 * API Service
 * Centralized API calls to the backend
 */

import axios from 'axios';

// Base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor to add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Authentication API
// ============================================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login response with token
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Logout user
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// ============================================
// Chat API
// ============================================

/**
 * Send a message to the AI assistant
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} AI response
 */
export const sendMessage = async (messageData) => {
  const response = await api.post('/chat/message', messageData);
  return response.data;
};

/**
 * Get chat history
 * @param {number} limit - Number of chats to retrieve
 * @returns {Promise<Object>} Chat history
 */
export const getChatHistory = async (limit = 10) => {
  const response = await api.get(`/chat/history?limit=${limit}`);
  return response.data;
};

/**
 * Get a specific chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Chat data
 */
export const getChat = async (chatId) => {
  const response = await api.get(`/chat/${chatId}`);
  return response.data;
};

/**
 * Get mood history
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Mood history data
 */
export const getMoodHistory = async (days = 7) => {
  const response = await api.get(`/chat/mood-history?days=${days}`);
  return response.data;
};

/**
 * Start a new chat session
 * @returns {Promise<Object>} New chat session data
 */
export const startNewChat = async () => {
  const response = await api.post('/chat/new');
  return response.data;
};

// ============================================
// User API
// ============================================

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData);
  return response.data;
};

/**
 * Change password
 * @param {Object} passwordData - Password data
 * @returns {Promise<Object>} Response
 */
export const changePassword = async (passwordData) => {
  const response = await api.put('/user/password', passwordData);
  return response.data;
};

// ============================================
// Health Check
// ============================================

/**
 * Check if API is running
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;