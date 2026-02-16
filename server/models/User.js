const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    authProvider: { type: String, default: "local" }, // local, google, facebook
    googleId: { type: String, default: "" },
    facebookId: { type: String, default: "" },
    role: { 
        type: String, 
        enum: ["admin", "user", "teacher", "student", "guest"], 
        default: "guest" 
    }, // admin, user, teacher, student, guest
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    permissions: [{ type: String }], // manage_news, manage_users, view_logs, manage_chat
    settings: {
        darkMode: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        language: { type: String, default: "English" },
    },
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        console.log(`[Bcrypt] Comparing ${enteredPassword} with hash ${this.password.substring(0, 10)}... Result: ${isMatch}`);
        return isMatch;
    } catch (error) {
        console.error("[Bcrypt] Compare error:", error);
        return false;
    }
};

module.exports = mongoose.model("User", userSchema);
