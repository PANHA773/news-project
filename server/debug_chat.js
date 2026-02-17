const mongoose = require("mongoose");
const Message = require("./models/Message");
const User = require("./models/User"); // Register User model just in case

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/university-app";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Check raw messages first
        console.log("Checking raw messages...");
        const rawMessages = await Message.find({});
        console.log(`Found ${rawMessages.length} raw messages.`);

        for (const msg of rawMessages) {
            if (!mongoose.Types.ObjectId.isValid(msg.sender)) {
                console.error(`ERROR: Message ${msg._id} has invalid sender: ${msg.sender}`);
            }
        }

        console.log("Attempting to find messages with populate...");
        const messages = await Message.find()
            .populate("sender", "name email avatar bio gender role")
            .sort({ createdAt: 1 });

        console.log(`Success! Found ${messages.length} messages.`);

        messages.forEach(m => {
            if (!m.sender) {
                console.log(`WARNING: Message ${m._id} has null sender after populate.`);
            }
        });

    } catch (error) {
        console.error("Caught Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
