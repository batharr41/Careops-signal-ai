<div align="center">
  <img src="./careops-signal-ai/screenshots/betweenvisits-logo.svg" alt="BetweenVisits" width="320" />
  <br /><br />
  <strong>AI-powered patient monitoring for home care agencies — catching decline before it becomes a crisis.</strong>
  <br /><br />

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue)](https://postgresql.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

Home care patients are seen once or twice a day at most. A lot can go wrong in between. BetweenVisits fills that gap with structured daily check-ins and AI-driven risk detection, giving coordinators real-time visibility into every patient on their panel — without being in the room.

🔗 **Live Demo:** [betweenvisits.vercel.app](https://betweenvisits.vercel.app)
🔗 **API:** [betweenvisits.onrender.com](https://betweenvisits.onrender.com)

---

## The Problem

Home care coordinators manage dozens of patients they can only visit periodically. Between those visits, patients can deteriorate — fall, skip medications, report worsening pain — and no one finds out until the next scheduled visit. By then, it's often an emergency.

**BetweenVisits solves the gap.**

---

## 📸 Screenshots

### Dashboard Overview
*Real-time monitoring with color-coded risk alerts, patient statistics, and weekly trends*
<img width="1878" height="859" alt="Screenshot (578)" src="https://github.com/user-attachments/assets/e9e6f747-b710-4ad6-a599-c8b1e601b093" />

### Triage Queue with Critical Alerts
*Prioritized patient alerts with detailed symptoms and AI-generated action steps*
<img width="1920" height="863" alt="Screenshot (579)" src="https://github.com/user-attachments/assets/34027869-3657-43bf-a39c-b2e853e12904" />

### Patient Directory
*All active patients with risk-based color coding, check-in history, and medical conditions*
<img width="1919" height="853" alt="Screenshot (580)" src="https://github.com/user-attachments/assets/3435d85b-b057-4180-b858-90652efd17ae" />


### AI-Powered Features
*Claude AI generates shift summaries, risk explanations, and triage call scripts from structured data — no hallucinations*
![AI Features](./careops-signal-ai/screenshots/ai.png)

---

## ✨ Features

- **🎯 Real-Time Risk Scoring** — Instant 0-100 risk assessment using 15+ detection rules
- **🤖 AI-Powered Summaries** — Claude generates shift handoff notes from structured data only
- **🚨 Smart Triage Queue** — Prioritized alerts with AI-generated call scripts
- **📊 Trend Analytics** — Track patient metrics over time to prevent hospitalizations
- **🏥 HIPAA-Ready Architecture** — Audit logging, encryption, grounded AI (no medical advice)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis
- [Anthropic API key](https://console.anthropic.com/)

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Anthropic API key to .env

# Set up database
npm run setup-db
npm run seed

# Start services (3 terminals)
redis-server              # Terminal 1
npm run server            # Terminal 2
npm run client            # Terminal 3

# Open browser
http://localhost:3000
```

---

## 🤖 How the AI Works

Powered by **Claude Sonnet** for three key functions:

**1. Shift Handoff Summaries**
3-4 sentence clinical summaries using only structured check-in data. No hallucinations or outside medical knowledge.

**2. Risk Explanations**
Explains why the risk score changed and what specific things staff should verify next.

**3. Triage Call Scripts**
Generates questions to ask caregivers based on recorded symptoms and patient history.

> All AI processing is async (via Redis/Bull queue) — users never wait for responses. AI can only summarize existing data, never adds outside medical knowledge or diagnoses.

---

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL via Supabase (Session Pooler) |
| Queue | Redis, Bull |
| AI | Anthropic Claude API |
| Hosting | Vercel (frontend), Render (backend) |

---

## 💡 Key Use Cases

- ✅ **Daily Check-Ins** — Caregivers submit structured patient status (pain, meds, vitals)
- ✅ **Risk Detection** — Algorithm scores 0-100 based on patterns (falls, missed meds, symptoms)
- ✅ **Alert Generation** — High-risk patients trigger immediate alerts
- ✅ **AI Triage** — Staff get call scripts and verification steps
- ✅ **Trend Tracking** — Monitor patient changes over time

---

## 🎯 Sample Data

Run `npm run seed` to create:

- 5 realistic patients with medical histories
- 8+ check-ins including critical scenarios
- Live alerts in triage queue
- Ready-to-explore dashboard

**Patient Examples:**
- Harold Thompson (Critical) — Fall incident with severe hip pain
- Robert Williams (Critical) — Missed medications with respiratory symptoms
- Dorothy Martinez (Elevated) — Increased confusion
- Betty Anderson (Routine) — Stable Parkinson's patient
- Margaret Chen (Routine) — Well-controlled diabetes

---

## 📈 Risk Scoring

Algorithm uses 15+ detection rules:

| Signal | Points |
|---|---|
| Fall incident | +30 |
| Missed medications | +25 |
| Abnormal vitals | +15 |
| Severe pain (8-10) | +20 |
| New symptoms | +10 each |

**Risk Levels:** Routine (0-14) → Moderate (15-34) → Elevated (35-59) → Critical (60-100)

---

## 🔧 Project Structure
```
betweenvisits/
├── server/
│   ├── services/aiService.js      # Claude API integration
│   ├── queues/aiQueue.js          # Async AI processing
│   ├── controllers/               # API logic
│   └── database/                  # Schema & seeds
├── src/
│   ├── App.jsx                    # Main React component
│   └── App.css                    # UI styles
└── package.json
```

---

## 🔒 Security & Compliance

Built with HIPAA in mind:
- Audit logging for all PHI access
- Environment-based secrets
- Grounded AI (no hallucinations)
- Encryption ready
- Row-level security planned

---

## 🎯 Roadmap

- [x] Patient check-in submission
- [x] AI risk scoring via Claude API
- [x] Agency dashboard with triage queue
- [x] Connection stability (pool.js optimization)
- [x] New patient form
- [x] Patient list with search, sort, and last check-in tracking
- [x] Supabase Auth (login/signup, JWT-protected API routes)
- [ ] Role-based access (family vs caregiver vs admin views)
- [ ] Multi-agency support (dynamic agency scoping)
- [ ] Email/SMS alerts for high-risk check-ins
- [ ] PDF weekly reports per patient
- [ ] Caregiver assignment and scheduling
- [ ] Agency self-onboarding
- [ ] Figma visual redesign
- [ ] Landing page and pricing page
- [ ] Demo mode for prospects
- [ ] Mobile responsive design
- [ ] HIPAA audit logging
- [ ] Stripe billing

---

## 🎓 API Reference

**POST `/api/check-ins`** — Submit new patient check-in
```json
{
  "patientId": "uuid",
  "submittedBy": "Caregiver Name",
  "painLevel": 8,
  "medicationsTaken": false,
  "missedMedications": ["Morning BP med"],
  "temperature": 101.2,
  "heartRate": 115,
  "newSymptoms": ["shortness of breath"],
  "fallIncident": false
}
```

**GET `/api/patients/:patientId/check-ins`** — Patient check-in history

**GET `/api/agencies/:agencyId/dashboard`** — Dashboard stats and trends

**GET `/api/agencies/:agencyId/triage-queue`** — Pending alerts with AI call scripts

---

## 📄 License

MIT
