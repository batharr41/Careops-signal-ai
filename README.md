<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Claude%20API-D97706?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<h1 align="center">🏥 BetweenVisits</h1>

<p align="center">
  <strong>AI-Powered Patient Monitoring & Triage Platform for Home Care Agencies</strong>
</p>

<p align="center">
  <a href="https://betweenvisits.org/">🔗 Live App</a> &nbsp;•&nbsp;
  <a href="mailto:batharbetweenvisits@gmail.com">📧 Contact</a> &nbsp;•&nbsp;
  <a href="https://betweenvisits.org/?login">🚀 Start Free Trial</a>
</p>

---

## 🎯 The Problem

Home care agencies track patient status between visits through **paper notes, group texts, and phone calls**. Critical changes in a patient's condition get buried in text threads or lost in handoffs. By the time someone notices, it's an ER visit that could have been prevented.

## 💡 The Solution

BetweenVisits replaces fragmented communication with a structured, AI-powered monitoring system:

> **1.** Caregiver submits a digital check-in → **2.** AI scores risk 0-100 → **3.** Instant alert if risk is elevated

No more missed warning signs. No more information falling through the cracks.

---

## ✨ Features

### 🩺 Core Monitoring
- **Daily Check-In Forms** — Pain levels, mobility, medications, mood, vitals, and free-text notes
- **AI Risk Scoring** — Every check-in analyzed by Claude AI to detect concerning patterns and generate a triage summary
- **Patient Dashboard** — Search, sort, and filter patients by risk level with real-time status

### 🚨 Alerts & Triage
- **Real-Time Triage Queue** — Prioritized list of patients needing attention, sortable by risk level
- **Email Alerts** — Automated notifications via Resend when risk levels spike
- **SMS Alerts** — Text message notifications via Twilio
- **Acknowledge/Resolve Workflow** — Track who responded, when, and what action was taken

### 📄 Reports & Compliance
- **Per-Patient PDF Reports** — Professional reports for doctor visits or family updates
- **Agency-Wide PDF Reports** — Summary reports across all patients
- **HIPAA Audit Logging** — Every PHI access and admin action logged with user, action, resource, IP address, and timestamp
- **Audit Log Viewer** — Admin page with paginated audit trail

### 👥 Team & Access
- **Role-Based Access Control** — Three roles: Admin, Caregiver, Family
- **Caregiver Assignment** — Staff only see their assigned patients
- **Staff Management** — Admins add/remove staff; new staff auto-join on signup
- **Multi-Agency Support** — Full data isolation between agencies

### 🏁 Onboarding & Trial
- **Agency Self-Onboarding** — Sign up → enter agency name → fully provisioned in seconds
- **7-Day Free Trial** — Trial countdown with expiration screen and pricing tiers
- **Demo Mode** — Try the full app with static data, no signup required

### 📱 Design & UX
- **Landing Page** — Hero, features, pricing, contact section, slide-in login panel
- **Mobile Responsive** — Hamburger menu, responsive grids at 1024/768/480px breakpoints
- **Password Strength Meter** — Visual indicator enforcing strong passwords

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND          │  React + Vite → Vercel         │
│  BACKEND           │  Node.js / Express → Render    │
│  DATABASE          │  PostgreSQL via Supabase        │
│  AUTH              │  Supabase Auth (ES256 JWT/JWKS) │
│  AI ENGINE         │  Anthropic Claude API           │
│  EMAIL ALERTS      │  Resend                         │
│  SMS ALERTS        │  Twilio                         │
│  PDF GENERATION    │  PDFKit                         │
└─────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture

```
                        ┌──────────────────────┐
                        │   betweenvisits.org   │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
             ┌──────▼──────┐              ┌───────▼───────┐
             │   Vercel    │              │    Render     │
             │  (React)    │──authFetch──▶│  (Express)    │
             └─────────────┘              └───────┬───────┘
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           │                      │                      │
                    ┌──────▼──────┐       ┌───────▼───────┐      ┌──────▼──────┐
                    │  Supabase   │       │  Claude AI    │      │   Resend    │
                    │  (Postgres) │       │  (Risk Score) │      │   Twilio    │
                    │  (Auth)     │       │  (Triage)     │      │  (Alerts)   │
                    └─────────────┘       └───────────────┘      └─────────────┘
```

### 🔐 Auth Flow
```
Supabase Auth → JWT → authenticateJWT → requireRole() → enforceAgencyScope()
```

### 🆕 Onboarding Flow
```
Signup → /api/me (needs_onboarding: true) → /onboarding → creates agency + staff → /dashboard
```

### ⏱ Trial Flow
```
/api/me (trial_expired: true) → /trial-expired → pricing tiers → "Upgrade Now"
```

---

## 🗄 Database Schema

| Table | Key Columns |
|-------|------------|
| **agencies** | `id`, `name`, `contact_email`, `trial_ends_at` |
| **staff_users** | `id`, `agency_id`, `email`, `first_name`, `last_name`, `role` (admin \| caregiver) |
| **family_users** | `id`, `agency_id`, `patient_id`, `email`, `first_name`, `last_name`, `relationship` |
| **patients** | `id`, `agency_id`, `first_name`, `last_name`, `date_of_birth`, `medical_conditions` (text[]), `medications` (text[]), `risk_level`, `assigned_caregiver_id` |
| **check_ins** | `id`, `patient_id`, `agency_id`, `pain_level`, `mobility`, `mood`, `risk_score`, `ai_summary` |
| **alerts** | `id`, `patient_id`, `risk_score`, `status`, `assigned_to`, `acknowledged_at`, `resolved_at`, `resolution_notes` |
| **audit_log** | `id`, `user_id`, `action`, `resource_type`, `resource_id`, `details` (JSONB), `ip_address` |

> 🔒 Row Level Security enabled on all tables. Full data isolation between agencies.

---

## 📋 Roadmap

### ✅ Completed
- [x] Core monitoring (check-ins, patient list, AI triage)
- [x] Supabase Auth with JWT verification (ES256/JWKS)
- [x] Row Level Security on all tables
- [x] Email alerts (Resend) + SMS alerts (Twilio)
- [x] PDF reports (per-patient and agency-wide)
- [x] Delete patient with cascading deletion
- [x] Triage acknowledge/resolve workflow
- [x] Caregiver assignment
- [x] Landing page with pricing tiers
- [x] Password strength indicator
- [x] Role-based access control (admin, caregiver, family)
- [x] Demo mode (no signup required)
- [x] Mobile responsive design
- [x] Multi-agency support
- [x] Agency self-onboarding
- [x] Staff management
- [x] HIPAA audit logging
- [x] 7-day trial system

### 🔜 Up Next
- [ ] Stripe billing (wire "Upgrade Now" to Stripe Checkout)
- [ ] BAAs with subprocessors
- [ ] Terms of Service / Privacy Policy / BAA template
- [ ] Visual redesign (Figma)

---

## 👨‍💻 About

**Built by Bilal Athar** — solo developer, designed and developed end-to-end.

<p align="center">
  <a href="https://betweenvisits.org/">🌐 betweenvisits.org</a> &nbsp;•&nbsp;
  <a href="mailto:batharbetweenvisits@gmail.com">📧 batharbetweenvisits@gmail.com</a> &nbsp;•&nbsp;
  <a href="https://github.com/batharr41">💻 github.com/batharr41</a>
</p>

---

<p align="center">
  <sub>© 2025 BetweenVisits. All rights reserved. This code is provided for viewing purposes only and may not be copied, modified, or distributed without written permission.</sub>
</p>
