
const express = require("express");
const router = express.Router();

const rateLimit = require("express-rate-limit");

const protect = require("../middleware/authMiddleware");
const { chatWithAI } = require("../controllers/aiController");

// Rate limiter configuration
const aiLimiter = rateLimit({
 windowMs: 60 * 1000,
limit: 10,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    console.log("RATE LIMIT REACHED");

    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again after one minute."
    });
  }
});

// AI chat route with authentication and rate limiting
router.post("/chat", protect, aiLimiter, chatWithAI);

module.exports = router;
