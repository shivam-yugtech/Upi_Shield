const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = '*';

const { app } = require('../src/app');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('API validation (no database required)', () => {
  it('rejects empty scan bodies with 400', async () => {
    const response = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText: '  ' }),
    });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.match(data.error, /No message text provided/);
  });

  it('rejects empty report bodies with 400', async () => {
    const response = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newScamPhrase: '' }),
    });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  it('rejects malformed JSON with 400', async () => {
    const response = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Malformed JSON/i);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/missing`);
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.error, 'Not found.');
  });
});
