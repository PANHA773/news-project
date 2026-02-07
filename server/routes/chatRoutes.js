const express = require("express");
const Message = require("../models/Message");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// @desc    Get all public chat messages
// @route   GET /api/chat
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const messages = await Message.find({ recipient: null })
            .populate("sender", "name email avatar bio gender role")
            .sort({ createdAt: 1 }); // Oldest first

        const validMessages = messages.filter(msg => msg.sender);
        res.json(validMessages);
    } catch (error) {
        console.error("Error in GET /api/chat:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send a message (public or private)
// @route   POST /api/chat
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { content, recipientId } = req.body;

        // If recipientId provided, ensure recipient is a friend
        if (recipientId) {
            const sender = await require("../models/User").findById(req.user._id);
            if (!sender) return res.status(404).json({ message: "Sender not found" });
            const isFriend = sender.friends && sender.friends.some(id => id.toString() === recipientId);
            if (!isFriend) return res.status(403).json({ message: "Can only send private messages to friends" });
        }

        const newMessage = await Message.create({
            sender: req.user._id,
            recipient: recipientId || null,
            content,
        });

        const populated = await newMessage.populate("sender", "name email avatar bio gender role");
        res.status(201).json(populated);
    } catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get private conversation between authenticated user and another
// @route   GET /api/chat/conversation/:userId
// @access  Private
router.get("/conversation/:userId", protect, async (req, res) => {
    try {
        const otherId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: req.user._id, recipient: otherId },
                { sender: otherId, recipient: req.user._id }
            ]
        }).populate("sender", "name email avatar bio gender role").sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
