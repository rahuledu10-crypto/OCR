from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
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

# Create the main app
app = FastAPI(title="OCR API System", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ========== MODELS ==========

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "company_name": user_data.company_name,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
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
    if not user or not verify_password(credentials.password, user["password_hash"]):
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
