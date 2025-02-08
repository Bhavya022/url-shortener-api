const shortid = require("shortid");
const Url = require("../models/Url");

class UrlService {
    static async createShortUrl(originalUrl, userId) {
        const shortUrl = shortid.generate();
        const newUrl = new Url({ originalUrl, shortUrl, user: userId });
        await newUrl.save();
        return newUrl.toObject(); // Convert to plain object to avoid circular issues
    }

    static async getOriginalUrl(shortUrl) {
        const url = await Url.findOne({ shortUrl }).lean(); // Use .lean() to return a plain object
        return url;
    }
}

module.exports = UrlService;
