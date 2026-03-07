# ExtractAI - Universal Document OCR API PRD

## Original Problem Statement
Build a universal OCR SaaS platform where users upload document images and extract key information. B2B API product with billing, usage limits, and SDKs.

## What's Been Implemented (Feb 21, 2026)

### Core OCR Engine
- ✅ **Gemini 3 Flash Vision** - 17+ document types supported
- ✅ ~₹0.14/extraction cost, selling at ₹0.20/extraction

### Backend Features (FastAPI + MongoDB)
- ✅ User authentication (JWT)
- ✅ API key management (create, list, revoke)
- ✅ OCR extraction `/api/v1/extract`
- ✅ **Batch extraction** `/api/v1/batch-extract` (up to 10 docs)
- ✅ **Usage limits** enforcement per plan
- ✅ **Razorpay billing** (test mode)
  - Subscription orders & verification
  - Wallet top-up system
- ✅ **Webhooks** system
  - Configure webhook endpoints
  - HMAC signature support
  - Test webhook sending
- ✅ Rate limiting per plan

### Frontend (React + Tailwind + Shadcn)
- ✅ Landing page with industry-based solutions
- ✅ Interactive "Built For Every Industry" section
- ✅ Pricing in INR (Free, ₹499, ₹1,999, Custom)
- ✅ User auth, dashboard, API keys, playground
- ✅ Analytics with charts
- ✅ Mobile responsive

### SDKs
- ✅ **Python SDK** (`/app/sdks/python/`)
  - `extractai.py` - Main client
  - Proper error classes
  - Batch support
- ✅ **Node.js SDK** (`/app/sdks/nodejs/`)
  - `index.js` - Main client
  - TypeScript definitions
  - Batch support

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
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

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

## Testing Status
- ✅ Backend: 34/34 tests passed (100%)
- ✅ All new features tested
- ✅ SDKs reviewed

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

### P1 - Next Up
- [ ] Frontend billing UI (plan upgrade, wallet top-up)
- [ ] Add real Razorpay keys for production
- [ ] Webhook management UI in dashboard

### P2 - Future
- [ ] WhatsApp integration
- [ ] Publish SDKs to PyPI/npm
- [ ] On-premise deployment option

## Key Files
- `/app/backend/server.py` - Main API
- `/app/backend/ocr_engine.py` - Gemini Vision
- `/app/backend/plans.py` - Pricing config
- `/app/backend/payments.py` - Razorpay
- `/app/backend/webhooks.py` - Webhook system
- `/app/sdks/python/` - Python SDK
- `/app/sdks/nodejs/` - Node.js SDK
