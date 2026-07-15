const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

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

function normalizeFileName(file = {}) {
  const name = file?.originalname || file?.name || '';
  return typeof name === 'string' ? name : String(name ?? '');
}

function normalizeMimeType(file = {}) {
  const mime = file?.mimetype || file?.type || '';
  return typeof mime === 'string' ? mime.toLowerCase() : String(mime ?? '').toLowerCase();
}

async function parseRequest(req) {
  const contentType = req.headers['content-type'] || '';
  if (typeof contentType === 'string' && contentType.includes('multipart/form-data')) {
    const body = req.body || {};
    const rawMessages = body.messages;
    let messages = [];

    if (typeof rawMessages === 'string') {
      try {
        messages = JSON.parse(rawMessages);
      } catch (error) {
        messages = [];
      }
    } else if (Array.isArray(rawMessages)) {
      messages = rawMessages;
    }

    const uploadedFiles = req.files?.files || req.files || [];
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles].filter(Boolean);

    return { messages, files };
  }

  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  return { messages, files: [] };
}

async function fileToBuffer(file) {
  if (file?.buffer) {
    return Buffer.from(file.buffer);
  }
  if (typeof file?.arrayBuffer === 'function') {
    return Buffer.from(await file.arrayBuffer());
  }
  return Buffer.from([]);
}

async function fileToBase64(file) {
  const buffer = await fileToBuffer(file);
  return { mimeType: normalizeMimeType(file), data: buffer.toString('base64') };
}

async function extractTextFromTxt(file) {
  const buffer = await fileToBuffer(file);
  return buffer.toString('utf-8').trim();
}

async function extractTextFromPdf(file) {
  const buffer = await fileToBuffer(file);
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data && typeof data === 'object' && 'text' in data ? data.text : '';
    return typeof text === 'string' ? text.trim() : '';
  } catch (e) {
    console.warn('PDF parse failed for', normalizeFileName(file), e);
    return '';
  }
}

async function extractTextFromFile(file) {
  const mime = normalizeMimeType(file);
  const fileName = normalizeFileName(file);
  if (mime === PDF_MIME) return extractTextFromPdf(file);
  if (mime === TXT_MIME || fileName.toLowerCase().endsWith('.txt')) return extractTextFromTxt(file);
  return '';
}

async function callGroq(messages) {
  if (!process.env.GROQ_API_KEY) {
    logChatEvent('groq-key-missing');
    const error = new Error('Groq API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  logChatEvent('groq-request-started', {
    model: GROQ_MODEL,
    messageCount: Array.isArray(messages) ? messages.length : 0,
  });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_completion_tokens: 1024,
  });

  if (!completion?.choices?.[0]?.message?.content) {
    const error = new Error('Empty response from Groq');
    error.statusCode = 502;
    throw error;
  }

  logChatEvent('groq-response-success', {
    model: completion.model || GROQ_MODEL,
    choiceCount: completion.choices?.length || 0,
  });

  return completion.choices[0].message.content.trim();
}

async function generateChatReply(req) {
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

  const requestMessages = messages.map((m) => ({
    role: ['user', 'assistant', 'system'].includes(m.role) ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
  }));

  if (files && files.length > 0) {
    const lastMessage = requestMessages[requestMessages.length - 1];
    if (lastMessage?.role === 'user') {
      const textFiles = files.filter((f) => {
        const mime = normalizeMimeType(f);
        const fileName = normalizeFileName(f);
        return mime === PDF_MIME || mime === TXT_MIME || fileName.toLowerCase().endsWith('.txt');
      });
      if (textFiles.length > 0) {
        const extracted = [];
        for (const f of textFiles) {
          const text = await extractTextFromFile(f);
          if (text) extracted.push(`[Content from ${normalizeFileName(f)}]:\n${text}`);
        }
        if (extracted.length > 0) {
          const appended = extracted.join('\n\n---\n\n');
          const existingText = lastMessage.content ?? '';
          lastMessage.content = existingText ? `${existingText}\n\n${appended}` : appended;
        }
      }

      const imageFiles = files.filter((f) => IMAGE_MIMES.includes(normalizeMimeType(f)));
      if (imageFiles.length > 0) {
        const imageDescriptions = await Promise.all(
          imageFiles.map(async (f) => {
            const base64 = await fileToBase64(f);
            return `[Image attachment: ${normalizeFileName(f)}, mime: ${base64.mimeType}, data: ${base64.data}]`;
          })
        );
        const appended = imageDescriptions.join('\n\n');
        lastMessage.content = lastMessage.content ? `${lastMessage.content}\n\n${appended}` : appended;
      }
    }
  }

  const groqMessages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...requestMessages,
  ];

  logChatEvent('chat-prompt-prepared', {
    messageRoles: groqMessages.map((item) => item.role),
    lastMessageLength: groqMessages[groqMessages.length - 1]?.content?.length || 0,
  });

  const text = await callGroq(groqMessages);

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
  const translated = await callGroq([
    { role: 'system', content: SYSTEM_INSTRUCTION },
    { role: 'user', content: prompt },
  ]);
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
