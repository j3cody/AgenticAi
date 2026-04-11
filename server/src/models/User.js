/**
 * User Model
 * Stores user account information
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // User's email address (unique identifier)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

  // User's password (hashed)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  // User's display name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  // User's preferred language
  preferredLanguage: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'hi']
  },

  // User's timezone for proper time handling
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  // Last login timestamp
  lastLogin: {
    type: Date,
    default: null
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password; // Never return password in JSON
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Hash password before saving
 * This middleware runs automatically when a user is created or password is changed
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * Used during login to verify password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);