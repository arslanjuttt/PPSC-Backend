const express = require('express');
const translateController = require('../controllers/translate.controller');

const router = express.Router();

// Translate transcript to English
router.post('/transcript', translateController.translateTranscriptToEnglish);

module.exports = router;

