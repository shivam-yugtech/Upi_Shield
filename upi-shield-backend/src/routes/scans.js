const express = require('express');
const { getDb } = require('../get-db');
const { getScanById, listScans, submitScanFeedback } = require('../services/scans');
const {
  feedbackBodySchema,
  paginationQuerySchema,
  parseBody,
  parseQuery,
  scanIdSchema,
} = require('../validation');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = parseQuery(paginationQuerySchema, req.query);
    const result = await listScans(getDb(req), { page, limit });
    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = scanIdSchema.parse(req.params.id);
    const scan = await getScanById(getDb(req), id);
    return res.json({
      success: true,
      data: scan,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/feedback', async (req, res, next) => {
  try {
    const id = scanIdSchema.parse(req.params.id);
    const { feedback } = parseBody(feedbackBodySchema, req.body);
    await submitScanFeedback(getDb(req), id, feedback);
    return res.json({
      success: true,
      message: 'Feedback recorded successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
