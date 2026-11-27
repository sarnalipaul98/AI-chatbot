
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  updateTheme,
  updateChatbotName
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// Authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

// Profile and settings routes
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/theme", protect, updateTheme);
router.put("/chatbot-name", protect, updateChatbotName);

module.exports = router;
