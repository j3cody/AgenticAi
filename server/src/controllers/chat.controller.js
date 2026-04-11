/**
 * Chat Controller
 * Handles chat messages and conversations
 */

const orchestrator = require('../services/orchestrator.service');

/**
 * Send a message and get AI response
 * @route POST /api/chat/message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check message length
    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 5000 characters)'
      });
    }

    console.log(`\n📨 New message from user ${userId}`);
    console.log(`   Chat ID: ${chatId || 'new chat'}`);

    // Process message through AI pipeline
    const result = await orchestrator.processMessage(userId, message, chatId);

    // Return response
    res.json({
      success: true,
      data: {
        response: result.response,
        chatId: result.chatId,
        mood: result.pipeline?.mood,
        safety: {
          riskLevel: result.pipeline?.safety?.riskLevel,
          needsAttention: result.requiresImmediateAttention || false
        },
        resources: result.resources,
        followUp: result.followUp,
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get chat history for user
 * @route GET /api/chat/history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const result = await orchestrator.getChatHistory(userId, limit);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
};

/**
 * Get a specific chat by ID
 * @route GET /api/chat/:chatId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const result = await orchestrator.getChatById(userId, chatId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      data: result.chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat'
    });
  }
};

/**
 * Get mood history and analytics
 * @route GET /api/chat/mood-history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMoodHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;

    const result = await orchestrator.getMoodHistory(userId, days);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get mood history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mood history'
    });
  }
};

/**
 * Start a new chat session
 * @route POST /api/chat/new
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const startNewChat = async (req, res) => {
  try {
    const userId = req.user._id;

    // Return a placeholder for new chat
    // The actual chat is created when first message is sent
    res.json({
      success: true,
      data: {
        chatId: null,
        message: 'Ready to start a new conversation. Send your first message!'
      }
    });

  } catch (error) {
    console.error('Start new chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start new chat'
    });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  getChat,
  getMoodHistory,
  startNewChat
};
