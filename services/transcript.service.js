const TRANSCRIPT_API_KEY = "sk_YhedrXSUSShi1S-hyq-QFjtoMXXxUcGdplYYzYrtq8E";
const TRANSCRIPT_API_URL = 'https://transcriptapi.com/api/v2/youtube/transcript';
const MAX_URL_LENGTH = 2048;
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function extractYouTubeVideoId(input) {
  const trimmed = input?.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' && url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id && YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
    }

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id && YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

function buildTranscriptText(data) {
  if (!data || typeof data !== 'object') return '';

  const response = data;
  if (response.error) {
    throw new Error(response.error);
  }

  const transcript = response.transcript ?? [];
  if (!Array.isArray(transcript) || transcript.length === 0) return '';

  return transcript
    .map((seg) => seg?.text?.trim())
    .filter((t) => Boolean(t))
    .join('\n\n');
}

async function generateVideoTranscript(url) {
  if (typeof url !== 'string' || !url.trim()) {
    const error = new Error('URL is required and must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  if (url.length > MAX_URL_LENGTH) {
    const error = new Error('URL is too long');
    error.statusCode = 400;
    throw error;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    const error = new Error('Please enter a valid YouTube video URL.');
    error.statusCode = 400;
    throw error;
  }

  if (!TRANSCRIPT_API_KEY) {
    const error = new Error('Transcript API key is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const apiUrl = new URL(TRANSCRIPT_API_URL);
  apiUrl.searchParams.set('video_url', url);
  apiUrl.searchParams.set('format', 'json');
  apiUrl.searchParams.set('language', 'en');
  apiUrl.searchParams.set('send_metadata', 'false');

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${TRANSCRIPT_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const error = new Error(errorText || 'Unable to fetch transcript from TranscriptAPI.');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const transcript = buildTranscriptText(data);

  if (!transcript) {
    const error = new Error('No transcript could be generated for this video.');
    error.statusCode = 404;
    throw error;
  }

  return transcript;
}

module.exports = {
  generateVideoTranscript,
};
