const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { message: "Too many requests, please try again later." },
    headers: true,
});

module.exports = rateLimiter;
