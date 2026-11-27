
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// CREATE NEW CONVERSATION
const createConversation = async (req, res) => {
  try {
    const { title, category } = req.body;

    const allowedCategories = [
      "casual",
      "professional",
      "creative",
      "educational",
      "coding"
    ];

    const selectedCategory = category || "casual";

    if (!allowedCategories.includes(selectedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation category"
      });
    }

    const conversation = await Conversation.create({
      userId: req.userId,
      title: title?.trim() || "New Chat",
      category: selectedCategory
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL USER CONVERSATIONS
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      userId: req.userId
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      conversations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE CONVERSATION WITH MESSAGES
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.userId
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const messages = await Message.find({
      conversationId: id,
      userId: req.userId
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      conversation,
      messages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE CONVERSATION
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    await Message.deleteMany({
      conversationId: id,
      userId: req.userId
    });

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation
};
