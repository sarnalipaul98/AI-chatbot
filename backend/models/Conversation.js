
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      default: "New Chat"
    },
    category: {
      type: String,
      enum: [
        "casual",
        "professional",
        "creative",
        "educational",
        "coding"
      ],
      default: "casual"
    }
  },
  { timestamps: true }
);

// Database index for faster user conversation retrieval
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
