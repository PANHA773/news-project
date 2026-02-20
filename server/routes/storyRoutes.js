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
            .populate("viewers", "name avatar")
            .populate("comments.user", "name avatar")
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

// @desc    View a story
// @route   POST /api/stories/:id/view
// @access  Private
router.post("/:id/view", protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });

        // Don't count owner's view or duplicate views
        if (
            story.user.toString() !== req.user._id.toString() &&
            !story.viewers.includes(req.user._id)
        ) {
            story.viewers.push(req.user._id);
            await story.save();
        }

        res.json(story.viewers);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Comment on a story
// @route   POST /api/stories/:id/comment
// @access  Private
router.post("/:id/comment", protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "Content is required" });

        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });

        const newComment = {
            user: req.user._id,
            content,
        };

        story.comments.push(newComment);
        await story.save();

        // Populate the user of the new comment to return it
        await story.populate("comments.user", "name avatar");

        // Return the last comment (the one we just added)
        const addedComment = story.comments[story.comments.length - 1];
        res.status(201).json(addedComment);
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
