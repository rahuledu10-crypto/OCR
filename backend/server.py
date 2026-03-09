from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, BackgroundTasks, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import secrets
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import asyncio

# Import our custom OCR engine (Gemini 3 Flash Vision)
from ocr_engine import extract_document as ocr_extract_document, ExtractionResult
from plans import PLANS, PAYG_PRICE_PER_EXTRACTION
from payments import create_order, verify_payment_signature, PLAN_PRICES, IS_TEST_MODE
from webhooks import send_webhook, create_extraction_webhook_payload, create_batch_webhook_payload

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'ocr_api_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72  # 3 days for better UX

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'https://api.extractai.io/api/auth/google/callback')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://extractai.io')

# Create the main app
app = FastAPI(title="OCR API System", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ========== MODELS ==========

class UserCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None  # Optional for Google OAuth users
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class GoogleSessionRequest(BaseModel):
    session_id: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    company_name: Optional[str] = None
    created_at: str

class APIKeyCreate(BaseModel):
    name: str
    rate_limit: int = 100  # requests per minute

class APIKeyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    key_prefix: str
    rate_limit: int
    is_active: bool
    created_at: str
    last_used: Optional[str] = None
    total_requests: int = 0

class APIKeyFull(APIKeyResponse):
    key: str  # Only shown on creation

class OCRRequest(BaseModel):
    image_base64: str
    document_type: Optional[str] = None  # aadhaar, pan, dl, passport, voter_id, auto
    use_gpt_fallback: Optional[bool] = False  # Use GPT Vision for difficult images

class OCRResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    document_type: str
    extracted_data: Dict[str, Any]
    confidence: float
    processing_time_ms: int
    timestamp: str
    extraction_method: Optional[str] = None
    quality_score: Optional[float] = None
    preprocessing_used: Optional[str] = None
    suggestions: Optional[List[str]] = None

class UsageStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_requests: int
    successful_requests: int
    failed_requests: int
    document_breakdown: Dict[str, int]
    daily_usage: List[Dict[str, Any]]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ========== NEW MODELS FOR BILLING, BATCH, WEBHOOKS ==========

class UserResponseWithPlan(UserResponse):
    plan: str = "free"
    extractions_used: int = 0
    extractions_limit: Optional[int] = 100
    plan_expires_at: Optional[str] = None
    wallet_balance: float = 0.0

class SubscriptionCreate(BaseModel):
    plan: str  # starter, growth, enterprise

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    plan: str
    razorpay_key_id: str
    is_test_mode: bool = False

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str

class WalletTopUp(BaseModel):
    amount: int  # Amount in INR

class BatchOCRRequest(BaseModel):
    images: List[Dict[str, str]]  # List of {"image_base64": "...", "document_type": "..."}
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None

class BatchOCRResponse(BaseModel):
    batch_id: str
    total: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    processing_time_ms: int

class WebhookConfig(BaseModel):
    url: str
    secret: Optional[str] = None
    events: List[str] = ["extraction.completed", "batch.completed"]
    is_active: bool = True

class WebhookConfigResponse(BaseModel):
    id: str
    url: str
    events: List[str]
    is_active: bool
    created_at: str

class PlanInfoResponse(BaseModel):
    name: str
    price_inr: Optional[int]
    extractions_per_month: Optional[int]
    rate_limit_per_minute: int
    features: List[str]

# ========== HELPER FUNCTIONS ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_api_key() -> str:
    return f"ocr_{secrets.token_urlsafe(32)}"

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

async def create_default_api_key(user_id: str) -> Dict[str, Any]:
    """Create a default API key for new users"""
    key = generate_api_key()
    now = datetime.now(timezone.utc).isoformat()
    
    api_key_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": "Default Key",
        "key": key,
        "key_prefix": key[:12] + "...",
        "rate_limit": 100,
        "is_active": True,
        "created_at": now,
        "last_used": None,
        "total_requests": 0
    }
    
    await db.api_keys.insert_one(api_key_doc)
    return api_key_doc

async def send_welcome_email(email: str, name: str, api_key: str):
    """Send welcome email with API key"""
    if not SMTP_HOST or not SMTP_USER:
        logging.warning("SMTP not configured, skipping welcome email")
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Welcome to ExtractAI - Your API Key is Ready!"
        msg['From'] = SMTP_USER
        msg['To'] = email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1;">Welcome to ExtractAI!</h1>
            </div>
            
            <p>Hi {name or 'there'},</p>
            
            <p>Your account is ready! You have <strong>100 free extractions</strong> to get started.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your API Key:</p>
                <code style="background: #1f2937; color: #10b981; padding: 10px 15px; border-radius: 4px; display: block; word-break: break-all;">
                    {api_key}
                </code>
            </div>
            
            <p>Quick start:</p>
            <pre style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 8px; overflow-x: auto;">
curl -X POST "https://api.extractai.io/api/v1/extract" \\
  -H "X-API-Key: {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{{"image_base64": "...", "document_type": "auto"}}'
            </pre>
            
            <p style="margin-top: 30px;">
                <a href="https://extractai.io/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Go to Dashboard
                </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
                Questions? Reply to this email or contact us at support@extractai.io
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        logging.info(f"[EMAIL] Attempting to send welcome email to {email} via {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"[EMAIL] Welcome email sent successfully to {email}")
    except smtplib.SMTPAuthenticationError as e:
        logging.error(f"[EMAIL ERROR] SMTP authentication failed for welcome email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP authentication failed: {e}")
    except smtplib.SMTPConnectError as e:
        logging.error(f"[EMAIL ERROR] SMTP connection failed for welcome email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP connection failed: {e}")
    except smtplib.SMTPException as e:
        logging.error(f"[EMAIL ERROR] SMTP error sending welcome email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP error: {e}")
    except Exception as e:
        logging.error(f"[EMAIL ERROR] Unexpected error sending welcome email to {email}: {type(e).__name__}: {e}")
        print(f"[EMAIL ERROR] Unexpected error: {type(e).__name__}: {e}")

async def get_user_usage(user_id: str) -> Dict[str, Any]:
    """Get current month's usage for a user"""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count extractions this month
    extractions_count = await db.ocr_requests.count_documents({
        "user_id": user_id,
        "timestamp": {"$gte": month_start.isoformat()},
        "success": True
    })
    
    return {
        "extractions_used": extractions_count,
        "month_start": month_start.isoformat()
    }

async def check_usage_limit(user_id: str) -> Dict[str, Any]:
    """Check if user can make more extractions"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    plan_name = user.get("plan", "free")
    plan = PLANS.get(plan_name, PLANS["free"])
    
    usage = await get_user_usage(user_id)
    extractions_used = usage["extractions_used"]
    
    # For free plan, it's a one-time limit (not monthly)
    if plan_name == "free":
        total_extractions = await db.ocr_requests.count_documents({
            "user_id": user_id,
            "success": True
        })
        extractions_used = total_extractions
    
    extractions_limit = plan.get("extractions_per_month")
    wallet_balance = user.get("wallet_balance", 0.0)
    
    # Enterprise has unlimited
    if extractions_limit is None:
        return {"allowed": True, "reason": "unlimited", "extractions_used": extractions_used}
    
    # Check if under plan limit
    if extractions_used < extractions_limit:
        return {
            "allowed": True,
            "reason": "within_plan",
            "extractions_used": extractions_used,
            "extractions_limit": extractions_limit,
            "remaining": extractions_limit - extractions_used
        }
    
    # Check if wallet has balance for pay-as-you-go
    if wallet_balance >= PAYG_PRICE_PER_EXTRACTION:
        return {
            "allowed": True,
            "reason": "payg",
            "extractions_used": extractions_used,
            "extractions_limit": extractions_limit,
            "wallet_balance": wallet_balance,
            "will_charge": PAYG_PRICE_PER_EXTRACTION
        }
    
    # Limit exceeded and no wallet balance
    return {
        "allowed": False,
        "reason": "limit_exceeded",
        "extractions_used": extractions_used,
        "extractions_limit": extractions_limit,
        "message": f"Monthly limit of {extractions_limit} extractions reached. Add wallet balance or upgrade plan."
    }

async def deduct_usage(user_id: str, usage_check: Dict[str, Any]) -> None:
    """Deduct from wallet if using pay-as-you-go"""
    if usage_check.get("reason") == "payg":
        charge = usage_check.get("will_charge", PAYG_PRICE_PER_EXTRACTION)
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"wallet_balance": -charge}}
        )
        # Log the charge
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "amount": -charge,
            "type": "extraction_charge",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

async def validate_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header is required")
    
    api_key = await db.api_keys.find_one({"key": x_api_key, "is_active": True}, {"_id": 0})
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    # Check usage limits
    usage_check = await check_usage_limit(api_key["user_id"])
    if not usage_check["allowed"]:
        raise HTTPException(
            status_code=402,  # Payment Required
            detail=usage_check.get("message", "Usage limit exceeded")
        )
    
    # Rate limiting check
    now = datetime.now(timezone.utc)
    minute_ago = now - timedelta(minutes=1)
    recent_requests = await db.ocr_requests.count_documents({
        "api_key_id": api_key["id"],
        "timestamp": {"$gte": minute_ago.isoformat()}
    })
    
    # Get rate limit from user's plan
    user = await db.users.find_one({"id": api_key["user_id"]}, {"_id": 0})
    plan_name = user.get("plan", "free") if user else "free"
    plan = PLANS.get(plan_name, PLANS["free"])
    rate_limit = plan.get("rate_limit_per_minute", 10)
    
    if recent_requests >= rate_limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Update last used
    await db.api_keys.update_one(
        {"id": api_key["id"]},
        {"$set": {"last_used": now.isoformat()}, "$inc": {"total_requests": 1}}
    )
    
    # Store usage check for potential PAYG deduction
    api_key["_usage_check"] = usage_check
    
    return api_key

# ========== OCR EXTRACTION (Gemini 3 Flash) ==========

# ========== MAIN OCR FUNCTION ==========

async def extract_document_info(image_base64: str, document_type: Optional[str] = None, use_gpt_fallback: bool = False) -> Dict[str, Any]:
    """
    Universal Document Extractor
    
    Supports: Aadhaar, PAN, DL, Passport, Voter ID, and general documents
    Engine: Gemini 3 Flash Vision
    
    Cost: ~$0.00165/extraction (1000 extractions = ~$1.65)
    """
    try:
        # Use the Gemini 3 Flash Vision implementation from ocr_engine.py
        result = await ocr_extract_document(image_base64, document_type)
        
        # Convert ExtractionResult object to dictionary
        return {
            "document_type": result.document_type,
            "extracted_data": result.extracted_data,
            "confidence": result.confidence,
            "extraction_method": getattr(result, 'extraction_method', 'gemini_flash'),
            "quality_score": getattr(result, 'quality_score', 0.0),
            "preprocessing_used": getattr(result, 'preprocessing_used', ''),
            "suggestions": getattr(result, 'suggestions', []),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"OCR extraction error: {e}")
        import traceback
        logging.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# ========== AUTH ENDPOINTS ==========

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Password is optional for Google OAuth users
    password_hash = hash_password(user_data.password) if user_data.password else None
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": password_hash,
        "company_name": user_data.company_name,
        "created_at": now,
        "plan": "free",
        "wallet_balance": 0.0
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default API key for new users
    default_key = await create_default_api_key(user_id)
    
    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email, 
        user_data.email, 
        user_data.company_name or "", 
        default_key["key"]
    )
    
    token = create_jwt_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            company_name=user_data.company_name,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user signed up with Google (no password)
    if not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Please sign in with Google")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            company_name=user.get("company_name"),
            created_at=user["created_at"]
        )
    )

# ========== GOOGLE OAUTH ENDPOINTS ==========

@api_router.get("/auth/google")
async def google_auth_redirect():
    """Redirect user to Google OAuth consent screen"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Build Google OAuth URL
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        "access_type=offline&"
        "prompt=consent"
    )
    
    return RedirectResponse(url=google_auth_url)

@api_router.get("/auth/google/callback")
async def google_callback(code: str, background_tasks: BackgroundTasks):
    """Handle Google OAuth callback, exchange code for user data"""
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logging.error("[GOOGLE AUTH] OAuth credentials not configured")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_not_configured")
    
    try:
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI
                }
            )
            
            if token_response.status_code != 200:
                logging.error(f"[GOOGLE AUTH] Token exchange failed: {token_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                logging.error(f"[GOOGLE AUTH] User info fetch failed: {userinfo_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo_failed")
            
            google_data = userinfo_response.json()
    
    except httpx.RequestError as e:
        logging.error(f"[GOOGLE AUTH] Request error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_request_failed")
    
    email = google_data.get("email")
    name = google_data.get("name")
    google_id = google_data.get("id")
    picture = google_data.get("picture")
    
    if not email:
        logging.error("[GOOGLE AUTH] No email returned from Google")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")
    
    logging.info(f"[GOOGLE AUTH] Processing login for {email}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        # Update google_id if not set
        if not existing_user.get("google_id"):
            await db.users.update_one(
                {"id": existing_user["id"]},
                {"$set": {"google_id": google_id, "picture": picture}}
            )
        
        user_id = existing_user["id"]
        is_new_user = False
        logging.info(f"[GOOGLE AUTH] Existing user logged in: {email}")
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        user_doc = {
            "id": user_id,
            "email": email,
            "password_hash": None,  # Google users don't have password
            "company_name": name,
            "google_id": google_id,
            "picture": picture,
            "created_at": now,
            "plan": "free",
            "wallet_balance": 0.0
        }
        
        await db.users.insert_one(user_doc)
        
        # Create default API key for new users
        default_key = await create_default_api_key(user_id)
        
        # Send welcome email in background
        background_tasks.add_task(
            send_welcome_email, 
            email, 
            name or "", 
            default_key["key"]
        )
        
        is_new_user = True
        logging.info(f"[GOOGLE AUTH] New user created: {email}")
    
    # Create JWT token
    token = create_jwt_token(user_id, email)
    
    # Redirect to frontend with token
    redirect_url = f"{FRONTEND_URL}/auth/google/callback?token={token}&is_new_user={str(is_new_user).lower()}"
    return RedirectResponse(url=redirect_url)

# ========== FORGOT PASSWORD ENDPOINTS ==========

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Send password reset email"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists with this email, a reset link will be sent"}
    
    # Check if user signed up with Google
    if not user.get("password_hash") and user.get("google_id"):
        return {"message": "This account uses Google Sign-In. Please use Google to login."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send reset email in background
    if SMTP_HOST and SMTP_USER:
        background_tasks.add_task(
            send_reset_email,
            data.email,
            reset_token
        )
    
    return {"message": "If an account exists with this email, a reset link will be sent"}

async def send_reset_email(email: str, token: str):
    """Send password reset email"""
    if not SMTP_HOST or not SMTP_USER:
        logging.warning("[EMAIL] SMTP not configured, skipping reset email")
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Reset Your ExtractAI Password"
        msg['From'] = SMTP_USER
        msg['To'] = email
        
        # TODO: Update this URL to your actual frontend URL
        reset_url = f"https://extractai.io/reset-password?token={token}"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">Reset Your Password</h1>
            
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            
            <p style="margin: 30px 0;">
                <a href="{reset_url}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Reset Password
                </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
                This link expires in 1 hour. If you didn't request this, please ignore this email.
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        logging.info(f"[EMAIL] Attempting to send reset email to {email} via {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"[EMAIL] Reset email sent successfully to {email}")
    except smtplib.SMTPAuthenticationError as e:
        logging.error(f"[EMAIL ERROR] SMTP authentication failed for reset email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP authentication failed: {e}")
    except smtplib.SMTPConnectError as e:
        logging.error(f"[EMAIL ERROR] SMTP connection failed for reset email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP connection failed: {e}")
    except smtplib.SMTPException as e:
        logging.error(f"[EMAIL ERROR] SMTP error sending reset email to {email}: {e}")
        print(f"[EMAIL ERROR] SMTP error: {e}")
    except Exception as e:
        logging.error(f"[EMAIL ERROR] Unexpected error sending reset email to {email}: {type(e).__name__}: {e}")
        print(f"[EMAIL ERROR] Unexpected error: {type(e).__name__}: {e}")

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Reset password using token"""
    # Find valid reset token
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": reset_doc["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        company_name=user.get("company_name"),
        created_at=user["created_at"]
    )

# ========== API KEY ENDPOINTS ==========

@api_router.post("/keys", response_model=APIKeyFull)
async def create_api_key(key_data: APIKeyCreate, user: dict = Depends(get_current_user)):
    key_id = str(uuid.uuid4())
    api_key = generate_api_key()
    now = datetime.now(timezone.utc).isoformat()
    
    key_doc = {
        "id": key_id,
        "user_id": user["id"],
        "name": key_data.name,
        "key": api_key,
        "key_prefix": api_key[:12] + "...",
        "rate_limit": key_data.rate_limit,
        "is_active": True,
        "created_at": now,
        "last_used": None,
        "total_requests": 0
    }
    
    await db.api_keys.insert_one(key_doc)
    
    return APIKeyFull(
        id=key_id,
        name=key_data.name,
        key=api_key,
        key_prefix=api_key[:12] + "...",
        rate_limit=key_data.rate_limit,
        is_active=True,
        created_at=now,
        total_requests=0
    )

@api_router.get("/keys", response_model=List[APIKeyResponse])
async def list_api_keys(user: dict = Depends(get_current_user)):
    keys = await db.api_keys.find(
        {"user_id": user["id"]},
        {"_id": 0, "key": 0}
    ).to_list(100)
    return keys

@api_router.delete("/keys/{key_id}")
async def revoke_api_key(key_id: str, user: dict = Depends(get_current_user)):
    result = await db.api_keys.update_one(
        {"id": key_id, "user_id": user["id"]},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}

@api_router.patch("/keys/{key_id}")
async def update_api_key(key_id: str, key_data: APIKeyCreate, user: dict = Depends(get_current_user)):
    result = await db.api_keys.update_one(
        {"id": key_id, "user_id": user["id"]},
        {"$set": {"name": key_data.name, "rate_limit": key_data.rate_limit}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key updated"}

# ========== PUBLIC OCR API (for B2B customers) ==========

@api_router.post("/v1/extract", response_model=OCRResponse)
async def extract_document(request: OCRRequest, api_key: dict = Depends(validate_api_key)):
    """Main OCR extraction endpoint for B2B customers"""
    import time
    start_time = time.time()
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    try:
        result = await extract_document_info(request.image_base64, request.document_type)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Store the request
        request_doc = {
            "id": request_id,
            "api_key_id": api_key["id"],
            "user_id": api_key["user_id"],
            "document_type": result.get("document_type", "unknown"),
            "extracted_data": result.get("extracted_data", {}),
            "confidence": result.get("confidence", 0),
            "processing_time_ms": processing_time,
            "timestamp": now.isoformat(),
            "success": True
        }
        await db.ocr_requests.insert_one(request_doc)
        
        return OCRResponse(
            id=request_id,
            document_type=result.get("document_type", "unknown"),
            extracted_data=result.get("extracted_data", {}),
            confidence=result.get("confidence", 0),
            processing_time_ms=processing_time,
            timestamp=now.isoformat()
        )
        
    except Exception as e:
        # Log failed request
        await db.ocr_requests.insert_one({
            "id": request_id,
            "api_key_id": api_key["id"],
            "user_id": api_key["user_id"],
            "timestamp": now.isoformat(),
            "success": False,
            "error": str(e)
        })
        raise

# ========== PLAYGROUND ENDPOINT (for dashboard testing) ==========

@api_router.post("/playground/extract", response_model=OCRResponse)
async def playground_extract(request: OCRRequest, user: dict = Depends(get_current_user)):
    """OCR extraction for testing in the dashboard"""
    import time
    start_time = time.time()
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    result = await extract_document_info(request.image_base64, request.document_type)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    # Store the request
    request_doc = {
        "id": request_id,
        "user_id": user["id"],
        "document_type": result.get("document_type", "unknown"),
        "extracted_data": result.get("extracted_data", {}),
        "confidence": result.get("confidence", 0),
        "processing_time_ms": processing_time,
        "timestamp": now.isoformat(),
        "success": True,
        "is_playground": True
    }
    await db.ocr_requests.insert_one(request_doc)
    
    return OCRResponse(
        id=request_id,
        document_type=result.get("document_type", "unknown"),
        extracted_data=result.get("extracted_data", {}),
        confidence=result.get("confidence", 0),
        processing_time_ms=processing_time,
        timestamp=now.isoformat()
    )

# ========== ANALYTICS ENDPOINTS ==========

@api_router.get("/analytics/usage", response_model=UsageStats)
async def get_usage_stats(user: dict = Depends(get_current_user)):
    """Get usage statistics for the current user"""
    
    # Get total counts
    total = await db.ocr_requests.count_documents({"user_id": user["id"]})
    successful = await db.ocr_requests.count_documents({"user_id": user["id"], "success": True})
    failed = total - successful
    
    # Get document breakdown
    pipeline = [
        {"$match": {"user_id": user["id"], "success": True}},
        {"$group": {"_id": "$document_type", "count": {"$sum": 1}}}
    ]
    breakdown_cursor = db.ocr_requests.aggregate(pipeline)
    breakdown = {doc["_id"]: doc["count"] async for doc in breakdown_cursor}
    
    # Get daily usage for last 7 days
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    daily_pipeline = [
        {"$match": {"user_id": user["id"], "timestamp": {"$gte": seven_days_ago}}},
        {"$project": {
            "date": {"$substr": ["$timestamp", 0, 10]},
            "success": 1
        }},
        {"$group": {
            "_id": "$date",
            "total": {"$sum": 1},
            "successful": {"$sum": {"$cond": ["$success", 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_cursor = db.ocr_requests.aggregate(daily_pipeline)
    daily_usage = [{"date": doc["_id"], "total": doc["total"], "successful": doc["successful"]} async for doc in daily_cursor]
    
    return UsageStats(
        total_requests=total,
        successful_requests=successful,
        failed_requests=failed,
        document_breakdown=breakdown,
        daily_usage=daily_usage
    )

@api_router.get("/analytics/recent")
async def get_recent_extractions(user: dict = Depends(get_current_user), limit: int = 10):
    """Get recent extraction requests"""
    extractions = await db.ocr_requests.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return extractions

# ========== BILLING & SUBSCRIPTION ENDPOINTS ==========

@api_router.get("/plans")
async def get_plans():
    """Get all available plans"""
    return [
        {
            "id": plan_id,
            "name": plan["name"],
            "price_inr": plan["price_inr"],
            "extractions_per_month": plan["extractions_per_month"],
            "rate_limit_per_minute": plan["rate_limit_per_minute"],
            "features": plan["features"]
        }
        for plan_id, plan in PLANS.items()
    ]

@api_router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    """Get current user's subscription details"""
    plan_name = user.get("plan", "free")
    plan = PLANS.get(plan_name, PLANS["free"])
    
    usage = await get_user_usage(user["id"])
    
    # For free plan, check total usage instead of monthly
    if plan_name == "free":
        total_extractions = await db.ocr_requests.count_documents({
            "user_id": user["id"],
            "success": True
        })
        extractions_used = total_extractions
    else:
        extractions_used = usage["extractions_used"]
    
    return {
        "plan": plan_name,
        "plan_details": {
            "name": plan["name"],
            "price_inr": plan["price_inr"],
            "extractions_per_month": plan["extractions_per_month"],
            "features": plan["features"]
        },
        "usage": {
            "extractions_used": extractions_used,
            "extractions_limit": plan["extractions_per_month"],
            "remaining": (plan["extractions_per_month"] - extractions_used) if plan["extractions_per_month"] else None
        },
        "wallet_balance": user.get("wallet_balance", 0.0),
        "plan_expires_at": user.get("plan_expires_at")
    }

@api_router.post("/subscription/create-order")
async def create_subscription_order(data: SubscriptionCreate, user: dict = Depends(get_current_user)):
    """Create Razorpay order for subscription"""
    plan_name = data.plan.lower()
    
    if plan_name not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    price = PLAN_PRICES[plan_name]
    if price is None:
        raise HTTPException(status_code=400, detail="Contact sales for enterprise pricing")
    
    order = create_order(
        amount_inr=price,
        user_id=user["id"],
        plan=plan_name
    )
    
    # Store order in database
    await db.payment_orders.insert_one({
        "order_id": order["id"],
        "user_id": user["id"],
        "plan": plan_name,
        "amount": price,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return PaymentOrderResponse(
        order_id=order["id"],
        amount=price * 100,  # Paise
        currency="INR",
        plan=plan_name,
        razorpay_key_id=os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
        is_test_mode=IS_TEST_MODE
    )

@api_router.post("/subscription/verify-payment")
async def verify_subscription_payment(data: PaymentVerify, user: dict = Depends(get_current_user)):
    """Verify Razorpay payment and activate subscription"""
    
    # Verify signature
    is_valid = verify_payment_signature(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    plan_name = data.plan.lower()
    if plan_name not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30)
    
    # Update user's plan
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "plan": plan_name,
                "plan_expires_at": expires_at.isoformat(),
                "plan_started_at": now.isoformat()
            }
        }
    )
    
    # Update payment order status
    await db.payment_orders.update_one(
        {"order_id": data.razorpay_order_id},
        {
            "$set": {
                "status": "paid",
                "payment_id": data.razorpay_payment_id,
                "paid_at": now.isoformat()
            }
        }
    )
    
    # Log the transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "order_id": data.razorpay_order_id,
        "payment_id": data.razorpay_payment_id,
        "plan": plan_name,
        "amount": PLAN_PRICES[plan_name],
        "type": "subscription",
        "timestamp": now.isoformat()
    })
    
    return {
        "success": True,
        "message": f"Successfully upgraded to {PLANS[plan_name]['name']} plan",
        "plan": plan_name,
        "expires_at": expires_at.isoformat()
    }

@api_router.post("/wallet/topup")
async def create_wallet_topup(data: WalletTopUp, user: dict = Depends(get_current_user)):
    """Create order to top up wallet balance"""
    if data.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum top-up amount is ₹100")
    
    order = create_order(
        amount_inr=data.amount,
        user_id=user["id"],
        plan="wallet_topup"
    )
    
    await db.payment_orders.insert_one({
        "order_id": order["id"],
        "user_id": user["id"],
        "type": "wallet_topup",
        "amount": data.amount,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return PaymentOrderResponse(
        order_id=order["id"],
        amount=data.amount * 100,
        currency="INR",
        plan="wallet_topup",
        razorpay_key_id=os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
        is_test_mode=IS_TEST_MODE
    )

@api_router.post("/wallet/verify-topup")
async def verify_wallet_topup(data: PaymentVerify, user: dict = Depends(get_current_user)):
    """Verify wallet top-up payment"""
    
    is_valid = verify_payment_signature(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Get order details
    order = await db.payment_orders.find_one({"order_id": data.razorpay_order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    amount = order["amount"]
    now = datetime.now(timezone.utc)
    
    # Add to wallet balance
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"wallet_balance": amount}}
    )
    
    # Update order status
    await db.payment_orders.update_one(
        {"order_id": data.razorpay_order_id},
        {
            "$set": {
                "status": "paid",
                "payment_id": data.razorpay_payment_id,
                "paid_at": now.isoformat()
            }
        }
    )
    
    # Log transaction
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": amount,
        "type": "topup",
        "payment_id": data.razorpay_payment_id,
        "timestamp": now.isoformat()
    })
    
    # Get updated balance
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    return {
        "success": True,
        "message": f"₹{amount} added to wallet",
        "new_balance": updated_user.get("wallet_balance", amount)
    }

# ========== BATCH PROCESSING ENDPOINTS ==========

@api_router.post("/v1/batch-extract", response_model=BatchOCRResponse)
async def batch_extract(
    request: BatchOCRRequest, 
    background_tasks: BackgroundTasks,
    api_key: dict = Depends(validate_api_key)
):
    """
    Batch extract data from multiple documents
    Max 10 documents per request
    """
    import time
    start_time = time.time()
    
    if len(request.images) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images per batch request")
    
    if len(request.images) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    batch_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    results = []
    successful = 0
    failed = 0
    
    for idx, image_data in enumerate(request.images):
        try:
            image_base64 = image_data.get("image_base64", "")
            document_type = image_data.get("document_type")
            
            result = await extract_document_info(image_base64, document_type)
            
            results.append({
                "index": idx,
                "success": True,
                "document_type": result.get("document_type", "unknown"),
                "extracted_data": result.get("extracted_data", {}),
                "confidence": result.get("confidence", 0)
            })
            successful += 1
            
        except Exception as e:
            results.append({
                "index": idx,
                "success": False,
                "error": str(e)
            })
            failed += 1
    
    processing_time = int((time.time() - start_time) * 1000)
    
    # Store batch request
    batch_doc = {
        "batch_id": batch_id,
        "user_id": api_key["user_id"],
        "api_key_id": api_key["id"],
        "total": len(request.images),
        "successful": successful,
        "failed": failed,
        "results": results,
        "processing_time_ms": processing_time,
        "timestamp": now.isoformat()
    }
    await db.batch_requests.insert_one(batch_doc)
    
    # Send webhook if configured
    if request.webhook_url:
        webhook_payload = create_batch_webhook_payload(
            batch_id=batch_id,
            total=len(request.images),
            successful=successful,
            failed=failed,
            results=results,
            user_id=api_key["user_id"]
        )
        background_tasks.add_task(
            send_webhook,
            request.webhook_url,
            webhook_payload,
            request.webhook_secret
        )
    
    return BatchOCRResponse(
        batch_id=batch_id,
        total=len(request.images),
        successful=successful,
        failed=failed,
        results=results,
        processing_time_ms=processing_time
    )

# ========== WEBHOOK CONFIGURATION ENDPOINTS ==========

@api_router.post("/webhooks", response_model=WebhookConfigResponse)
async def create_webhook(config: WebhookConfig, user: dict = Depends(get_current_user)):
    """Configure a webhook endpoint"""
    webhook_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    webhook_doc = {
        "id": webhook_id,
        "user_id": user["id"],
        "url": config.url,
        "secret": config.secret,
        "events": config.events,
        "is_active": config.is_active,
        "created_at": now
    }
    
    await db.webhooks.insert_one(webhook_doc)
    
    return WebhookConfigResponse(
        id=webhook_id,
        url=config.url,
        events=config.events,
        is_active=config.is_active,
        created_at=now
    )

@api_router.get("/webhooks")
async def list_webhooks(user: dict = Depends(get_current_user)):
    """List all webhook configurations"""
    webhooks = await db.webhooks.find(
        {"user_id": user["id"]},
        {"_id": 0, "secret": 0}
    ).to_list(100)
    return webhooks

@api_router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, user: dict = Depends(get_current_user)):
    """Delete a webhook configuration"""
    result = await db.webhooks.delete_one({
        "id": webhook_id,
        "user_id": user["id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return {"message": "Webhook deleted"}

@api_router.post("/webhooks/{webhook_id}/test")
async def test_webhook(webhook_id: str, user: dict = Depends(get_current_user)):
    """Send a test webhook"""
    webhook = await db.webhooks.find_one({
        "id": webhook_id,
        "user_id": user["id"]
    }, {"_id": 0})
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    test_payload = {
        "event": "test",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "message": "This is a test webhook from ExtractAI"
        }
    }
    
    result = await send_webhook(
        webhook["url"],
        test_payload,
        webhook.get("secret")
    )
    
    return {
        "success": result["success"],
        "details": result
    }

# ========== HEALTH CHECK ==========

@api_router.get("/")
async def root():
    return {"message": "OCR API System", "version": "1.0.0", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
