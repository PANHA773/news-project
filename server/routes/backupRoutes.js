const express = require('express');
const router = express.Router();
const { getBackup, restoreBackup } = require('../controllers/backupController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { ensureUploadsSubdir } = require('../utils/uploads');

// Configure multer for temporary storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, ensureUploadsSubdir("temp"));
    },
    filename(req, file, cb) {
        cb(null, `backup-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /json/;
        const mimetypes = /application\/json/;
        const mimetype = mimetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports following filetypes - " + filetypes));
    }
});

router.get('/', protect, admin, getBackup);
router.post('/restore', protect, admin, upload.single('backup'), restoreBackup);

module.exports = router;
