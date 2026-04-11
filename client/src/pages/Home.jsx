/**
 * Home Page Component
 * Landing page with welcome message and CTA
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Home page displays welcome information and call to action
 */
const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo and title */}
          <div className="mb-8">
            <span className="text-6xl">🧠</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mt-4">
              Mental Health Assistant
            </h1>
            <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Your AI-powered companion for mental wellness. Get support, learn
              coping strategies, and track your emotional well-being.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors shadow-lg"
              >
                Start Chatting
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/"
                  className="px-8 py-4 bg-white text-blue-500 border-2 border-blue-500 rounded-xl font-medium text-lg hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Supportive Chat
            </h3>
            <p className="text-gray-600">
              Talk to our AI assistant anytime. Get empathetic responses and
              helpful guidance for your mental wellness journey.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">😊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Mood Tracking
            </h3>
            <p className="text-gray-600">
              Our AI detects your emotional state and helps you understand your
              mood patterns over time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Safety First
            </h3>
            <p className="text-gray-600">
              Built-in safety checks identify crisis situations and provide
              immediate resources when needed.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-800">Share</h4>
              <p className="text-sm text-gray-600">Tell us how you're feeling</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-800">Analyze</h4>
              <p className="text-sm text-gray-600">AI detects your mood</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-800">Respond</h4>
              <p className="text-sm text-gray-600">Get supportive guidance</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h4 className="font-medium text-gray-800">Learn</h4>
              <p className="text-sm text-gray-600">Build wellness skills</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This AI assistant is not a replacement
              for professional mental health care. If you're in crisis or need
              immediate help, please contact emergency services or call the
              National Suicide Prevention Lifeline at{' '}
              <strong>988</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;