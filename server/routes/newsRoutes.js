const express = require("express");
const {
    getNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    toggleLike,
    addComment,
    getComments
} = require("../controllers/newsController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// Allow any authenticated user to create news; editing/deleting allowed to author or admin
router.route("/").get(getNews).post(protect, createNews);
router.route("/:id").get(getNewsById).put(protect, updateNews).delete(protect, deleteNews);

// Social Engagement Routes
router.post("/:id/like", protect, toggleLike);
router.route("/:id/comments").get(getComments).post(protect, addComment);

module.exports = router;
