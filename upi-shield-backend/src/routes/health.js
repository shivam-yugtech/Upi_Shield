const { prisma } = require('../db');

async function healthHandler(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
    });
  }
}

module.exports = { healthHandler };
