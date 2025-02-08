const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redisClient = require("../config/redis");

exports.googleAuth = async (req, res) => {
    try {
        if (!req.user) return res.status(400).json({ error: "Authentication failed" });

        let user = await User.findOne({ email: req.user.email });
        if (!user) {
            user = new User({
                googleId: req.user.id,
                email: req.user.email,
                name: req.user.displayName,
                profilePic: req.user.photos[0].value
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ error: "Authentication failed" });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) return res.status(400).json({ error: "No token provided" });

        await redisClient.set(`blacklist:${token}`, "invalid", "EX", 604800);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Logout failed" });
    }
};
