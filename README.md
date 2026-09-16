# 🛡️ UPI Shield

> **Real-time, crowdsourced cybersecurity firewall designed to protect digital wallets and prevent hyper-local UPI financial fraud across India.**

---

## 📖 Table of Contents

* [💡 Project Genesis &amp; Context](#-project-genesis--context)
* [⚙️ Features Built (MVP Core)](#%EF%B8%8F-features-built-mvp-core)
* [🏗️ Workspace Architecture](#%EF%B8%8F-workspace-architecture)
* [🛠️ Technical Stack &amp; Modules](#%F0%9F%9B%A0-technical-stack--modules)
* [🔋 API Reference &amp; Routing Layer](#-api-reference--routing-layer)
* [📱 Mobile Frontend Flow](#-mobile-frontend-flow)
* [🚀 Local Installation &amp; Execution](#-local-installation--execution)
* [🌐 Live Production Deployments](#-live-production-deployments)
* [🤝 Founding Team &amp; Recruitment (We Are Hiring!)](#-founding-team--recruitment-we-are-hiring)

---

## 💡 Project Genesis & Context

India's unified digital payment framework (**UPI**) handles billions of micro-transactions monthly, driving unprecedented economic velocity. However, this massive transition has made millions of daily smartphone users vulnerable to engineering scams.

Common attack vectors targeting individuals include:

* **Urgent Utility Scams:** Phishing messages threatening immediate electricity line disconnection.
* **Account Deactivation Warnings:** Fraudulent identity checks claiming bank accounts are locked.
* **Malicious Downloads:** Links forcing users to download `.apk` spyware scripts disguised as updates.

**UPI Shield** serves as an interactive community-driven protective barrier. It combines client-side processing text-matching triggers with clean cloud service routing layers to check context vectors, flag structural phishing link patterns, and collect emerging telemetries to save other users immediately.

---

## ⚙️ Features Built (MVP Core)

* **Live Cloud Threat Assessment:** Sends user notification texts natively over network streams to automated backend processing points.
* **RegEx Phishing Scanners:** Built-in pattern recognition identifying suspicious `http://` or `https://` structures inside messages.
* **Crowdsourced Telemetry Ingestion:** Interactive framework allowing users to submit new scam text variations, updating active tracking variables in real-time.
* **Dynamic UI Warning System:** Modifies device view backgrounds to high-alert crimson states when potential exploits are caught.

---

## 🏗️ Workspace Architecture

This project is configured as a standalone **Monorepo** to maintain full-stack continuous alignment. The workspace separates client layouts from backend execution scripts:

```text
📁 upi-shield (Monorepo Workspace Root)
├── 📁 upi-shield-app      # Cross-platform mobile project file trees (Expo framework)
│   ├── 📁 app             # File-based view structure
│   │   └── 📄 index.tsx   # Entry workspace screen, user forms, and fetch drivers
│   └── 📄 package.json    # Frontend dependency tracking map
├── 📁 upi-shield-backend  # Cloud-native API gateway microservice (Node.js runtime)
│   ├── 📄 server.js       # Express routing definitions and text scanners
│   └── 📄 package.json    # Server package ecosystem map
└── 📄 README.md           # Master documentation matrix (This File)
```

---

## 🛠️ Technical Stack & Modules

### 📱 Frontend Layer (`/upi-shield-app`)

* **Runtime/Framework:** React Native running on **Expo Platform (Expo Router File System)**.
* **Language:** JavaScript / TypeScript.
* **Network Driver:** **Fetch API** utilizing asynchronous JavaScript operations (`async/await`) to carry structural text objects over external networks.
* **State Management:** Native React Hooks (`useState`, `useEffect`) tracking user data inputs and threat statuses.
* **UI Components:** `ScrollView`, `TextInput`, `TouchableOpacity`, `ActivityIndicator`, and native platform `Alert` popup notifications.

### 🔌 Backend Processing Gateway (`/upi-shield-backend`)

* **Runtime:** **Node.js** environment.
* **Framework:** **Express.js** minimal web infrastructure.
* **Parsing Middleware:** Native Express body parsers (`express.json()`).
* **Environment Ports:** Configuration variables (`process.env.PORT`) handling dynamic deployment adjustments natively.
* **Database Mock Engine:** Live variable indexing matrices running keyword calculations without initial structural load drops.

---

## 🔋 API Reference & Routing Layer

### 1. Threat Signature Evaluation Route

* **Endpoint:** `/api/scan`
* **Method:** `POST`
* **Payload Format:** `application/json`
* **Request Schema:**
  ```json
  {
    "messageText": "Dear user your electricity bill is due, click https://fake-pay.in immediately."
  }
  ```
* **Response Scenarios:**
  * **Threat Flagged (200 OK):**
    ```json
    {
      "isScam": true,
      "reason": "Contains an unverified web link."
    }
    ```
  * **Clear State (200 OK):**
    ```json
    {
      "isScam": false,
      "message": "Message appears safe."
    }
    ```

### 2. Crowdsourced Telemetry Route

* **Endpoint:** `/api/report`
* **Method:** `POST`
* **Payload Format:** `application/json`
* **Request Schema:**
  ```json
  {
    "newScamPhrase": "Free mobile recharge offer"
  }
  ```
* **Response Schema (200 OK):**
  ```json
  {
    "success": true,
    "message": "Thank you! This phrase has been added to safeguard the community."
  }
  ```

---

## 📱 Mobile Frontend Flow

The frontend application executes threat scans in three coordinated phases:

1. **Input Vector Evaluation:** String extraction checks the data values input into the view blocks.
2. **Network Request Packaging:** The string data is parsed into structural payloads and passed out via explicit asynchronous fetch calls.
3. **UI Feedback Transformation:** The UI checks the `isScam` key returned from the cloud endpoint. If it maps to true, background states change color dynamically while structural system notifications map exact reason variables to alert views.

---

## 🚀 Local Installation & Execution

### 1. Pre-requisites

Ensure you have **Node.js** (v16+ recommended) and **Git** configured locally.

### 2. Setting Up the Backend Server

Clone the workspace repository and enter the server directory:

```bash
git clone https://github.com/your-username/upi-shield.git
cd upi-shield/upi-shield-backend
```

Install all backend Express dependencies and boot up your local Node process server:

```bash
npm install
node server.js
```

The console will log: `🛡️ UPI Shield backend running smoothly on http://localhost:5000`

### 3. Running the Mobile Application

Open a clean separate terminal screen, shift into the mobile app project folder:

```bash
cd ../upi-shield-app
```

Install all necessary Expo component structures:

```bash
npm install
```

Launch the Metro development system engine:

```bash
npx expo start
```

*Note: Boot up the **Expo Go** reader app directly via the Google Play Store on your Android device and capture the terminal display's visual QR vector to interact with your code layouts locally!*

---

## 🌐 Live Production Deployments

This architecture has been decoupled from local host dependencies and is deployed on active cloud ecosystems:

* **API Processing Hub (Render Cloud Node):** Host routes run through managed systems handling live operations seamlessly.
* **Mobile Testing Channel (Expo EAS Services):** Live layouts are active across production branches to load test interfaces globally on physical mobile smartphones.

---

## 🤝 Founding Team & Recruitment (We Are Hiring!)

I am a beginner engineer who successfully structured this initial full-stack operational MVP architecture. I am now looking to scale this project into an ecosystem deployment ready for release on the Google Play Store.

### 🛠️ Open Core Engineering Roles:

* **Database Infrastructure Engineer:** Help transition our runtime array framework into cloud-backed storage matrices (**MongoDB Atlas / PostgreSQL**).
* **UI/UX Interface Designer:** Expand the form views into structural cards localized across regional languages (Hindi, Tamil, Telugu, etc.) to optimize access for older age groups.
* **Native Device Permissions Specialist:** Build Android accessibility bridges to safely read incoming text data vectors automatically in the background.

If you want to solve an impactful real-world problem and level up your engineering portfolio—clone the project files, run a local deployment test, and open a Pull Request or reach out directly!


[expo.dev/accounts/shivam-yugtech/projects/upi-shield-app/updates/57b429d1-f607-4c5a-b350-6f427b4af1ea](https://expo.dev/accounts/shivam-yugtech/projects/upi-shield-app/updates/57b429d1-f607-4c5a-b350-6f427b4af1ea)

exp://10.18.12.109:8081
