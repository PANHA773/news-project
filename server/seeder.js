const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const User = require("./models/User");
const Category = require("./models/Category");
const News = require("./models/News");
const FriendRequest = require("./models/FriendRequest");
const bcrypt = require("bcryptjs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/university-app";

mongoose.connect(MONGO_URI);

const seedDB = async () => {
    try {
        await User.deleteMany();
        await FriendRequest.deleteMany();
        await Category.deleteMany();
        await News.deleteMany();

        console.log("Data Destroyed...");

        // Create Admin
        const user = new User({
            name: "Admin User",
            email: "admin@example.com",
            password: "password123",
            role: "admin",
            gender: "Male"
        });
        const adminUser = await user.save();

        const standardUser = new User({
            name: "Standard User",
            email: "user@example.com",
            password: "password123",
            role: "user",
            gender: "Female"
        });
        await standardUser.save();

        // Additional users for friends/testing
        const alice = new User({ name: "Alice Johnson", email: "alice@example.com", password: "password123", role: "user" });
        const bob = new User({ name: "Bob Smith", email: "bob@example.com", password: "password123", role: "user" });
        const carol = new User({ name: "Carol Lee", email: "carol@example.com", password: "password123", role: "user" });

        await alice.save();
        await bob.save();
        await carol.save();

        // Create mutual friendships (seed)
        // admin <-> alice
        adminUser.friends = adminUser.friends || [];
        alice.friends = alice.friends || [];
        if (!adminUser.friends.some(id => id.toString() === alice._id.toString())) adminUser.friends.push(alice._id);
        if (!alice.friends.some(id => id.toString() === adminUser._id.toString())) alice.friends.push(adminUser._id);

        // standardUser <-> bob
        standardUser.friends = standardUser.friends || [];
        bob.friends = bob.friends || [];
        if (!standardUser.friends.some(id => id.toString() === bob._id.toString())) standardUser.friends.push(bob._id);
        if (!bob.friends.some(id => id.toString() === standardUser._id.toString())) bob.friends.push(standardUser._id);

        await adminUser.save();
        await alice.save();
        await standardUser.save();
        await bob.save();

        // Create Categories
        const categories = await Category.insertMany([
            { name: "Academic" },
            { name: "Events" },
            { name: "Sports" },
            { name: "Campus Life" }
        ]);

        // Create News
        await News.create([
            {
                title: "New Semester Registration Open",
                content: "Registration for the Spring semester is now open. Please visit the portal to register.",
                category: categories[0]._id,
                author: adminUser._id
            },
            {
                title: "Annual Sports Day",
                content: "The annual sports day will be held on Friday. Join us for a day of fun and games.",
                category: categories[2]._id,
                author: adminUser._id
            },
            {
                title: "Science Fair Winners Announced",
                content: "Congratulations to the winners of the Science Fair!",
                category: categories[0]._id,
                author: adminUser._id
            }
        ]);

        // Seed Friend Requests
        await FriendRequest.create([
            // pending: carol -> adminUser
            { requester: carol._id, recipient: adminUser._id, status: 'pending', message: 'Hi Admin, let\'s connect.' },
            // pending: bob -> carol
            { requester: bob._id, recipient: carol._id, status: 'pending', message: 'Hey Carol, want to be friends?' },
            // declined: alice -> standardUser
            { requester: alice._id, recipient: standardUser._id, status: 'declined', message: 'Hello!' }
        ]);

        console.log("Data Imported!");
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
}

seedDB();
