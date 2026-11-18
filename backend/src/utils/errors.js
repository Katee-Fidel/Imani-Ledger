class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}
class BadRequestError extends AppError { constructor(m = 'Bad request', d) { super(m, 400, d); } }
class UnauthorizedError extends AppError { constructor(m = 'Unauthorized') { super(m, 401); } }
class ForbiddenError extends AppError { constructor(m = 'Forbidden') { super(m, 403); } }
class NotFoundError extends AppError { constructor(m = 'Not found') { super(m, 404); } }

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError };
