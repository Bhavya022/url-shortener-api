const redis = require("redis");

const client = redis.createClient({
    socket: {
        host: "redis-14939.c330.asia-south1-1.gce.redns.redis-cloud.com",
        port: 14939,
    },
    username: "default",
    password: "ShLwv26YUe466KNsDxEQggahWhNXh16i",
});

client.connect()
    .then(() => console.log("🟢 Redis Connected Successfully"))
    .catch(err => console.error("🔴 Redis Connection Error:", err));

class CacheService {
    static async setCache(key, value, expiration = 3600) {
        try {
            const plainValue = JSON.stringify(value); // Ensure it's a plain JSON object
            await client.setEx(key, expiration, plainValue);
            console.log(`✅ Cached: ${key}`);
        } catch (err) {
            console.error("🔴 Redis Set Error:", err);
        }
    }

    static async getCache(key) {
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error("🔴 Redis Get Error:", err);
            return null;
        }
    }

    static async clearCache(key) {
        try {
            await client.del(key);
            console.log(`🗑️ Cleared Cache: ${key}`);
        } catch (err) {
            console.error("🔴 Redis Delete Error:", err);
        }
    }
}

module.exports = CacheService;
