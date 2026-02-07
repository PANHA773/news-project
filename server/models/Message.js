const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    content: {
        type: String,
        required: true,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    image: { type: String, default: "" },
    video: { type: String, default: "" },
    audio: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
