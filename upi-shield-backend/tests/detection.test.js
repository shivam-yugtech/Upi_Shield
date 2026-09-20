const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { detectScam } = require('../src/detection/detection');
const { extractUrlStrings, inspectUrl } = require('../src/detection/urlAnalyzer');
const { CATEGORIES } = require('../src/detection/rules');
const { SCAM_THRESHOLD, capScore } = require('../src/detection/scoring');
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

describe('detectScam structured engine', () => {
  it('treats a safe normal message as SAFE with score 0', () => {
    const result = detectScam('Dinner at 8pm, I already paid via UPI.', PHRASES);
    assert.equal(result.isScam, false);
    assert.equal(result.riskScore, 0);
    assert.equal(result.category, CATEGORIES.SAFE);
    assert.deepEqual(result.signals, []);
    assert.equal(result.urlDetected, false);
    assert.equal(result.message, 'No obvious scam indicators detected.');
  });

  it('detects the electricity bill threat phrase', () => {
    const result = detectScam(
      'Pay your electricity bill now or the line will be cut.',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.ok(result.riskScore >= SCAM_THRESHOLD);
    assert.equal(result.category, CATEGORIES.UTILITY_BILL_SCAM);
    assert.ok(result.signals.some((signal) => /electricity bill/.test(signal)));
    assert.equal(result.matchedPhrase, 'electricity bill');
  });

  it('detects phrases case-insensitively', () => {
    const result = detectScam('URGENT: KYC UPDATED required today', PHRASES);
    assert.equal(result.isScam, true);
    assert.equal(result.matchedPhrase, 'kyc updated');
  });

  it('flags KYC plus urgency as KYC phishing', () => {
    const result = detectScam(
      'KYC update immediately or your account will be blocked.',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.KYC_PHISHING);
    assert.ok(result.signals.some((signal) => /KYC/i.test(signal)));
    assert.ok(result.signals.some((signal) => /urgent/i.test(signal)));
    assert.ok(result.riskScore >= SCAM_THRESHOLD);
  });

  it('flags an OTP request as credential theft', () => {
    const result = detectScam('Share your OTP to receive refund', PHRASES);
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.OTP_CREDENTIAL_SCAM);
    assert.ok(result.riskScore >= SCAM_THRESHOLD);
  });

  it('flags a UPI payment request', () => {
    const result = detectScam(
      'Scan this QR code and send payment immediately',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.UPI_PAYMENT_SCAM);
  });

  it('flags APK install language', () => {
    const result = detectScam(
      'Install this APK to receive cashback',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.APK_MALWARE);
  });

  it('flags lottery/reward claim language', () => {
    const result = detectScam(
      'Congratulations, you won a lottery prize',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.LOTTERY_REWARD_SCAM);
  });

  it('flags a job scam that asks for a registration fee', () => {
    const result = detectScam(
      'Earn money from a part time job, pay registration fee',
      PHRASES
    );
    assert.equal(result.isScam, true);
    assert.equal(result.category, CATEGORIES.JOB_SCAM);
  });

  it('does not automatically flag a normal job conversation', () => {
    const result = detectScam(
      'I start my library job on Monday and the offer letter looks fine.',
      PHRASES
    );
    assert.equal(result.isScam, false);
    assert.ok(result.riskScore < SCAM_THRESHOLD);
    assert.equal(result.category, CATEGORIES.SAFE);
  });

  it('does not automatically flag a normal payment conversation', () => {
    const result = detectScam(
      'I will make the payment for groceries after I get home.',
      PHRASES
    );
    assert.equal(result.isScam, false);
    assert.equal(result.category, CATEGORIES.SAFE);
    assert.equal(result.riskScore, 0);
  });

  it('does not treat a normal URL as a scam', () => {
    const result = detectScam('See the receipt at https://example.com/pay', PHRASES);
    assert.equal(result.isScam, false);
    assert.equal(result.urlDetected, true);
    assert.ok(result.urls.includes('https://example.com/pay'));
    assert.ok(result.riskScore < SCAM_THRESHOLD);
    assert.equal(result.category, CATEGORIES.SAFE);
  });

  it('adds risk for a raw IP URL without auto-classifying as scam', () => {
    const result = detectScam('Open http://192.168.10.25/verify-kyc now', []);
    assert.equal(result.urlDetected, true);
    assert.equal(result.isScam, false);
    assert.ok(result.riskScore >= 30);
    assert.ok(result.riskScore < SCAM_THRESHOLD);
    assert.equal(result.category, CATEGORIES.SUSPICIOUS_MESSAGE);
    assert.ok(result.signals.some((signal) => /IP/i.test(signal)));
  });

  it('adds risk for a punycode URL', () => {
    const result = detectScam(
      'Visit http://xn--80ak6aa92e.com/login to continue',
      []
    );
    assert.equal(result.urlDetected, true);
    assert.equal(result.isScam, false);
    assert.ok(result.signals.some((signal) => /punycode/i.test(signal)));
  });

  it('increases score when multiple signals are present', () => {
    const kycOnly = detectScam(
      'Update KYC. Your account is blocked.',
      []
    );
    const kycPlusOtp = detectScam(
      'Update KYC. Your account is blocked. Share OTP immediately.',
      []
    );
    assert.ok(kycPlusOtp.riskScore > kycOnly.riskScore);
    assert.equal(kycPlusOtp.category, CATEGORIES.OTP_CREDENTIAL_SCAM);
  });

  it('caps the score at 100', () => {
    const result = detectScam(
      'KYC updated immediately. Account blocked. Share OTP and UPI PIN. Install this APK. Scan QR code and send payment. You won a lottery prize. Part time job registration fee. http://192.168.0.8/xn--phish.apk',
      PHRASES
    );
    assert.equal(result.riskScore, 100);
    assert.equal(capScore(140), 100);
  });

  it('selects the highest-weighted category', () => {
    const result = detectScam(
      'Share your OTP to receive refund',
      []
    );
    assert.equal(result.category, CATEGORIES.OTP_CREDENTIAL_SCAM);
  });

  it('avoids obvious substring false positives on seeded phrases', () => {
    assert.equal(
      detectScam('The lottery window closes tomorrow.', PHRASES).isScam,
      false
    );
    assert.equal(
      detectScam('He is a lottery winner at the office raffle.', PHRASES).isScam,
      false
    );
    assert.equal(
      detectScam('The apk downloaded overnight from Play Store.', PHRASES).isScam,
      false
    );
  });
});

describe('urlAnalyzer', () => {
  it('extracts URLs without fetching them', () => {
    const urls = extractUrlStrings('Open http://files.example/app.apk then wait');
    assert.deepEqual(urls, ['http://files.example/app.apk']);
  });

  it('flags raw IP hosts', () => {
    const info = inspectUrl('http://10.0.0.8/login');
    assert.equal(info.suspicious, true);
    assert.ok(info.reasons.some((reason) => /IP/i.test(reason)));
  });

  it('flags punycode hosts', () => {
    const info = inspectUrl('http://xn--80ak6aa92e.com/');
    assert.equal(info.suspicious, true);
    assert.ok(info.reasons.some((reason) => /punycode/i.test(reason)));
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
