from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
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

# Import our custom OCR engine (PaddleOCR-based)
from ocr_engine import extract_document, ExtractionResult

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

async def validate_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header is required")
    
    api_key = await db.api_keys.find_one({"key": x_api_key, "is_active": True}, {"_id": 0})
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    # Rate limiting check
    now = datetime.now(timezone.utc)
    minute_ago = now - timedelta(minutes=1)
    recent_requests = await db.ocr_requests.count_documents({
        "api_key_id": api_key["id"],
        "timestamp": {"$gte": minute_ago.isoformat()}
    })
    
    if recent_requests >= api_key["rate_limit"]:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Update last used
    await db.api_keys.update_one(
        {"id": api_key["id"]},
        {"$set": {"last_used": now.isoformat()}, "$inc": {"total_requests": 1}}
    )
    
    return api_key

# ========== VALIDATION PATTERNS ==========
import re

VALIDATION_PATTERNS = {
    "aadhaar_number": r"^\d{4}\s?\d{4}\s?\d{4}$",  # 12 digits with optional spaces
    "pan_number": r"^[A-Z]{5}[0-9]{4}[A-Z]$",  # 5 letters + 4 digits + 1 letter
    "dl_number": r"^[A-Z]{2}[0-9]{2}\s?[0-9]{4}\s?[0-9]{7}$",  # State code + year + number
}

def validate_field(field_name: str, value: str) -> tuple[bool, float]:
    """Validate extracted field against known patterns. Returns (is_valid, confidence_adjustment)"""
    if not value or not isinstance(value, str):
        return False, -0.3
    
    # Clean the value
    clean_value = value.strip().upper()
    
    if field_name == "aadhaar_number":
        # Remove spaces and check 12 digits
        digits_only = re.sub(r'\s', '', clean_value)
        if re.match(r"^\d{12}$", digits_only):
            return True, 0.1
        return False, -0.4
    
    elif field_name == "pan_number":
        if re.match(VALIDATION_PATTERNS["pan_number"], clean_value):
            # Additional PAN validation: 4th char indicates holder type
            if clean_value[3] in ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']:
                return True, 0.15
        return False, -0.4
    
    elif field_name == "dl_number":
        # DL formats vary by state, basic check for alphanumeric
        if len(clean_value) >= 10 and re.match(r"^[A-Z]{2}", clean_value):
            return True, 0.1
        return False, -0.2
    
    elif field_name == "date_of_birth":
        # Check common date formats
        date_patterns = [
            r"^\d{2}/\d{2}/\d{4}$",  # DD/MM/YYYY
            r"^\d{2}-\d{2}-\d{4}$",  # DD-MM-YYYY
            r"^\d{4}-\d{2}-\d{2}$",  # YYYY-MM-DD
        ]
        for pattern in date_patterns:
            if re.match(pattern, clean_value):
                return True, 0.05
        return False, -0.1
    
    elif field_name == "gender":
        if clean_value in ["MALE", "FEMALE", "M", "F", "OTHER"]:
            return True, 0.05
        return False, -0.1
    
    return True, 0  # Unknown fields pass through

def post_process_extraction(result: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and adjust confidence based on field validation"""
    extracted_data = result.get("extracted_data", {})
    base_confidence = result.get("confidence", 0.5)
    
    validation_results = {}
    confidence_adjustments = 0
    fields_validated = 0
    
    for field_name, value in extracted_data.items():
        if isinstance(value, str):
            is_valid, adjustment = validate_field(field_name, value)
            validation_results[field_name] = {
                "value": value,
                "valid": is_valid
            }
            confidence_adjustments += adjustment
            fields_validated += 1
    
    # Calculate final confidence
    if fields_validated > 0:
        avg_adjustment = confidence_adjustments / fields_validated
        final_confidence = max(0, min(1, base_confidence + avg_adjustment))
    else:
        final_confidence = base_confidence
    
    result["confidence"] = round(final_confidence, 2)
    result["field_validations"] = validation_results
    
    return result

# ========== MULTI-PASS OCR FOR LOW CONFIDENCE ==========

async def extract_with_retry(image_base64: str, document_type: Optional[str], api_key: str) -> Dict[str, Any]:
    """Extract with retry for low confidence - focuses on digit verification"""
    
    # First pass - standard extraction
    first_result = await single_extraction(image_base64, document_type, api_key, pass_num=1)
    
    first_confidence = first_result.get("confidence", 0)
    
    # If confidence is good enough, return
    if first_confidence >= 0.75:
        first_result["extraction_method"] = "single_pass"
        return first_result
    
    # Second pass - digit-focused extraction for ID numbers
    second_result = await single_extraction(image_base64, document_type, api_key, pass_num=2)
    
    # Compare and merge results
    merged = merge_extraction_results(first_result, second_result)
    merged["extraction_method"] = "multi_pass_verified"
    
    return merged

def merge_extraction_results(result1: Dict, result2: Dict) -> Dict:
    """Merge two extraction results, preferring higher confidence values"""
    
    data1 = result1.get("extracted_data", {})
    data2 = result2.get("extracted_data", {})
    conf1 = result1.get("confidence", 0)
    conf2 = result2.get("confidence", 0)
    
    merged_data = {}
    comparison_notes = []
    
    # Get all keys from both
    all_keys = set(data1.keys()) | set(data2.keys())
    
    for key in all_keys:
        val1 = data1.get(key)
        val2 = data2.get(key)
        
        if val1 == val2:
            # Both agree - high confidence
            merged_data[key] = val1
        elif val1 and not val2:
            merged_data[key] = val1
        elif val2 and not val1:
            merged_data[key] = val2
        else:
            # Disagreement - use the one from higher confidence pass
            # For ID numbers, prefer pass 2 (digit-focused)
            if key in ["aadhaar_number", "pan_number", "dl_number"]:
                merged_data[key] = val2  # Pass 2 is digit-focused
                comparison_notes.append(f"{key}: '{val1}' vs '{val2}' - used digit-focused result")
            else:
                merged_data[key] = val1 if conf1 >= conf2 else val2
    
    # Calculate merged confidence
    # If both passes agree on ID number, boost confidence
    id_fields = ["aadhaar_number", "pan_number", "dl_number"]
    id_match = any(
        data1.get(f) == data2.get(f) and data1.get(f) is not None 
        for f in id_fields
    )
    
    merged_confidence = (conf1 + conf2) / 2
    if id_match:
        merged_confidence = min(0.95, merged_confidence + 0.15)
    
    return {
        "document_type": result2.get("document_type") or result1.get("document_type"),
        "extracted_data": merged_data,
        "confidence": round(merged_confidence, 2),
        "extraction_notes": "; ".join(comparison_notes) if comparison_notes else "Multi-pass verified",
        "pass_comparison": {
            "pass1_confidence": conf1,
            "pass2_confidence": conf2,
            "fields_matched": id_match
        }
    }

async def single_extraction(image_base64: str, document_type: Optional[str], api_key: str, pass_num: int = 1) -> Dict[str, Any]:
    """Single extraction pass with different prompts based on pass number"""
    
    # Use a consistent, simple system prompt for all passes
    system_prompt = """You are an OCR system. Extract the Aadhaar number from the image.

The Aadhaar number is 12 digits at the bottom of the card, above the red line.
Format: XXXX XXXX XXXX

IMPORTANT: Read each digit carefully. Common errors in blurry images:
- 5 looks like 9 (but 5 has flat top)
- 0 looks like 9 (but 0 is just an oval)
- 3 looks like 8 (but 3 is open on left)

Always respond with valid JSON:
{"document_type": "aadhaar", "extracted_data": {"aadhaar_number": "XXXX XXXX XXXX"}, "confidence": 0.X}"""
    
    # Different prompts for each pass
    if pass_num == 1:
        prompt = "Extract the 12-digit Aadhaar number from this card. Return JSON only."
    elif pass_num == 2:
        prompt = """Read the Aadhaar number digit by digit from left to right.
The number is at the bottom of the card above the red line.
Pay special attention to: first digit (is it 5 or 9?), second digit (is it 0 or 9?).
Return JSON with the aadhaar_number."""
    else:
        prompt = """VERIFY the Aadhaar number one more time.
Look at the first 4 digits especially carefully.
Common misreads: 5 as 9, 9 as 0.
Return JSON with your final answer."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ocr_pass{pass_num}_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(text=prompt, file_contents=[image_content])
        
        response = await chat.send_message(user_message)
        logging.info(f"Pass {pass_num} raw response: {response[:200] if response else 'None'}...")
        
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
            result = post_process_extraction(result)
            return result
        
        return {"document_type": "unknown", "extracted_data": {}, "confidence": 0.3}
        
    except Exception as e:
        logging.error(f"OCR pass {pass_num} error: {str(e)}")
        return {"document_type": "unknown", "extracted_data": {}, "confidence": 0}

async def extract_with_retry(image_base64: str, document_type: Optional[str], api_key: str) -> Dict[str, Any]:
    """Extract with up to 3 passes for difficult images"""
    
    # First pass - standard extraction
    result1 = await single_extraction(image_base64, document_type, api_key, pass_num=1)
    conf1 = result1.get("confidence", 0)
    logging.info(f"Pass 1 - Aadhaar: {result1.get('extracted_data', {}).get('aadhaar_number', 'N/A')}, Confidence: {conf1}")
    
    # ALWAYS do at least 2 passes for ID verification - models are often overconfident
    # Only skip if confidence is extremely high (>0.95)
    if conf1 >= 0.95:
        result1["extraction_method"] = "single_pass_very_high_confidence"
        return result1
    
    # Second pass - digit-focused
    result2 = await single_extraction(image_base64, document_type, api_key, pass_num=2)
    conf2 = result2.get("confidence", 0)
    logging.info(f"Pass 2 - Aadhaar: {result2.get('extracted_data', {}).get('aadhaar_number', 'N/A')}, Confidence: {conf2}")
    
    # Check if both passes agree (handle None values)
    num1_raw = result1.get("extracted_data", {}).get("aadhaar_number") or ""
    num2_raw = result2.get("extracted_data", {}).get("aadhaar_number") or ""
    num1 = str(num1_raw).replace(" ", "")
    num2 = str(num2_raw).replace(" ", "")
    
    if num1 == num2 and len(num1) == 12:
        # Both agree - good confidence
        merged = result2.copy()
        merged["confidence"] = min(0.92, max(conf1, conf2) + 0.1)
        merged["extraction_method"] = "dual_pass_agreement"
        return merged
    
    # Disagreement - do a third verification pass
    result3 = await single_extraction(image_base64, document_type, api_key, pass_num=3)
    num3_raw = result3.get("extracted_data", {}).get("aadhaar_number") or ""
    num3 = str(num3_raw).replace(" ", "")
    logging.info(f"Pass 3 - Aadhaar: {num3_raw}")
    
    # Check how many passes disagree
    numbers_set = set([num1, num2, num3])
    disagreement_level = len(numbers_set)
    
    # Compare digit by digit and use consensus
    final_number = consensus_digit_voting(num1, num2, num3)
    logging.info(f"Consensus result: {final_number}")
    
    # Determine confidence based on agreement level
    if disagreement_level >= 3:
        # All three passes gave different numbers - low quality image
        confidence = 0.65
        requires_review = True
        quality_warning = "All 3 extraction passes returned different results. Image quality may be too low for reliable OCR. Consider uploading a clearer image."
    elif disagreement_level == 2:
        # Two passes disagree
        confidence = 0.75
        requires_review = True
        quality_warning = "Extraction passes had disagreements. Result may need manual verification."
    else:
        confidence = 0.85
        requires_review = False
        quality_warning = None
    
    if len(final_number) == 12:
        formatted = f"{final_number[:4]} {final_number[4:8]} {final_number[8:12]}"
        
        return {
            "document_type": "aadhaar",
            "extracted_data": {
                "aadhaar_number": formatted,
                **{k: v for k, v in result2.get("extracted_data", {}).items() if k != "aadhaar_number"}
            },
            "confidence": confidence,
            "extraction_method": "triple_pass_digit_consensus",
            "requires_human_review": requires_review,
            "quality_warning": quality_warning,
            "extraction_details": {
                "pass1": f"{num1[:4]} {num1[4:8]} {num1[8:12]}" if len(num1) == 12 else num1,
                "pass2": f"{num2[:4]} {num2[4:8]} {num2[8:12]}" if len(num2) == 12 else num2,
                "pass3": f"{num3[:4]} {num3[4:8]} {num3[8:12]}" if len(num3) == 12 else num3,
                "consensus": formatted
            }
        }
    
    # Fallback to the best single result
    best_result = max([result1, result2, result3], key=lambda r: r.get("confidence", 0))
    best_result["extraction_method"] = "triple_pass_best_confidence"
    return best_result

def consensus_digit_voting(num1: str, num2: str, num3: str) -> str:
    """Vote on each digit position across 3 extraction passes"""
    
    # Ensure all have 12 digits, pad if needed
    nums = []
    for n in [num1, num2, num3]:
        clean = n.replace(" ", "")
        if len(clean) == 12:
            nums.append(clean)
    
    if len(nums) < 2:
        # Not enough valid extractions
        return num1.replace(" ", "") if len(num1.replace(" ", "")) == 12 else ""
    
    result = []
    for i in range(12):
        digits = [n[i] for n in nums]
        
        # Count votes
        counts = {}
        for d in digits:
            counts[d] = counts.get(d, 0) + 1
        
        # Get the most common digit
        best_digit = max(counts, key=counts.get)
        
        # If there's a tie or disagreement, apply confusion rules
        if counts[best_digit] < 2 and len(nums) >= 2:
            # Apply confusion correction
            # Common confusions: 5↔9, 3↔8, 0↔6
            corrected = apply_confusion_correction(digits)
            result.append(corrected)
        else:
            result.append(best_digit)
    
    return "".join(result)

# ========== MAIN OCR FUNCTION ==========

async def extract_document_info(image_base64: str, document_type: Optional[str] = None, use_gpt_fallback: bool = False) -> Dict[str, Any]:
    """
    Universal Document Extractor
    
    Supports: Aadhaar, PAN, DL, Passport, Voter ID, and general documents
    Engine: Tesseract with multi-pass preprocessing
    Fallback: GPT Vision for difficult images (optional)
    
    Cost: ~$0.001/extraction (Tesseract) or ~$0.02/extraction (GPT fallback)
    """
    try:
        # Use the Tesseract-based implementation from ocr_engine.py
        result = await extract_document(image_base64, document_type)
        
        # Convert ExtractionResult object to dictionary
        return {
            "document_type": result.document_type,
            "extracted_data": result.extracted_data,
            "confidence": result.confidence,
            "extraction_method": getattr(result, 'extraction_method', 'tesseract'),
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
