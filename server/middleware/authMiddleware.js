const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            // Lightweight debug: log presence (don't log the full token in prod)
            console.debug("protect: authorization header present");

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            console.debug("protect: token decoded id=", decoded.id);

            req.user = await User.findById(decoded.id).select("-password");

            next();
        } catch (error) {
            console.error("protect: token verification error:", error.message);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(401).json({ message: "Not authorized as an admin" });
    }
};

const checkPermission = (permission) => (req, res, next) => {
    if (req.user && (req.user.role === "admin" || (req.user.permissions && req.user.permissions.includes(permission)))) {
        next();
    } else {
        res.status(403).json({ message: `Not authorized - missing permission: ${permission}` });
    }
};

// Allow any authenticated user to manage news
const allowManageNews = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: "Not authorized" });
    }
};

module.exports = { protect, admin, checkPermission, allowManageNews };
