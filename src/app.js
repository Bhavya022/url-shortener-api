require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authMiddleware = require("./middlewares/authMiddleware");
const rateLimiter = require("./middlewares/rateLimiter");
const connectDB = require("./config/db");
const app = express();
const passport = require("passport");
require("./config/passport");
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL })); 
app.use(helmet()); 
app.use(morgan("dev")); 
app.use(cookieParser());
connectDB();
app.get("/", (req, res) => {
  res.send("Welcome to the URL Shortener API!");
});
app.use("/api/auth", authRoutes);
app.use("/api/url", authMiddleware.authenticate, urlRoutes);
app.use("/api/analytics", authMiddleware.authenticate, rateLimiter, analyticsRoutes);
app.get("/", (req, res) => {
  res.send("URL Shortener API is Running 🚀");
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
