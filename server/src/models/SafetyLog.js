/**
 * SafetyLog Model
 * Records safety-related events for monitoring and intervention
 */

const mongoose = require('mongoose');

const safetyLogSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Reference to the chat session
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },

  // Risk level detected
  riskLevel: {
    type: String,
    required: true,
    enum: ['none', 'low', 'medium', 'high', 'crisis']
  },

  // Risk score (0-1)
  riskScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },

  // Categories of risk detected
  riskCategories: [{
    type: String,
    enum: ['self_harm', 'suicide', 'violence', 'substance_abuse', 'eating_disorder', 'other']
  }],

  // Original message that triggered safety check
  triggerMessage: {
    type: String,
    required: true,
    maxlength: [2000, 'Trigger message too long']
  },

  // Key phrases that triggered the alert
  triggerPhrases: [{
    phrase: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],

  // AI's assessment and reasoning
  assessment: {
    type: String,
    maxlength: [1000, 'Assessment too long']
  },

  // Response given to the user
  responseProvided: {
    type: String,
    maxlength: [2000, 'Response too long']
  },

  // Resources provided to user
  resourcesProvided: [{
      type: String,
      name: String,
      contact: String
  }],

  // Resolution status
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated', 'monitored'],
    default: 'active'
  },

  // Follow-up actions taken
  followUpActions: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: String,
      default: 'system'
    }
  }],

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true
});

/**
 * Indexes for efficient querying
 */
safetyLogSchema.index({ userId: 1, timestamp: -1 });
safetyLogSchema.index({ riskLevel: 1 });
safetyLogSchema.index({ status: 1 });

/**
 * Check if user has recent safety alerts
 * @param {string} userId - User ID
 * @param {number} hours - Hours to look back
 * @returns {Promise<boolean>} True if recent alerts exist
 */
safetyLogSchema.statics.hasRecentAlerts = async function(userId, hours = 24) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);
  const objectId = new mongoose.Types.ObjectId(userId);

  const count = await this.countDocuments({
    userId: objectId,
    timestamp: { $gte: startDate },
    riskLevel: { $in: ['medium', 'high', 'crisis'] }
  });

  return count > 0;
};

/**
 * Get safety summary for user
 * @param {string} userId - User ID
 * @param {number} days - Days to analyze
 * @returns {Promise<Object>} Safety summary
 */
safetyLogSchema.statics.getSafetySummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const objectId = new mongoose.Types.ObjectId(userId);

  return await this.aggregate([
    {
      $match: {
        userId: objectId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * Mark safety log as resolved
 * @param {string} resolution - Resolution details
 * @returns {Promise<void>}
 */
safetyLogSchema.methods.resolve = async function(resolution) {
  this.status = 'resolved';
  this.followUpActions.push({
    action: resolution,
    timestamp: new Date(),
    performedBy: 'system'
  });
  return await this.save();
};

module.exports = mongoose.model('SafetyLog', safetyLogSchema);
