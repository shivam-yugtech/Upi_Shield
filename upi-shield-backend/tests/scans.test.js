const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = '*';

const { createApp } = require('../src/app');

const PHRASES = [
  'electricity bill',
  'account blocked',
  'lottery win',
  'kyc updated',
  'gift card',
  'part time job',
  'apk download',
];

function createMemoryPrisma() {
  const scans = [];
  const feedback = [];
  let seq = 0;

  function nextId() {
    seq += 1;
    return `memscan${String(seq).padStart(12, '0')}`;
  }

  function pick(row, select) {
    if (!select) {
      return row;
    }
    const out = {};
    for (const key of Object.keys(select)) {
      if (select[key]) {
        out[key] = row[key];
      }
    }
    return out;
  }

  return {
    threatPhrase: {
      findMany: async () => PHRASES.map((phrase) => ({ phrase, status: 'ACTIVE' })),
    },
    scan: {
      create: async ({ data }) => {
        const row = {
          id: nextId(),
          createdAt: new Date(Date.now() + seq),
          ...data,
        };
        scans.push(row);
        return row;
      },
      findMany: async ({ skip = 0, take = 20, select } = {}) => {
        const sorted = [...scans].sort((a, b) => b.createdAt - a.createdAt);
        return sorted.slice(skip, skip + take).map((row) => pick(row, select));
      },
      count: async () => scans.length,
      findUnique: async ({ where, select }) => {
        const row = scans.find((item) => item.id === where.id) || null;
        return row ? pick(row, select) : null;
      },
    },
    scanFeedback: {
      findUnique: async ({ where }) =>
        feedback.find((item) => item.scanId === where.scanId) || null,
      create: async ({ data }) => {
        const row = { id: nextId(), createdAt: new Date(), ...data };
        feedback.push(row);
        return row;
      },
    },
    $queryRaw: async () => [{ ok: 1 }],
  };
}

const app = createApp({ prisma: createMemoryPrisma() });

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

async function scan(messageText) {
  const response = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageText }),
  });
  return { status: response.status, data: await response.json() };
}

describe('scan persistence and history (in-memory Prisma, not production DB)', () => {
  it('persists a scan and keeps existing scan fields', async () => {
    const { status, data } = await scan('Dinner at 8pm, I already paid via UPI.');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.isScam, false);
    assert.equal(typeof data.id, 'string');
    assert.equal(data.riskScore, 0);
    assert.equal(data.category, 'SAFE');
    assert.equal(Object.prototype.hasOwnProperty.call(data, 'messageText'), false);
  });

  it('returns recent scans without messageText', async () => {
    await scan('Share your OTP to receive refund');
    const response = await fetch(`${baseUrl}/api/scans?page=1&limit=20`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 1);
    assert.equal(Object.prototype.hasOwnProperty.call(body.data[0], 'messageText'), false);
    assert.ok(body.data[0].createdAt);
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.limit, 20);
  });

  it('paginates newest first and rejects limit above 50', async () => {
    await scan('Visit https://example.com');
    await scan('Pay your electricity bill now or the line will be cut.');

    const page1 = await (await fetch(`${baseUrl}/api/scans?page=1&limit=2`)).json();
    const page2 = await (await fetch(`${baseUrl}/api/scans?page=2&limit=2`)).json();
    assert.equal(page1.data.length, 2);
    assert.ok(page2.data.length >= 1);
    assert.notEqual(page1.data[0].id, page2.data[0].id);

    const tooBig = await fetch(`${baseUrl}/api/scans?limit=51`);
    assert.equal(tooBig.status, 400);
  });

  it('rejects invalid pagination', async () => {
    const page = await fetch(`${baseUrl}/api/scans?page=0`);
    assert.equal(page.status, 400);
    const limit = await fetch(`${baseUrl}/api/scans?limit=0`);
    assert.equal(limit.status, 400);
  });

  it('returns a scan by id and 404 for unknown ids', async () => {
    const created = await scan('See the receipt at https://example.com/pay');
    const found = await fetch(`${baseUrl}/api/scans/${created.data.id}`);
    assert.equal(found.status, 200);
    const body = await found.json();
    assert.equal(body.data.id, created.data.id);
    assert.equal(Object.prototype.hasOwnProperty.call(body.data, 'messageText'), false);

    const missing = await fetch(`${baseUrl}/api/scans/does-not-exist-scan`);
    assert.equal(missing.status, 404);
  });

  it('records FALSE_POSITIVE, CONFIRMED_SCAM, and UNSURE feedback', async () => {
    const a = await scan('I will make the payment for groceries after I get home.');
    const b = await scan('I start my library job on Monday.');
    const c = await scan('Hello there, see you at 5.');

    const fp = await fetch(`${baseUrl}/api/scans/${a.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'FALSE_POSITIVE' }),
    });
    assert.equal(fp.status, 200);
    assert.equal((await fp.json()).message, 'Feedback recorded successfully.');

    const cs = await fetch(`${baseUrl}/api/scans/${b.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'CONFIRMED_SCAM' }),
    });
    assert.equal(cs.status, 200);

    const uns = await fetch(`${baseUrl}/api/scans/${c.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'UNSURE' }),
    });
    assert.equal(uns.status, 200);
  });

  it('rejects invalid feedback and duplicate feedback', async () => {
    const created = await scan('Another ordinary grocery reminder.');
    const invalid = await fetch(`${baseUrl}/api/scans/${created.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'NOT_A_VALUE' }),
    });
    assert.equal(invalid.status, 400);

    await fetch(`${baseUrl}/api/scans/${created.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'UNSURE' }),
    });
    const dup = await fetch(`${baseUrl}/api/scans/${created.data.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'UNSURE' }),
    });
    assert.equal(dup.status, 409);
  });
});
