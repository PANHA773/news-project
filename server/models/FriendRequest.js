const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    message: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
