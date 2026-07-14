const express = require('express');
const transcriptController = require('../controllers/transcript.controller');

const router = express.Router();

router.post('/', transcriptController.generateVideoTranscript);

module.exports = router;
