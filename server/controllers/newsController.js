const News = require("../models/News");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const logActivity = require("../utils/activityLogger");
const {
    deleteCloudinaryByUrl,
    deleteCloudinaryMany,
    extractDocumentUrls,
} = require("../utils/cloudinaryMedia");

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const parseDocuments = (value) => {
    let documents = value;

    if (typeof documents === "string") {
        try {
            const parsed = JSON.parse(documents);
            documents = Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            documents = [];
        }
    }

    if (!Array.isArray(documents)) return [];

    return documents
        .map((doc) => {
            if (typeof doc === "string") {
                const trimmed = doc.trim();
                return trimmed ? { name: "", url: trimmed } : null;
            }

            if (!doc || typeof doc !== "object") return null;
            const name = typeof doc.name === "string" ? doc.name.trim() : "";
            const url = typeof doc.url === "string" ? doc.url.trim() : "";
            if (!url) return null;
            return { name, url };
        })
        .filter(Boolean);
};


// @desc    Get all news
// @route   GET /api/news
// @access  Public
const getNews = async (req, res) => {
    try {
        const { author, category, search } = req.query;
        let query = {};

        if (author) query.author = author;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } }
            ];
        }

        const news = await News.find(query)
            .sort({ createdAt: -1 })
            .populate("category", "name")
            .populate("author", "name avatar");
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create news article
// @route   POST /api/news
// @access  Private (Admin)
const createNews = async (req, res) => {
    // Support requests where body might be undefined (e.g., wrong content-type)
    const body = req.body || {};

    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isAdmin = req.user.role === 'admin';
        const hasManageNews =
            req.user.permissions && req.user.permissions.includes('manage_news');
        const isUser = req.user.role === 'user';

        // ❌ Block unknown roles
        if (!isAdmin && !hasManageNews && !isUser) {
            return res.status(403).json({ message: "Permission denied" });
        }

        // 🔑 Status logic
        let status = "pending"; // default for users
        if (isAdmin || hasManageNews) {
            status = "published";
        }

        const rawTitle =
            body.title ??
            body.headline ??
            body.name ??
            body.subject ??
            "";
        const rawContent =
            body.content ??
            body.body ??
            body.description ??
            body.text ??
            body.caption ??
            "";
        const rawCaption = body.caption ?? "";

        const trimmedTitle = String(rawTitle).trim();
        const trimmedCaption = String(rawCaption).trim();
        const trimmedContent = String(rawContent).trim();

        if (!trimmedTitle || !trimmedContent) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const derivedTitle = trimmedTitle || trimmedCaption || "";
        const derivedContent = trimmedContent || trimmedCaption || "";

        const image = typeof body.image === "string" ? body.image.trim() : "";
        const video = typeof body.video === "string" ? body.video.trim() : "";
        const category = body.category || body.categoryId || null;

        const documents = parseDocuments(body.documents || []);

        const news = new News({
            title: derivedTitle,
            content: derivedContent,
            image,
            video,
            documents,
            category: category || null,
            author: req.user._id,
            status, // 👈 important
        });

        const createdNews = await news.save();

        await logActivity(
            req.user._id,
            "CREATE_NEWS",
            { title: createdNews.title, newsId: createdNews._id },
            req
        );

        // 🔔 Notify users ONLY if published
        if (status === "published") {
            try {
                const User = require("../models/User");
                const users = await User.find({ _id: { $ne: req.user._id } }).select("_id");

                const notifications = users.map(user => ({
                    recipient: user._id,
                    sender: req.user._id,
                    type: "news",
                    news: createdNews._id,
                    message: `New Article: ${createdNews.title}`,
                    link: `/news/${createdNews._id}`,
                }));

                await Notification.insertMany(notifications);
                req.io.emit("new_news_published", {
                    title: createdNews.title,
                    newsId: createdNews._id,
                });
            } catch (err) {
                console.error("Notification error:", err);
            }
        }

        res.status(201).json({
            message:
                status === "published"
                    ? "News published successfully"
                    : "News submitted for approval",
            data: createdNews,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// @desc    Update news article
// @route   PUT /api/news/:id
// @access  Private (Admin)
const updateNews = async (req, res) => {
    const body = req.body || {};

    try {
        const news = await News.findById(req.params.id);

        if (news) {
            // Authorization: allow if requester is the author, an admin, or has manage_news permission
            const isAuthor = news.author && news.author.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin';
            const hasManageNews = req.user.permissions && req.user.permissions.includes('manage_news');

            if (!isAuthor && !isAdmin && !hasManageNews) {
                return res.status(403).json({ message: 'Not authorized to update this article' });
            }

            const previousImage = news.image || "";
            const previousVideo = news.video || "";
            const previousDocumentUrls = extractDocumentUrls(news.documents || []);

            if (hasOwn(body, "title")) {
                const nextTitle = String(body.title || "").trim();
                news.title = nextTitle || news.title;
            }

            if (hasOwn(body, "content")) {
                const nextContent = String(body.content || "").trim();
                news.content = nextContent || news.content;
            }

            if (hasOwn(body, "image")) {
                news.image = typeof body.image === "string" ? body.image.trim() : "";
            }

            if (hasOwn(body, "video")) {
                news.video = typeof body.video === "string" ? body.video.trim() : "";
            }

            if (hasOwn(body, "documents")) {
                news.documents = parseDocuments(body.documents);
            }

            if (hasOwn(body, "category")) {
                news.category = body.category || null;
            }

            const updatedNews = await news.save();

            const cleanupJobs = [];

            if (hasOwn(body, "image") && previousImage && previousImage !== updatedNews.image) {
                cleanupJobs.push(deleteCloudinaryByUrl(previousImage, { resourceType: "image", silent: true }));
            }

            if (hasOwn(body, "video") && previousVideo && previousVideo !== updatedNews.video) {
                cleanupJobs.push(deleteCloudinaryByUrl(previousVideo, { resourceType: "video", silent: true }));
            }

            if (hasOwn(body, "documents")) {
                const nextDocumentUrls = extractDocumentUrls(updatedNews.documents || []);
                const removedDocumentUrls = previousDocumentUrls.filter((url) => !nextDocumentUrls.includes(url));
                cleanupJobs.push(deleteCloudinaryMany(removedDocumentUrls, { resourceType: "raw", silent: true }));
            }

            if (cleanupJobs.length > 0) {
                await Promise.all(cleanupJobs);
            }

            await logActivity(req.user._id, "UPDATE_NEWS", { title: updatedNews.title, newsId: updatedNews._id }, req);
            res.json(updatedNews);
        } else {
            res.status(404).json({ message: "News not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Private (Admin)
const deleteNews = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);

        if (news) {
            // Authorization: allow if requester is the author, an admin, or has manage_news permission
            const isAuthor = news.author && news.author.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin';
            const hasManageNews = req.user.permissions && req.user.permissions.includes('manage_news');

            if (!isAuthor && !isAdmin && !hasManageNews) {
                return res.status(403).json({ message: 'Not authorized to delete this article' });
            }

            const imageUrl = news.image || "";
            const videoUrl = news.video || "";
            const documentUrls = extractDocumentUrls(news.documents || []);

            await logActivity(req.user._id, "DELETE_NEWS", { title: news.title, newsId: news._id }, req);
            await news.deleteOne();
            await Promise.all([
                deleteCloudinaryByUrl(imageUrl, { resourceType: "image", silent: true }),
                deleteCloudinaryByUrl(videoUrl, { resourceType: "video", silent: true }),
                deleteCloudinaryMany(documentUrls, { resourceType: "raw", silent: true }),
            ]);

            res.json({ message: "News removed" });
        } else {
            res.status(404).json({ message: "News not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single news
// @route   GET /api/news/:id
// @access  Public
const getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id)
            .populate("category", "name")
            .populate("author", "name avatar bio");

        if (news) {
            // Increment views
            news.views = (news.views || 0) + 1;
            await news.save();
            res.json(news);
        } else {
            res.status(404).json({ message: "News not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle like news
// @route   POST /api/news/:id/like
// @access  Private
const toggleLike = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ message: "News not found" });

        const alreadyLiked = news.likes.includes(req.user._id);

        if (alreadyLiked) {
            news.likes = news.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            news.likes.push(req.user._id);
        }

        await news.save();

        // Notification Logic
        if (!alreadyLiked && news.author.toString() !== req.user._id.toString()) {
            try {
                const notification = await Notification.create({
                    recipient: news.author,
                    sender: req.user._id,
                    type: "like",
                    news: news._id,
                    message: `${req.user.name} liked your article: ${news.title}`
                });
                const populated = await notification.populate("sender", "name avatar");
                req.io.to(news.author.toString()).emit("new_notification", populated);
            } catch (err) {
                console.error("Notification Error:", err);
            }
        }

        res.json({ likes: news.likes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to news
// @route   POST /api/news/:id/comments
// @access  Private
const addComment = async (req, res) => {
    const { content } = req.body;
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ message: "News not found" });

        const comment = await Comment.create({
            content,
            user: req.user._id,
            news: req.params.id
        });

        const populatedComment = await comment.populate("user", "name avatar");

        // Notification Logic
        if (news.author.toString() !== req.user._id.toString()) {
            try {
                const notification = await Notification.create({
                    recipient: news.author,
                    sender: req.user._id,
                    type: "comment",
                    news: news._id,
                    message: `${req.user.name} commented on your article: ${news.title}`
                });
                const populated = await notification.populate("sender", "name avatar");
                req.io.to(news.author.toString()).emit("new_notification", populated);
            } catch (err) {
                console.error("Notification Error:", err);
            }
        }

        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get comments for news
// @route   GET /api/news/:id/comments
// @access  Public
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ news: req.params.id })
            .sort({ createdAt: -1 })
            .populate("user", "name avatar");
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a comment (owner, admin, or manage_news)
// @route   PATCH /api/news/:newsId/comments/:commentId
// @access  Private
const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "Content is required" });

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        if (comment.news.toString() !== req.params.newsId) {
            return res.status(400).json({ message: "Comment does not belong to this article" });
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        const hasManageNews = req.user.permissions && req.user.permissions.includes("manage_news");
        if (!isOwner && !isAdmin && !hasManageNews) {
            return res.status(403).json({ message: "Not authorized" });
        }

        comment.content = content;
        await comment.save();

        const populated = await comment.populate("user", "name avatar");
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a comment (owner, admin, or manage_news)
// @route   DELETE /api/news/:newsId/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        if (comment.news.toString() !== req.params.newsId) {
            return res.status(400).json({ message: "Comment does not belong to this article" });
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        const hasManageNews = req.user.permissions && req.user.permissions.includes("manage_news");
        if (!isOwner && !isAdmin && !hasManageNews) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await comment.deleteOne();
        res.json({ message: "Comment removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
