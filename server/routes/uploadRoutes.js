const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const { ensureUploadsSubdir } = require("../utils/uploads");

const router = express.Router();

const storage = multer.memoryStorage();

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|gif|mp4|mkv|webm|mp3|wav|m4a|ogg|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => checkFileType(file, cb),
});

router.post("/", (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }

        // Everything went fine.
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const isProduction = process.env.NODE_ENV === "production";

        if (!isProduction) {
            const mediaSubdir = req.file.mimetype.startsWith("video/")
                ? "videos"
                : req.file.mimetype.startsWith("audio/")
                    ? "audio"
                    : req.file.mimetype === "application/pdf" ||
                        req.file.mimetype === "application/msword" ||
                        req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        ? "documents"
                        : "images";

            const uploadDir = ensureUploadsSubdir(mediaSubdir);
            const ext = path.extname(req.file.originalname || "").toLowerCase();
            const fileName = `media-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFile(filePath, req.file.buffer, (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({ message: `Local upload failed: ${writeErr.message}` });
                }

                return res.json(`/uploads/${mediaSubdir}/${fileName}`);
            });
            return;
        }

        if (!isCloudinaryConfigured()) {
            return res.status(500).json({
                message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
            });
        }

        const resourceType = req.file.mimetype.startsWith("video/")
            ? "video"
            : req.file.mimetype.startsWith("audio/")
                ? "video"
                : req.file.mimetype === "application/pdf" ||
                    req.file.mimetype === "application/msword" ||
                    req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ? "raw"
                    : "image";

        const uploadOptions = {
            folder: process.env.CLOUDINARY_FOLDER || "university-app",
            resource_type: resourceType,
            public_id: `media-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (uploadErr, result) => {
            if (uploadErr) {
                return res.status(500).json({ message: `Cloudinary upload failed: ${uploadErr.message}` });
            }

            // Keep API contract: return a string URL (was /uploads/...)
            return res.json(result.secure_url || result.url);
        });

        stream.end(req.file.buffer);
    });
});

module.exports = router;
