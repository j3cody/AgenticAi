/**
 * Chat Model
 * Stores conversation history between user and AI
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Role: 'user' or 'assistant'
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },

  // Message content
  content: {
    type: String,
    required: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },

  // Timestamp of the message
  timestamp: {
    type: Date,
    default: Date.now
  },

  // Detected mood for this message (only for user messages)
  detectedMood: {
    type: String,
    enum: ['happy', 'sad', 'anxious', 'angry', 'neutral', 'stressed', 'hopeful', 'confused', 'overwhelmed', 'calm'],
    default: null
  },

  // Confidence score for mood detection
  moodConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },

  // Whether this message triggered a safety alert
  safetyFlag: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  // Reference to the user who owns this chat
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Conversation title (auto-generated or user-defined)
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  // Array of messages in the conversation
  messages: [messageSchema],

  // Session metadata
  sessionStart: {
    type: Date,
    default: Date.now
  },

  sessionEnd: {
    type: Date,
    default: null
  },

  // Overall mood summary for this chat session
  moodSummary: {
    primaryMood: {
      type: String,
      enum: ['happy', 'sad', 'anxious', 'angry', 'neutral', 'stressed', 'hopeful', 'confused', 'overwhelmed', 'calm'],
      default: 'neutral'
    },
    moodTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'fluctuating'],
      default: 'stable'
    }
  },

  // Whether this chat contains sensitive content
  containsSensitiveContent: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Index for efficient querying by user and date
 */
chatSchema.index({ userId: 1, createdAt: -1 });

/**
 * Add a message to the chat
 * @param {Object} message - Message object with role and content
 * @returns {Promise<void>}
 */
chatSchema.methods.addMessage = async function(message) {
  this.messages.push(message);
  return await this.save();
};

/**
 * Get the last N messages from this chat
 * @param {number} count - Number of messages to retrieve
 * @returns {Array} Array of messages
 */
chatSchema.methods.getRecentMessages = function(count = 10) {
  return this.messages.slice(-count);
};

module.exports = mongoose.model('Chat', chatSchema);
