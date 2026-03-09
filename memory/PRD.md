# ExtractAI - Product Requirements Document (PRD)
## Complete Technical Handover Documentation

**Version:** 1.0  
**Last Updated:** March 2025  
**Status:** Production Ready (with noted mocked features)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Environment Setup](#5-environment-setup)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Authentication & Security](#9-authentication--security)
10. [OCR Engine](#10-ocr-engine)
11. [Billing & Subscriptions](#11-billing--subscriptions)
12. [What's Implemented vs Mocked](#12-whats-implemented-vs-mocked)
13. [Testing](#13-testing)
14. [Deployment](#14-deployment)
15. [SDKs](#15-sdks)
16. [Future Roadmap](#16-future-roadmap)
17. [Known Issues & Limitations](#17-known-issues--limitations)
18. [Contact & Support](#18-contact--support)

---

## 1. Executive Summary

**ExtractAI** is a B2B SaaS platform providing document OCR (Optical Character Recognition) via API. Users can extract structured data from 17+ Indian document types including Aadhaar, PAN, Driving License, Invoices, Cheques, and more.

### Business Model
- **Freemium**: 100 free extractions (one-time)
- **Subscription**: Monthly plans (₹499, ₹1,999, Custom)
- **Pay-as-you-go**: ₹0.20 per extraction beyond plan limits

### Target Market
- Indian B2B companies needing KYC/document verification
- Fintech, Logistics, HR Tech, Healthcare, Legal Tech

---

## 2. Product Overview

### Core Value Proposition
Single API call to extract structured data from any supported document.

### Key Features
| Feature | Status |
|---------|--------|
| Single document extraction | ✅ Live |
| Batch extraction (up to 10 docs) | ✅ Live |
| 17+ document types | ✅ Live |
| API key management | ✅ Live |
| Usage analytics | ✅ Live |
| Multi-tier pricing | ✅ Live |
| Razorpay payments | ✅ Live (requires API keys) |
| Google OAuth | ✅ Live |
| Email notifications | ✅ Live (via Resend API) |
| Webhooks | ✅ Live |

### Supported Document Types
```
ID Documents:
- Aadhaar Card
- PAN Card
- Driving License (DL)
- Passport
- Voter ID

Financial Documents:
- Invoice
- Cheque
- Bank Statement
- Salary Slip

Business Documents:
- Purchase Order
- Delivery Challan
- E-way Bill

Other:
- Medical Prescription
- Lab Report
- Rent Agreement
- Property Documents
```

---

## 3. Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   React + Tailwind + Shadcn                  │
│                      (Port 3000)                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX INGRESS                            │
│              /api/* → Backend (8001)                         │
│              /* → Frontend (3000)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                   FastAPI + Python                           │
│                      (Port 8001)                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │   OCR   │  │ Billing │  │Webhooks │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   MongoDB   │ │ Gemini 3    │ │  Razorpay   │
│  (Primary)  │ │   Flash     │ │  (Mocked)   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Directory Structure
```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application (1400+ lines)
│   ├── ocr_engine.py       # Gemini 3 Flash OCR logic
│   ├── plans.py            # Pricing plan configurations
│   ├── payments.py         # Razorpay integration (MOCKED)
│   ├── webhooks.py         # Webhook sending logic
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Environment variables
│   └── tests/              # Pytest test files
│       └── test_auth_features.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx         # Marketing homepage
│   │   │   ├── LoginPage.jsx           # User login
│   │   │   ├── RegisterPage.jsx        # User registration
│   │   │   ├── ForgotPasswordPage.jsx  # Password reset request
│   │   │   ├── ResetPasswordPage.jsx   # Password reset form
│   │   │   ├── DashboardOverview.jsx   # Main dashboard
│   │   │   ├── PlaygroundPage.jsx      # OCR testing UI
│   │   │   ├── APIKeysPage.jsx         # API key management
│   │   │   ├── AnalyticsPage.jsx       # Usage analytics
│   │   │   ├── DocsPage.jsx            # Dashboard docs
│   │   │   ├── SupportPage.jsx         # Support & FAQ
│   │   │   ├── PublicDocsPage.jsx      # Public API docs
│   │   │   ├── TermsPage.jsx           # Terms of Service
│   │   │   ├── PrivacyPage.jsx         # Privacy Policy
│   │   │   └── NotFoundPage.jsx        # 404 page
│   │   ├── components/
│   │   │   ├── ui/                     # Shadcn components
│   │   │   ├── DashboardLayout.jsx     # Dashboard wrapper
│   │   │   ├── PlanUpgradeModal.jsx    # Subscription modal
│   │   │   ├── OnboardingFlow.jsx      # New user onboarding
│   │   │   ├── GoogleLoginButton.jsx   # OAuth button (mocked)
│   │   │   └── GlobalUpgradeModal.jsx  # 429 error handler
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Auth state management
│   │   │   └── UpgradeModalContext.jsx # Global modal state
│   │   ├── App.js                      # Route definitions
│   │   └── App.css                     # Global styles
│   ├── public/
│   │   └── index.html                  # HTML template
│   ├── package.json
│   └── .env
│
├── sdks/
│   ├── python/
│   │   ├── extractai.py    # Python SDK
│   │   └── README.md
│   └── nodejs/
│       ├── index.js        # Node.js SDK
│       └── README.md
│
├── memory/
│   └── PRD.md              # This document
│
└── test_reports/
    └── iteration_*.json    # Test results
```

---

## 4. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.104+ |
| Language | Python | 3.11+ |
| Database | MongoDB | 6.0+ |
| ODM | Motor (async) | 3.3+ |
| Auth | JWT (PyJWT) | 2.8+ |
| Password Hashing | Bcrypt | 4.0+ |
| OCR Engine | Gemini 3 Flash | Latest |
| HTTP Client | HTTPX | 0.25+ |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.2+ |
| Routing | React Router | 6.x |
| Styling | Tailwind CSS | 3.3+ |
| UI Components | Shadcn/UI | Latest |
| Charts | Recharts | 2.x |
| Animations | Framer Motion | 10.x |
| HTTP Client | Axios | 1.x |
| Toasts | Sonner | Latest |
| Icons | Lucide React | Latest |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Process Manager | Supervisor |
| Reverse Proxy | Nginx |
| Container | Kubernetes |

---

## 5. Environment Setup

### Backend Environment Variables (`/app/backend/.env`)
```env
# Database (REQUIRED - DO NOT CHANGE)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="extractai"

# JWT Authentication
JWT_SECRET="your-secure-secret-key-here"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS=24

# OCR Engine (REQUIRED)
EMERGENT_API_KEY="your-emergent-llm-key"

# Razorpay (MOCKED - Add for production)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# SMTP Email (MOCKED - Add for production)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@extractai.io"

# Google OAuth (MOCKED - Add for production)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Frontend Environment Variables (`/app/frontend/.env`)
```env
# Backend API URL (REQUIRED - DO NOT CHANGE)
REACT_APP_BACKEND_URL="https://your-domain.com"
```

### Installing Dependencies

**Backend:**
```bash
cd /app/backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd /app/frontend
yarn install
```

### Running Services

**Using Supervisor (Production):**
```bash
sudo supervisorctl start backend frontend
sudo supervisorctl status
```

**Manual (Development):**
```bash
# Backend
cd /app/backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd /app/frontend && yarn start
```

---

## 6. Database Schema

### Collections

#### `users`
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hash),
  company_name: String (optional),
  google_id: String (optional, for OAuth),
  plan: String (default: "free"),
  wallet_balance: Number (default: 0),
  usage: {
    extractions_used: Number,
    extractions_limit: Number,
    period_start: ISODate,
    period_end: ISODate
  },
  created_at: ISODate,
  updated_at: ISODate
}
```

#### `api_keys`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (indexed),
  key: String (unique, format: "ocr_xxxxxx"),
  key_prefix: String (first 12 chars for display),
  name: String,
  rate_limit: Number (requests per minute),
  is_active: Boolean (default: true),
  created_at: ISODate,
  last_used_at: ISODate
}
```

#### `extractions`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (indexed),
  api_key_id: ObjectId,
  document_type: String,
  success: Boolean,
  confidence: Number,
  processing_time_ms: Number,
  timestamp: ISODate (indexed),
  batch_id: String (optional)
}
```

#### `password_reset_tokens`
```javascript
{
  _id: ObjectId,
  email: String (indexed),
  token: String (unique),
  expires_at: ISODate,
  used: Boolean (default: false)
}
```

#### `webhooks`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (indexed),
  url: String,
  secret: String (for HMAC signing),
  events: Array<String>,
  is_active: Boolean,
  created_at: ISODate
}
```

### Indexes
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })

// API Keys
db.api_keys.createIndex({ key: 1 }, { unique: true })
db.api_keys.createIndex({ user_id: 1 })

// Extractions
db.extractions.createIndex({ user_id: 1, timestamp: -1 })
db.extractions.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
```

---

## 7. API Reference

### Base URL
- **Production:** `https://api.extractai.io`
- **Preview:** Value from `REACT_APP_BACKEND_URL`

### Authentication

All API endpoints (except auth) require authentication via:
- **JWT Token:** `Authorization: Bearer <token>` (for dashboard/web)
- **API Key:** `X-API-Key: <key>` (for API integrations)

---

### Auth Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min8chars",
  "company_name": "Optional Company"
}

Response 200:
{
  "access_token": "jwt.token.here",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "...",
    "plan": "free"
  },
  "message": "You have 100 free extractions to get started!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "access_token": "jwt.token.here",
  "token_type": "bearer",
  "user": { ... }
}

Response 401:
{
  "detail": "Invalid credentials"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{
  "id": "...",
  "email": "...",
  "company_name": "...",
  "plan": "free",
  "created_at": "..."
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "If an account exists, a reset link has been sent"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}

Response 200:
{
  "message": "Password reset successful"
}

Response 400:
{
  "detail": "Invalid or expired token"
}
```

---

### OCR Endpoints

#### Single Extraction
```http
POST /api/v1/extract
X-API-Key: ocr_xxxxxxxxxxxxxx
Content-Type: application/json

{
  "image_base64": "base64-encoded-image",
  "document_type": "aadhaar"  // or "pan", "dl", "auto", etc.
}

Response 200:
{
  "id": "extraction-uuid",
  "document_type": "aadhaar",
  "extracted_data": {
    "name": "JOHN DOE",
    "aadhaar_number": "XXXX XXXX 1234",
    "dob": "01/01/1990",
    "gender": "Male",
    "address": "..."
  },
  "confidence": 0.95,
  "processing_time_ms": 2500,
  "timestamp": "2025-03-07T12:00:00Z"
}
```

#### Batch Extraction
```http
POST /api/v1/batch-extract
X-API-Key: ocr_xxxxxxxxxxxxxx
Content-Type: application/json

{
  "images": [
    {
      "image_base64": "...",
      "document_type": "aadhaar"
    },
    {
      "image_base64": "...",
      "document_type": "pan"
    }
  ]
}

Response 200:
{
  "batch_id": "batch-uuid",
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "document_type": "aadhaar",
      "extracted_data": { ... },
      "confidence": 0.95
    },
    {
      "index": 1,
      "success": true,
      "document_type": "pan",
      "extracted_data": { ... },
      "confidence": 0.92
    }
  ],
  "processing_time_ms": 4500
}
```

#### Playground Extraction (JWT Auth)
```http
POST /api/playground/extract
Authorization: Bearer <token>
Content-Type: application/json

{
  "image_base64": "...",
  "document_type": null  // auto-detect
}
```

---

### API Key Endpoints

#### List Keys
```http
GET /api/keys
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "...",
    "name": "Default Key",
    "key_prefix": "ocr_abc123...",
    "rate_limit": 100,
    "is_active": true,
    "created_at": "...",
    "last_used_at": "..."
  }
]
```

#### Create Key
```http
POST /api/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Key",
  "rate_limit": 100
}

Response 200:
{
  "id": "...",
  "name": "Production Key",
  "key": "ocr_full_key_shown_only_once",
  "key_prefix": "ocr_xxxxxx...",
  "rate_limit": 100,
  "created_at": "..."
}
```

#### Revoke Key
```http
DELETE /api/keys/{key_id}
Authorization: Bearer <token>

Response 200:
{
  "message": "API key revoked"
}
```

---

### Subscription & Billing Endpoints

#### Get Plans
```http
GET /api/plans

Response 200:
[
  {
    "id": "free",
    "name": "Free",
    "price_inr": 0,
    "extractions_limit": 100,
    "rate_limit": 10,
    "features": [...]
  },
  {
    "id": "starter",
    "name": "Starter",
    "price_inr": 499,
    "extractions_limit": 1000,
    "rate_limit": 30,
    "features": [...]
  },
  ...
]
```

#### Get Subscription
```http
GET /api/subscription
Authorization: Bearer <token>

Response 200:
{
  "plan": "free",
  "plan_details": { ... },
  "usage": {
    "extractions_used": 45,
    "extractions_limit": 100,
    "remaining": 55
  },
  "wallet_balance": 0,
  "period_start": "...",
  "period_end": "..."
}
```

#### Create Subscription Order (MOCKED)
```http
POST /api/subscription/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "starter"
}

Response 200:
{
  "order_id": "order_xxx",
  "amount": 49900,
  "currency": "INR",
  "key_id": "rzp_test_xxx"
}
```

---

### Analytics Endpoints

#### Usage Stats
```http
GET /api/analytics/usage
Authorization: Bearer <token>

Response 200:
{
  "total_requests": 150,
  "successful_requests": 142,
  "failed_requests": 8,
  "document_breakdown": {
    "aadhaar": 50,
    "pan": 40,
    "invoice": 30,
    "other": 30
  },
  "daily_usage": [
    { "date": "2025-03-01", "count": 20 },
    ...
  ]
}
```

#### Recent Extractions
```http
GET /api/analytics/recent?limit=20
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "...",
    "document_type": "aadhaar",
    "success": true,
    "confidence": 0.95,
    "processing_time_ms": 2500,
    "timestamp": "..."
  },
  ...
]
```

---

### Webhook Endpoints

#### List Webhooks
```http
GET /api/webhooks
Authorization: Bearer <token>
```

#### Create Webhook
```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["extraction.completed", "extraction.failed"],
  "secret": "your-webhook-secret"
}
```

#### Test Webhook
```http
POST /api/webhooks/{webhook_id}/test
Authorization: Bearer <token>
```

---

### Health Check
```http
GET /api/health

Response 200:
{
  "status": "healthy",
  "timestamp": "2025-03-07T12:00:00Z"
}
```

---

## 8. Frontend Pages & Components

### Public Pages (No Auth Required)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage.jsx` | Marketing homepage with pricing |
| `/login` | `LoginPage.jsx` | User login form |
| `/register` | `RegisterPage.jsx` | User registration |
| `/forgot-password` | `ForgotPasswordPage.jsx` | Request password reset |
| `/reset-password` | `ResetPasswordPage.jsx` | Set new password |
| `/docs` | `PublicDocsPage.jsx` | Public API documentation |
| `/terms` | `TermsPage.jsx` | Terms of Service |
| `/privacy` | `PrivacyPage.jsx` | Privacy Policy |
| `/*` | `NotFoundPage.jsx` | 404 error page |

### Dashboard Pages (Auth Required)
| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `DashboardOverview.jsx` | Main dashboard with stats |
| `/dashboard/keys` | `APIKeysPage.jsx` | API key management |
| `/dashboard/playground` | `PlaygroundPage.jsx` | OCR testing interface |
| `/dashboard/analytics` | `AnalyticsPage.jsx` | Usage charts & metrics |
| `/dashboard/docs` | `DocsPage.jsx` | Dashboard documentation |
| `/dashboard/support` | `SupportPage.jsx` | Support & FAQ |

### Key Components
| Component | Description |
|-----------|-------------|
| `DashboardLayout.jsx` | Sidebar + navbar wrapper |
| `PlanUpgradeModal.jsx` | Subscription upgrade modal |
| `OnboardingFlow.jsx` | 3-step new user guide |
| `GoogleLoginButton.jsx` | OAuth button (mocked) |
| `GlobalUpgradeModal.jsx` | Auto-opens on 429 errors |

### State Management
- **AuthContext:** User authentication state, login/logout functions
- **UpgradeModalContext:** Global upgrade modal trigger (for 429 errors)

---

## 9. Authentication & Security

### JWT Implementation
- **Algorithm:** HS256
- **Expiration:** 24 hours
- **Payload:** `{ sub: user_email, exp: timestamp }`

### Password Security
- **Hashing:** Bcrypt with auto-generated salt
- **Minimum Length:** 8 characters
- **Reset Tokens:** UUID4, expires in 1 hour

### API Key Security
- **Format:** `ocr_` + 32 random alphanumeric characters
- **Storage:** Full key shown once, only prefix stored/displayed
- **Rate Limiting:** Per-key configurable (default: 100 req/min)

### Security Headers
- CORS enabled for frontend domain
- No sensitive data in URL parameters
- MongoDB `_id` excluded from all API responses

---

## 10. OCR Engine

### Technology
**Gemini 3 Flash Vision** via Emergent LLM Key

### How It Works
1. Image received as base64
2. Sent to Gemini 3 Flash with document-type-specific prompt
3. AI extracts structured fields
4. Response parsed and returned

### Prompts by Document Type
```python
DOCUMENT_PROMPTS = {
    "aadhaar": "Extract: name, aadhaar_number, dob, gender, address",
    "pan": "Extract: name, pan_number, father_name, dob",
    "dl": "Extract: name, dl_number, dob, validity, address, vehicle_classes",
    "invoice": "Extract: invoice_number, date, vendor, items, total, gst",
    # ... etc
}
```

### Cost Analysis
- **Gemini 3 Flash:** ~₹0.14 per extraction
- **Selling Price:** ₹0.20 per extraction
- **Margin:** ~30%

---

## 11. Billing & Subscriptions

### Pricing Plans
| Plan | Price | Extractions | Rate Limit | Features |
|------|-------|-------------|------------|----------|
| Free | ₹0 | 100 (one-time) | 10/min | Basic docs |
| Starter | ₹499/mo | 1,000/mo | 30/min | All docs, batch |
| Growth | ₹1,999/mo | 5,000/mo | 100/min | Priority support, webhooks |
| Enterprise | Custom | Unlimited | 500/min | Custom integrations |

### Pay-As-You-Go
- Charged when exceeding plan limits
- Rate: ₹0.20 per extraction
- Deducted from wallet balance

### Payment Gateway (MOCKED)
- **Provider:** Razorpay
- **Status:** Placeholder endpoints exist, no real integration
- **To Enable:** Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`

---

## 12. What's Implemented vs Mocked

### ✅ Fully Implemented
- User registration & login (email/password)
- JWT authentication
- API key management (create, revoke)
- OCR extraction (single & batch)
- Usage tracking & analytics
- Dashboard with all pages
- Pricing display
- Terms & Privacy pages
- Support page with FAQ
- 404 page
- Mobile responsive design
- Empty states for new users
- Webhook configuration

### 🟡 Mocked (Shows Toast/Placeholder)
| Feature | Current Behavior | To Enable |
|---------|------------------|-----------|
| Google OAuth | Shows "Coming soon" toast | Add Google credentials |
| Razorpay Payments | Shows "Coming soon" toast | Add Razorpay keys |
| Email Sending | Skipped silently | Add SMTP credentials |
| Support Form | Shows success toast | Integrate email service |

### 🔴 Not Implemented
- WhatsApp integration
- On-premise deployment option
- SDK publishing (PyPI/npm)

---

## 13. Testing

### Test Files Location
```
/app/backend/tests/
/app/test_reports/
```

### Running Tests
```bash
# Backend tests
cd /app/backend
pytest tests/ -v

# Full E2E (via testing agent)
# See /app/test_reports/iteration_8.json for latest results
```

### Test Coverage
- **Auth flows:** 6/6 passing
- **OCR flows:** 6/6 passing
- **API Key flows:** 4/4 passing
- **Billing flows:** 4/4 passing
- **Navigation flows:** 7/7 passing
- **Domain verification:** 3/3 passing
- **Total:** 30/30 PASSING

### Key Test IDs (for Playwright)
```
data-testid="register-email-input"
data-testid="register-password-input"
data-testid="login-submit-btn"
data-testid="upgrade-plan-btn"
data-testid="plan-upgrade-modal"
data-testid="usage-counter"
data-testid="credits-badge"
data-testid="create-key-btn"
data-testid="support-submit-btn"
data-testid="faq-item-0"
```

---

## 14. Deployment

### Current Setup (Preview)
- Kubernetes cluster with Supervisor-managed processes
- Nginx reverse proxy for routing
- MongoDB local instance

### Production Checklist
1. [ ] Set production `JWT_SECRET`
2. [ ] Add Razorpay production keys
3. [ ] Configure SMTP for emails
4. [ ] Set up Google OAuth redirect URI
5. [ ] Configure DNS for `extractai.io`
6. [ ] Enable HTTPS certificates
7. [ ] Set up MongoDB replica set
8. [ ] Configure backup strategy
9. [ ] Set up monitoring/alerting

### Environment-Specific Configs
```
Production:
- REACT_APP_BACKEND_URL=https://api.extractai.io
- MongoDB Atlas or managed instance
- Razorpay live keys

Staging:
- REACT_APP_BACKEND_URL=https://staging.extractai.io
- Razorpay test keys
```

---

## 15. SDKs

### Python SDK
**Location:** `/app/sdks/python/`

```python
from extractai import ExtractAI

client = ExtractAI(api_key="ocr_xxx")

# Single extraction
result = client.extract(
    image_path="./aadhaar.jpg",
    document_type="aadhaar"
)

# Batch extraction
results = client.batch_extract([
    {"image_base64": "...", "document_type": "aadhaar"},
    {"image_base64": "...", "document_type": "pan"},
])
```

### Node.js SDK
**Location:** `/app/sdks/nodejs/`

```javascript
const ExtractAI = require('extractai');

const client = new ExtractAI({ apiKey: 'ocr_xxx' });

// Single extraction
const result = await client.extract({
  imagePath: './aadhaar.jpg',
  documentType: 'aadhaar'
});
```

### Publishing (TODO)
- Python: Publish to PyPI
- Node.js: Publish to npm

---

## 16. Future Roadmap

### P0 - Critical (Before Revenue)
- [ ] Wire Razorpay for real payments
- [ ] Configure SMTP for transactional emails
- [ ] Enable Google OAuth with production redirect

### P1 - Important
- [ ] Webhook management UI in dashboard
- [ ] Usage limit enforcement at extraction endpoint
- [ ] Email templates for welcome/reset/invoice

### P2 - Nice to Have
- [ ] WhatsApp notifications
- [ ] Publish SDKs to package managers
- [ ] Admin dashboard for support team
- [ ] Multi-language support

### P3 - Future
- [ ] On-premise deployment option
- [ ] Custom model training
- [ ] Document comparison feature
- [ ] Audit logs

---

## 17. Known Issues & Limitations

### Limitations
1. **Batch limit:** Maximum 10 documents per request
2. **Image size:** Recommended < 5MB per image
3. **Rate limits:** Enforced per API key
4. **OCR accuracy:** Depends on image quality

### Known Issues
1. OCR may return low confidence for poor quality images
2. Handwritten text extraction is limited
3. Multi-page documents not supported (extract page by page)

### Error Codes
| Code | Meaning |
|------|---------|
| 400 | Bad request (invalid image, missing fields) |
| 401 | Unauthorized (invalid token/key) |
| 403 | Forbidden (key revoked) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## 18. Contact & Support

### Domains
- **Website:** https://extractai.io
- **API:** https://api.extractai.io
- **Docs:** https://docs.extractai.io

### Email
- **Support:** support@extractai.io
- **Sales:** sales@extractai.io
- **Legal:** legal@extractai.io
- **Privacy:** privacy@extractai.io

### Internal
- **Codebase:** This repository
- **Test Reports:** `/app/test_reports/`
- **PRD:** `/app/memory/PRD.md`

---

## Appendix: Quick Commands

```bash
# Check service status
sudo supervisorctl status

# Restart backend
sudo supervisorctl restart backend

# Restart frontend
sudo supervisorctl restart frontend

# View backend logs
tail -f /var/log/supervisor/backend.err.log

# View frontend logs
tail -f /var/log/supervisor/frontend.err.log

# Run backend tests
cd /app/backend && pytest tests/ -v

# Check MongoDB
mongosh --eval "db.users.countDocuments()"

# API health check
curl https://your-domain.com/api/health
```

---

## Changelog

### March 9, 2026

**Razorpay Payment Integration**
- Wired PlanUpgradeModal to backend Razorpay payment endpoints
- Full payment flow: click Subscribe → `/api/subscription/create-order` → Razorpay checkout → `/api/subscription/verify-payment`
- Razorpay SDK loaded dynamically in modal
- Test mode supported with mock orders when using placeholder keys
- All tests passing (100% backend, 100% frontend)

**Required Environment Variables for Live Payments:**
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret

**Files Modified:**
- `/app/frontend/src/components/PlanUpgradeModal.jsx` - Integrated with Razorpay API

---

**Google OAuth Profile Completion Feature**
- Fixed Google OAuth flow to properly redirect users to dashboard after login
- Added `ProfileCompletionModal` component to collect company_name from new Google users
- Differentiated Google button text: "Continue with Google" (Login) vs "Sign up with Google" (Register)
- Added backend endpoint `PATCH /api/users/me/complete-profile`
- Updated user schema to store Google `name` separately from `company_name`
- All tests passing (100% backend, 100% frontend)

**Files Modified:**
- `/app/frontend/src/components/GoogleLoginButton.jsx` - Added `variant` prop
- `/app/frontend/src/components/ProfileCompletionModal.jsx` - New component
- `/app/frontend/src/pages/GoogleCallbackPage.jsx` - Show modal for new users
- `/app/frontend/src/pages/RegisterPage.jsx` - Use variant="register"
- `/app/backend/server.py` - Added profile completion endpoint, updated user schema

---

**Document Version:** 1.2  
**Maintained By:** ExtractAI Engineering  
**Last Review:** March 2026
