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

## ⚙️ Features Built (current)

* **Scan pasted message text** with a rule-based risk score (0–100), category, and signals. `isScam` is true at score 60+. URLs are parsed locally and never fetched.
* **Scam reports** are stored as **PENDING** (`ScamReport`). They do **not** immediately join the live detection list.
* **Health check** for process + database connectivity.
* **Expo Home screen** that POSTs to `/api/scan` and `/api/report`.

Not implemented yet: authentication, admin review UI, scan history, risk scores, ML, SMS monitoring.

---

## 🏗️ Workspace Architecture

```text
upi-shield/
├── upi-shield-app/                 # Expo (React Native) client
│   ├── src/app/index.tsx           # Scan + report screen
│   ├── src/config/api.ts           # API base URL (EXPO_PUBLIC_API_BASE_URL)
│   └── .env.example
├── upi-shield-backend/             # Express 5 API
│   ├── server.js                   # `node server.js` entry
│   ├── src/                        # app, routes, detection, middleware
│   ├── prisma/schema.prisma
│   ├── prisma/seed.js
│   └── .env.example
└── README.md
```

---

## 🛠️ Technical Stack

### Frontend (`upi-shield-app`)

* Expo SDK 57, Expo Router, React Native, TypeScript
* `EXPO_PUBLIC_API_BASE_URL` for the API origin (see `.env.example`)

### Backend (`upi-shield-backend`)

* Node.js 18+, Express 5
* PostgreSQL + Prisma ORM
* dotenv, cors, helmet, express-rate-limit, Zod
* Tests: Node.js built-in test runner (`node --test`)

---

## 🔋 API Reference

None of these routes require authentication.

### `GET /health`

Checks that the API is up and that PostgreSQL responds.

```json
{ "status": "ok", "database": "connected" }
```

Returns **503** if the database is unavailable:

```json
{ "status": "error", "database": "disconnected" }
```

### `GET /api/keywords`

Returns ACTIVE threat phrases only (no extra DB fields).

```json
{ "success": true, "keywords": ["apk download", "account blocked"] }
```

### `POST /api/scan`

Body: `{ "messageText": "..." }` (string, trimmed, 1–5000 characters).

The detector is a **rule-based heuristic** (not a probability and not ML). `isScam` is `true` when `riskScore >= 60`. Scores `30–59` are suspicious but not classified as scam. A normal URL by itself is not a scam. User-supplied URLs are parsed locally and never fetched.

Scam example:

```json
{
  "success": true,
  "isScam": true,
  "riskScore": 75,
  "category": "KYC_PHISHING",
  "signals": [
    "KYC/account verification language detected",
    "urgent action requested"
  ],
  "reason": "Multiple indicators suggest a possible KYC phishing scam.",
  "urlDetected": false
}
```

Safe example (existing clients can keep using `isScam` / `message`):

```json
{
  "success": true,
  "isScam": false,
  "riskScore": 0,
  "category": "SAFE",
  "signals": [],
  "message": "No obvious scam indicators detected.",
  "urlDetected": false
}
```

Invalid input returns **400** `{ "success": false, "error": "..." }`.

### `POST /api/report`

Body: `{ "newScamPhrase": "..." }` (string, trimmed, 3–200 characters).

Stores a **PENDING** `ScamReport`. Does not activate the phrase for scanning.

```json
{ "success": true, "message": "Report submitted for review." }
```

---

## 📱 Mobile Frontend Flow

1. User pastes text on Home (`src/app/index.tsx`).
2. App POSTs JSON to `{API_BASE_URL}/api/scan` or `/api/report`.
3. If `isScam` is true, the screen turns red and shows an alert with `reason`.

---

## 🚀 Local Installation & Execution

### Prerequisites

* Node.js 18+
* PostgreSQL
* Git

### 1. Backend

```bash
cd upi-shield-backend
npm install
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`. Edit `.env` and set a real `DATABASE_URL` (do not commit `.env`):

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/upi_shield"
CLIENT_ORIGIN="*"
```

Then:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm start
```

Equivalent scripts: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`.

The API listens on `http://localhost:5000`.

Tests (detection + request validation; they do not require PostgreSQL):

```bash
npm test
```

### 2. Point the Expo app at an API

Copy `upi-shield-app/.env.example` to `upi-shield-app/.env` (or `.env.local`).

| Client | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| Default / production | `https://upi-shield-7mcc.onrender.com` |
| Emulator or Expo web on the same PC | `http://localhost:5000` |
| Physical phone | `http://YOUR_PC_LAN_IP:5000` |

**On a physical phone, `localhost` is the phone itself, not your computer.** Use the PC’s LAN IP (for example `http://192.168.1.10:5000`) and keep the phone on the same Wi-Fi. Restart Expo after changing env vars, then reload the app.

If `EXPO_PUBLIC_API_BASE_URL` is unset, the app uses the production Render URL.

### 3. Mobile app

```bash
cd upi-shield-app
npm install
npx expo start
```

Open Expo Go, an emulator, or press `w` for web.

---

## 🌐 Live Production Deployments

This architecture has been decoupled from local host dependencies and is deployed on active cloud ecosystems:

* **API Processing Hub (Render Cloud Node):** Host routes run through managed systems handling live operations seamlessly.
* **Mobile Testing Channel (Expo EAS Services):** Live layouts are active across production branches to load test interfaces globally on physical mobile smartphones.

---

## 🤝 Founding Team & Recruitment (We Are Hiring!)

I am a beginner engineer who successfully structured this initial full-stack operational MVP architecture. I am now looking to scale this project into an ecosystem deployment ready for release on the Google Play Store.

### 🛠️ Open Core Engineering Roles:

* **Database / API Engineer:** Help evolve Prisma models (scan history, users, moderation) on the existing PostgreSQL schema.
* **UI/UX Interface Designer:** Expand the form views into structural cards localized across regional languages (Hindi, Tamil, Telugu, etc.) to optimize access for older age groups.
* **Native Device Permissions Specialist:** Build Android accessibility bridges to safely read incoming text data vectors automatically in the background.

If you want to solve an impactful real-world problem and level up your engineering portfolio—clone the project files, run a local deployment test, and open a Pull Request or reach out directly!


[expo.dev/accounts/shivam-yugtech/projects/upi-shield-app/updates/57b429d1-f607-4c5a-b350-6f427b4af1ea](https://expo.dev/accounts/shivam-yugtech/projects/upi-shield-app/updates/57b429d1-f607-4c5a-b350-6f427b4af1ea)

exp://10.18.12.109:8081
