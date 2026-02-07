const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    news: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
