const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { detectScam, extractUrls } = require('../src/detection/detection');
const { parseBody, scanBodySchema } = require('../src/validation');

const PHRASES = [
  'electricity bill',
  'account blocked',
  'lottery win',
  'kyc updated',
  'gift card',
  'part time job',
  'apk download',
];

describe('detectScam', () => {
  it('detects a known phrase', () => {
    const result = detectScam(
      'Pay your electricity bill now or the line will be cut.',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.match(result.reason, /electricity bill/);
  });

  it('detects phrases case-insensitively', () => {
    const result = detectScam('URGENT: KYC UPDATED required today', PHRASES);
    assert.equal(result.isScam, true);
    assert.equal(result.matchedPhrase, 'kyc updated');
  });

  it('does not flag a safe message', () => {
    const result = detectScam('Dinner at 8pm, I already paid via UPI.', PHRASES);
    assert.equal(result.isScam, false);
    assert.equal(result.message, 'No obvious scam indicators detected.');
    assert.equal(result.urlDetected, false);
  });

  it('does not treat a URL as automatically malicious', () => {
    const result = detectScam('See the receipt at https://example.com/pay', PHRASES);
    assert.equal(result.isScam, false);
    assert.equal(result.urlDetected, true);
    assert.ok(result.urls.includes('https://example.com/pay'));
    assert.match(result.message, /URL was detected/i);
  });

  it('extracts URLs separately from phrase detection', () => {
    const urls = extractUrls('Open http://files.example/app.apk then wait');
    assert.deepEqual(urls, ['http://files.example/app.apk']);

    const withoutPhrase = detectScam('Open http://files.example/app.apk then wait', PHRASES);
    assert.equal(withoutPhrase.isScam, false);
    assert.equal(withoutPhrase.urlDetected, true);
  });

  it('still flags a phrase when a URL is also present', () => {
    const result = detectScam(
      'Your account blocked. Download https://evil.example/update.apk',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.matchedPhrase, 'account blocked');
    assert.equal(result.urlDetected, true);
  });

  it('avoids obvious substring false positives', () => {
    const giftCard = detectScam('Please send a gift card code immediately.', PHRASES);
    assert.equal(giftCard.isScam, true);

    const giftCardsPlural = detectScam('She collected several gift cards for her birthday.', PHRASES);
    assert.equal(giftCardsPlural.isScam, false);

    const lotteryWindow = detectScam('The lottery window closes tomorrow.', PHRASES);
    assert.equal(lotteryWindow.isScam, false);

    const winner = detectScam('He is a lottery winner at the office raffle.', PHRASES);
    assert.equal(winner.isScam, false);

    const downloaded = detectScam('The apk downloaded overnight from Play Store.', PHRASES);
    assert.equal(downloaded.isScam, false);
  });
});

describe('scan input validation', () => {
  it('rejects empty input', () => {
    assert.throws(
      () => parseBody(scanBodySchema, { messageText: '   ' }),
      (err) => err.name === 'ValidationError' && /No message text provided/.test(err.message)
    );
  });

  it('rejects missing messageText', () => {
    assert.throws(
      () => parseBody(scanBodySchema, {}),
      (err) => err.status === 400
    );
  });

  it('rejects non-string messageText', () => {
    assert.throws(
      () => parseBody(scanBodySchema, { messageText: 12 }),
      (err) => /must be a string/.test(err.message)
    );
  });

  it('rejects oversized messageText', () => {
    assert.throws(
      () => parseBody(scanBodySchema, { messageText: 'a'.repeat(5001) }),
      (err) => /5000/.test(err.message)
    );
  });
});
