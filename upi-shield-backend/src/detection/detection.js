const { normalizeWhitespace, phrasePattern } = require('./text');
const { analyzeUrls, extractUrlStrings } = require('./urlAnalyzer');
const {
  collectRuleHits,
  findMatchedPhrase,
  hasUrgency,
} = require('./rules');
const { scoreDetection } = require('./scoring');

/**
 * Rule-based UPI scam detector.
 * riskScore is a heuristic, not a probability.
 */
function detectScam(messageText, threatPhrases = []) {
  const text = normalizeWhitespace(messageText);
  const urlAnalysis = analyzeUrls(text);
  const matchedPhrase = findMatchedPhrase(text, threatPhrases);
  const ruleHits = collectRuleHits(text);
  const urgency = hasUrgency(text);

  return scoreDetection({
    matchedPhrase,
    ruleHits,
    urlAnalysis,
    urgency,
  });
}

module.exports = {
  detectScam,
  extractUrls: extractUrlStrings,
  phrasePattern,
  normalizeWhitespace,
};
