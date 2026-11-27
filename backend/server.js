
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const jwt = require("jsonwebtoken");
const Conversation = require("./models/Conversation");

dotenv.config();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Allowed frontend origins
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Make Socket.io available to API controllers
app.set("io", io);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header (e.g. Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Chatbot Backend is running!",
    database: "Connected",
    socket: "Enabled"
  });
});

// Socket.io connection

// Authenticate Socket.io connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return next(new Error("Invalid authentication token"));
    }

    socket.userId = decoded.userId;
    next();

  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.id);

  socket.on("join_conversation", async (conversationId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return socket.emit("socket_error", "Invalid conversation ID");
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: socket.userId
      });

      if (!conversation) {
        return socket.emit("socket_error", "Conversation access denied");
      }

      socket.join(conversationId);

      console.log("User joined authorized conversation:", conversationId);

    } catch (error) {
      console.error("Socket conversation error:", error.message);
      socket.emit("socket_error", "Could not join conversation");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.io server is ready!");
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed:", error.message);
  });
