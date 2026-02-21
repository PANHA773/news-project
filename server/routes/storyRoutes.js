const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Story = require("../models/Story");
const { protect } = require("../middleware/authMiddleware");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const { ensureUploadsSubdir } = require("../utils/uploads");

const router = express.Router();

const getExpiryDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const isProduction = process.env.NODE_ENV === "production";

const storyUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file?.mimetype?.startsWith("image/") || file?.mimetype?.startsWith("video/")) {
            cb(null, true);
            return;
        }
        cb(new Error("Only image or video files are allowed"));
    },
});

const parseStoryUpload = (req, res, next) => {
    storyUpload.any()(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ message: err.message || "Invalid upload payload" });
    });
};

const getExtFromMime = (mime) => {
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "image/webp") return ".webp";
    if (mime === "image/gif") return ".gif";
    if (mime === "video/mp4") return ".mp4";
    if (mime === "video/webm") return ".webm";
    if (mime === "video/x-matroska") return ".mkv";
    if (mime === "video/quicktime") return ".mov";
    return "";
};

const uploadStoryFile = async (file) => {
    const isVideo = file?.mimetype?.startsWith("video/");
    const mediaSubdir = isVideo ? "videos" : "images";

    if (!isProduction) {
        const uploadDir = ensureUploadsSubdir(mediaSubdir);
        const ext = path.extname(file.originalname || "").toLowerCase() || getExtFromMime(file.mimetype);
        const fileName = `story-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, file.buffer);
        return `/uploads/${mediaSubdir}/${fileName}`;
    }

    if (!isCloudinaryConfigured()) {
        const error = new Error("Cloudinary is not configured on the server");
        error.status = 500;
        throw error;
    }

    const uploadedUrl = await new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: process.env.CLOUDINARY_FOLDER || "university-app",
            resource_type: isVideo ? "video" : "image",
            public_id: `story-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (uploadErr, result) => {
            if (uploadErr) return reject(uploadErr);
            resolve(result.secure_url || result.url);
        });

        stream.end(file.buffer);
    });

    return uploadedUrl;
};

const pickUploadedStoryFile = (files) => {
    if (!Array.isArray(files) || files.length === 0) return null;
    const preferredFields = ["video", "image", "media", "file", "story"];
    for (const fieldName of preferredFields) {
        const found = files.find((f) => f.fieldname === fieldName);
        if (found) return found;
    }
    return files[0];
};

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
router.post("/", protect, parseStoryUpload, async (req, res) => {
    try {
        const imageUrl = typeof req.body?.image === "string" ? req.body.image.trim() : "";
        const videoUrl = typeof req.body?.video === "string" ? req.body.video.trim() : "";
        const caption = typeof req.body?.caption === "string" ? req.body.caption : "";

        let finalImage = imageUrl;
        let finalVideo = videoUrl;
        const uploadedFile = pickUploadedStoryFile(req.files);

        if (uploadedFile) {
            const uploadedUrl = await uploadStoryFile(uploadedFile);
            if (uploadedFile.mimetype.startsWith("video/")) {
                finalVideo = finalVideo || uploadedUrl;
            } else {
                finalImage = finalImage || uploadedUrl;
            }
        }

        if (!finalImage && !finalVideo) {
            return res.status(400).json({ message: "Image or video is required" });
        }

        const story = await Story.create({
            user: req.user._id,
            image: finalImage,
            video: finalVideo,
            caption: caption || "",
            expiresAt: getExpiryDate(),
        });

        const populated = await story.populate("user", "name email avatar");
        res.status(201).json(populated);
    } catch (error) {
        console.error("Create story error:", error);
        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message || "Invalid story data";
            return res.status(400).json({ message: firstMessage });
        }
        if (error?.name === "CastError") {
            return res.status(400).json({ message: "Invalid story media format" });
        }
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

// @desc    Get comments for a story
// @route   GET /api/stories/:id/comment
// @access  Private
router.get("/:id/comment", protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate("comments.user", "name avatar");
        if (!story) return res.status(404).json({ message: "Story not found" });

        res.json(story.comments);
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
