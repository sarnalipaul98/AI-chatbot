
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light"
    },
    chatbotName: {
      type: String,
      default: "AI Assistant",
      trim: true,
      maxlength: 30
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
