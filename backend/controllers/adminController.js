
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // Activity during the last 24 hours
    const last24Hours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );

    // Activity during the last 7 days
    const last7Days = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const [
      totalUsers,
      totalConversations,
      totalMessages,
      totalUserMessages,
      totalAIResponses,
      activeUsers,
      averageRating,
      dailyMessages,
      recentMessages
    ] = await Promise.all([
      User.countDocuments(),

      Conversation.countDocuments(),

      Message.countDocuments(),

      Message.countDocuments({ role: "user" }),

      Message.countDocuments({ role: "assistant" }),

      Message.distinct("userId", {
        createdAt: { $gte: last24Hours }
      }),

      Message.aggregate([
        {
          $match: {
            role: "assistant",
            rating: { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" }
          }
        }
      ]),

      Message.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("role content createdAt userId conversationId")
        .populate("userId", "name email")
        .populate("conversationId", "title")
        .lean()
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalConversations,
        totalMessages,
        totalUserMessages,
        totalAIResponses,
        activeUsers: activeUsers.length,
        averageRating: averageRating.length
          ? Number(averageRating[0].average.toFixed(2))
          : 0,
        dailyMessages,
        recentActivity: recentMessages.map((message) => ({
          role: message.role,
          preview: message.content.slice(0, 100),
          createdAt: message.createdAt,
          user: message.userId
            ? {
                name: message.userId.name,
                email: message.userId.email
              }
            : null,
          conversation: message.conversationId
            ? message.conversationId.title
            : "Deleted conversation"
        }))
      }
    });

  } catch (error) {
    console.error("Admin analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin analytics"
    });
  }
};

module.exports = { getAdminAnalytics };
