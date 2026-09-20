const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.name || 'Error', err.message);
  }

  if (err.name === 'ValidationError' || err instanceof ZodError) {
    const message =
      err instanceof ZodError
        ? err.issues[0]?.message || 'Invalid request.'
        : err.message;
    return res.status(400).json({ success: false, error: message });
  }

  if (err.name === 'HttpError' && err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return res.status(400).json({ success: false, error: 'Malformed JSON.' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body is too large.' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'This record already exists.' });
    }
    return res.status(503).json({ success: false, error: 'Database request failed.' });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({ success: false, error: 'Database unavailable.' });
  }

  const status = Number(err.status) >= 400 ? Number(err.status) : 500;
  const message =
    process.env.NODE_ENV === 'production' || status >= 500
      ? status >= 500
        ? 'Internal server error.'
        : err.message || 'Request failed.'
      : err.message || 'Internal server error.';

  return res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = { errorHandler };
