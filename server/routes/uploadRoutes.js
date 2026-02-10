const express = require("express");
const multer = require("multer");
const path = require("path");
const { ensureUploadsDir } = require("../utils/uploads");

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, ensureUploadsDir());
    },
    filename(req, file, cb) {
        cb(null, `media-${Date.now()}${path.extname(file.originalname)}`);
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|mp4|mkv|webm|mp3|wav|m4a|ogg|pdf|doc|docx/;
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
        res.json(`/uploads/${req.file.filename}`);
    });
});

module.exports = router;
