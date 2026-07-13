const normalizeUrl = (url) => (url ? url.replace(/\/$/, '') : '');

const CLIENT_URL_LOCAL = normalizeUrl(process.env.CLIENT_URL_LOCAL || 'http://localhost:3000');
const CLIENT_URL_PRODUCTION = normalizeUrl(process.env.CLIENT_URL_PRODUCTION || '');

const getClientUrl = () => {
  if (process.env.NODE_ENV === 'production' && CLIENT_URL_PRODUCTION) {
    return CLIENT_URL_PRODUCTION;
  }
  return CLIENT_URL_LOCAL;
};

const getAllowedOrigins = () => {
  const origins = new Set([CLIENT_URL_LOCAL]);

  if (CLIENT_URL_PRODUCTION) {
    origins.add(CLIENT_URL_PRODUCTION);
  }

  if (process.env.CLIENT_URL) {
    origins.add(normalizeUrl(process.env.CLIENT_URL));
  }

  return [...origins];
};

module.exports = {
  CLIENT_URL_LOCAL,
  CLIENT_URL_PRODUCTION,
  getClientUrl,
  getAllowedOrigins,
};
