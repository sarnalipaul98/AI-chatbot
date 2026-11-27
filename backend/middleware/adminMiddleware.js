
const User = require("../models/User");

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");
    console.log("ADMIN CHECK:", {
  userId: req.userId,
  found: !!user,
  role: user?.role
});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during admin authorization"
    });
  }
};

module.exports = adminOnly;
