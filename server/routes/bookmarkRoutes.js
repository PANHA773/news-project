const express = require("express");
const User = require("../models/User");
const logActivity = require("../utils/activityLogger");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @desc    Get my bookmarks
// @route   GET /api/bookmarks
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("bookmarks")
            .populate({ path: "bookmarks", populate: { path: "category author" } });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.bookmarks || []);
    } catch (error) {
        console.error("/api/bookmarks GET error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

function extractArticleId(req) {
    return (req.body && (req.body.articleId || req.body.id || req.body.article_id || req.body.article || (req.body.data && req.body.data.articleId)))
        || req.query.articleId || req.query.id || req.query.article_id || req.query.article || req.params.articleId;
}

async function toggleBookmark(req, res) {
    const articleId = extractArticleId(req);
    if (!articleId) return res.status(400).json({ message: "articleId required in body, query, or param" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bookmarks = user.bookmarks || [];
    const isBookmarked = user.bookmarks.some(id => id.toString() === articleId);

    if (isBookmarked) {
        user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId);
        await user.save();
        await user.populate({ path: "bookmarks", populate: { path: "category author" } });
        try { await logActivity(req.user._id, "REMOVE_BOOKMARK", { articleId }, req); } catch (err) { console.error("Bookmark log error:", err); }
        return res.json({ message: "Bookmark removed", bookmarks: user.bookmarks });
    } else {
        user.bookmarks.push(articleId);
        await user.save();
        await user.populate({ path: "bookmarks", populate: { path: "category author" } });
        try { await logActivity(req.user._id, "ADD_BOOKMARK", { articleId }, req); } catch (err) { console.error("Bookmark log error:", err); }
        return res.json({ message: "Bookmark added", bookmarks: user.bookmarks });
    }
}

// @desc    Toggle bookmark
// @route   POST /api/bookmarks
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        await toggleBookmark(req, res);
    } catch (error) {
        console.error("/api/bookmarks POST error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// @desc    Toggle bookmark via URL param
// @route   POST /api/bookmarks/:articleId
// @access  Private
router.post("/:articleId", protect, async (req, res) => {
    try {
        await toggleBookmark(req, res);
    } catch (error) {
        console.error("/api/bookmarks/:articleId POST error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;
