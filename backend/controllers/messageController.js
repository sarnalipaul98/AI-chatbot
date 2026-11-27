
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

// Save a new message
const saveMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and message are required"
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const message = await Message.create({
      conversationId,
      userId: req.userId,
      role: "user",
      content: content.trim()
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({
      success: true,
      message
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all messages from a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const messages = await Message.find({
      conversationId,
      userId: req.userId
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Rate an AI response
const rateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5"
      });
    }

    const message = await Message.findOne({
      _id: id,
      userId: req.userId,
      role: "assistant"
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "AI response not found"
      });
    }

    message.rating = rating;
    await message.save();

    res.status(200).json({
      success: true,
      message: "Rating saved successfully",
      rating: message.rating
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export functions
module.exports = {
  saveMessage,
  getMessages,
  rateMessage
};
