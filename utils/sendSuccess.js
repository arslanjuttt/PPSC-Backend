const sendSuccess = (res, statusCode, payload = {}) => {
  res.status(statusCode).json({ success: true, ...payload });
};

module.exports = sendSuccess;
