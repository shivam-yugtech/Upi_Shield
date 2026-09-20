const { CATEGORIES, inferCategoryFromPhrase } = require('./rules');

/**
 * Application-defined heuristic weights. These are not probabilities
 * and are not a scientifically validated risk model.
 */
const POINTS = {
  THREAT_PHRASE: 60,
  OTP_CREDENTIAL: 60,
  APK_MALWARE: 60,
  LOTTERY_REWARD: 60,
  JOB_SCAM: 60,
  KYC_PHISHING: 50,
  UPI_PAYMENT: 50,
  UTILITY_BILL: 45,
  SUSPICIOUS_URL: 30,
  URGENCY_COMBO: 15,
};

const RULE_POINTS = {
  kyc: POINTS.KYC_PHISHING,
  otp: POINTS.OTP_CREDENTIAL,
  apk: POINTS.APK_MALWARE,
  upi: POINTS.UPI_PAYMENT,
  lottery: POINTS.LOTTERY_REWARD,
  job: POINTS.JOB_SCAM,
  utility: POINTS.UTILITY_BILL,
};

/** isScam is true at or above this score. */
const SCAM_THRESHOLD = 60;
const SUSPICIOUS_THRESHOLD = 30;

const REASONS = {
  [CATEGORIES.KYC_PHISHING]:
    'Multiple indicators suggest a possible KYC phishing scam.',
  [CATEGORIES.UPI_PAYMENT_SCAM]:
    'Multiple indicators suggest a possible UPI or payment scam.',
  [CATEGORIES.OTP_CREDENTIAL_SCAM]:
    'The message asks for secrets such as an OTP, PIN, or password.',
  [CATEGORIES.APK_MALWARE]:
    'The message pushes an app install, APK, or remote-access step.',
  [CATEGORIES.LOTTERY_REWARD_SCAM]:
    'The message resembles a lottery, prize, or reward scam.',
  [CATEGORIES.JOB_SCAM]:
    'The message resembles a job offer that asks for a fee or easy money.',
  [CATEGORIES.UTILITY_BILL_SCAM]:
    'The message resembles a utility-bill disconnection scam.',
  [CATEGORIES.PHISHING]:
    'A known threat phrase was matched in this message.',
  [CATEGORIES.SUSPICIOUS_MESSAGE]:
    'The message contains suspicious indicators but does not cross the scam threshold.',
  [CATEGORIES.SAFE]: 'No obvious scam indicators detected.',
};

const CATEGORY_TIEBREAK = {
  OTP_CREDENTIAL_SCAM: 8,
  APK_MALWARE: 7,
  KYC_PHISHING: 6,
  UPI_PAYMENT_SCAM: 5,
  LOTTERY_REWARD_SCAM: 4,
  JOB_SCAM: 3,
  UTILITY_BILL_SCAM: 2,
  PHISHING: 1,
};

function capScore(score) {
  return Math.max(0, Math.min(100, score));
}

function scoreDetection({ matchedPhrase, ruleHits, urlAnalysis, urgency }) {
  const byCategory = new Map();

  function addHit(category, points, signal) {
    const current = byCategory.get(category);
    if (!current) {
      byCategory.set(category, { category, points, signals: [signal] });
      return;
    }
    if (!current.signals.includes(signal)) {
      current.signals.push(signal);
    }
    if (points > current.points) {
      current.points = points;
    }
  }

  for (const hit of ruleHits) {
    addHit(hit.category, RULE_POINTS[hit.id] || 0, hit.signal);
  }

  if (matchedPhrase) {
    const category = inferCategoryFromPhrase(matchedPhrase);
    addHit(
      category,
      POINTS.THREAT_PHRASE,
      `suspicious threat phrase matched: "${matchedPhrase}"`
    );
  }

  const extraSignals = [];
  let extras = 0;

  if (urgency && (byCategory.size > 0 || urlAnalysis.suspicious.length > 0)) {
    extras += POINTS.URGENCY_COMBO;
    extraSignals.push('urgent action requested');
  }

  if (urlAnalysis.suspicious.length > 0) {
    extras += POINTS.SUSPICIOUS_URL;
    extraSignals.push(`suspicious URL characteristics: ${urlAnalysis.suspicious[0].reasons[0]}`);
  }

  const ranked = [...byCategory.values()].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (CATEGORY_TIEBREAK[b.category] || 0) - (CATEGORY_TIEBREAK[a.category] || 0);
  });
  const base = ranked.reduce((sum, item) => sum + item.points, 0);
  const riskScore = capScore(base + extras);

  const signals = [
    ...ranked.flatMap((item) => item.signals),
    ...extraSignals,
  ];

  let category = CATEGORIES.SAFE;
  if (riskScore >= SCAM_THRESHOLD) {
    category = ranked[0]?.category || CATEGORIES.PHISHING;
  } else if (riskScore >= SUSPICIOUS_THRESHOLD) {
    category = CATEGORIES.SUSPICIOUS_MESSAGE;
  }

  const isScam = riskScore >= SCAM_THRESHOLD;
  const explanation = REASONS[category];

  return {
    isScam,
    riskScore,
    category,
    signals,
    reason: explanation,
    message: isScam ? undefined : explanation,
    urlDetected: urlAnalysis.urlDetected,
    urls: urlAnalysis.urls,
    matchedPhrase: matchedPhrase || null,
    scamThreshold: SCAM_THRESHOLD,
  };
}

module.exports = {
  POINTS,
  SCAM_THRESHOLD,
  SUSPICIOUS_THRESHOLD,
  capScore,
  scoreDetection,
};
