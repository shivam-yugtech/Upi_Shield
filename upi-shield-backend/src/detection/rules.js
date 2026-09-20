const { includesPhrase, matchesAny } = require('./text');

const CATEGORIES = {
  KYC_PHISHING: 'KYC_PHISHING',
  UPI_PAYMENT_SCAM: 'UPI_PAYMENT_SCAM',
  OTP_CREDENTIAL_SCAM: 'OTP_CREDENTIAL_SCAM',
  APK_MALWARE: 'APK_MALWARE',
  LOTTERY_REWARD_SCAM: 'LOTTERY_REWARD_SCAM',
  JOB_SCAM: 'JOB_SCAM',
  UTILITY_BILL_SCAM: 'UTILITY_BILL_SCAM',
  PHISHING: 'PHISHING',
  SUSPICIOUS_MESSAGE: 'SUSPICIOUS_MESSAGE',
  SAFE: 'SAFE',
};

const URGENCY_PATTERNS = [
  /\bimmediately\b/i,
  /\burgent\b/i,
  /\bact\s+now\b/i,
  /\bwithin\s+24\s+hours\b/i,
  /\blast\s+warning\b/i,
  /\baccount\s+will\s+be\s+(blocked|suspended|closed)\b/i,
  /\bverify\s+now\b/i,
];

const IDENTITY_PATTERNS = [
  /\bkyc\b/i,
  /\bpan\b/i,
  /\baadhaar\b/i,
  /\baadhar\b/i,
];

const ACCOUNT_THREAT_PATTERNS = [
  /\baccount\s+(is\s+|has\s+been\s+)?(blocked|suspended|locked|deactivated)\b/i,
  /\bupdate\s+kyc\b/i,
  /\bverify\s+(your\s+)?account\b/i,
  /\bkyc\s+(update|updated|verification)\b/i,
];

const UPI_CORE_PATTERNS = [
  /\bupi\b/i,
  /\bcollect\s+request\b/i,
  /\bqr\s+code\b/i,
  /\bscan\s+(this\s+)?qr\b/i,
];

const MONEY_MOVE_PATTERNS = [
  /\bsend\s+money\b/i,
  /\btransfer\b/i,
  /\brefund\b/i,
  /\bcashback\b/i,
  /\bpayment\s+pending\b/i,
  /\bsend\s+payment\b/i,
];

const SHARE_PATTERNS = [/\b(share|send|tell|provide|give|enter|submit|forward)\b/i];

const SECRET_PATTERNS = [
  /\botp\b/i,
  /\bupi\s*pin\b/i,
  /\bpassword\b/i,
  /\bcvv\b/i,
  /\bcard\s+number\b/i,
  /\bverification\s+code\b/i,
  /\bpin\b/i,
];

const APK_PATTERNS = [
  /\binstall\s+(this\s+|the\s+)?(apk|app|application)\b/i,
  /\bdownload\s+(this\s+|the\s+)?(apk|app|application)\b/i,
  /\bunknown\s+application\b/i,
  /\bscreen\s+sharing\b/i,
  /\bremote\s+access\b/i,
  /\.apk(\b|$|\?)/i,
];

const LOTTERY_ANCHOR_PATTERNS = [/\blottery\b/i, /\blucky\s+draw\b/i];

const LOTTERY_CLAIM_PATTERNS = [
  /\bprize\b/i,
  /\bcongratulations\b/i,
  /\byou\s+(have\s+)?won\b/i,
  /\bclaim\b/i,
];

const JOB_ROLE_PATTERNS = [
  /\bpart[\s-]?time\s+job\b/i,
  /\bwork\s+from\s+home\b/i,
  /\bjob\s+offer\b/i,
];

const JOB_FEE_PATTERNS = [
  /\bregistration\s+fee\b/i,
  /\bjoining\s+fee\b/i,
  /\bearn\s+money\b/i,
  /\beasy\s+income\b/i,
];

const UTILITY_PATTERNS = [
  /\b(electricity|power|gas|water|broadband)\s+bill\b/i,
];

const UTILITY_THREAT_PATTERNS = [
  /\b(disconnect|disconnected|overdue|due)\b/i,
  /\bline\s+will\s+be\s+cut\b/i,
  /\bpay\b/i,
];

function hasUrgency(text) {
  return matchesAny(text, URGENCY_PATTERNS);
}

function collectRuleHits(text) {
  const hits = [];

  const identity = matchesAny(text, IDENTITY_PATTERNS);
  const accountThreat = matchesAny(text, ACCOUNT_THREAT_PATTERNS);
  if (identity && accountThreat) {
    hits.push({
      id: 'kyc',
      category: CATEGORIES.KYC_PHISHING,
      signal: 'KYC/account verification language detected',
    });
  }

  const upiCore = matchesAny(text, UPI_CORE_PATTERNS);
  const moneyMove = matchesAny(text, MONEY_MOVE_PATTERNS);
  if (upiCore && moneyMove) {
    hits.push({
      id: 'upi',
      category: CATEGORIES.UPI_PAYMENT_SCAM,
      signal: 'UPI/payment request language detected',
    });
  }

  const askingToShare = matchesAny(text, SHARE_PATTERNS);
  const secret = matchesAny(text, SECRET_PATTERNS);
  if (askingToShare && secret) {
    hits.push({
      id: 'otp',
      category: CATEGORIES.OTP_CREDENTIAL_SCAM,
      signal: 'request to share OTP, PIN, or password detected',
    });
  }

  if (matchesAny(text, APK_PATTERNS)) {
    hits.push({
      id: 'apk',
      category: CATEGORIES.APK_MALWARE,
      signal: 'APK, app-install, or remote-access language detected',
    });
  }

  if (
    matchesAny(text, LOTTERY_ANCHOR_PATTERNS) &&
    matchesAny(text, LOTTERY_CLAIM_PATTERNS)
  ) {
    hits.push({
      id: 'lottery',
      category: CATEGORIES.LOTTERY_REWARD_SCAM,
      signal: 'lottery/prize claim language detected',
    });
  } else if (includesPhrase(text, 'gift card') && askingToShare) {
    hits.push({
      id: 'lottery',
      category: CATEGORIES.LOTTERY_REWARD_SCAM,
      signal: 'gift card request detected',
    });
  }

  const jobRole = matchesAny(text, JOB_ROLE_PATTERNS);
  const jobFee = matchesAny(text, JOB_FEE_PATTERNS);
  if (jobRole && jobFee) {
    hits.push({
      id: 'job',
      category: CATEGORIES.JOB_SCAM,
      signal: 'job offer combined with fee or easy-money language',
    });
  }

  if (matchesAny(text, UTILITY_PATTERNS) && matchesAny(text, UTILITY_THREAT_PATTERNS)) {
    hits.push({
      id: 'utility',
      category: CATEGORIES.UTILITY_BILL_SCAM,
      signal: 'utility-bill pressure language detected',
    });
  }

  return hits;
}

function inferCategoryFromPhrase(phrase) {
  const hits = collectRuleHits(phrase);
  if (hits.length > 0) {
    return hits[0].category;
  }

  if (/\b(apk|malware|download)\b/i.test(phrase)) {
    return CATEGORIES.APK_MALWARE;
  }
  if (/\b(kyc|aadhaar|aadhar|account)\b/i.test(phrase)) {
    return CATEGORIES.KYC_PHISHING;
  }
  if (/\b(otp|password|pin|cvv)\b/i.test(phrase)) {
    return CATEGORIES.OTP_CREDENTIAL_SCAM;
  }
  if (/\b(upi|qr|refund|payment)\b/i.test(phrase)) {
    return CATEGORIES.UPI_PAYMENT_SCAM;
  }
  if (/\b(lottery|prize|gift)\b/i.test(phrase)) {
    return CATEGORIES.LOTTERY_REWARD_SCAM;
  }
  if (/\b(job|work from home|income)\b/i.test(phrase)) {
    return CATEGORIES.JOB_SCAM;
  }
  if (/\b(electricity|bill|gas|water)\b/i.test(phrase)) {
    return CATEGORIES.UTILITY_BILL_SCAM;
  }

  return CATEGORIES.PHISHING;
}

function findMatchedPhrase(text, threatPhrases) {
  const phrases = Array.isArray(threatPhrases) ? threatPhrases : [];
  for (const phrase of phrases) {
    if (includesPhrase(text, phrase)) {
      return phrase;
    }
  }
  return null;
}

module.exports = {
  CATEGORIES,
  collectRuleHits,
  hasUrgency,
  inferCategoryFromPhrase,
  findMatchedPhrase,
};
