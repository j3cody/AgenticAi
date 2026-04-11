/**
 * Authentication Middleware
 * Verifies JWT token from the Authorization header
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 * Attaches user object to request if token is valid
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // Check if authorization header exists and starts with 'Bearer'
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token provided'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - invalid token'
    });
  }
};

module.exports = { protect };