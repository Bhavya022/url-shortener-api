// src/controllers/urlController.js

const UrlService = require('../services/urlService');
const CacheService = require('../services/cacheService');
const AnalyticsService = require('../services/analyticsService');

exports.shortenUrl = async (req, res) => {
    try {
        const { originalUrl } = req.body;
        const userId = req.user.id;
        console.log(userId);

        const shortUrlData = await UrlService.createShortUrl(originalUrl, userId);
        await CacheService.setCache(shortUrlData.shortUrl, shortUrlData);

        res.status(201).json(shortUrlData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating short URL' });
    }
};

exports.redirectUrl = async (req, res) => {
    try {
        const { alias } = req.params;
        console.log(alias);
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"]; 
    
        console.log("Extracted User-Agent:", userAgent,ip); 
        let urlData = await CacheService.getCache(alias);
        if (!urlData) {
            urlData = await UrlService.getOriginalUrl(alias);
            if (!urlData) {
                return res.status(404).json({ error: 'URL not found' });
            }
            await CacheService.setCache(alias, urlData);
        }

        await AnalyticsService.trackClick(alias, ip, userAgent);
        res.redirect(urlData.originalUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error redirecting to URL' });
    }
};
 