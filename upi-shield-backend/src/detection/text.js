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

function includesPhrase(text, phrase) {
  const pattern = phrasePattern(phrase);
  return Boolean(pattern && pattern.test(text));
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

module.exports = {
  normalizeWhitespace,
  escapeRegExp,
  phrasePattern,
  includesPhrase,
  matchesAny,
};
