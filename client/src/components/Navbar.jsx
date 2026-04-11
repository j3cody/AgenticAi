/**
 * Navbar Component
 * Navigation bar with user info and logout
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar displays the app logo, navigation links, and user actions
 */
const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🧠</div>
            <Link to="/" className="text-xl font-bold text-gray-800">
              Mental Health Assistant
            </Link>
          </div>

          {/* Navigation links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-gray-600">Welcome,</span>
                  <span className="font-medium text-gray-800">{user?.name || 'User'}</span>
                </div>

                {/* Nav links */}
                <Link
                  to="/home"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>

                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Chat
                </Link>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login link */}
                <Link
                  to="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>

                {/* Signup link */}
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
