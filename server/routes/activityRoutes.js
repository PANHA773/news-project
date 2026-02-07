const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { protect, admin, checkPermission } = require("../middleware/authMiddleware");
const router = express.Router();

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Private (View Logs Permission)
router.get("/", protect, checkPermission("view_logs"), async (req, res) => {
    try {
        const { user, action, limit = 50, skip = 0 } = req.query;
        let query = {};

        if (user) query.user = user;
        if (action) query.action = action;

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("user", "name email avatar");

        const total = await ActivityLog.countDocuments(query);

        res.json({
            logs,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Get activity logs for a specific user
// @route   GET /api/activities/user/:userId
// @access  Private (Admin or Self)
router.get("/user/:userId", protect, async (req, res) => {
    try {
        // Only allow admin or the user themselves to see their logs
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { limit = 20, skip = 0 } = req.query;

        const logs = await ActivityLog.find({ user: req.params.userId })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("user", "name email");

        const total = await ActivityLog.countDocuments({ user: req.params.userId });

        res.json({
            logs,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
