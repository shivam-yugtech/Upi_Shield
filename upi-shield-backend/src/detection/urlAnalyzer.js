const { isIP } = require('node:net');

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/** Cheap heuristic list of often-abused TLDs. Not a blocklist of all risk. */
const SUSPICIOUS_TLDS = new Set([
  'zip',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'top',
  'click',
  'country',
  'rest',
  'fit',
  'cam',
  'cfd',
  'sbs',
  'cyou',
  'icu',
  'buzz',
  'work',
  'lol',
  'quest',
  'accountant',
  'download',
  'racing',
  'review',
  'science',
  'stream',
  'webcam',
  'win',
  'xyz',
]);

function stripTrailingPunctuation(value) {
  return value.replace(/[).,;:!?]+$/g, '');
}

function extractUrlStrings(messageText) {
  const matches = String(messageText).match(URL_PATTERN) || [];
  return [...new Set(matches.map(stripTrailingPunctuation))];
}

function parseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function hostnameTld(hostname) {
  const labels = hostname.toLowerCase().split('.').filter(Boolean);
  return labels.length ? labels[labels.length - 1] : '';
}

function encodingHits(raw) {
  const matches = raw.match(/%[0-9a-f]{2}/gi) || [];
  const dangerous = /%(00|0a|0d|2f|5c)/i.test(raw);
  return { count: matches.length, dangerous };
}

/**
 * Local string analysis only. Never fetches or resolves the host.
 */
function inspectUrl(raw) {
  const parsed = parseUrl(raw);
  const reasons = [];

  if (!parsed) {
    reasons.push('malformed URL');
    return { raw, suspicious: true, reasons };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '');

  if (isIP(host)) {
    reasons.push('host is a raw IP address');
  }

  if (host.includes('xn--')) {
    reasons.push('punycode hostname');
  }

  if (host.length >= 40) {
    reasons.push('unusually long hostname');
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length >= 5) {
    reasons.push('excessive subdomains');
  }

  if (parsed.username || parsed.password) {
    reasons.push('credentials embedded in the URL');
  }

  const encoding = encodingHits(raw);
  if (encoding.dangerous || encoding.count >= 4) {
    reasons.push('suspicious URL encoding');
  }

  const tld = hostnameTld(host);
  if (SUSPICIOUS_TLDS.has(tld)) {
    reasons.push(`uncommon TLD .${tld}`);
  }

  if (/\.apk(\b|$|\?)/i.test(parsed.pathname + parsed.search)) {
    reasons.push('APK file in URL path');
  }

  return {
    raw,
    hostname: host,
    suspicious: reasons.length > 0,
    reasons,
  };
}

function analyzeUrls(messageText) {
  const urls = extractUrlStrings(messageText);
  const inspections = urls.map(inspectUrl);
  const suspicious = inspections.filter((item) => item.suspicious);

  return {
    urlDetected: urls.length > 0,
    urls,
    inspections,
    suspicious,
  };
}

module.exports = {
  extractUrlStrings,
  inspectUrl,
  analyzeUrls,
};
