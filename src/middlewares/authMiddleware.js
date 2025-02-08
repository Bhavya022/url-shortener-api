const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        console.log(token);
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        // Check if token is blacklisted
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) return res.status(403).json({ error: "Token is invalid. Please log in again." });

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};
