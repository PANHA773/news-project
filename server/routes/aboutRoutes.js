const express = require("express");
const router = express.Router();
const About = require("../models/About");
const { protect, admin } = require("../middleware/authMiddleware");

// @desc    Get university info
// @route   GET /api/about
// @access  Public
router.get("/", async (req, res) => {
    try {
        let about = await About.findOne();
        if (!about) {
            // Create a default if none exists
            about = await About.create({
                description: "The University News App provides the latest updates from across the campus.",
                history: "Founded in 2024 to bring the community together.",
            });
        }
        res.json(about);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update university info
// @route   PUT /api/about
// @access  Private/Admin
router.put("/", protect, admin, async (req, res) => {
    try {
        let about = await About.findOne();

        if (about) {
            about.title = req.body.title || about.title;
            about.logo = req.body.logo || about.logo;
            about.description = req.body.description || about.description;
            about.history = req.body.history || about.history;
            about.contact = req.body.contact || about.contact;
            about.socialLinks = req.body.socialLinks || about.socialLinks;
            about.stats = req.body.stats || about.stats;
            about.leaders = req.body.leaders || about.leaders;

            const updatedAbout = await about.save();
            res.json(updatedAbout);
        } else {
            const newAbout = await About.create(req.body);
            res.json(newAbout);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
