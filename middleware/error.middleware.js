const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An error occurred!';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { error: err.stack }),
  });
};

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
