"""
ExtractAI - Lightweight Self-hosted OCR Engine using Tesseract
Cost: ~$0.001 per extraction (just CPU)
Memory: ~100MB (vs 2GB+ for neural OCR)
Accuracy: 90-95% on clear documents
"""

import re
import logging
import base64
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass
from enum import Enum
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import io

logger = logging.getLogger(__name__)


class DocumentType(Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    DRIVING_LICENSE = "dl"
    UNKNOWN = "unknown"


@dataclass
class ExtractionResult:
    document_type: str
    extracted_data: Dict[str, Any]
    raw_text: str
    confidence: float
    extraction_method: str = "tesseract"


# ============ VALIDATION PATTERNS ============

# Aadhaar: 12 digits (XXXX XXXX XXXX), first digit 2-9
AADHAAR_PATTERN = re.compile(r'[2-9]\d{3}\s?\d{4}\s?\d{4}')

# PAN: 5 letters + 4 digits + 1 letter
PAN_PATTERN = re.compile(r'[A-Z]{5}[0-9]{4}[A-Z]')

# DL patterns
DL_PATTERNS = [
    re.compile(r'[A-Z]{2}[0-9]{2}\s?[0-9]{4}\s?[0-9]{7}'),
    re.compile(r'[A-Z]{2}-[0-9]{2}-[0-9]{4}-[0-9]{7}'),
    re.compile(r'[A-Z]{2}[0-9]{13}'),
]

# Date pattern
DATE_PATTERN = re.compile(r'(\d{2})[/\-.](\d{2})[/\-.](\d{4})')

# Name pattern
NAME_PATTERN = re.compile(r'(?:Name|नाम)[:\s]*([A-Z][A-Za-z\s]+?)(?:\n|$|Father|DOB|Date|Gender)', re.IGNORECASE)


def preprocess_image(image_base64: str) -> Image.Image:
    """Convert base64 to PIL Image and enhance for better OCR"""
    try:
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Enhance image for better OCR
        # 1. Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # 2. Sharpen
        image = image.filter(ImageFilter.SHARPEN)
        
        return image
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise ValueError(f"Invalid image data: {e}")


def extract_text_with_tesseract(image: Image.Image) -> Tuple[str, float, Dict]:
    """Extract text using Tesseract OCR"""
    
    # Get detailed data including confidence
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    
    # Calculate average confidence (excluding -1 which means no text)
    confidences = [int(c) for c in data['conf'] if int(c) > 0]
    avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0
    
    # Get full text
    full_text = pytesseract.image_to_string(image)
    
    return full_text, avg_confidence, data


def detect_document_type(text: str) -> DocumentType:
    """Detect document type from text"""
    text_upper = text.upper()
    
    # Aadhaar indicators
    if any(kw in text_upper for kw in ['AADHAAR', 'आधार', 'UIDAI', 'UNIQUE IDENTIFICATION']):
        return DocumentType.AADHAAR
    
    # PAN indicators
    if any(kw in text_upper for kw in ['PERMANENT ACCOUNT', 'INCOME TAX', 'आयकर']):
        return DocumentType.PAN
    
    # DL indicators
    if any(kw in text_upper for kw in ['DRIVING', 'LICENSE', 'LICENCE', 'LMV', 'MCWG']):
        return DocumentType.DRIVING_LICENSE
    
    # Fallback: check patterns
    clean = text.replace(' ', '').replace('\n', '')
    if AADHAAR_PATTERN.search(clean):
        return DocumentType.AADHAAR
    if PAN_PATTERN.search(text_upper):
        return DocumentType.PAN
    
    return DocumentType.UNKNOWN


def extract_aadhaar_fields(text: str) -> Dict[str, Any]:
    """Extract Aadhaar fields"""
    fields = {}
    
    # Clean text for number extraction
    clean = text.replace(' ', '').replace('\n', '').replace('O', '0').replace('o', '0')
    
    # Find 12-digit number starting with 2-9
    match = AADHAAR_PATTERN.search(clean)
    if match:
        num = match.group().replace(' ', '')
        fields['aadhaar_number'] = f"{num[:4]} {num[4:8]} {num[8:12]}"
    else:
        # Try finding any 12 consecutive digits
        digit_match = re.search(r'[2-9]\d{11}', clean)
        if digit_match:
            num = digit_match.group()
            fields['aadhaar_number'] = f"{num[:4]} {num[4:8]} {num[8:12]}"
    
    # Extract DOB
    dob = DATE_PATTERN.search(text)
    if dob:
        fields['date_of_birth'] = f"{dob.group(1)}/{dob.group(2)}/{dob.group(3)}"
    
    # Extract gender
    if re.search(r'\b(MALE|पुरुष)\b', text, re.IGNORECASE):
        fields['gender'] = 'Male'
    elif re.search(r'\b(FEMALE|महिला)\b', text, re.IGNORECASE):
        fields['gender'] = 'Female'
    
    return fields


def extract_pan_fields(text: str) -> Dict[str, Any]:
    """Extract PAN fields"""
    fields = {}
    
    match = PAN_PATTERN.search(text.upper())
    if match:
        fields['pan_number'] = match.group()
    
    dob = DATE_PATTERN.search(text)
    if dob:
        fields['date_of_birth'] = f"{dob.group(1)}/{dob.group(2)}/{dob.group(3)}"
    
    return fields


def extract_dl_fields(text: str) -> Dict[str, Any]:
    """Extract DL fields"""
    fields = {}
    
    clean = text.upper().replace(' ', '')
    for pattern in DL_PATTERNS:
        match = pattern.search(clean)
        if match:
            fields['dl_number'] = match.group()
            break
    
    return fields


def validate_aadhaar(aadhaar: str) -> bool:
    """Verhoeff checksum validation"""
    d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
         [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
         [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
         [9,8,7,6,5,4,3,2,1,0]]
    p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
         [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
         [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]
    
    clean = aadhaar.replace(' ', '')
    if len(clean) != 12 or not clean.isdigit():
        return False
    c = 0
    for i, digit in enumerate(reversed(clean)):
        c = d[c][p[i % 8][int(digit)]]
    return c == 0


async def extract_document(image_base64: str, document_type: Optional[str] = None) -> ExtractionResult:
    """
    Main extraction function using Tesseract
    Cost: ~$0.001/extraction | Memory: ~100MB
    """
    try:
        logger.info(f"Starting Tesseract extraction, hint: {document_type}")
        
        # Preprocess
        image = preprocess_image(image_base64)
        
        # Extract text
        full_text, confidence, _ = extract_text_with_tesseract(image)
        logger.info(f"Extracted {len(full_text)} chars, confidence: {confidence:.2f}")
        
        if not full_text.strip():
            return ExtractionResult("unknown", {}, "", 0, "tesseract")
        
        # Detect type
        if document_type and document_type != "auto":
            try:
                doc_type = DocumentType(document_type)
            except:
                doc_type = detect_document_type(full_text)
        else:
            doc_type = detect_document_type(full_text)
        
        # Extract fields
        if doc_type == DocumentType.AADHAAR:
            extracted = extract_aadhaar_fields(full_text)
            if 'aadhaar_number' in extracted:
                extracted['checksum_valid'] = validate_aadhaar(extracted['aadhaar_number'])
        elif doc_type == DocumentType.PAN:
            extracted = extract_pan_fields(full_text)
        elif doc_type == DocumentType.DRIVING_LICENSE:
            extracted = extract_dl_fields(full_text)
        else:
            extracted = {"raw_text": full_text[:500]}
        
        return ExtractionResult(
            document_type=doc_type.value,
            extracted_data=extracted,
            raw_text=full_text,
            confidence=round(confidence, 2),
            extraction_method="tesseract"
        )
        
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise
