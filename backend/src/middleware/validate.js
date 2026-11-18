const { BadRequestError } = require('../utils/errors');

// Usage: validate({ body: zodSchema, params: zodSchema, query: zodSchema })
module.exports = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'params', 'query']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key]);
    if (!result.success) return next(new BadRequestError('Validation failed', result.error.issues));
    req[key] = result.data;
  }
  next();
};
