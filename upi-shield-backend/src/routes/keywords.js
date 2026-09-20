const express = require('express');
const { prisma } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const records = await prisma.threatPhrase.findMany({
      where: { status: 'ACTIVE' },
      select: { phrase: true },
      orderBy: { phrase: 'asc' },
    });

    return res.json({
      success: true,
      keywords: records.map((row) => row.phrase),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
