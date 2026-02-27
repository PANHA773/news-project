const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { protect, admin } = require("../middleware/authMiddleware");
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

// @desc    Get admin announcements for all users
// @route   GET /api/chat/announcements
// @access  Private
router.get("/announcements", protect, async (req, res) => {
    try {
        const announcements = await Message.find({ isAnnouncement: true })
            .populate("sender", "name email avatar bio gender role")
            .sort({ createdAt: -1 });

        const validAnnouncements = announcements.filter(msg => msg.sender);
        res.json(validAnnouncements);
    } catch (error) {
        console.error("Error in GET /api/chat/announcements:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin broadcast announcement to all users
// @route   POST /api/chat/announcements
// @access  Private/Admin
router.post("/announcements", protect, admin, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Content is required" });
        }

        const newAnnouncement = await Message.create({
            sender: req.user._id,
            recipient: null,
            content: content.trim(),
            isAnnouncement: true,
        });

        const populated = await newAnnouncement.populate("sender", "name email avatar bio gender role");

        const users = await User.find({ _id: { $ne: req.user._id } }).select("_id role");
        const targetUsers = users.filter((u) => u.role !== "admin");

        if (targetUsers.length > 0) {
            await Notification.insertMany(
                targetUsers.map((u) => ({
                    recipient: u._id,
                    sender: req.user._id,
                    type: "system",
                    message: `Admin announcement: ${content.trim().slice(0, 120)}`,
                    link: "/",
                }))
            );
        }

        if (req.io) {
            req.io.emit("announcement_message", populated);
            req.io.emit("new_chat_notification", {
                senderName: req.user.name || "Admin",
                content: content.trim(),
                type: "announcement",
            });
        }

        res.status(201).json(populated);
    } catch (error) {
        console.error("Error in POST /api/chat/announcements:", error);
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

// @desc    Update own message
// @route   PATCH /api/chat/:id
// @access  Private
router.patch("/:id", protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "Content is required" });

        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: "Message not found" });
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populated = await message.populate("sender", "name email avatar bio gender role");
        res.json(populated);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete own message
// @route   DELETE /api/chat/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: "Message not found" });
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await message.deleteOne();
        res.json({ message: "Message removed" });
    } catch (error) {
        console.error("Error deleting message:", error);
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

router.post('/CALL', protect, (req, res) => {
    res.status(200).json({ message: 'Call route placeholder' });
});

router.post('/VIDEO_CALL', protect, (req, res) => {
    res.status(200).json({ message: 'Video call route placeholder' });
});

module.exports = router;
