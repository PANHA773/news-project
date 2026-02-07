const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const MONGO_URI = "mongodb://localhost:27017/university-app";
const JWT_SECRET = "supersecretkey123";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne();
        if (!user) {
            console.log("No user found to test with.");
            return;
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });
        console.log("Generated token for user:", user.email);

        console.log("Fetching http://localhost:5000/api/chat...");
        const response = await fetch("http://localhost:5000/api/chat", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Response status:", response.status);
        if (response.status === 500) {
            const data = await response.json();
            console.log("Error message from server:", data);
        } else if (response.ok) {
            console.log("Request SUCCEEDED! (No 500 error reproduced)");
            const data = await response.json();
            console.log("Records received:", data.length);
        } else {
            console.log("Other status:", response.status);
            const text = await response.text();
            console.log(text);
        }

    } catch (err) {
        console.error("Test script error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
