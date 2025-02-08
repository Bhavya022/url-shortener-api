const Analytics = require("../models/analyticsModel");
const Url = require("../models/Url");
const redisClient = require("../config/redis");

// 🛠️ Utility Functions
const detectOS = (userAgent) => {
    if (/windows/i.test(userAgent)) return "Windows";
    if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
    if (/linux/i.test(userAgent)) return "Linux";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
    if (/android/i.test(userAgent)) return "Android";
    return "Unknown";
};

const detectDevice = (userAgent) => {
    if (/mobile/i.test(userAgent)) return "Mobile";
    if (/tablet/i.test(userAgent)) return "Tablet";
    return "Desktop";
};

// 🟢 Log Click Data
exports.logClick = async (req, shortUrl) => {
    try {
        //console.log("Request Details:", req);
        console.log("Short URL:", shortUrl);
        
        const { ip, headers } = req;
        const userAgent = headers["user-agent"] || "Unknown";
        const osName = detectOS(userAgent);
        const deviceName = detectDevice(userAgent);

        console.log("Logging Click Data:", { shortUrl, ip, userAgent, osName, deviceName });

        // **Ensure only required fields are stored in MongoDB**
        const analyticsEntry = {
            shortUrl,
            ip,
            userAgent,
            osName,
            deviceName,
            timestamp: new Date(),
        };

        await Analytics.create(analyticsEntry);
        console.log("Analytics entry stored successfully.");

        // Increment click count in Redis
        const cacheKey = `clicks:${shortUrl}`;
        let cachedCount = await redisClient.get(cacheKey);

        if (cachedCount) {
            await redisClient.incr(cacheKey);
        } else {
            const count = await Analytics.countDocuments({ shortUrl });
            await redisClient.set(cacheKey, count, "EX", 600);
        }

    } catch (error) {
        console.error("❌ Error logging click:", error);
    }
};

// 🟢 Get URL Analytics (Single URL)
exports.getUrlAnalytics = async (alias) => {
    try {
        const totalClicks = await Analytics.countDocuments({ shortUrl: alias });
        const uniqueUsers = await Analytics.distinct("ip", { shortUrl: alias });

        const recentClicks = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);

        const osType = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            { $group: { _id: "$osName", uniqueClicks: { $sum: 1 }, uniqueUsers: { $addToSet: "$ip" } } },
        ]).then(data => data.map(d => ({ osName: d._id, uniqueClicks: d.uniqueClicks, uniqueUsers: d.uniqueUsers.length })));

        const deviceType = await Analytics.aggregate([
            { $match: { shortUrl: alias } },
            { $group: { _id: "$deviceName", uniqueClicks: { $sum: 1 }, uniqueUsers: { $addToSet: "$ip" } } },
        ]).then(data => data.map(d => ({ deviceName: d._id, uniqueClicks: d.uniqueClicks, uniqueUsers: d.uniqueUsers.length })));

        return { totalClicks, uniqueUsers: uniqueUsers.length, clicksByDate: recentClicks, osType, deviceType };
    } catch (error) {
        console.error("❌ Error fetching URL analytics:", error);
        throw error;
    }
};

// 🟢 Get Topic-Based Analytics
// exports.getTopicAnalytics = async (topic) => {
//     try {
//         const urls = await Url.find({ topic });
//         if (!urls.length) throw new Error("No URLs found under this topic");

//         let totalClicks = 0;
//         let uniqueUsersSet = new Set();

//         const clicksByDate = await Analytics.aggregate([
//             { $match: { shortUrl: { $in: urls.map(u => u.shortUrl) } } },
//             { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
//             { $sort: { _id: -1 } },
//             { $limit: 7 },
//         ]);

//         const urlStats = await Promise.all(
//             urls.map(async (url) => {
//                 const clicks = await Analytics.countDocuments({ shortUrl: url.shortUrl });
//                 const unique = await Analytics.distinct("ip", { shortUrl: url.shortUrl });

//                 totalClicks += clicks;
//                 unique.forEach(ip => uniqueUsersSet.add(ip));

//                 return { shortUrl: url.shortUrl, totalClicks: clicks, uniqueUsers: unique.length };
//             })
//         );

//         return { totalClicks, uniqueUsers: uniqueUsersSet.size, clicksByDate, urls: urlStats };
//     } catch (error) {
//         console.error("❌ Error fetching topic analytics:", error);
//         throw error;
//     }
// };

exports.getTopicAnalytics = async (topic) => {
    try {
        // Convert Mongoose documents to plain objects using .lean()
        const urls = await Url.find({ topic }).lean();  
        if (!urls.length) throw new Error("No URLs found under this topic");

        let totalClicks = 0;
        let uniqueUsersSet = new Set();

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urls.map(u => u.shortUrl) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
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

        return { totalClicks, uniqueUsers: uniqueUsersSet.size, clicksByDate, urls: urlStats };
    } catch (error) {
        console.error("❌ Error fetching topic analytics:", error);
        throw error;
    }
};

// 🟢 Get Overall Analytics (All User URLs)
exports.getOverallAnalytics = async (userId) => {
    try {
        const urls = await Url.find({ createdBy: userId });
        if (!urls.length) throw new Error("No URLs found for this user");

        let totalClicks = 0;
        let uniqueUsersSet = new Set();

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urls.map(u => u.shortUrl) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);

        return { totalUrls: urls.length, totalClicks, uniqueUsers: uniqueUsersSet.size, clicksByDate };
    } catch (error) {
        console.error("❌ Error fetching overall analytics:", error);
        throw error;
    }
};
