const express = require("express");
const router = express.Router();
const urlController = require("../controllers/urlController"); 

const authMiddleware = require("../middlewares/authMiddleware");
//console.log(urlController);
router.post("/shorten", urlController.shortenUrl); 
router.get("/r/:alias", urlController.redirectUrl); 

module.exports = router;
