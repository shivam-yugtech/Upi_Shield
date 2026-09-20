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

module.exports = {
  scanBodySchema,
  reportBodySchema,
  parseBody,
};
