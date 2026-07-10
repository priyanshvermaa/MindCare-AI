import Conversation from '../models/Conversation.js';
import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import DailyWaterSummary from '../models/DailyWaterSummary.js';
import { getComprehensiveAnalytics } from '../services/analyticsService.js';
import { analyzeUserHealthContext } from '../services/grokService.js';
import { generateOrchestratedAIResponse, compileFullUserTelemetry, formatUserTelemetryText } from '../services/aiService.js';

// Local date formatting helper
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * @desc    Send chat message to AI assistant and retrieve response
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const sendMessageToAI = async (req, res) => {
  const userId = req.user._id;
  const { message, conversationId } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message content is required.' });
  }

  try {
    // 1. Fetch user's centralized telemetry context
    const telemetryData = await compileFullUserTelemetry(userId);
    const userContext = formatUserTelemetryText(telemetryData);

    let conversation = null;
    let chatHistory = [];

    // 2. Fetch conversation if conversationId is provided
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (conversation) {
        chatHistory = conversation.messages;
      }
    }

    // 3. Request response from Orchestrated AI service
    const assistantReplyText = await generateOrchestratedAIResponse(userId, chatHistory, message, userContext);

    // 4. Save messages to database
    const userMessageObj = { role: 'user', content: message };
    const assistantMessageObj = { role: 'assistant', content: assistantReplyText };

    if (conversation) {
      conversation.messages.push(userMessageObj);
      conversation.messages.push(assistantMessageObj);
      await conversation.save();
    } else {
      // Create new conversation
      // Generate clean title from first few words of the user message
      const words = message.trim().split(/\s+/);
      const generatedTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');

      conversation = await Conversation.create({
        userId,
        title: generatedTitle || 'Wellness Discussion',
        messages: [userMessageObj, assistantMessageObj]
      });
    }

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      messages: conversation.messages,
      assistantMessage: assistantReplyText
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user's chat history list
 * @route   GET /api/ai/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const list = await Conversation.find({ userId })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations: list
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get details of a single conversation session
 * @route   GET /api/ai/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation session not found.' });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a conversation session
 * @route   DELETE /api/ai/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation session not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation successfully deleted.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
