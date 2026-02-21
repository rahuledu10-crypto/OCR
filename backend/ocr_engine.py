"""
ExtractAI - Universal Document Extractor
========================================
Supports: Aadhaar, PAN, DL, Passport, Voter ID, and general documents
Engine: Tesseract with multi-pass preprocessing
Fallback: GPT Vision for difficult images (optional)

Cost: ~$0.001/extraction (Tesseract) or ~$0.02/extraction (GPT fallback)
"""

import re
import logging
import base64
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass, field
from enum import Enum
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io
import os

logger = logging.getLogger(__name__)


# ============ DOCUMENT TYPES ============

class DocumentType(Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    DRIVING_LICENSE = "dl"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"
    RATION_CARD = "ration_card"
    BANK_STATEMENT = "bank_statement"
    UNKNOWN = "unknown"


@dataclass
class ExtractionResult:
    document_type: str
    extracted_data: Dict[str, Any]
    raw_text: str
    confidence: float
    extraction_method: str = "tesseract"
    quality_score: float = 0.0
    preprocessing_used: str = ""
    suggestions: List[str] = field(default_factory=list)


# ============ COMPREHENSIVE PATTERNS ============

PATTERNS = {
    # Aadhaar: 12 digits, first digit 2-9
    "aadhaar": {
        "number": [
            re.compile(r'[2-9]\d{3}\s?\d{4}\s?\d{4}'),
            re.compile(r'[2-9]\d{11}'),
        ],
        "keywords": ['AADHAAR', 'आधार', 'UIDAI', 'UNIQUE IDENTIFICATION', 'GOVERNMENT OF INDIA', 'भारत सरकार'],
    },
    
    # PAN: ABCDE1234F format
    "pan": {
        "number": [
            re.compile(r'[A-Z]{5}[0-9]{4}[A-Z]'),
            re.compile(r'[A-Z]{3}[PCHATBLJGF][A-Z][0-9]{4}[A-Z]'),  # Valid 4th char
        ],
        "keywords": ['PERMANENT ACCOUNT NUMBER', 'INCOME TAX', 'PAN', 'आयकर विभाग', 'DEPT'],
    },
    
    # Driving License
    "dl": {
        "number": [
            re.compile(r'[A-Z]{2}[0-9]{2}\s?[0-9]{4}\s?[0-9]{7}'),
            re.compile(r'[A-Z]{2}-[0-9]{2}-[0-9]{4}-[0-9]{7}'),
            re.compile(r'[A-Z]{2}[0-9]{13}'),
            re.compile(r'DL[0-9A-Z]{10,15}'),
        ],
        "keywords": ['DRIVING', 'LICENSE', 'LICENCE', 'TRANSPORT', 'LMV', 'MCWG', 'MOTOR VEHICLE'],
    },
    
    # Passport
    "passport": {
        "number": [
            re.compile(r'[A-Z][0-9]{7}'),  # Indian passport: Letter + 7 digits
            re.compile(r'[A-Z]{2}[0-9]{7}'),  # Some formats
        ],
        "keywords": ['PASSPORT', 'REPUBLIC OF INDIA', 'PASSEPORT', 'TYPE', 'NATIONALITY', 'INDIAN'],
    },
    
    # Voter ID (EPIC)
    "voter_id": {
        "number": [
            re.compile(r'[A-Z]{3}[0-9]{7}'),  # Format: ABC1234567
        ],
        "keywords": ['ELECTION', 'VOTER', 'EPIC', 'ELECTORAL', 'PHOTO IDENTITY'],
    },
    
    # Common patterns
    "date": re.compile(r'(\d{2})[/\-.](\d{2})[/\-.](\d{4})'),
    "name": re.compile(r'(?:Name|नाम)[:\s]*([A-Z][A-Za-z\s\.]+?)(?:\n|$|Father|DOB|Date|Gender|S/O|D/O|W/O)', re.IGNORECASE),
    "father_name": re.compile(r"(?:Father'?s?\s*(?:Name)?|S/?O|पिता)[:\s]*([A-Z][A-Za-z\s\.]+?)(?:\n|$|DOB|Date)", re.IGNORECASE),
    "dob": re.compile(r'(?:DOB|Date\s*of\s*Birth|Birth|जन्म)[:\s]*(\d{2})[/\-.](\d{2})[/\-.](\d{4})', re.IGNORECASE),
    "gender": re.compile(r'\b(MALE|FEMALE|M|F|पुरुष|महिला)\b', re.IGNORECASE),
    "address": re.compile(r'(?:Address|पता)[:\s]*(.+?)(?:\n\n|$)', re.IGNORECASE | re.DOTALL),
}


# ============ IMAGE PREPROCESSING ============

def preprocess_image_multi(image: Image.Image) -> List[Tuple[Image.Image, str]]:
    """
    Apply multiple preprocessing techniques and return all versions.
    This allows us to try OCR on each and pick the best result.
    """
    results = []
    
    # Ensure RGB
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # 1. Original (resized if small)
    img1 = image.copy()
    if img1.width < 1000:
        scale = 1000 / img1.width
        img1 = img1.resize((int(img1.width * scale), int(img1.height * scale)), Image.LANCZOS)
    results.append((img1, "original_scaled"))
    
    # 2. Grayscale + High Contrast
    img2 = image.convert('L')
    img2 = ImageEnhance.Contrast(img2).enhance(2.0)
    if img2.width < 1000:
        scale = 1000 / img2.width
        img2 = img2.resize((int(img2.width * scale), int(img2.height * scale)), Image.LANCZOS)
    results.append((img2, "grayscale_contrast"))
    
    # 3. Sharpen + Resize 2x
    img3 = image.filter(ImageFilter.SHARPEN)
    img3 = img3.filter(ImageFilter.SHARPEN)  # Double sharpen
    img3 = img3.resize((image.width * 2, image.height * 2), Image.LANCZOS)
    results.append((img3, "sharpen_2x"))
    
    # 4. Adaptive threshold simulation (high contrast grayscale)
    img4 = image.convert('L')
    img4 = ImageOps.autocontrast(img4, cutoff=2)
    img4 = img4.resize((image.width * 2, image.height * 2), Image.LANCZOS)
    results.append((img4, "autocontrast_2x"))
    
    # 5. Denoise + Sharpen
    img5 = image.filter(ImageFilter.MedianFilter(size=3))
    img5 = img5.filter(ImageFilter.SHARPEN)
    img5 = ImageEnhance.Contrast(img5).enhance(1.5)
    results.append((img5, "denoise_sharpen"))
    
    return results


def decode_base64_image(image_base64: str) -> Image.Image:
    """Decode base64 to PIL Image"""
    try:
        image_data = base64.b64decode(image_base64)
        return Image.open(io.BytesIO(image_data))
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}")


# ============ OCR EXTRACTION ============

def run_tesseract(image: Image.Image) -> Tuple[str, float]:
    """Run Tesseract and return text with confidence"""
    try:
        # Get detailed data
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config='--psm 6')
        
        # Calculate confidence
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        avg_conf = sum(confidences) / len(confidences) / 100 if confidences else 0
        
        # Get text
        text = pytesseract.image_to_string(image, config='--psm 6')
        
        return text, avg_conf
    except Exception as e:
        logger.error(f"Tesseract error: {e}")
        return "", 0.0


def extract_text_multipass(image: Image.Image) -> Tuple[str, float, str]:
    """
    Run OCR with multiple preprocessing methods.
    Returns the best result based on text length and confidence.
    """
    preprocessed = preprocess_image_multi(image)
    
    best_text = ""
    best_conf = 0.0
    best_method = ""
    
    for proc_image, method_name in preprocessed:
        text, conf = run_tesseract(proc_image)
        
        # Score based on: text length, confidence, and presence of numbers
        digit_count = len(re.findall(r'\d', text))
        score = len(text) * conf * (1 + digit_count * 0.1)
        best_score = len(best_text) * best_conf * (1 + len(re.findall(r'\d', best_text)) * 0.1)
        
        if score > best_score:
            best_text = text
            best_conf = conf
            best_method = method_name
    
    logger.info(f"Best preprocessing: {best_method}, conf: {best_conf:.2f}, text_len: {len(best_text)}")
    
    return best_text, best_conf, best_method


# ============ DOCUMENT DETECTION ============

def detect_document_type(text: str) -> DocumentType:
    """Detect document type from extracted text"""
    text_upper = text.upper()
    
    # Score each document type
    scores = {}
    
    for doc_type in ["aadhaar", "pan", "dl", "passport", "voter_id"]:
        pattern_info = PATTERNS.get(doc_type, {})
        keywords = pattern_info.get("keywords", [])
        number_patterns = pattern_info.get("number", [])
        
        # Keyword score
        keyword_score = sum(1 for kw in keywords if kw.upper() in text_upper)
        
        # Pattern score
        pattern_score = 0
        clean_text = text.replace(' ', '').replace('\n', '')
        for pattern in number_patterns:
            if pattern.search(clean_text) or pattern.search(text_upper):
                pattern_score += 2
                break
        
        scores[doc_type] = keyword_score + pattern_score
    
    # Get the best match
    best_type = max(scores, key=scores.get)
    
    if scores[best_type] > 0:
        return DocumentType(best_type)
    
    return DocumentType.UNKNOWN


# ============ FIELD EXTRACTION ============

def extract_aadhaar_fields(text: str) -> Dict[str, Any]:
    """Extract Aadhaar card fields"""
    fields = {}
    
    # Clean text for number extraction
    clean = text.replace(' ', '').replace('\n', '').replace('O', '0').replace('o', '0')
    clean = re.sub(r'[^\d]', lambda m: m.group() if m.group().isalpha() else '', clean)
    
    # Also try original with just space removal
    clean2 = re.sub(r'[^0-9]', '', text)
    
    # Find Aadhaar number
    for pattern in PATTERNS["aadhaar"]["number"]:
        match = pattern.search(clean) or pattern.search(clean2) or pattern.search(text)
        if match:
            num = re.sub(r'[^0-9]', '', match.group())
            if len(num) == 12 and num[0] in '23456789':
                fields['aadhaar_number'] = f"{num[:4]} {num[4:8]} {num[8:12]}"
                break
    
    # If not found, try to find any 12-digit sequence
    if 'aadhaar_number' not in fields:
        all_digits = re.sub(r'[^0-9]', '', text)
        for i in range(len(all_digits) - 11):
            candidate = all_digits[i:i+12]
            if candidate[0] in '23456789':
                fields['aadhaar_number'] = f"{candidate[:4]} {candidate[4:8]} {candidate[8:12]}"
                break
    
    # Name
    name_match = PATTERNS["name"].search(text)
    if name_match:
        fields['name'] = name_match.group(1).strip()
    
    # DOB
    dob_match = PATTERNS["dob"].search(text) or PATTERNS["date"].search(text)
    if dob_match:
        fields['date_of_birth'] = f"{dob_match.group(1)}/{dob_match.group(2)}/{dob_match.group(3)}"
    
    # Gender
    gender_match = PATTERNS["gender"].search(text)
    if gender_match:
        g = gender_match.group(1).upper()
        fields['gender'] = 'Male' if g in ['MALE', 'M', 'पुरुष'] else 'Female'
    
    # Address
    addr_match = PATTERNS["address"].search(text)
    if addr_match:
        fields['address'] = addr_match.group(1).strip()[:200]
    
    return fields


def extract_pan_fields(text: str) -> Dict[str, Any]:
    """Extract PAN card fields"""
    fields = {}
    text_upper = text.upper()
    
    # PAN Number
    for pattern in PATTERNS["pan"]["number"]:
        match = pattern.search(text_upper)
        if match:
            fields['pan_number'] = match.group()
            break
    
    # Name
    name_match = PATTERNS["name"].search(text)
    if name_match:
        fields['name'] = name_match.group(1).strip()
    
    # Father's name
    father_match = PATTERNS["father_name"].search(text)
    if father_match:
        fields['father_name'] = father_match.group(1).strip()
    
    # DOB
    dob_match = PATTERNS["dob"].search(text) or PATTERNS["date"].search(text)
    if dob_match:
        fields['date_of_birth'] = f"{dob_match.group(1)}/{dob_match.group(2)}/{dob_match.group(3)}"
    
    return fields


def extract_dl_fields(text: str) -> Dict[str, Any]:
    """Extract Driving License fields"""
    fields = {}
    clean = text.upper().replace(' ', '').replace('-', '')
    
    # DL Number
    for pattern in PATTERNS["dl"]["number"]:
        match = pattern.search(clean) or pattern.search(text.upper())
        if match:
            fields['dl_number'] = match.group()
            break
    
    # Name
    name_match = PATTERNS["name"].search(text)
    if name_match:
        fields['name'] = name_match.group(1).strip()
    
    # DOB
    dob_match = PATTERNS["dob"].search(text)
    if dob_match:
        fields['date_of_birth'] = f"{dob_match.group(1)}/{dob_match.group(2)}/{dob_match.group(3)}"
    
    # Validity
    validity_match = re.search(r'(?:Valid|Validity|NT|Expiry)[:\s]*(?:Till|Upto|To)?[:\s]*(\d{2})[/\-.](\d{2})[/\-.](\d{4})', text, re.IGNORECASE)
    if validity_match:
        fields['validity'] = f"{validity_match.group(1)}/{validity_match.group(2)}/{validity_match.group(3)}"
    
    # Vehicle class
    class_match = re.search(r'(?:COV|Class|Category|LMV|MCWG)[:\s]*([A-Z0-9,\s/]+?)(?:\n|$)', text.upper())
    if class_match:
        fields['vehicle_class'] = class_match.group(1).strip()
    
    # Blood group
    blood_match = re.search(r'(?:Blood|BG)[:\s]*([ABO]+[+-]?)', text.upper())
    if blood_match:
        fields['blood_group'] = blood_match.group(1)
    
    return fields


def extract_passport_fields(text: str) -> Dict[str, Any]:
    """Extract Passport fields"""
    fields = {}
    text_upper = text.upper()
    
    # Passport Number
    for pattern in PATTERNS["passport"]["number"]:
        match = pattern.search(text_upper)
        if match:
            fields['passport_number'] = match.group()
            break
    
    # Name (passport often has Given Names and Surname separately)
    surname_match = re.search(r'(?:Surname|Family)[:\s]*([A-Z\s]+?)(?:\n|$)', text_upper)
    if surname_match:
        fields['surname'] = surname_match.group(1).strip()
    
    given_match = re.search(r'(?:Given\s*Names?)[:\s]*([A-Z\s]+?)(?:\n|$)', text_upper)
    if given_match:
        fields['given_names'] = given_match.group(1).strip()
    
    # Nationality
    if 'INDIAN' in text_upper:
        fields['nationality'] = 'Indian'
    
    # DOB
    dob_match = PATTERNS["dob"].search(text) or PATTERNS["date"].search(text)
    if dob_match:
        fields['date_of_birth'] = f"{dob_match.group(1)}/{dob_match.group(2)}/{dob_match.group(3)}"
    
    # Gender
    gender_match = PATTERNS["gender"].search(text)
    if gender_match:
        g = gender_match.group(1).upper()
        fields['gender'] = 'Male' if g in ['MALE', 'M'] else 'Female'
    
    # Place of birth
    pob_match = re.search(r'(?:Place\s*of\s*Birth)[:\s]*([A-Z\s,]+?)(?:\n|$)', text_upper)
    if pob_match:
        fields['place_of_birth'] = pob_match.group(1).strip()
    
    # Issue/Expiry dates
    issue_match = re.search(r'(?:Date\s*of\s*Issue|Issue)[:\s]*(\d{2})[/\-.](\d{2})[/\-.](\d{4})', text, re.IGNORECASE)
    if issue_match:
        fields['date_of_issue'] = f"{issue_match.group(1)}/{issue_match.group(2)}/{issue_match.group(3)}"
    
    expiry_match = re.search(r'(?:Date\s*of\s*Expiry|Expiry|Valid)[:\s]*(\d{2})[/\-.](\d{2})[/\-.](\d{4})', text, re.IGNORECASE)
    if expiry_match:
        fields['date_of_expiry'] = f"{expiry_match.group(1)}/{expiry_match.group(2)}/{expiry_match.group(3)}"
    
    return fields


def extract_voter_id_fields(text: str) -> Dict[str, Any]:
    """Extract Voter ID (EPIC) fields"""
    fields = {}
    text_upper = text.upper()
    
    # EPIC Number
    for pattern in PATTERNS["voter_id"]["number"]:
        match = pattern.search(text_upper)
        if match:
            fields['epic_number'] = match.group()
            break
    
    # Name
    name_match = PATTERNS["name"].search(text)
    if name_match:
        fields['name'] = name_match.group(1).strip()
    
    # Father's/Husband's name
    relation_match = re.search(r"(?:Father'?s?|Husband'?s?|S/?O|D/?O|W/?O)[:\s]*([A-Z][A-Za-z\s\.]+?)(?:\n|$)", text, re.IGNORECASE)
    if relation_match:
        fields['relation_name'] = relation_match.group(1).strip()
    
    # DOB or Age
    dob_match = PATTERNS["dob"].search(text)
    if dob_match:
        fields['date_of_birth'] = f"{dob_match.group(1)}/{dob_match.group(2)}/{dob_match.group(3)}"
    else:
        age_match = re.search(r'(?:Age|आयु)[:\s]*(\d{1,3})', text, re.IGNORECASE)
        if age_match:
            fields['age'] = age_match.group(1)
    
    # Gender
    gender_match = PATTERNS["gender"].search(text)
    if gender_match:
        g = gender_match.group(1).upper()
        fields['gender'] = 'Male' if g in ['MALE', 'M', 'पुरुष'] else 'Female'
    
    return fields


def extract_generic_fields(text: str) -> Dict[str, Any]:
    """Extract common fields from any document"""
    fields = {}
    
    # All dates found
    dates = PATTERNS["date"].findall(text)
    if dates:
        fields['dates_found'] = [f"{d[0]}/{d[1]}/{d[2]}" for d in dates[:5]]
    
    # All potential ID numbers (alphanumeric patterns)
    id_patterns = re.findall(r'\b[A-Z0-9]{8,20}\b', text.upper())
    if id_patterns:
        fields['potential_ids'] = list(set(id_patterns))[:5]
    
    # Names
    name_match = PATTERNS["name"].search(text)
    if name_match:
        fields['name'] = name_match.group(1).strip()
    
    # Raw text (truncated)
    fields['raw_text_preview'] = text[:500]
    
    return fields


# ============ VALIDATION ============

def validate_aadhaar(aadhaar: str) -> bool:
    """Verhoeff checksum validation for Aadhaar"""
    d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
         [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
         [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
         [9,8,7,6,5,4,3,2,1,0]]
    p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
         [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
         [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]
    
    clean = re.sub(r'[^0-9]', '', aadhaar)
    if len(clean) != 12:
        return False
    c = 0
    for i, digit in enumerate(reversed(clean)):
        c = d[c][p[i % 8][int(digit)]]
    return c == 0


def validate_pan(pan: str) -> Tuple[bool, str]:
    """Validate PAN format and return holder type"""
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan):
        return False, "Invalid"
    
    holder_types = {
        'P': 'Individual', 'C': 'Company', 'H': 'HUF', 'F': 'Firm',
        'A': 'AOP', 'T': 'Trust', 'B': 'BOI', 'L': 'Local Authority',
        'J': 'Artificial Juridical Person', 'G': 'Government'
    }
    return True, holder_types.get(pan[3], 'Unknown')


def validate_passport(passport_num: str) -> bool:
    """Basic passport number validation"""
    return bool(re.match(r'^[A-Z][0-9]{7}$', passport_num))


# ============ QUALITY ASSESSMENT ============

def assess_quality(text: str, confidence: float, extracted_data: Dict) -> Tuple[float, List[str]]:
    """
    Assess extraction quality and provide suggestions.
    Returns (quality_score 0-1, list of suggestions)
    """
    score = confidence
    suggestions = []
    
    # Text length check
    if len(text) < 50:
        score *= 0.5
        suggestions.append("Low text extracted - image may be too blurry or low resolution")
    
    # Check if key fields were extracted
    key_fields = ['aadhaar_number', 'pan_number', 'dl_number', 'passport_number', 'epic_number']
    has_key_field = any(f in extracted_data for f in key_fields)
    
    if not has_key_field:
        score *= 0.6
        suggestions.append("Could not extract primary ID number - try a clearer image")
    
    # Digit density check (IDs should have numbers)
    digit_ratio = len(re.findall(r'\d', text)) / max(len(text), 1)
    if digit_ratio < 0.05:
        score *= 0.7
        suggestions.append("Very few digits detected - ensure document is properly visible")
    
    # Confidence threshold suggestions
    if confidence < 0.5:
        suggestions.append("Low OCR confidence - consider using higher resolution image")
    
    if not suggestions:
        suggestions.append("Extraction quality looks good")
    
    return min(score, 1.0), suggestions


# ============ MAIN EXTRACTION FUNCTION ============

async def extract_document(image_base64: str, document_type: Optional[str] = None) -> ExtractionResult:
    """
    Main extraction function - Universal Document Extractor
    
    Supports: Aadhaar, PAN, DL, Passport, Voter ID, and general documents
    """
    try:
        logger.info(f"Starting extraction, hint: {document_type}")
        
        # Decode image
        image = decode_base64_image(image_base64)
        logger.info(f"Image loaded: {image.size}, mode: {image.mode}")
        
        # Multi-pass OCR
        text, confidence, preprocess_method = extract_text_multipass(image)
        logger.info(f"OCR complete: {len(text)} chars, conf: {confidence:.2f}")
        
        if not text.strip():
            return ExtractionResult(
                document_type="unknown",
                extracted_data={},
                raw_text="",
                confidence=0,
                quality_score=0,
                suggestions=["No text could be extracted. Please ensure the image is clear and well-lit."]
            )
        
        # Detect document type
        if document_type and document_type != "auto":
            try:
                doc_type = DocumentType(document_type)
            except ValueError:
                doc_type = detect_document_type(text)
        else:
            doc_type = detect_document_type(text)
        
        logger.info(f"Document type: {doc_type.value}")
        
        # Extract fields based on document type
        if doc_type == DocumentType.AADHAAR:
            extracted = extract_aadhaar_fields(text)
            if 'aadhaar_number' in extracted:
                extracted['checksum_valid'] = validate_aadhaar(extracted['aadhaar_number'])
                
        elif doc_type == DocumentType.PAN:
            extracted = extract_pan_fields(text)
            if 'pan_number' in extracted:
                is_valid, holder_type = validate_pan(extracted['pan_number'])
                extracted['format_valid'] = is_valid
                extracted['holder_type'] = holder_type
                
        elif doc_type == DocumentType.DRIVING_LICENSE:
            extracted = extract_dl_fields(text)
            
        elif doc_type == DocumentType.PASSPORT:
            extracted = extract_passport_fields(text)
            if 'passport_number' in extracted:
                extracted['format_valid'] = validate_passport(extracted['passport_number'])
                
        elif doc_type == DocumentType.VOTER_ID:
            extracted = extract_voter_id_fields(text)
            
        else:
            extracted = extract_generic_fields(text)
        
        # Quality assessment
        quality_score, suggestions = assess_quality(text, confidence, extracted)
        
        logger.info(f"Extraction complete: {extracted}")
        
        return ExtractionResult(
            document_type=doc_type.value,
            extracted_data=extracted,
            raw_text=text,
            confidence=round(confidence, 2),
            extraction_method="tesseract",
            quality_score=round(quality_score, 2),
            preprocessing_used=preprocess_method,
            suggestions=suggestions
        )
        
    except ValueError as e:
        raise
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


# ============ GPT VISION FALLBACK (Optional) ============

async def extract_with_gpt_fallback(image_base64: str, document_type: Optional[str] = None) -> ExtractionResult:
    """
    Try Tesseract first, fall back to GPT Vision for low quality results.
    Uses GPT only when necessary to minimize costs.
    """
    # First try Tesseract
    result = await extract_document(image_base64, document_type)
    
    # Check if we need GPT fallback
    needs_fallback = (
        result.quality_score < 0.4 or
        result.confidence < 0.3 or
        (result.document_type != "unknown" and not any(
            k in result.extracted_data 
            for k in ['aadhaar_number', 'pan_number', 'dl_number', 'passport_number', 'epic_number']
        ))
    )
    
    if needs_fallback:
        logger.info("Low quality result, attempting GPT Vision fallback...")
        try:
            gpt_result = await extract_with_gpt_vision(image_base64, document_type)
            if gpt_result and gpt_result.confidence > result.confidence:
                gpt_result.extraction_method = "gpt_vision_fallback"
                return gpt_result
        except Exception as e:
            logger.warning(f"GPT fallback failed: {e}")
    
    return result


async def extract_with_gpt_vision(image_base64: str, document_type: Optional[str] = None) -> Optional[ExtractionResult]:
    """
    Extract using GPT Vision (for fallback)
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        import json
        import uuid
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return None
        
        system_prompt = """You are an expert document OCR system. Extract all visible information from the document image.

For Indian ID documents, extract:
- Aadhaar: aadhaar_number (12 digits), name, dob, gender, address
- PAN: pan_number (ABCDE1234F format), name, father_name, dob
- Driving License: dl_number, name, dob, validity, vehicle_class
- Passport: passport_number, surname, given_names, dob, nationality, issue_date, expiry_date
- Voter ID: epic_number, name, relation_name, dob/age, gender

Return JSON: {"document_type": "...", "extracted_data": {...}, "confidence": 0.X}"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"ocr_gpt_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        prompt = "Extract all information from this document. Return only valid JSON."
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(text=prompt, file_contents=[image_content])
        
        response = await chat.send_message(user_message)
        
        # Parse response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            data = json.loads(json_match.group())
            return ExtractionResult(
                document_type=data.get('document_type', 'unknown'),
                extracted_data=data.get('extracted_data', {}),
                raw_text="",
                confidence=data.get('confidence', 0.8),
                extraction_method="gpt_vision"
            )
    except Exception as e:
        logger.error(f"GPT Vision error: {e}")
    
    return None
