const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'system', 'message', 'call'],
        required: true
    },
    link: {
        type: String,
        default: ""
    },
    news: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'News'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
