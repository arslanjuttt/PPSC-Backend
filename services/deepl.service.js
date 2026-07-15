const deepl = require('deepl-node');

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || "de202b17-fe0c-4736-b576-3bd59feb1ec9:fx";

function requireKey() {
  if (!DEEPL_API_KEY) {
    const error = new Error('DeepL API key is not configured (DEEPL_API_KEY).');
    error.statusCode = 500;
    throw error;
  }
}

async function translateToEnglish(text, { sourceLang = undefined } = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Text to translate is required.');
    error.statusCode = 400;
    throw error;
  }

  requireKey();

  const translator = new deepl.Translator(DEEPL_API_KEY);

  // DeepL accepts target like 'EN-US'.
  // Use EN-US to meet requirement.
  // deepl-node requires sourceLang to be either a valid language code or omitted/left undefined.
  // Passing `undefined` explicitly can trigger SDK validation errors in some versions.
  const result = await translator.translateText(text, sourceLang ?? null, 'EN-US');

  return result?.text || '';
}

module.exports = {
  translateToEnglish,
};

