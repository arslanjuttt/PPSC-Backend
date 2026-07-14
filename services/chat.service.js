const GEMINI_API_KEY = 'AIzaSyCKP3EHmM0iSLpOLmnsxffBIU4EwWkT1M8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
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

async function generateChatReply(req) {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const { messages, files } = await parseRequest(req);

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

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(`Gemini API error: ${response.status}`);
    error.statusCode = 502;
    error.details = errData;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  if (!text) {
    const error = new Error('Empty response from Gemini');
    error.statusCode = 502;
    throw error;
  }

  return { text };
}

module.exports = {
  generateChatReply,
};
