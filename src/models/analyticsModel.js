const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
    shortUrl: String,
    ip: String,
    userAgent: String,
    osName: String,
    deviceName: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Analytics", analyticsSchema);
