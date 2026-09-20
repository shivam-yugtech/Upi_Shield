const express = require('express');
const { prisma } = require('../db');
const { detectScam } = require('../detection/detection');
const { parseBody, scanBodySchema } = require('../validation');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { messageText } = parseBody(scanBodySchema, req.body);

    const records = await prisma.threatPhrase.findMany({
      where: { status: 'ACTIVE' },
      select: { phrase: true },
    });

    const result = detectScam(
      messageText,
      records.map((row) => row.phrase)
    );

    const payload = {
      success: true,
      isScam: result.isScam,
      riskScore: result.riskScore,
      category: result.category,
      signals: result.signals,
      urlDetected: result.urlDetected,
    };

    if (result.isScam) {
      payload.reason = result.reason;
    } else {
      payload.message = result.message;
      if (result.riskScore > 0) {
        payload.reason = result.reason;
      }
    }

    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
