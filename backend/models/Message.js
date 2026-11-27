
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  { timestamps: true }
);

// Database index for faster message retrieval
messageSchema.index({
  conversationId: 1,
  userId: 1,
  createdAt: 1
});

module.exports = mongoose.model("Message", messageSchema);
