const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        image: { type: String, required: true },
        caption: { type: String, default: "" },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// Auto-delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", StorySchema);
