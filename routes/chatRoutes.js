const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { accessChat, fetchChats } = require("../controllers/chatController");

// Create or access chat
router.post("/", protect, accessChat);

// Get user chats
router.get("/", protect, fetchChats);

module.exports = router;