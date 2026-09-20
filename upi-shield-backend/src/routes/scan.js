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

    if (result.isScam) {
      return res.json({
        success: true,
        isScam: true,
        reason: result.reason,
      });
    }

    const payload = {
      success: true,
      isScam: false,
      message: result.message,
    };

    if (result.urlDetected) {
      payload.urlDetected = true;
    }

    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
