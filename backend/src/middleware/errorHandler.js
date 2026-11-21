const logger = require('../utils/logger');

exports.notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (err, _req, res, _next) => {
  // Multer throws its own error type (e.g. LIMIT_FILE_SIZE) rather than an AppError.
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload rejected: ${err.message}` });
  }

  const status = err.statusCode || 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({
    message: err.isOperational ? err.message : 'Internal server error',
    ...(err.details && { details: err.details }),
  });
};
