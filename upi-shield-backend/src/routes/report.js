const express = require('express');
const { prisma } = require('../db');
const { parseBody, reportBodySchema } = require('../validation');

const router = express.Router();

function normalizePhrase(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

router.post('/', async (req, res, next) => {
  try {
    const { newScamPhrase } = parseBody(reportBodySchema, req.body);
    const phrase = normalizePhrase(newScamPhrase);

    const existingPhrase = await prisma.threatPhrase.findUnique({
      where: { phrase },
      select: { status: true },
    });

    if (existingPhrase?.status === 'ACTIVE') {
      return res.json({
        success: true,
        message: 'This phrase is already in the active threat list.',
      });
    }

    const existingReport = await prisma.scamReport.findUnique({
      where: { phrase },
      select: { status: true },
    });

    if (existingReport) {
      return res.json({
        success: true,
        message:
          existingReport.status === 'PENDING'
            ? 'This phrase was already submitted and is pending review.'
            : 'Report submitted for review.',
      });
    }

    await prisma.scamReport.create({
      data: {
        phrase,
        status: 'PENDING',
      },
    });

    return res.json({
      success: true,
      message: 'Report submitted for review.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
