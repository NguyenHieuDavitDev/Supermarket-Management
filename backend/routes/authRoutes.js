const express = require("express");
const { login, logout, checkAuth } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/check", authMiddleware, checkAuth);

module.exports = router;
