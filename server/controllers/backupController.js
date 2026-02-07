const fs = require('fs');
const User = require('../models/User');
const News = require('../models/News');
const Category = require('../models/Category');
const About = require('../models/About');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Comment = require('../models/Comment');
const Message = require('../models/Message');

// @desc    Get full database backup
// @route   GET /api/backup
// @access  Private (Admin)
const getBackup = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password for slight security, though restore needs it? 
        // ACTUALLY: needed for restore. If we exclude password, restored users can't login. 
        // So we MUST include password hashes.
        const usersWithPassword = await User.find();

        const news = await News.find();
        const categories = await Category.find();
        const about = await About.find();
        const notifications = await Notification.find();
        const activities = await ActivityLog.find();
        const comments = await Comment.find();
        const messages = await Message.find();

        const backupData = {
            timestamp: new Date().toISOString(),
            data: {
                users: usersWithPassword,
                news,
                categories,
                about,
                notifications,
                activities,
                comments,
                messages
            }
        };

        res.json(backupData);
    } catch (error) {
        console.error("Backup error:", error);
        res.status(500).json({ message: "Backup failed", error: error.message });
    }
};

// @desc    Restore database from backup
// @route   POST /api/backup/restore
// @access  Private (Admin)
const restoreBackup = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No backup file uploaded" });
        }

        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = JSON.parse(fileContent);

        if (!data) {
            throw new Error("Invalid backup file format");
        }

        // Clear existing data
        // WARNING: This is destructive. In a real app, use transactions.
        await Promise.all([
            User.deleteMany({}),
            News.deleteMany({}),
            Category.deleteMany({}),
            About.deleteMany({}),
            Notification.deleteMany({}),
            ActivityLog.deleteMany({}),
            Comment.deleteMany({}),
            Message.deleteMany({})
        ]);

        // Insert new data
        // We use insertMany. Note that _id fields are preserved from JSON.
        if (data.users?.length) await User.insertMany(data.users);
        if (data.news?.length) await News.insertMany(data.news);
        if (data.categories?.length) await Category.insertMany(data.categories);
        if (data.about?.length) await About.insertMany(data.about);
        if (data.notifications?.length) await Notification.insertMany(data.notifications);
        if (data.activities?.length) await ActivityLog.insertMany(data.activities);
        if (data.comments?.length) await Comment.insertMany(data.comments);
        if (data.messages?.length) await Message.insertMany(data.messages);

        // Cleanup uploaded file
        fs.unlinkSync(filePath);

        res.json({ message: "Data restored successfully" });
    } catch (error) {
        console.error("Restore error:", error);
        // Attempt cleanup if file exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Restore failed", error: error.message });
    }
};

module.exports = { getBackup, restoreBackup };
