"""
PDF Processing Module for ExtractAI
====================================
Converts PDF pages to images and processes through the OCR pipeline.
Supports multi-page PDFs with page-level error handling.
"""

import fitz  # PyMuPDF
import base64
import io
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import time

logger = logging.getLogger(__name__)

# Configuration
MAX_PAGES = 50  # Maximum pages per PDF
DEFAULT_DPI = 200  # Image resolution for OCR
MAX_FILE_SIZE_MB = 50  # Maximum PDF file size


@dataclass
class PageResult:
    """Result for a single PDF page"""
    page_number: int
    success: bool
    document_type: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    error: Optional[str] = None
    processing_time_ms: int = 0


@dataclass 
class PDFExtractionResult:
    """Complete PDF extraction result"""
    document_id: str
    total_pages: int
    pages_processed: int
    pages_successful: int
    pages_failed: int
    credits_consumed: int
    processing_time_ms: int
    pages: List[PageResult]
    merged_data: Optional[Dict[str, Any]] = None
    errors: List[Dict[str, Any]] = field(default_factory=list)


def pdf_to_images(pdf_bytes: bytes, max_pages: int = MAX_PAGES, dpi: int = DEFAULT_DPI) -> List[Dict[str, Any]]:
    """
    Convert PDF pages to base64-encoded PNG images.
    
    Args:
        pdf_bytes: Raw PDF file bytes
        max_pages: Maximum number of pages to process
        dpi: Resolution for rendering (higher = better quality but slower)
    
    Returns:
        List of dicts with page_number and image_base64
    """
    images = []
    
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        
        logger.info(f"[PDF] Opened PDF with {total_pages} pages")
        
        if total_pages > max_pages:
            logger.warning(f"[PDF] PDF has {total_pages} pages, limiting to {max_pages}")
            total_pages = max_pages
        
        # Calculate zoom factor for desired DPI (default PDF is 72 DPI)
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                
                # Render page to pixmap (image)
                pixmap = page.get_pixmap(matrix=matrix, alpha=False)
                
                # Convert to PNG bytes
                png_bytes = pixmap.tobytes("png")
                
                # Encode to base64
                image_base64 = base64.b64encode(png_bytes).decode('utf-8')
                
                images.append({
                    "page_number": page_num + 1,  # 1-indexed
                    "image_base64": image_base64,
                    "width": pixmap.width,
                    "height": pixmap.height
                })
                
                logger.debug(f"[PDF] Converted page {page_num + 1}/{total_pages}")
                
            except Exception as e:
                logger.error(f"[PDF] Error converting page {page_num + 1}: {e}")
                images.append({
                    "page_number": page_num + 1,
                    "image_base64": None,
                    "error": str(e)
                })
        
        doc.close()
        
    except Exception as e:
        logger.error(f"[PDF] Error opening PDF: {e}")
        raise ValueError(f"Failed to open PDF: {str(e)}")
    
    return images


def is_pdf(file_bytes: bytes) -> bool:
    """Check if file is a PDF by examining magic bytes"""
    return file_bytes[:4] == b'%PDF'


def is_pdf_content_type(content_type: str) -> bool:
    """Check if content type indicates PDF"""
    pdf_types = ['application/pdf', 'application/x-pdf']
    return content_type.lower() in pdf_types


def merge_extraction_results(pages: List[PageResult]) -> Dict[str, Any]:
    """
    Merge extraction results from multiple pages into a single response.
    Intelligently combines data based on document type patterns.
    """
    if not pages:
        return {}
    
    successful_pages = [p for p in pages if p.success and p.extracted_data]
    if not successful_pages:
        return {}
    
    # Detect dominant document type
    doc_types = [p.document_type for p in successful_pages if p.document_type]
    dominant_type = max(set(doc_types), key=doc_types.count) if doc_types else "unknown"
    
    merged = {
        "document_type": dominant_type,
        "source_pages": len(successful_pages),
        "data": {}
    }
    
    # Different merge strategies based on document type
    if dominant_type in ["invoice", "purchase_order", "delivery_challan"]:
        # For multi-page invoices: combine line items, keep header from page 1
        merged["data"] = _merge_invoice_data(successful_pages)
    
    elif dominant_type == "bank_statement":
        # For bank statements: combine all transactions
        merged["data"] = _merge_bank_statement(successful_pages)
    
    elif dominant_type == "prescription":
        # For prescriptions: combine medicines from all pages
        merged["data"] = _merge_prescription_data(successful_pages)
    
    else:
        # Default: combine all unique fields, prefer first occurrence
        merged["data"] = _merge_generic(successful_pages)
    
    return merged


def _merge_invoice_data(pages: List[PageResult]) -> Dict[str, Any]:
    """Merge invoice/PO data from multiple pages"""
    result = {}
    all_line_items = []
    
    for page in pages:
        data = page.extracted_data or {}
        
        # Header fields from first page
        if not result:
            for key in ["invoice_number", "date", "seller_name", "buyer_name", "gstin", 
                       "po_number", "vendor", "challan_number", "receiver"]:
                if key in data:
                    result[key] = data[key]
        
        # Collect line items from all pages
        if "line_items" in data and isinstance(data["line_items"], list):
            all_line_items.extend(data["line_items"])
        if "items" in data and isinstance(data["items"], list):
            all_line_items.extend(data["items"])
    
    # Footer fields from last page (totals)
    last_page_data = pages[-1].extracted_data or {}
    for key in ["total_amount", "tax_amount", "total_value", "bank_details"]:
        if key in last_page_data:
            result[key] = last_page_data[key]
    
    if all_line_items:
        result["line_items"] = all_line_items
    
    return result


def _merge_bank_statement(pages: List[PageResult]) -> Dict[str, Any]:
    """Merge bank statement data from multiple pages"""
    result = {}
    all_transactions = []
    
    for page in pages:
        data = page.extracted_data or {}
        
        # Account details from first page
        if not result:
            for key in ["account_holder", "account_number", "bank_name", "statement_period"]:
                if key in data:
                    result[key] = data[key]
        
        # Collect transactions from all pages
        if "transactions" in data and isinstance(data["transactions"], list):
            all_transactions.extend(data["transactions"])
    
    if all_transactions:
        result["transactions"] = all_transactions
        result["total_transactions"] = len(all_transactions)
    
    return result


def _merge_prescription_data(pages: List[PageResult]) -> Dict[str, Any]:
    """Merge prescription data from multiple pages"""
    result = {}
    all_medicines = []
    
    for page in pages:
        data = page.extracted_data or {}
        
        # Doctor/patient info from first page
        if not result:
            for key in ["doctor_name", "doctor_registration", "clinic_hospital", 
                       "patient_name", "date", "diagnosis"]:
                if key in data:
                    result[key] = data[key]
        
        # Collect medicines from all pages
        if "medicines" in data and isinstance(data["medicines"], list):
            all_medicines.extend(data["medicines"])
    
    if all_medicines:
        result["medicines"] = all_medicines
    
    return result


def _merge_generic(pages: List[PageResult]) -> Dict[str, Any]:
    """Generic merge for unknown document types"""
    result = {}
    
    for page in pages:
        data = page.extracted_data or {}
        for key, value in data.items():
            if key not in result:
                result[key] = value
            elif isinstance(result[key], list) and isinstance(value, list):
                result[key].extend(value)
    
    return result


def validate_pdf_size(file_bytes: bytes) -> bool:
    """Check if PDF is within size limits"""
    size_mb = len(file_bytes) / (1024 * 1024)
    return size_mb <= MAX_FILE_SIZE_MB


def get_pdf_page_count(file_bytes: bytes) -> int:
    """Get the number of pages in a PDF without full processing"""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        count = len(doc)
        doc.close()
        return count
    except Exception:
        return 0
