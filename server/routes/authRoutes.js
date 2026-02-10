const express = require("express");
const path = require("path");
const multer = require("multer");
const { ensureUploadsDir } = require("../utils/uploads");
const {
    registerUser,
    loginUser,
    loginWithGoogle,
    loginWithFacebook,
    getUserProfile,
    updateUserProfile,
    updateUserProfileById,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer storage for profile images
const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, ensureUploadsDir());
	},
	filename(req, file, cb) {
		cb(null, `media-${Date.now()}${path.extname(file.originalname)}`);
	},
});

const upload = multer({ storage });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle);
router.post("/facebook", loginWithFacebook);
router.get("/profile", protect, getUserProfile);

// Update profile (supports multipart/form-data with `image` field)
router.put("/profile", protect, upload.single("image"), updateUserProfile);

// Allow updating profile by id: only the owner or admin can update another user's profile
router.put("/profile/:id", protect, upload.single("image"), updateUserProfileById);

module.exports = router;
