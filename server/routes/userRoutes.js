const express = require("express");
const User = require("../models/User");
const { protect, admin, checkPermission } = require("../middleware/authMiddleware");
const FriendRequest = require("../models/FriendRequest");
const multer = require("multer");
const path = require("path");
const logActivity = require("../utils/activityLogger");
const { ensureUploadsDir } = require("../utils/uploads");
const router = express.Router();

// Multer setup for avatar uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, ensureUploadsDir());
    },
    filename(req, file, cb) {
        cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    },
});

function imageFileFilter(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\//.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported image type"));
    }
}

const upload = multer({ storage, fileFilter: imageFileFilter });

// --- User Profile Routes (MUST come before /:id routes) ---

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate({
                path: 'bookmarks',
                populate: { path: 'category author' }
            });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("/api/users/bookmark PUT error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
    try {
        console.log("[Profile Update] User ID:", req.user._id);
        console.log("[Profile Update] Request body:", req.body);

        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.avatar = req.body.avatar || user.avatar;
            user.bio = req.body.bio || user.bio;

            if (req.body.password) {
                user.password = req.body.password;
            }

            console.log("[Profile Update] Saving user...");
            const updatedUser = await user.save();
            console.log("[Profile Update] User saved successfully");

            await logActivity(req.user._id, "UPDATE_PROFILE", { fields: Object.keys(req.body).filter(f => f !== 'password') }, req);
            await updatedUser.populate({
                path: 'bookmarks',
                populate: { path: 'category author' }
            });

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                bookmarks: updatedUser.bookmarks,
                settings: updatedUser.settings,
                token: req.headers.authorization.split(" ")[1], // Keep existing token
            });
        } else {
            console.log("[Profile Update] User not found");
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("[Profile Update] Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// @desc    Update user avatar (multipart/form-data)
// @route   PUT /api/users/profile/avatar
// @access  Private
router.put("/profile/avatar", protect, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Save avatar path (served from /uploads)
        user.avatar = `/uploads/${req.file.filename}`;
        const updatedUser = await user.save();

        await logActivity(req.user._id, "UPDATE_AVATAR", { filename: req.file.filename }, req);

        res.json({ message: "Avatar updated", avatar: updatedUser.avatar });
    } catch (error) {
        console.error("[Avatar Upload] Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Toggle bookmark
// @route   PUT /api/users/bookmark/:articleId
// @access  Private
// Also accept articleId in JSON body at PUT /api/users/bookmark for clients that omit the param
router.put("/bookmark", protect, async (req, res) => {
    try {
        // Debug info to help mobile clients: log incoming keys
        console.log('[Bookmark] headers:', { authorization: !!req.headers.authorization });
        console.log('[Bookmark] body keys:', Object.keys(req.body || {}), 'query keys:', Object.keys(req.query || {}));

        // Accept articleId from multiple common field names (body or query)
        const articleId = (req.body && (req.body.articleId || req.body.id || req.body.article_id || req.body.article || (req.body.data && req.body.data.articleId))) || req.query.articleId || req.query.id || req.query.article_id || req.query.article;
        if (!articleId) return res.status(400).json({ message: "articleId required in body or query", received: { bodyKeys: Object.keys(req.body || {}), queryKeys: Object.keys(req.query || {}) } });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.bookmarks = user.bookmarks || [];
        const isBookmarked = user.bookmarks.some(id => id.toString() === articleId);

        if (isBookmarked) {
            user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId);
            await user.save();
            await user.populate({ path: 'bookmarks', populate: { path: 'category author' } });
            try {
                await logActivity(req.user._id, "REMOVE_BOOKMARK", { articleId }, req);
            } catch (err) {
                console.error("Bookmark log error:", err);
            }
            res.json({ message: "Bookmark removed", bookmarks: user.bookmarks });
        } else {
            user.bookmarks.push(articleId);
            await user.save();
            await user.populate({ path: 'bookmarks', populate: { path: 'category author' } });
            try {
                await logActivity(req.user._id, "ADD_BOOKMARK", { articleId }, req);
            } catch (err) {
                console.error("Bookmark log error:", err);
            }
            res.json({ message: "Bookmark added", bookmarks: user.bookmarks });
        }
    } catch (error) {
        console.error("/api/users/bookmark POST error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
// Also allow POST for clients that send POST instead of PUT
router.post("/bookmark", protect, async (req, res) => {
    try {
        console.log('[Bookmark POST] headers:', { authorization: !!req.headers.authorization });
        console.log('[Bookmark POST] body keys:', Object.keys(req.body || {}), 'query keys:', Object.keys(req.query || {}));

        const articleId = (req.body && (req.body.articleId || req.body.id || req.body.article_id || req.body.article || (req.body.data && req.body.data.articleId))) || req.query.articleId || req.query.id || req.query.article_id || req.query.article;
        if (!articleId) return res.status(400).json({ message: "articleId required in body or query", received: { bodyKeys: Object.keys(req.body || {}), queryKeys: Object.keys(req.query || {}) } });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.bookmarks = user.bookmarks || [];
        const isBookmarked = user.bookmarks.some(id => id.toString() === articleId);

        if (isBookmarked) {
            user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId);
            await user.save();
            await user.populate({ path: 'bookmarks', populate: { path: 'category author' } });
            try {
                await logActivity(req.user._id, "REMOVE_BOOKMARK", { articleId }, req);
            } catch (err) {
                console.error("Bookmark log error:", err);
            }
            res.json({ message: "Bookmark removed", bookmarks: user.bookmarks });
        } else {
            user.bookmarks.push(articleId);
            await user.save();
            await user.populate({ path: 'bookmarks', populate: { path: 'category author' } });
            try {
                await logActivity(req.user._id, "ADD_BOOKMARK", { articleId }, req);
            } catch (err) {
                console.error("Bookmark log error:", err);
            }
            res.json({ message: "Bookmark added", bookmarks: user.bookmarks });
        }
    } catch (error) {
        console.error("/api/users/bookmark/:articleId PUT error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
router.put("/bookmark/:articleId", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const articleId = req.params.articleId;

        if (user) {
            // Ensure bookmarks is an array
            user.bookmarks = user.bookmarks || [];

            // Compare as strings because bookmarks contains ObjectIds
            const isBookmarked = user.bookmarks.some(id => id.toString() === articleId);

            if (isBookmarked) {
                user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId);
                await user.save();

                // Populate for frontend
                await user.populate({
                    path: 'bookmarks',
                    populate: { path: 'category author' }
                });

                try {
                    await logActivity(req.user._id, "REMOVE_BOOKMARK", { articleId }, req);
                } catch (err) {
                    console.error("Bookmark log error:", err);
                }
                res.json({ message: "Bookmark removed", bookmarks: user.bookmarks });
            } else {
                user.bookmarks.push(articleId);
                await user.save();

                // Populate for frontend
                await user.populate({
                    path: 'bookmarks',
                    populate: { path: 'category author' }
                });

                try {
                    await logActivity(req.user._id, "ADD_BOOKMARK", { articleId }, req);
                } catch (err) {
                    console.error("Bookmark log error:", err);
                }
                res.json({ message: "Bookmark added", bookmarks: user.bookmarks });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
router.put("/settings", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.settings = {
                ...user.settings,
                ...req.body,
            };

            const updatedUser = await user.save();
            await updatedUser.populate({
                path: 'bookmarks',
                populate: { path: 'category author' }
            });
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// --- Admin & Staff Routes ---

// @desc    Get all users (basic profiles)
// @route   GET /api/users/all
// @access  Private
router.get("/all", protect, async (req, res) => {
    try {
        const users = await User.find({})
            .select("name email avatar bio role");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Manage Users Permission)
router.get("/", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Create new admin/staff
// @route   POST /api/users/admin
// @access  Private (Admin only)
router.post("/admin", protect, admin, async (req, res) => {
    const { name, email, password, role, permissions } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const user = await User.create({
            name,
            email,
            password,
            role: role || "admin",
            permissions: permissions || []
        });

        await logActivity(req.user._id, "CREATE_ADMIN", { newAdminId: user._id, role: user.role }, req);
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Dynamic ID Routes (MUST come after specific routes) ---

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Manage Users Permission)
router.delete("/:id", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
                return res.status(400).json({ message: "Cannot delete the only admin" });
            }
            await logActivity(req.user._id, "DELETE_USER", { deletedUserId: user._id, deletedUserName: user.name }, req);
            await user.deleteOne();
            res.json({ message: "User removed" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Manage Users Permission)
router.put("/:id/role", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            await logActivity(req.user._id, "UPDATE_ROLE", { targetUserId: user._id, newRole: updatedUser.role }, req);
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Update user permissions
// @route   PUT /api/users/:id/permissions
// @access  Private (Manage Users Permission)
router.put("/:id/permissions", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.permissions = req.body.permissions || user.permissions;
            const updatedUser = await user.save();
            await logActivity(req.user._id, "UPDATE_PERMISSIONS", { targetUserId: user._id, permissions: user.permissions }, req);
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Get public user profile
// @route   GET /api/users/:id
// @access  Public
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("name avatar bio");
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Get authenticated user's friends
// @route   GET /api/users/friends
// @access  Private
// Get my friends
router.get("/me/friends", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("friends", "name email avatar bio");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.friends || []);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Add friend (mutual)
// @route   POST /api/users/:id/add-friend
// @access  Private
router.post("/:id/add-friend", protect, async (req, res) => {
    res.status(400).json({ message: "Friendship requires confirmation. Use the friend request flow." });
});

// @desc    Remove friend (mutual)
// @route   DELETE /api/users/:id/remove-friend
// @access  Private
router.delete("/:id/remove-friend", protect, async (req, res) => {
    try {
        const targetId = req.params.id;
        const me = await User.findById(req.user._id);
        const other = await User.findById(targetId);
        if (!other) return res.status(404).json({ message: "User not found" });

        me.friends = (me.friends || []).filter(id => id.toString() !== targetId);
        other.friends = (other.friends || []).filter(id => id.toString() !== req.user._id.toString());

        await me.save();
        await other.save();

        await logActivity(req.user._id, "REMOVE_FRIEND", { friendId: other._id }, req);

        res.json({ message: "Friend removed" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// --- Friend Requests ---

// Send friend request
// POST /api/users/:id/request
router.post("/:id/request", protect, async (req, res) => {
    try {
        const recipientId = req.params.id;
        if (recipientId === req.user._id.toString()) return res.status(400).json({ message: "Cannot send request to yourself" });

        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).json({ message: "Recipient not found" });

        // Check existing friendship
        const me = await User.findById(req.user._id);
        if (me.friends && me.friends.some(id => id.toString() === recipientId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Prevent duplicate pending requests
        const existing = await FriendRequest.findOne({ requester: req.user._id, recipient: recipientId, status: 'pending' });
        if (existing) return res.status(400).json({ message: "Friend request already sent" });

        const fr = await FriendRequest.create({ requester: req.user._id, recipient: recipientId, message: req.body.message || '' });
        await logActivity(req.user._id, "SEND_FRIEND_REQUEST", { to: recipientId }, req);

        // Optionally notify via socket
        if (req.io) req.io.to(recipientId).emit('friend_request_received', fr);

        res.status(201).json(fr);
    } catch (error) {
        console.error("Send friend request error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get received friend requests
// GET /api/users/me/friend-requests
router.get("/me/friend-requests", protect, async (req, res) => {
    try {
        const received = await FriendRequest.find({ recipient: req.user._id }).populate('requester', 'name email avatar');
        res.json(received);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// Get sent friend requests
// GET /api/users/me/friend-requests/sent
router.get("/me/friend-requests/sent", protect, async (req, res) => {
    try {
        const sent = await FriendRequest.find({ requester: req.user._id }).populate('recipient', 'name email avatar');
        res.json(sent);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// Accept friend request
// POST /api/users/friend-requests/:id/accept
router.post("/friend-requests/:id/accept", protect, async (req, res) => {
    try {
        const fr = await FriendRequest.findById(req.params.id);
        if (!fr) return res.status(404).json({ message: "Friend request not found" });
        if (fr.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
        if (fr.status !== 'pending') return res.status(400).json({ message: "Request already handled" });

        fr.status = 'accepted';
        await fr.save();

        const me = await User.findById(req.user._id);
        const other = await User.findById(fr.requester);

        me.friends = me.friends || [];
        other.friends = other.friends || [];

        if (!me.friends.some(id => id.toString() === other._id.toString())) me.friends.push(other._id);
        if (!other.friends.some(id => id.toString() === me._id.toString())) other.friends.push(me._id);

        await me.save();
        await other.save();

        await logActivity(req.user._id, "ACCEPT_FRIEND_REQUEST", { from: other._id }, req);

        if (req.io) {
            req.io.to(other._id.toString()).emit('friend_request_accepted', { by: me._id });
        }

        res.json({ message: "Friend request accepted" });
    } catch (error) {
        console.error("Accept friend request error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Decline friend request
// POST /api/users/friend-requests/:id/decline
router.post("/friend-requests/:id/decline", protect, async (req, res) => {
    try {
        const fr = await FriendRequest.findById(req.params.id);
        if (!fr) return res.status(404).json({ message: "Friend request not found" });
        if (fr.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
        if (fr.status !== 'pending') return res.status(400).json({ message: "Request already handled" });

        fr.status = 'declined';
        await fr.save();

        await logActivity(req.user._id, "DECLINE_FRIEND_REQUEST", { from: fr.requester }, req);

        if (req.io) req.io.to(fr.requester.toString()).emit('friend_request_declined', { by: req.user._id });

        res.json({ message: "Friend request declined" });
    } catch (error) {
        console.error("Decline friend request error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: list all friend requests
// GET /api/users/admin/friend-requests
router.get("/admin/friend-requests", protect, admin, async (req, res) => {
    try {
        const list = await FriendRequest.find().populate('requester recipient', 'name email avatar');
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: force accept a friend request (admin action)
// POST /api/users/admin/friend-requests/:id/force-accept
router.post("/admin/friend-requests/:id/force-accept", protect, admin, async (req, res) => {
    try {
        const fr = await FriendRequest.findById(req.params.id);
        if (!fr) return res.status(404).json({ message: "Friend request not found" });
        if (fr.status === 'accepted') return res.status(400).json({ message: "Already accepted" });

        fr.status = 'accepted';
        await fr.save();

        const a = await User.findById(fr.recipient);
        const b = await User.findById(fr.requester);
        a.friends = a.friends || [];
        b.friends = b.friends || [];
        if (!a.friends.some(id => id.toString() === b._id.toString())) a.friends.push(b._id);
        if (!b.friends.some(id => id.toString() === a._id.toString())) b.friends.push(a._id);
        await a.save();
        await b.save();

        await logActivity(req.user._id, "ADMIN_FORCE_ACCEPT_FRIEND_REQUEST", { requestId: fr._id }, req);

        res.json({ message: "Friend request force-accepted" });
    } catch (error) {
        console.error("Admin force accept error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
