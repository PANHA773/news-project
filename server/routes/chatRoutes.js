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

// @desc    Get users who have a private conversation with the current user
// @route   GET /api/chat/conversations
// @access  Private
router.get("/conversations", protect, async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: req.user._id }, { recipient: req.user._id }],
                    recipient: { $ne: null }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", req.user._id] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: "$userDetails._id",
                    name: "$userDetails.name",
                    email: "$userDetails.email",
                    avatar: "$userDetails.avatar",
                }
            }
        ]);

        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send a message (public or private)
// @route   POST /api/chat
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { content, recipientId } = req.body;

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
