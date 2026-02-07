const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'REGISTER',
            'LOGOUT',
            'CREATE_NEWS',
            'UPDATE_NEWS',
            'DELETE_NEWS',
            'UPDATE_ROLE',
            'DELETE_USER',
            'UPDATE_PROFILE',
            'ADD_BOOKMARK',
            'REMOVE_BOOKMARK'
        ]
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
