# ExtractAI - OCR API System PRD

## Original Problem Statement
Build an OCR system where users upload document images (Aadhaar, PAN, Driving License, Passport, Voter ID) and it extracts key information. This is a B2B SaaS product where customers integrate directly with the API system.

## User Personas
1. **B2B Developer** - Integrates OCR API into their KYC/verification workflows
2. **Product Manager** - Monitors usage, manages API keys, reviews analytics
3. **Compliance Officer** - Needs audit trails and usage reports

## Core Requirements (Static)
- Document OCR extraction (Aadhaar, PAN, DL, Passport, Voter ID)
- API key-based authentication for B2B customers
- Usage analytics and monitoring
- Rate limiting per API key
- Dashboard for key management

## What's Been Implemented (Feb 21, 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT-based for dashboard)
- ✅ API key management (create, list, revoke)
- ✅ OCR extraction endpoint `/api/v1/extract` using **Gemini 3 Flash Vision**
- ✅ Playground endpoint `/api/playground/extract` for testing
- ✅ Rate limiting per API key
- ✅ Usage analytics endpoints
- ✅ MongoDB persistence for all data

### Frontend (React + Tailwind + Shadcn)
- ✅ Landing page with hero, features, pricing (INR), CTAs
- ✅ User registration and login flows
- ✅ Dashboard with usage overview
- ✅ API Keys management page
- ✅ API Playground for testing OCR
- ✅ Analytics page with charts
- ✅ API Documentation page

### Integrations
- ✅ **Gemini 3 Flash Vision** via Emergent LLM Key (~₹0.14/extraction cost)
- ✅ MongoDB for data persistence

### Pricing (Updated Feb 21, 2026)
| Tier | Price | Extractions |
|------|-------|-------------|
| Free | ₹0/month | 100 |
| Starter | ₹499/month | 1,000 |
| Growth | ₹1,999/month | 5,000 |
| Enterprise | Custom | Unlimited |

**Per extraction cost to user:** ₹0.20 (launch price)
**Our cost:** ~₹0.14/extraction
**Margin:** ~30-40%

## Testing Status
- ✅ Backend: 31/31 tests passed (100%)
- ✅ Frontend: All pages and flows tested
- ✅ Mobile responsiveness verified
- ✅ Production ready

## Prioritized Backlog

### P0 (Critical - Next)
- [ ] Add Stripe/Razorpay billing integration for INR payments
- [ ] Implement usage limits enforcement based on plan
- [ ] Add prepaid credits/wallet system

### P1 (Important)
- [ ] SDK generation (Python, Node.js)
- [ ] Batch processing for multiple documents
- [ ] WhatsApp integration for Enterprise tier
- [ ] Webhook notifications for async processing

### P2 (Nice to Have)
- [ ] On-premise deployment option
- [ ] Custom model fine-tuning
- [ ] Multi-language document support

## Key Files
- `/app/backend/server.py` - Main FastAPI app
- `/app/backend/ocr_engine.py` - Gemini 3 Flash Vision integration
- `/app/frontend/src/pages/LandingPage.jsx` - Landing page with pricing
- `/app/frontend/src/pages/Dashboard.jsx` - User dashboard

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET, POST, DELETE /api/keys` - API key management
- `POST /api/v1/extract` - OCR extraction (API key auth)
- `POST /api/playground/extract` - OCR testing (JWT auth)
- `GET /api/analytics/usage` - Usage statistics
- `GET /api/analytics/recent` - Recent extractions
