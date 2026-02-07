const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
    title: { type: String, required: true, default: "University News App" },
    logo: { type: String, default: "" },
    description: { type: String, required: true },
    history: { type: String },
    contact: {
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        website: { type: String },
    },
    socialLinks: [
        {
            platform: { type: String },
            url: { type: String },
        }
    ],
    stats: [
        {
            label: { type: String },
            value: { type: String },
        }
    ],
    leaders: [
        {
            name: { type: String, required: true },
            position: { type: String, required: true },
            image: { type: String },
            bio: { type: String },
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("About", aboutSchema);
