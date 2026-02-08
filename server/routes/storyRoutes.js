const express = require("express");
const Story = require("../models/Story");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getExpiryDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

// @desc    Get active stories
// @route   GET /api/stories
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const now = new Date();
        const me = await require("../models/User").findById(req.user._id).select("friends");
        const friendIds = (me?.friends || []).map((id) => id.toString());
        friendIds.push(req.user._id.toString());

        const stories = await Story.find({
            expiresAt: { $gt: now },
            user: { $in: friendIds },
        })
            .populate("user", "name email avatar")
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Create story
// @route   POST /api/stories
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { image, caption } = req.body;
        if (!image) return res.status(400).json({ message: "Image is required" });

        const story = await Story.create({
            user: req.user._id,
            image,
            caption: caption || "",
            expiresAt: getExpiryDate(),
        });

        const populated = await story.populate("user", "name email avatar");
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Delete story (owner only)
// @route   DELETE /api/stories/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });
        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await story.deleteOne();
        res.json({ message: "Story removed" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
