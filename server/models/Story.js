const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        image: { type: String, default: "" },
        video: { type: String, default: "" },
        caption: { type: String, default: "" },
        expiresAt: { type: Date, required: true },
        viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                content: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

StorySchema.pre("validate", function () {
    if (!this.image && !this.video) {
        this.invalidate("image", "Image or video is required");
    }
});

// Auto-delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", StorySchema);
