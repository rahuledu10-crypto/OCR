# ExtractAI - Universal Document OCR API PRD

## Original Problem Statement
Build a universal OCR SaaS platform where users upload document images and extract key information. B2B API product with billing, usage limits, and SDKs.

## What's Been Implemented (March 7, 2026)

### Core OCR Engine
- **Gemini 3 Flash Vision** - 17+ document types supported
- ~₹0.14/extraction cost, selling at ₹0.20/extraction

### Backend Features (FastAPI + MongoDB)
- User authentication (JWT)
- **Google OAuth 2.0** (Emergent managed)
- **Forgot Password** flow with email reset
- **Welcome email** on registration
- **Default API key** creation on registration
- API key management (create, list, revoke)
- OCR extraction `/api/v1/extract`
- **Batch extraction** `/api/v1/batch-extract` (up to 10 docs)
- **Usage limits** enforcement per plan
- **Razorpay billing** (test mode - MOCKED)
  - Subscription orders & verification
  - Wallet top-up system
- **Webhooks** system
  - Configure webhook endpoints
  - HMAC signature support
  - Test webhook sending
- Rate limiting per plan

### Frontend (React + Tailwind + Shadcn)
- Landing page with industry-based solutions
- Interactive "Built For Every Industry" section
- Pricing in INR (Free, ₹499, ₹1,999, Custom)
- User auth (email/password + Google OAuth)
- Dashboard, API keys, playground
- Analytics with charts
- **Forgot Password** page
- **404 Not Found** page
- **Support link** in sidebar (mailto:support@extractai.in)
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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google/session` - Google OAuth session exchange
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
- `POST /api/wallet/topup` - Create wallet top-up order
- `POST /api/wallet/verify-topup` - Verify wallet top-up

### Webhooks
- `POST /api/webhooks` - Create webhook config
- `GET /api/webhooks` - List webhooks
- `DELETE /api/webhooks/{id}` - Delete webhook
- `POST /api/webhooks/{id}/test` - Test webhook

### Analytics
- `GET /api/analytics/usage`
- `GET /api/analytics/recent`

## Testing Status (March 7, 2026)
- Backend Auth Tests: 20/20 PASSED (100%)
- Frontend UI Tests: ALL PASSED
- E2E Integration: ALL PASSED

## Supported Document Types
- **ID Documents:** Aadhaar, PAN, DL, Passport, Voter ID
- **Business:** Invoice, PO, Delivery Challan, E-way Bill
- **Financial:** Cheque, Bank Statement, Salary Slip
- **Medical:** Prescription, Lab Report
- **Property:** Rent Agreement, Property Docs

## Target Industries
1. Logistics & Transport
2. Banking & Finance
3. HR & Staffing
4. Healthcare
5. Legal & Property
6. E-Commerce & Retail

## Remaining Backlog

### P0 - Critical
- [ ] Activate Razorpay Billing (replace MOCKED stubs with real integration)
- [ ] Add real Razorpay keys for production

### P1 - Important
- [ ] Frontend billing UI (plan upgrade, wallet top-up)
- [ ] Enforce usage limits at OCR endpoint (currently checks exist)
- [ ] Webhook management UI in dashboard
- [ ] Configure SMTP for production emails

### P2 - Future
- [ ] WhatsApp integration
- [ ] Publish SDKs to PyPI/npm
- [ ] On-premise deployment option

### Refactoring
- [ ] Break `server.py` into modular route files (`/app/backend/routes/`)

## Key Files
- `/app/backend/server.py` - Main API (1400+ lines)
- `/app/backend/ocr_engine.py` - Gemini Vision
- `/app/backend/plans.py` - Pricing config
- `/app/backend/payments.py` - Razorpay (MOCKED)
- `/app/backend/webhooks.py` - Webhook system
- `/app/sdk/python/` - Python SDK
- `/app/sdk/nodejs/` - Node.js SDK

## 3rd Party Integrations
| Integration | Status | Keys Required |
|-------------|--------|---------------|
| Gemini 3 Flash | Active | Emergent LLM Key (configured) |
| Google OAuth | Active | Emergent managed (no user keys) |
| Razorpay | **MOCKED** | Needs `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| SMTP Email | Inactive | Needs `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` |

## Test Reports
- `/app/test_reports/iteration_4.json`
- `/app/test_reports/pytest/pytest_results_auth.xml`
- `/app/backend/tests/test_auth_features.py`
