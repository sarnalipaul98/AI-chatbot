
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation
} = require("../controllers/conversationController");

// All conversation routes require login
router.use(protect);

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.delete("/:id", deleteConversation);

module.exports = router;
