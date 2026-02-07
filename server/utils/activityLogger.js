const ActivityLog = require("../models/ActivityLog");

/**
 * Log a user activity
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action type from the enum in ActivityLog model
 * @param {object} details - Additional information about the action
 * @param {object} req - Express request object for capturing metadata (IP, User-Agent)
 */
const logActivity = async (userId, action, details = {}, req = null) => {
    try {
        const logData = {
            user: userId,
            action,
            details,
        };

        if (req) {
            logData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            logData.userAgent = req.headers['user-agent'];
        }

        await ActivityLog.create(logData);
    } catch (error) {
        console.error(`[ActivityLogger] Failed to log activity: ${action}`, error);
    }
};

module.exports = logActivity;
