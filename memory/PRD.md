# ExtractAI - Universal Document OCR API PRD

## Original Problem Statement
Build a universal OCR SaaS platform where users upload document images and extract key information. B2B API product with billing, usage limits, and SDKs.

## What's Been Implemented (March 7, 2026)

### Core OCR Engine
- **Gemini 3 Flash Vision** - 17+ document types supported
- ~₹0.14/extraction cost, selling at ₹0.20/extraction

### Backend Features (FastAPI + MongoDB)
- User authentication (JWT)
- **Google OAuth 2.0** (disabled until deployment - shows toast)
- **Forgot Password** flow with email reset
- **Welcome email** on registration (requires SMTP config)
- **Default API key** creation on registration
- API key management (create, list, revoke)
- OCR extraction `/api/v1/extract`
- **Batch extraction** `/api/v1/batch-extract` (up to 10 docs)
- **Usage limits** enforcement per plan
- **Razorpay billing** (MOCKED - shows toast)
- **Webhooks** system
- Rate limiting per plan

### Frontend (React + Tailwind + Shadcn)
- **Landing Page** - Hero, Features, Solutions (6 industries), Pricing (4 plans INR)
- **Mobile responsive** - Hamburger menu on small screens
- Interactive "Built For Every Industry" section
- User auth (email/password)
- **Plan Upgrade Modal** - 4 plans with Subscribe buttons (MOCKED)
- **Usage Meter** - Progress bar showing "X / Y extractions used"
- **Credits Badge** - Remaining extractions in top navbar
- **Support Page** - Contact form with FAQ section
- Dashboard, API keys, playground, analytics, docs
- **Forgot Password** page
- **404 Not Found** page
- Mobile responsive

### SDKs
- **Python SDK** (`/app/sdk/python/`)
- **Node.js SDK** (`/app/sdk/nodejs/`)

### Pricing Plans
| Plan | Price | Extractions | Rate Limit |
|------|-------|-------------|------------|
| Free | ₹0 | 100 (one-time) | 10/min |
| Starter | ₹499/mo | 1,000 | 30/min |
| Growth | ₹1,999/mo | 5,000 | 100/min |
| Enterprise | Custom | Unlimited | 500/min |

**Pay-as-you-go:** ₹0.20/extraction (from wallet)

## Production Readiness Audit (March 7, 2026)

### What's Working
- Landing page with all sections
- Mobile hamburger menu
- User registration with email validation (8 char password)
- User login with error handling
- Forgot password flow
- Dashboard with usage meter and credits badge
- Playground OCR extraction (Gemini 3 Flash)
- API Keys management (create, copy, revoke)
- Analytics page with charts
- Support page with contact form and FAQ
- Plan upgrade modal
- 404 page
- Logout flow

### What's MOCKED (Ready for Production Config)
1. **Google OAuth** - Shows "Coming soon" toast (needs real deployment URL)
2. **Razorpay Payments** - Shows toast (needs `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
3. **Email (SMTP)** - Skipped (needs `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`)
4. **Support Form** - Shows success toast (needs email service integration)

### Quality Audit Results
- Browser tab title: "ExtractAI - Document OCR API" ✅
- Favicon: SVG icon ✅
- Footer copyright: 2025 ✅
- No console errors ✅
- All buttons clickable ✅
- Loading states on async operations ✅
- Error handling with toast notifications ✅
- Mobile responsive ✅

## API Endpoints

### Authentication
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google/session` - Google OAuth (disabled)
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/me` - Get current user

### API Keys
- `GET, POST, DELETE /api/keys`

### OCR Extraction
- `POST /api/v1/extract` - Single document
- `POST /api/v1/batch-extract` - Batch (max 10)
- `POST /api/playground/extract` - Dashboard testing

### Billing & Subscription
- `GET /api/plans` - List all plans
- `GET /api/subscription` - Current subscription
- `POST /api/subscription/create-order` - Create Razorpay order
- `POST /api/subscription/verify-payment` - Verify & activate
- `POST /api/wallet/topup` - Create wallet top-up
- `POST /api/wallet/verify-topup` - Verify top-up

### Webhooks
- `POST /api/webhooks` - Create webhook config
- `GET /api/webhooks` - List webhooks
- `DELETE /api/webhooks/{id}` - Delete webhook
- `POST /api/webhooks/{id}/test` - Test webhook

### Analytics
- `GET /api/analytics/usage`
- `GET /api/analytics/recent`

## Testing Status (Final)
- Backend Auth Tests: 20/20 PASSED (100%)
- Frontend Critical Flows: ALL PASSED
- Production Readiness: READY (with noted mocked features)

## Supported Document Types
- **ID Documents:** Aadhaar, PAN, DL, Passport, Voter ID
- **Business:** Invoice, PO, Delivery Challan, E-way Bill
- **Financial:** Cheque, Bank Statement, Salary Slip
- **Medical:** Prescription, Lab Report
- **Property:** Rent Agreement, Property Docs

## Key Files
- `/app/backend/server.py` - Main API
- `/app/backend/ocr_engine.py` - Gemini Vision
- `/app/frontend/src/pages/LandingPage.jsx` - Marketing page
- `/app/frontend/src/pages/SupportPage.jsx` - Support & FAQ
- `/app/frontend/src/components/PlanUpgradeModal.jsx` - Upgrade modal

## 3rd Party Integrations Status
| Integration | Status | Required Keys |
|-------------|--------|---------------|
| Gemini 3 Flash | Active | Emergent LLM Key (configured) |
| Google OAuth | MOCKED | Needs deployment URL |
| Razorpay | MOCKED | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| SMTP Email | MOCKED | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` |

## Post-Deployment Checklist
1. Configure Google OAuth redirect URL
2. Add Razorpay production keys
3. Configure SMTP for transactional emails
4. Update domain in email templates
5. Remove "(Coming soon)" from Google button
