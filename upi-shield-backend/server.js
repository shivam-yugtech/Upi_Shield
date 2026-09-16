const express = require('express');
const app = express();
const PORT = 5000;

// Tell Express to parse JSON data sent by the mobile app
app.use(express.json());

// A live list of blacklisted fraud terms (In a real product, this will connect to a database)
let blacklistedKeywords = [
  "electricity bill",
  "account blocked",
  "lottery win",
  "kyc updated",
  "gift card",
  "part time job",
  "apk download"
];

// 1. Create a GET Route: Allows the mobile app to fetch the latest keywords
app.get('/api/keywords', (req, res) => {
  res.json({ success: true, keywords: blacklistedKeywords });
});

// 2. Create a POST Route: Checks if a specific text message contains a scam
app.post('/api/scan', (req, res) => {
  const { messageText } = req.body;

  if (!messageText) {
    return res.status(400).json({ success: false, error: "No message text provided." });
  }

  const lowerCaseMessage = messageText.toLowerCase();

  // Search through the array to see if any blacklisted keyword matches
  const detectedKeyword = blacklistedKeywords.find(keyword => 
    lowerCaseMessage.includes(keyword)
  );

  const containsLink = /https?:\/\/[^\s]+/.test(lowerCaseMessage);

  if (detectedKeyword || containsLink) {
    return res.json({
      isScam: true,
      reason: detectedKeyword ? `Flagged phrase found: "${detectedKeyword}"` : "Contains an unverified web link."
    });
  }

  return res.json({ isScam: false, message: "Message appears safe." });
});

// 3. Create a REPORT Route: Allows users to submit new scam phrases to the database
app.post('/api/report', (req, res) => {
  const { newScamPhrase } = req.body;

  if (!newScamPhrase || newScamPhrase.trim() === "") {
    return res.status(400).json({ success: false, error: "Report text cannot be empty." });
  }

  const cleanPhrase = newScamPhrase.toLowerCase().trim();

  // Prevent duplicate entries in our local array
  if (!blacklistedKeywords.includes(cleanPhrase)) {
    blacklistedKeywords.push(cleanPhrase);
    console.log(`➕ New crowdsourced scam phrase added: "${cleanPhrase}"`);
    return res.json({ success: true, message: "Thank you! This phrase has been added to safeguard the community." });
  }

  return res.json({ success: true, message: "This phrase was already flagged in our central security system." });
});

// Start the server on port 5000
app.listen(PORT, () => {
  console.log(`🛡️ UPI Shield backend running smoothly on http://localhost:${PORT}`);
});
