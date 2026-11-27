
const mongoose = require("mongoose");
const Message = require("../models/Message");
const NodeCache = require("node-cache");
const Conversation = require("../models/Conversation");
const { generateAIResponse } = require("../services/aiService");
const aiResponseCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120
});

const categoryInstructions = {
  casual: "Respond in a friendly, natural and simple conversational style. Keep the conversation relaxed and approachable.",

  professional: "Respond in a formal, professional and respectful tone. Give clear, well-structured and business-appropriate answers.",

  creative: "Be imaginative and creative. Suggest original ideas, interesting examples and engaging solutions.",

  educational: "Act as a helpful teacher. Explain concepts in simple language, step by step, with examples wherever useful.",

  coding: "Act as an experienced programming assistant. Provide accurate code, explain the solution clearly, identify errors and follow good coding practices."
};

const chatWithAI = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (
      !conversationId ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid conversation ID is required"
      });
    }

    if (typeof content !== "string") {
  return res.status(400).json({
    success: false,
    message: "Message content must be text"
  });
}

const trimmedContent = content.trim();

if (!trimmedContent) {
  return res.status(400).json({
    success: false,
    message: "Message content is required"
  });
}

    if (trimmedContent.length > 4000) {
      return res.status(400).json({
        success: false,
        message: "Message must not exceed 4000 characters"
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

    // Get category instructions
    const category = conversation.category || "casual";
    const systemMessage = {
      role: "system",
      content: categoryInstructions[category] || categoryInstructions.casual
    };

    // Get Socket.io instance
    const io = req.app.get("io");

    // Save user's message
    const userMessage = await Message.create({
      conversationId,
      userId: req.userId,
      role: "user",
      content: trimmedContent
    });

    // Broadcast user's message
    io.to(conversationId).emit("new_message", userMessage);

    // Get recent conversation history
    const history = await Message.find({
      conversationId,
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(20);

    history.reverse();

    const input = [
      systemMessage,
      ...history.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];


    // Check cached AI response
const previousHistory = history.slice(0, -1).map((message) => ({
  role: message.role,
  content: message.content
}));

const cacheKey = `${req.userId}:${conversation.category || "casual"}:${JSON.stringify(previousHistory)}:${trimmedContent}`;

const cachedResponse = aiResponseCache.get(cacheKey);
console.log("CACHE CHECK:", {
  key: cacheKey,
  found: Boolean(cachedResponse),
  totalCachedItems: aiResponseCache.keys().length
});

if (cachedResponse) {
  console.log("CACHE HIT: Using saved AI response");
  const assistantMessage = await Message.create({
    conversationId,
    userId: req.userId,
    role: "assistant",
    content: cachedResponse
  });

  io.to(conversationId).emit("new_message", assistantMessage);

  conversation.updatedAt = new Date();
  await conversation.save();

  return res.status(200).json({
    success: true,
    userMessage,
    assistantMessage,
    cached: true
  });
}

    // Generate AI response
    const aiText = await generateAIResponse(input);
    aiResponseCache.set(cacheKey, aiText);
console.log("CACHE STORED:", cacheKey);
    // Save AI response
    const assistantMessage = await Message.create({
      conversationId,
      userId: req.userId,
      role: "assistant",
      content: aiText
    });

    // Broadcast AI response
    io.to(conversationId).emit("new_message", assistantMessage);

    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(200).json({
      success: true,
      userMessage,
      assistantMessage
    });

  } catch (error) {
    console.error("AI Chat Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      
    });
  }
};

module.exports = { chatWithAI };
