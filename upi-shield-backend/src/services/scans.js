const crypto = require('node:crypto');
const { HttpError } = require('../httpError');

function hashMessage(messageText) {
  return crypto.createHash('sha256').update(messageText).digest('hex');
}

function publicScan(scan) {
  return {
    id: scan.id,
    isScam: scan.isScam,
    riskScore: scan.riskScore,
    category: scan.category,
    signals: scan.signals,
    reason: scan.reason,
    urlDetected: scan.urlDetected,
    createdAt: scan.createdAt,
  };
}

async function persistScan(prisma, messageText, result) {
  try {
    const created = await prisma.scan.create({
      data: {
        messageHash: hashMessage(messageText),
        messageText,
        isScam: result.isScam,
        riskScore: result.riskScore,
        category: result.category,
        signals: result.signals,
        reason: result.reason || result.message || 'No obvious scam indicators detected.',
        urlDetected: Boolean(result.urlDetected),
      },
    });
    return publicScan(created);
  } catch {
    throw new HttpError(503, 'Could not save the scan result.');
  }
}

async function listScans(prisma, { page, limit }) {
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        isScam: true,
        riskScore: true,
        category: true,
        signals: true,
        reason: true,
        urlDetected: true,
        createdAt: true,
      },
    }),
    prisma.scan.count(),
  ]);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getScanById(prisma, id) {
  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      isScam: true,
      riskScore: true,
      category: true,
      signals: true,
      reason: true,
      urlDetected: true,
      createdAt: true,
    },
  });

  if (!scan) {
    throw new HttpError(404, 'Scan not found.');
  }

  return scan;
}

async function submitScanFeedback(prisma, scanId, feedback) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { id: true },
  });

  if (!scan) {
    throw new HttpError(404, 'Scan not found.');
  }

  const existing = await prisma.scanFeedback.findUnique({
    where: { scanId },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, 'Feedback already recorded for this scan.');
  }

  await prisma.scanFeedback.create({
    data: { scanId, feedback },
  });
}

module.exports = {
  hashMessage,
  publicScan,
  persistScan,
  listScans,
  getScanById,
  submitScanFeedback,
};
