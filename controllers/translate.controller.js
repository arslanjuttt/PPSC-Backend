const asyncHandler = require('../utils/asyncHandler');
const deeplService = require('../services/deepl.service');

const translateTranscriptToEnglish = asyncHandler(async (req, res) => {
  const text = req.body?.text;

  const translatedText = await deeplService.translateToEnglish(text, {
    // Let DeepL auto-detect source language
    sourceLang: undefined,
  });

  res.status(200).json({ translatedText });
});

module.exports = {
  translateTranscriptToEnglish,
};

