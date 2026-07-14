const express = require('express');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', chatController.generateChatReply);
router.post('/translate', chatController.translateToEnglish);

module.exports = router;
