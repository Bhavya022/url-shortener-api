const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

const authMiddleware = require("../middlewares/authMiddleware");
const rateLimiter = require("../middlewares/rateLimiter");
router.get("/:alias", authMiddleware.authenticate, rateLimiter, analyticsController.getUrlAnalytics);
router.get("/topic/:topic", authMiddleware.authenticate, rateLimiter, analyticsController.getTopicAnalytics);
router.get("/overall", authMiddleware.authenticate, rateLimiter, analyticsController.getOverallAnalytics);

module.exports = router;
