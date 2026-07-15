const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
const OPENAI_API_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const CHAT_PROVIDER = (process.env.CHAT_PROVIDER || 'auto').toLowerCase();

function logChatEvent(message, details = {}) {
  console.log(`[chat-api] ${message}`, JSON.stringify(details));
}
const SYSTEM_INSTRUCTION = `You are a helpful PPSC (Punjab Public Service Commission) exam preparation assistant. You help students with:
- PPSC exam structure, syllabus, and stages (written exam, interview)
- Study strategies, time management, and revision tips
- Subject explanations: Pakistan Affairs, Islamiat, English, General Knowledge, Current Affairs, etc.
- Practice tips and how to use mock tests effectively
- Motivation and exam-day advice

Keep answers clear, concise, and relevant to PPSC preparation. Use markdown **bold** for emphasis when helpful. Be friendly and encouraging.`;

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PDF_MIME = 'application/pdf';
const TXT_MIME = 'text/plain';

async function parseRequest(req) {
  const contentType = req.headers['content-type'] || '';
  if (typeof contentType === 'string' && contentType.includes('multipart/form-data')) {
    const formData = req.body;
    const messagesJson = formData?.messages;
    const messages = messagesJson ? JSON.parse(messagesJson) : [];
    const files = Array.isArray(formData?.files) ? formData.files : [];
    return { messages, files };
  }

  const body = req.body || {};
  const messages = body.messages || [];
  return { messages, files: [] };
}

async function fileToBase64(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return { mimeType: file.type, data: buffer.toString('base64') };
}

async function extractTextFromTxt(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString('utf-8').trim();
}

async function extractTextFromPdf(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data && typeof data === 'object' && 'text' in data ? data.text : '';
    return typeof text === 'string' ? text.trim() : '';
  } catch (e) {
    console.warn('PDF parse failed for', file.name, e);
    return '';
  }
}

async function extractTextFromFile(file) {
  if (file.type === PDF_MIME) return extractTextFromPdf(file);
  if (file.type === TXT_MIME || file.name.toLowerCase().endsWith('.txt')) return extractTextFromTxt(file);
  return '';
}

function resolveChatProvider() {
  if (CHAT_PROVIDER === 'openai') return 'openai';
  if (CHAT_PROVIDER === 'gemini') return 'gemini';
  return OPENAI_API_KEY ? 'openai' : 'gemini';
}

function getApiKeyForProvider(provider) {
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || OPENAI_API_KEY;
  }
  return process.env.GEMINI_API_KEY || GEMINI_API_KEY;
}

async function callGemini(prompt, apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY) {
  if (!apiKey) {
    logChatEvent('gemini-key-missing');
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  logChatEvent('gemini-request-started', {
    keySource: process.env.GEMINI_API_KEY ? 'env' : 'code',
    keyPreview: apiKey.slice(0, 8) + '...',
    promptLength: prompt.length,
  });

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    logChatEvent('gemini-response-error', {
      status: response.status,
      errorData: errData,
    });

    const message = errData?.error?.message || 'Gemini API request failed.';
    const isQuotaError = response.status === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('exceeded');

    const error = new Error(
      isQuotaError
        ? 'Gemini API quota has been exceeded. Please wait a while and try again later.'
        : `Gemini API error: ${response.status}`
    );
    error.statusCode = isQuotaError ? 429 : 502;
    error.details = errData;
    throw error;
  }

  const data = await response.json();
  logChatEvent('gemini-response-success', {
    status: response.status,
    candidateCount: data.candidates?.length || 0,
    finishReason: data.candidates?.[0]?.finishReason || null,
  });
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  if (!text) {
    const error = new Error('Empty response from Gemini');
    error.statusCode = 502;
    throw error;
  }

  return text;
}

async function callOpenAI(prompt, apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || OPENAI_API_KEY) {
  if (!apiKey) {
    logChatEvent('openai-key-missing');
    const error = new Error('OpenAI API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  logChatEvent('openai-request-started', {
    keySource: process.env.OPENAI_API_KEY ? 'env' : (process.env.OPENAI_KEY ? 'env' : 'code'),
    keyPreview: apiKey.slice(0, 8) + '...',
    promptLength: prompt.length,
    model: OPENAI_MODEL,
  });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    logChatEvent('openai-response-error', {
      status: response.status,
      errorData: errData,
    });

    const message = errData?.error?.message || 'OpenAI API request failed.';
    const error = new Error(message);
    error.statusCode = response.status === 429 ? 429 : 502;
    error.details = errData;
    throw error;
  }

  const data = await response.json();
  logChatEvent('openai-response-success', {
    status: response.status,
    model: data.model || OPENAI_MODEL,
  });

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    const error = new Error('Empty response from OpenAI');
    error.statusCode = 502;
    throw error;
  }

  return text;
}

async function callChatProvider(prompt, providerOverride = null) {
  const provider = providerOverride || resolveChatProvider();
  logChatEvent('chat-provider-selected', { provider });

  if (provider === 'openai') {
    return callOpenAI(prompt, getApiKeyForProvider('openai'));
  }

  return callGemini(prompt, getApiKeyForProvider('gemini'));
}

async function generateChatReply(req) {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const { messages, files } = await parseRequest(req);
  logChatEvent('chat-request-received', {
    contentType: req.headers['content-type'] || 'unknown',
    messageCount: Array.isArray(messages) ? messages.length : 0,
    fileCount: Array.isArray(files) ? files.length : 0,
  });

  if (!Array.isArray(messages) || messages.length === 0) {
    const error = new Error('messages array is required and must not be empty');
    error.statusCode = 400;
    throw error;
  }

  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  if (files && files.length > 0) {
    const lastContent = contents[contents.length - 1];
    if (lastContent?.role === 'user' && lastContent.parts[0]) {
      const textFiles = files.filter(
        (f) => f.type === PDF_MIME || f.type === TXT_MIME || f.name.toLowerCase().endsWith('.txt')
      );
      if (textFiles.length > 0) {
        const extracted = [];
        for (const f of textFiles) {
          const text = await extractTextFromFile(f);
          if (text) extracted.push(`[Content from ${f.name}]:\n${text}`);
        }
        if (extracted.length > 0) {
          const appended = extracted.join('\n\n---\n\n');
          const existingText = lastContent.parts[0].text ?? '';
          lastContent.parts[0].text = existingText ? `${existingText}\n\n${appended}` : appended;
        }
      }

      const imageFiles = files.filter((f) => IMAGE_MIMES.includes(f.type));
      if (imageFiles.length > 0) {
        const imageParts = await Promise.all(
          imageFiles.map((f) => fileToBase64(f).then((b) => ({ inlineData: b })))
        );
        lastContent.parts = [...lastContent.parts, ...imageParts];
      }
    }
  }

  logChatEvent('chat-prompt-prepared', {
    messageRoles: contents.map((item) => item.role),
    lastMessageLength: contents[contents.length - 1]?.parts?.[0]?.text?.length || 0,
  });

  const text = await callChatProvider(
    JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })
  );

  return { text };
}

async function translateToEnglish(text) {
  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Text to translate is required.');
    error.statusCode = 400;
    throw error;
  }

  logChatEvent('translation-request-received', {
    textLength: text.length,
  });

  const prompt = `Translate the following transcript fully and accurately into natural, fluent English. Output ONLY the translated English text. Do not include explanations, headings, or any text in the source language. Do not summarize. Preserve meaning and paragraph breaks.\n\n${text}`;
  const translated = await callChatProvider(prompt);
  const cleaned = translated
    .replace(/^Here(?:'s| is)?\s+the\s+.*?translation.*?:\s*/i, '')
    .replace(/^English\s+translation:?\s*/i, '')
    .replace(/^Translation:?\s*/i, '')
    .trim();
  return { translatedText: cleaned };
}

module.exports = {
  generateChatReply,
  translateToEnglish,
};
