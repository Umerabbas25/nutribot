# NutriBot 🥗

> AI-powered personal nutrition chatbot — WhatsApp + NestJS + OpenAI

An intelligent dietician that lives on WhatsApp. Users create their health profile on the landing page, then log meals by chatting naturally on WhatsApp and receive instant nutritional analysis and personalised suggestions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL via Neon (free cloud) |
| AI | OpenAI GPT-4o-mini |
| Messaging | WhatsApp Cloud API (Meta) |
| Email | Resend |
| API Docs | Swagger (`/api/docs`) |
| Monitoring | Sentry.io |
| Frontend | Vanilla HTML/CSS/JS |

---

## Quick Start

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your API keys in .env
```

**Required keys:**
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com/api-keys)
- `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` — [Meta Developer Dashboard](https://developers.facebook.com)
- `WHATSAPP_VERIFY_TOKEN` — any string you choose (paste same in Meta dashboard)
- `RESEND_API_KEY` — [resend.com](https://resend.com)
- `SENTRY_DSN` — [sentry.io](https://sentry.io)

### 3. Start Backend

```bash
cd backend
npm run start:dev
```

Server starts at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api/docs`

### 4. Open Frontend

Open `frontend/index.html` in your browser (use VS Code Live Server or any static server).

### 5. Expose Webhook (for WhatsApp)

```bash
# Install ngrok if you don't have it
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`) and paste it as your webhook URL in the Meta Developer Dashboard:

```
Webhook URL: https://abc123.ngrok.io/whatsapp/webhook
Verify Token: <your WHATSAPP_VERIFY_TOKEN from .env>
```

Subscribe to the `messages` field.

---

## Project Structure

```
capstone/
├── backend/
│   ├── src/
│   │   ├── instrument.ts       ← Sentry init (imported first)
│   │   ├── main.ts             ← Bootstrap (Swagger, CORS, validation)
│   │   ├── app.module.ts       ← Root module
│   │   ├── common/
│   │   │   ├── tdee.util.ts    ← BMR/TDEE calculation (Mifflin-St Jeor)
│   │   │   └── sentry.filter.ts ← Global exception filter
│   │   ├── users/              ← Profile management
│   │   ├── whatsapp/           ← Webhook + conversational state machine
│   │   ├── nutrition/          ← OpenAI meal parsing + food logs
│   │   └── email/              ← Resend welcome + weekly summary emails
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html              ← Landing page + multi-step profile form
    ├── style.css               ← Dark mode, glassmorphism design
    └── app.js                  ← Form logic + chat demo animation
```

---

## API Endpoints (Swagger at `/api/docs`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/users/profile` | Create user profile from website |
| `GET` | `/api/users/:phone` | Get profile by WhatsApp number |
| `GET` | `/api/nutrition/:userId/today` | Today's food logs + totals |
| `GET` | `/api/nutrition/:userId/week` | Weekly average stats |
| `GET` | `/api/nutrition/:userId/logs` | All logs from last 7 days |
| `GET` | `/whatsapp/webhook` | Meta webhook verification |
| `POST` | `/whatsapp/webhook` | Receive WhatsApp messages |

---

## WhatsApp Bot Commands

Once chatting with the bot on WhatsApp:

| Message | What it does |
|---|---|
| Any meal description | Log the meal and get AI suggestions |
| `today` or `summary` | Show today's progress vs targets |
| `profile` | View your profile and daily targets |
| `help` | Show all available commands |

---

## Features

- **TDEE Calculation** using Mifflin-St Jeor formula
- **AI meal parsing** — handles natural language, local dishes, multiple items
- **Health-aware suggestions** — diabetes, hypertension, allergies all factored in
- **In-chat onboarding fallback** — works even if users skip the website
- **Weekly email summaries** via Resend (Monday 9am cron)
- **Sentry monitoring** — all errors captured with global exception filter
- **Swagger documentation** — all REST endpoints documented

---

## Assignment Requirements Checklist

- [x] NestJS chatbot with AI (OpenAI GPT-4o-mini)
- [x] Resend email integration (welcome email + weekly cron)
- [x] Swagger documentation (`/api/docs`)
- [x] Sentry.io error monitoring (`@sentry/nestjs`)
- [x] WhatsApp Cloud API integration
- [x] User health profiles with TDEE calculation
- [x] Food logging with macro tracking
- [x] Landing page frontend