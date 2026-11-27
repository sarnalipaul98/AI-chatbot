
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  saveMessage,
  getMessages,
  rateMessage
} = require("../controllers/messageController");

router.use(protect);

router.post("/", saveMessage);
router.get("/:conversationId", getMessages);
router.put("/:id/rating", rateMessage);

module.exports = router;
