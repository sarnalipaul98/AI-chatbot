
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const { getAdminAnalytics } = require("../controllers/adminController");

// Only logged-in admins can access these routes
router.get("/analytics", protect, adminOnly, getAdminAnalytics);

module.exports = router;
