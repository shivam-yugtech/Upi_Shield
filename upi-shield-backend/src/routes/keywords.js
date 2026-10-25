const express = require('express');
const { getDb } = require('../get-db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const records = await getDb(req).threatPhrase.findMany({
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
