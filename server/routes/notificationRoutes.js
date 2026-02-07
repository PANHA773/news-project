const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name avatar")
            .populate("news", "title")
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.recipient.toString() === req.user._id.toString()) {
            notification.isRead = true;
            await notification.save();
            res.json({ message: "Notification marked as read" });
        } else {
            res.status(404).json({ message: "Notification not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put("/read-all", protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
