/**
 * MoodLog Model
 * Tracks user's emotional state over time
 */

const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Reference to the chat session (if applicable)
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },

  // Detected mood
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'anxious', 'angry', 'neutral', 'stressed', 'hopeful', 'confused', 'overwhelmed', 'calm']
  },

  // Confidence score from AI detection
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },

  // Original message that triggered this mood detection
  triggerMessage: {
    type: String,
    maxlength: [2000, 'Trigger message too long']
  },

  // Key phrases that indicated this mood
  indicators: [{
    phrase: String,
    weight: Number
  }],

  // AI's reasoning for mood detection
  reasoning: {
    type: String,
    maxlength: [500, 'Reasoning too long']
  },

  // Contextual factors
  context: {
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  },

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
 * Index for efficient mood analytics
 */
moodLogSchema.index({ userId: 1, timestamp: -1 });
moodLogSchema.index({ userId: 1, mood: 1 });

/**
 * Static method to get mood distribution for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Mood distribution
 */
moodLogSchema.statics.getMoodDistribution = async function(userId, days = 7) {
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
        _id: '$mood',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * Static method to get mood trend over time
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Array>} Mood trend data
 */
moodLogSchema.statics.getMoodTrend = async function(userId, days = 30) {
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
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        primaryMood: { $first: '$mood' },
        avgConfidence: { $avg: '$confidence' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('MoodLog', moodLogSchema);
