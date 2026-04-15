/**
 * Orchestrator Service
 * Coordinates the AI pipeline for the mental health assistant.
 *
 * Pipeline Flow:
 * 1. Combined Analysis - Mood, safety, and response planning in one LLM call
 * 2. Knowledge Retrieval (RAG) - Get relevant mental health content
 * 3. Response Generation - Create final response
 */

const analysisService = require('./ai/analysis.service');
const safetyService = require('./ai/safety.service');
const responseService = require('./ai/response.service');
const ragService = require('./rag/rag.service');

const Chat = require('../models/Chat');
const MoodLog = require('../models/MoodLog');
const SafetyLog = require('../models/SafetyLog');

const processMessage = async (userId, message, chatId = null) => {
  const pipelineStartTime = Date.now();
  const pipelineResults = {
    mood: null,
    safety: null,
    rag: null,
    plan: null,
    response: null
  };

  try {
    const conversationHistory = await getConversationHistory(userId, chatId);

    console.log('Starting AI Pipeline...');
    console.log(`Processing message: "${message.substring(0, 50)}..."`);

    console.log('Step 1: Running combined analysis...');
    const analysisResult = await analysisService.analyzeMessage(message, conversationHistory);
    const moodResult = analysisResult.mood;
    const safetyResult = analysisResult.safety;
    const planResult = analysisResult.plan;

    pipelineResults.mood = moodResult;
    pipelineResults.safety = safetyResult;
    pipelineResults.plan = planResult;

    await logMood(userId, chatId, message, moodResult);
    await logSafety(userId, chatId, message, safetyResult);

    console.log(`   Mood: ${moodResult.mood} (confidence: ${(moodResult.confidence * 100).toFixed(1)}%)`);
    console.log(`   Safety: ${safetyResult.riskLevel} (risk score: ${(safetyResult.riskScore * 100).toFixed(1)}%)`);
    console.log(`   Strategy: ${planResult.strategy}`);
    console.log(`   Primary focus: ${planResult.primaryFocus}`);

    if (safetyResult.riskLevel === 'crisis' || safetyResult.riskLevel === 'high') {
      console.log('CRISIS DETECTED - Initiating safety protocol');
      const safetyResponse = safetyService.generateSafetyResponse(safetyResult);

      await updateChat(userId, chatId, message, safetyResponse.response, moodResult, safetyResult);

      return {
        success: true,
        response: safetyResponse.response,
        pipeline: pipelineResults,
        requiresImmediateAttention: true,
        resources: safetyResponse.resources,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - pipelineStartTime
      };
    }

    console.log('Step 2: Retrieving relevant knowledge...');
    const ragResult = await ragService.retrieveKnowledge(message, moodResult.mood);
    pipelineResults.rag = ragResult;

    console.log(`   Found ${ragResult.relevantDocs.length} relevant documents`);

    console.log('Step 3: Generating response...');
    const responseResult = await responseService.generateResponse(
      message,
      planResult,
      moodResult,
      safetyResult,
      ragResult,
      conversationHistory
    );
    pipelineResults.response = responseResult;

    console.log('   Response generated successfully');

    const finalChatId = await updateChat(userId, chatId, message, responseResult.response, moodResult, safetyResult);

    const processingTime = Date.now() - pipelineStartTime;
    console.log(`Pipeline completed in ${processingTime}ms`);

    return {
      success: true,
      response: responseResult.response,
      chatId: finalChatId,
      pipeline: {
        mood: {
          mood: moodResult.mood,
          confidence: moodResult.confidence,
          indicators: moodResult.indicators?.slice(0, 3)
        },
        safety: {
          riskLevel: safetyResult.riskLevel,
          riskScore: safetyResult.riskScore,
          riskCategories: safetyResult.riskCategories,
          triggerPhrases: safetyResult.triggerPhrases,
          assessment: safetyResult.assessment,
          immediateAction: safetyResult.immediateAction
        },
        rag: {
          documentsFound: ragResult.relevantDocs.length,
          categories: ragResult.relevantDocs.map((d) => d.category)
        },
        plan: {
          strategy: planResult.strategy,
          primaryFocus: planResult.primaryFocus
        }
      },
      resources: responseResult.resources || [],
      followUp: responseResult.followUp,
      timestamp: new Date().toISOString(),
      processingTime
    };
  } catch (error) {
    console.error('Pipeline error:', error);

    return {
      success: false,
      response: "I'm here to listen and support you. Could you tell me more about what's on your mind?",
      error: error.message,
      pipeline: pipelineResults,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - pipelineStartTime
    };
  }
};

const getConversationHistory = async (userId, chatId) => {
  try {
    if (!chatId) return [];

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat || !chat.messages) return [];

    return chat.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
};

const logMood = async (userId, chatId, message, moodResult) => {
  try {
    await MoodLog.create({
      userId,
      chatId,
      mood: moodResult.mood,
      confidence: moodResult.confidence,
      triggerMessage: message.substring(0, 500),
      indicators: moodResult.indicators?.map((ind) => ({
        phrase: ind,
        weight: 1
      })) || [],
      reasoning: moodResult.reasoning || 'AI-detected mood'
    });
  } catch (error) {
    console.error('Error logging mood:', error);
  }
};

const logSafety = async (userId, chatId, message, safetyResult) => {
  try {
    if (safetyResult.riskLevel !== 'none') {
      await SafetyLog.create({
        userId,
        chatId,
        riskLevel: safetyResult.riskLevel,
        riskScore: safetyResult.riskScore,
        riskCategories: safetyResult.riskCategories,
        triggerMessage: message.substring(0, 500),
        triggerPhrases: safetyResult.triggerPhrases?.map((phrase) => ({
          phrase,
          severity: safetyResult.riskLevel === 'crisis' ? 'high' : 'medium'
        })) || [],
        assessment: safetyResult.assessment,
        status: safetyResult.riskLevel === 'crisis' ? 'active' : 'monitored'
      });
    }
  } catch (error) {
    console.error('Error logging safety:', error);
  }
};

const updateChat = async (userId, chatId, userMessage, aiResponse, moodResult, safetyResult) => {
  try {
    let chat;

    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });

      if (chat) {
        chat.messages.push({
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
          detectedMood: moodResult.mood,
          moodConfidence: moodResult.confidence,
          safetyFlag: safetyResult.riskLevel !== 'none'
        });

        chat.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });

        await chat.save();
        return chatId;
      }
    }

    chat = await Chat.create({
      userId,
      title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
      messages: [
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
          detectedMood: moodResult.mood,
          moodConfidence: moodResult.confidence,
          safetyFlag: safetyResult.riskLevel !== 'none'
        },
        {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }
      ],
      containsSensitiveContent: safetyResult.riskLevel !== 'none'
    });

    return chat._id.toString();
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
};

const getMoodHistory = async (userId, days = 7) => {
  try {
    const distribution = await MoodLog.getMoodDistribution(userId, days);
    const trend = await MoodLog.getMoodTrend(userId, days);

    return {
      success: true,
      distribution,
      trend,
      days
    };
  } catch (error) {
    console.error('Error getting mood history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getChatHistory = async (userId, limit = 10) => {
  try {
    const chats = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title messages createdAt moodSummary');

    return {
      success: true,
      chats: chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        messageCount: chat.messages.length,
        createdAt: chat.createdAt,
        lastMessage: chat.messages[chat.messages.length - 1]?.timestamp
      }))
    };
  } catch (error) {
    console.error('Error getting chat history:', error);
    return {
      success: false,
      error: error.message,
      chats: []
    };
  }
};

const getChatById = async (userId, chatId) => {
  try {
    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return {
        success: false,
        error: 'Chat not found'
      };
    }

    return {
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        moodSummary: chat.moodSummary
      }
    };
  } catch (error) {
    console.error('Error getting chat:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  processMessage,
  getMoodHistory,
  getChatHistory,
  getChatById
};
