const express = require("express");
const passport = require("passport");
const { googleAuth, logout } = require("../controllers/authController");

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), googleAuth);
router.post("/logout", logout);

module.exports = router;
