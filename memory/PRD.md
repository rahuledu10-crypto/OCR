# ExtractAI - Universal Document OCR API PRD

## Original Problem Statement
Build a universal OCR system where users upload document images and extract key information. This is a B2B SaaS product where customers integrate directly with the API system at ₹0.20/extraction.

## User Personas
1. **B2B Developer** - Integrates OCR API into their KYC/verification workflows
2. **Product Manager** - Monitors usage, manages API keys, reviews analytics
3. **Compliance Officer** - Needs audit trails and usage reports

## Supported Document Types (17 Total)

### Indian ID Documents
- Aadhaar Card (12-digit UID, Name, DOB, Address)
- PAN Card (PAN Number, Name, Father's Name, DOB)
- Driving License (DL Number, Validity, Vehicle Class)
- Passport (Passport Number, Name, Dates)
- Voter ID (EPIC Number, Name, Details)

### Business Documents
- Invoice (Invoice No, Items, GST, Total Amount)
- Purchase Order (PO Number, Vendor, Items)
- Delivery Challan (Challan No, Items, Receiver)
- E-way Bill (Bill Number, From/To, Vehicle)

### Financial Documents
- Bank Cheque (Cheque No, Payee, Amount, Bank Details)
- Bank Statement (Account Details, Transactions)
- Salary Slip (Employee Info, Salary Breakdown)

### Property & Legal
- Rent Agreement (Landlord, Tenant, Rent, Duration)
- Property Document (Survey No, Owner, Area)

### Medical Documents
- Prescription (Doctor, Patient, Medicines)
- Lab Report (Tests, Results, Reference Ranges)

### General
- Any other document (Intelligent field extraction)

## What's Been Implemented (Feb 21, 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT-based for dashboard)
- ✅ API key management (create, list, revoke)
- ✅ OCR extraction endpoint `/api/v1/extract` using **Gemini 3 Flash Vision**
- ✅ Playground endpoint `/api/playground/extract` for testing
- ✅ Rate limiting per API key
- ✅ Usage analytics endpoints
- ✅ MongoDB persistence for all data
- ✅ Universal document extraction (17 document types)

### Frontend (React + Tailwind + Shadcn)
- ✅ Landing page with hero, features, pricing (INR), CTAs
- ✅ User registration and login flows
- ✅ Dashboard with usage overview
- ✅ API Keys management page
- ✅ API Playground with all 17 document types in dropdown
- ✅ Analytics page with charts
- ✅ API Documentation page

### Integrations
- ✅ **Gemini 3 Flash Vision** via Emergent LLM Key (~₹0.14/extraction cost)
- ✅ MongoDB for data persistence

### Pricing (Updated Feb 21, 2026)
| Tier | Price | Extractions |
|------|-------|-------------|
| Free | ₹0/month | 100 (one-time) |
| Starter | ₹499/month | 1,000 |
| Growth | ₹1,999/month | 5,000 |
| Enterprise | Custom | Unlimited |

**Per extraction cost to user:** ₹0.20 (launch price)
**Our cost:** ~₹0.14/extraction
**Margin:** 30-40%

## Testing Status
- ✅ Backend: 31/31 tests passed (100%)
- ✅ Frontend: All pages and flows tested
- ✅ Mobile responsiveness verified
- ✅ Production ready

## Prioritized Backlog

### P0 (Critical - Next)
- [ ] Add Razorpay/Stripe billing integration for INR payments
- [ ] Implement usage limits enforcement based on plan
- [ ] Add prepaid wallet system

### P1 (Important)
- [ ] Python/Node.js SDKs for easier integration
- [ ] Batch processing for multiple documents
- [ ] WhatsApp integration (Enterprise feature)
- [ ] Webhook notifications for async processing

### P2 (Nice to Have)
- [ ] On-premise deployment option
- [ ] Custom model fine-tuning
- [ ] Multi-language document support

## Key Files
- `/app/backend/server.py` - Main FastAPI app
- `/app/backend/ocr_engine.py` - Gemini 3 Flash Vision with 17 document types
- `/app/frontend/src/pages/LandingPage.jsx` - Landing page with pricing
- `/app/frontend/src/pages/PlaygroundPage.jsx` - OCR playground with document dropdown

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET, POST, DELETE /api/keys` - API key management
- `POST /api/v1/extract` - OCR extraction (API key auth)
- `POST /api/playground/extract` - OCR testing (JWT auth)
- `GET /api/analytics/usage` - Usage statistics
- `GET /api/analytics/recent` - Recent extractions
