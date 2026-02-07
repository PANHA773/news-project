const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logActivity = require("../utils/activityLogger");


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @desc    Register a new user (Admin)
// @route   POST /api/auth/register
// @access  Public (for initial setup)
const registerUser = async (req, res) => {
    const { name, email, password, gender } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
            gender: gender || "Other",
        });

        if (user) {
            // Log registration
            await logActivity(user._id, "REGISTER", { email: user.email }, req);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                settings: user.settings,
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: email=${email}, password=${password}`);

    try {
        const user = await User.findOne({ email });
        console.log(`User found: ${user ? "Yes" : "No"}`);

        if (user) {
            const isMatch = await user.matchPassword(password);
            console.log(`Password match: ${isMatch}`);

            if (isMatch) {
                // Log login
                await logActivity(user._id, "LOGIN", { email: user.email }, req);

                return res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                    settings: user.settings,
                });
            }
        }

        res.status(401).json({ message: "Invalid email or password" });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            settings: user.settings,
            avatar: user.avatar,
            bio: user.bio,
            gender: user.gender,
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// @desc    Update user profile (including avatar image)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { name, bio, gender } = req.body;

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (gender) user.gender = gender;

        // If an image was uploaded via multer, set avatar path
        if (req.file) {
            user.avatar = `/uploads/${req.file.filename}`;
        }

        await user.save();

        // Log profile update
        try { await logActivity(user._id, "PROFILE_UPDATE", { name: user.name }, req); } catch (e) { /* ignore logging errors */ }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            settings: user.settings,
            avatar: user.avatar,
            bio: user.bio,
            gender: user.gender,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile by id (owner or admin)
// @route   PUT /api/auth/profile/:id
// @access  Private (owner or admin)
const updateUserProfileById = async (req, res) => {
    try {
        const targetId = req.params.id;
        const requester = req.user; // set by protect middleware

        // allow if requester is admin or updating their own profile
        if (!requester) return res.status(401).json({ message: "Not authorized" });
        const isOwner = requester._id && requester._id.toString() === targetId.toString();
        const isAdmin = requester.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

        const user = await User.findById(targetId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { name, bio, gender, email } = req.body;
        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (gender) user.gender = gender;
        if (email && isAdmin) user.email = email; // only admin may change email here

        if (req.file) {
            user.avatar = `/uploads/${req.file.filename}`;
        }

        if (req.body.password) {
            // allow owner to change password; admin changing another's password should be handled carefully
            if (isOwner) user.password = req.body.password;
        }

        const updatedUser = await user.save();

        try { await logActivity(requester._id, "PROFILE_UPDATE_BY_ID", { targetId }, req); } catch (e) {}

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            settings: updatedUser.settings,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
            gender: updatedUser.gender,
        });
    } catch (error) {
        console.error("Profile by id update error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, updateUserProfileById };
