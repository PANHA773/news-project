const express = require("express");
const multer = require("multer");
const {
    getNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    toggleLike,
    addComment,
    getComments,
    updateComment,
    deleteComment
} = require("../controllers/newsController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

const router = express.Router();
const parseNewsMultipart = multer({ storage: multer.memoryStorage() }).any();

// Allow any authenticated user to create news; editing/deleting allowed to author or admin
router.route("/").get(getNews).post(protect, parseNewsMultipart, createNews);
router.route("/:id").get(getNewsById).put(protect, updateNews).delete(protect, deleteNews);

// Social Engagement Routes
router.post("/:id/like", protect, toggleLike);
router.route("/:id/comments").get(getComments).post(protect, addComment);
router.route("/:newsId/comments/:commentId")
    .patch(protect, updateComment)
    .delete(protect, deleteComment);

module.exports = router;
