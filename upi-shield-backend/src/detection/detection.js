const URL_PATTERN = /https?:\/\/[^\s]+/gi;

function normalizeWhitespace(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phrasePattern(phrase) {
  const words = normalizeWhitespace(phrase)
    .split(' ')
    .filter(Boolean)
    .map(escapeRegExp);

  if (words.length === 0) {
    return null;
  }

  return new RegExp(`\\b${words.join('\\s+')}\\b`, 'i');
}

function extractUrls(messageText) {
  const matches = String(messageText).match(URL_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Rule-based scan. Phrase hits are treated as scam indicators.
 * URLs are recorded as a separate signal and are not automatically malicious.
 */
function detectScam(messageText, threatPhrases = []) {
  const text = normalizeWhitespace(messageText);
  const urls = extractUrls(text);
  const phrases = Array.isArray(threatPhrases)
    ? threatPhrases.map(normalizeWhitespace).filter(Boolean)
    : [];

  let matchedPhrase = null;
  for (const phrase of phrases) {
    const pattern = phrasePattern(phrase);
    if (pattern && pattern.test(text)) {
      matchedPhrase = phrase;
      break;
    }
  }

  if (matchedPhrase) {
    return {
      isScam: true,
      reason: `Flagged phrase found: "${matchedPhrase}"`,
      matchedPhrase,
      urlDetected: urls.length > 0,
      urls,
    };
  }

  if (urls.length > 0) {
    return {
      isScam: false,
      message:
        'A URL was detected, but no known scam phrases were found. URLs are not automatically classified as malicious.',
      matchedPhrase: null,
      urlDetected: true,
      urls,
    };
  }

  return {
    isScam: false,
    message: 'No obvious scam indicators detected.',
    matchedPhrase: null,
    urlDetected: false,
    urls: [],
  };
}

module.exports = {
  detectScam,
  extractUrls,
  phrasePattern,
  normalizeWhitespace,
};
