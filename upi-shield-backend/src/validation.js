const { z } = require('zod');

const scanBodySchema = z
  .object({
    messageText: z
      .string({
        required_error: 'No message text provided.',
        invalid_type_error: 'Message text must be a string.',
      })
      .trim()
      .min(1, 'No message text provided.')
      .max(5000, 'Message text must be at most 5000 characters.'),
  })
  .strict();

const reportBodySchema = z
  .object({
    newScamPhrase: z
      .string({
        required_error: 'Report text cannot be empty.',
        invalid_type_error: 'Report text must be a string.',
      })
      .trim()
      .min(3, 'Report text must be at least 3 characters.')
      .max(200, 'Report text must be at most 200 characters.'),
  })
  .strict();

const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number.' })
    .int('page must be an integer.')
    .min(1, 'page must be at least 1.')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit must be a number.' })
    .int('limit must be an integer.')
    .min(1, 'limit must be at least 1.')
    .max(50, 'limit cannot exceed 50.')
    .default(20),
});

const scanIdSchema = z
  .string()
  .trim()
  .min(1, 'Scan id is required.')
  .max(64, 'Scan id is invalid.');

const feedbackBodySchema = z
  .object({
    feedback: z.enum(['FALSE_POSITIVE', 'CONFIRMED_SCAM', 'UNSURE'], {
      required_error: 'Feedback is required.',
      invalid_type_error: 'Feedback must be FALSE_POSITIVE, CONFIRMED_SCAM, or UNSURE.',
    }),
  })
  .strict();

function parseBody(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const message = result.error.issues[0]?.message || 'Invalid request.';
    const error = new Error(message);
    error.status = 400;
    error.name = 'ValidationError';
    throw error;
  }
  return result.data;
}

function parseQuery(schema, query) {
  return parseBody(schema, query);
}

module.exports = {
  scanBodySchema,
  reportBodySchema,
  paginationQuerySchema,
  scanIdSchema,
  feedbackBodySchema,
  parseBody,
  parseQuery,
};
