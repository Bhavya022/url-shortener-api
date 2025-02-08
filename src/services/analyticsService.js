const Analytics = require("../models/analyticsModel");
const Url = require("../models/Url");
const redisClient = require("../config/redis");
const mongoose = require("mongoose"); // For ObjectId handling

// 🛠️ Utility Functions
const detectOS = (userAgent) => {
    if (!userAgent) return "Unknown";
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("macintosh") || ua.includes("mac os x")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
    if (ua.includes("android")) return "Android";
    if (ua.includes("thunder client") || ua.includes("postman")) return "API Client";
    if (ua.includes("curl")) return "Command Line Tool";
    return "Unknown";
};

const detectDevice = (userAgent) => {
    if (!userAgent) return "Unknown";
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile")) return "Mobile";
    if (ua.includes("tablet")) return "Tablet";
    if (ua.includes("thunder client") || ua.includes("postman") || ua.includes("curl")) return "API Client";
    return "Desktop";
};

// 🟢 Log Click Data
exports.trackClick = async (shortUrl, ip, userAgent) => {
    try {
        const osName = detectOS(userAgent);
        const deviceName = detectDevice(userAgent);
        console.log("Detected OS:", osName);
        console.log("Detected Device:", deviceName);

        // Create analytics entry using plain values
        const analyticsEntry = {
            shortUrl,
            ip,
            userAgent: typeof userAgent === "string" ? userAgent : JSON.stringify(userAgent),
            osName,
            deviceName,
            timestamp: new Date(),
        };

        await Analytics.create(analyticsEntry);
        console.log("Analytics entry stored successfully.");

        const cacheKey = `clicks:${shortUrl}`;
        let cachedCount = await redisClient.get(cacheKey);
        if (cachedCount !== null) {
            await redisClient.incr(cacheKey);
        } else {
            const count = await Analytics.countDocuments({ shortUrl });
            // Ensure count is stored as a plain number (stringified)
            await redisClient.set(cacheKey, JSON.stringify(count), "EX", 600);
        }
    } catch (error) {
        console.error("Error logging analytics:", error);
    }
};

// 🟢 Get URL Analytics (Single URL)
exports.getUrlAnalytics = async (alias) => {
    try {
        const cacheKey = `analytics:${alias}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) return JSON.parse(cachedData);

        const totalClicks = await Analytics.countDocuments({ shortUrl: alias });
        const uniqueUsers = await Analytics.distinct("ip", { shortUrl: alias });

        const recentClicks = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);

        const osType = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            {
                $group: {
                    _id: "$osName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ip" },
                },
            },
        ]).then(data =>
            data.map(d => ({
                osName: d._id || "Unknown",
                uniqueClicks: d.uniqueClicks,
                uniqueUsers: Array.isArray(d.uniqueUsers) ? d.uniqueUsers.length : 0,
            }))
        );

        const deviceType = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            {
                $group: {
                    _id: "$deviceName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ip" },
                },
            },
        ]).then(data =>
            data.map(d => ({
                deviceName: d._id || "Unknown",
                uniqueClicks: d.uniqueClicks,
                uniqueUsers: Array.isArray(d.uniqueUsers) ? d.uniqueUsers.length : 0,
            }))
        );

        const analyticsData = {
            totalClicks,
            uniqueUsers: uniqueUsers.length,
            clicksByDate: recentClicks.map(item => ({ date: item._id, count: item.count })),
            osType,
            deviceType,
        };

        // Double stringify/parse to remove any circular references
        const safeAnalyticsData = JSON.parse(JSON.stringify(analyticsData));
        await redisClient.set(cacheKey, JSON.stringify(safeAnalyticsData), "EX", 600);
        return safeAnalyticsData;
    } catch (error) {
        console.error("Error fetching analytics:", error);
        throw error;
    }
};

// 🟢 Get Topic-Based Analytics
exports.getTopicAnalytics = async (topic) => {
    try {
        // Use lean() to ensure plain objects are returned
        const urls = await Url.find({ topic }).lean();
        if (!urls.length) throw new Error("No URLs found under this topic");

        let totalClicks = 0;
        let uniqueUsersSet = new Set();

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urls.map(u => u.shortUrl) } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);

        const urlStats = await Promise.all(
            urls.map(async (url) => {
                const clicks = await Analytics.countDocuments({ shortUrl: url.shortUrl });
                const unique = await Analytics.distinct("ip", { shortUrl: url.shortUrl });
                totalClicks += clicks;
                unique.forEach(ip => uniqueUsersSet.add(ip));
                return { shortUrl: url.shortUrl, totalClicks: clicks, uniqueUsers: unique.length };
            })
        );

        const analyticsData = {
            totalClicks,
            uniqueUsers: uniqueUsersSet.size,
            clicksByDate,
            urls: urlStats
        };

        // Remove any potential circular references
        const safeAnalyticsData = JSON.parse(JSON.stringify(analyticsData));
        await redisClient.set(`analytics:${topic}`, JSON.stringify(safeAnalyticsData), "EX", 600);
        return safeAnalyticsData;
    } catch (error) {
        console.error("Error fetching topic analytics:", error);
        throw error;
    }
};

// 🟢 Get Overall Analytics (All User URLs)
exports.getOverallAnalytics = async (userId) => {
    try {
        const urls = await Url.find({ createdBy: userId }).lean();
        if (!urls.length) throw new Error("No URLs found for this user");

        let totalClicks = 0;
        let uniqueUsersSet = new Set();

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urls.map(u => u.shortUrl) } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);

        // Note: If you intend to accumulate totalClicks and uniqueUsers,
        // you need to iterate through each URL
        for (const url of urls) {
            const clicks = await Analytics.countDocuments({ shortUrl: url.shortUrl });
            const unique = await Analytics.distinct("ip", { shortUrl: url.shortUrl });
            totalClicks += clicks;
            unique.forEach(ip => uniqueUsersSet.add(ip));
        }

        const analyticsData = {
            totalUrls: urls.length,
            totalClicks,
            uniqueUsers: uniqueUsersSet.size,
            clicksByDate,
        };

        const safeAnalyticsData = JSON.parse(JSON.stringify(analyticsData));
        await redisClient.set(`analytics:overall:${userId}`, JSON.stringify(safeAnalyticsData), "EX", 600);
        return safeAnalyticsData;
    } catch (error) {
        console.error("Error fetching overall analytics:", error);
        throw error;
    }
};
