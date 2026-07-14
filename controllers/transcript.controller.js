const asyncHandler = require('../utils/asyncHandler');
const sendSuccess = require('../utils/sendSuccess');
const transcriptService = require('../services/transcript.service');

const generateVideoTranscript = asyncHandler(async (req, res) => {
  const transcript = await transcriptService.generateVideoTranscript(req.body?.url);
  sendSuccess(res, 200, {
    message: 'Transcript generated successfully',
    transcript,
  });
});

module.exports = {
  generateVideoTranscript,
};
