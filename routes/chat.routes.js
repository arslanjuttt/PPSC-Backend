const express = require('express');
const multer = require('multer');
const chatController = require('../controllers/chat.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', upload.fields([{ name: 'files', maxCount: 10 }]), chatController.generateChatReply);
router.post('/translate', chatController.translateToEnglish);

module.exports = router;
