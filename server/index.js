const express = require("express");

const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { ensureUploadsDir } = require("./utils/uploads");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const User = require("./models/User");
const { protect } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const newsRoutes = require("./routes/newsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");
const aboutRoutes = require("./routes/aboutRoutes");
const userRoutes = require("./routes/userRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const storyRoutes = require("./routes/storyRoutes");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,https://news-project-dq86.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions,
});

// Middleware
app.use(express.json());
// Parse URL-encoded bodies (for clients that send form data)
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/university-app";

// const MONGO_URI = process.env.atlas_URL;
// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/university-app";



mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        if (require.main === module) {
            server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        }
    })
    .catch((err) => console.log(err));

// Socket.io Logic
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("send_message", async (data) => {
        // data: { senderId, recipientId?, content, senderName, image, video, audio }
        try {
            const newMessage = await Message.create({
                sender: data.senderId,
                recipient: data.recipientId || null,
                content: data.content,
                image: data.image || "",
                video: data.video || "",
                audio: data.audio || "",
            });

            // Populate sender info to send back to clients
            const populatedMessage = await newMessage.populate("sender", "name email avatar bio gender role");

            if (data.recipientId) {
                // Emit to recipient room and sender
                io.to(data.recipientId).emit("receive_message", populatedMessage);
                io.to(data.senderId).emit("receive_message", populatedMessage);
            } else {
                io.emit("receive_message", populatedMessage);
            }

            // Notification Logic for chat
            try {
                const User = require("./models/User");
                const Notification = require("./models/Notification");
                const users = await User.find({ _id: { $ne: data.senderId } }).select("_id");

                // We'll only create records for users to keep track of unread count
                // In a real app, you'd filter by who is NOT currently active in chat
                const notifications = users.map(user => ({
                    recipient: user._id,
                    sender: data.senderId,
                    type: "message",
                    message: `New message from ${data.senderName}`,
                    link: "/chat"
                }));
                // Note: insertMany for every message might be heavy. 
                // In a production app, use a more optimized approach.
                await Notification.insertMany(notifications);

                // Alert users who are online but outside chat
                if (data.recipientId) {
                    io.to(data.recipientId).emit("new_chat_notification", { senderName: data.senderName, content: data.content });
                } else {
                    io.emit("new_chat_notification", { senderName: data.senderName, content: data.content });
                }
            } catch (err) {
                console.error("Chat notification error:", err);
            }
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("edit_message", async ({ messageId, content }) => {
        try {
            const updatedMessage = await Message.findByIdAndUpdate(
                messageId,
                { content, isEdited: true },
                { new: true }
            ).populate("sender", "name email avatar bio gender role");

            if (updatedMessage) {
                io.emit("message_edited", updatedMessage);
            }
        } catch (error) {
            console.error("Error editing message:", error);
        }
    });

    socket.on("delete_message", async ({ messageId }) => {
        try {
            const deletedMessage = await Message.findByIdAndDelete(messageId);
            if (deletedMessage) {
                io.emit("message_deleted", messageId);
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    });

    socket.on("join_notifications", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined notification room`);
    });

    // Join chat room for private messages
    socket.on("join_chat", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined chat room`);
    });

    // WebRTC Signaling
    socket.on("call_user", ({ to, offer, type, fromName, fromId }) => {
        io.to(to).emit("incoming_call", { fromName, fromId, offer, type });
    });

    socket.on("answer_call", ({ to, answer }) => {
        io.to(to).emit("call_answered", { answer });
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
        io.to(to).emit("ice_candidate", { candidate });
    });

    socket.on("end_call", ({ to }) => {
        io.to(to).emit("call_ended");
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

// Routes
app.get("/", (req, res) => {
    res.send("University News App API is running");
});

app.use("/api/auth", authRoutes);
// Support clients that call the auth endpoints without the /api prefix
app.use("/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/backup", require("./routes/backupRoutes"));

// Add-friend helper: return all users (basic profiles)
app.get("/api/add-friend", protect, async (req, res) => {
    try {
        const users = await User.find({})
            .select("name email avatar bio role");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});


const uploadsDir = ensureUploadsDir();
app.use("/uploads", express.static(uploadsDir));

module.exports = server;
module.exports.app = app;
