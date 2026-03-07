"""
ExtractAI Python SDK
Simple, powerful OCR for Indian documents

Installation:
    pip install extractai

Usage:
    from extractai import ExtractAI
    
    client = ExtractAI(api_key="your_api_key")
    result = client.extract("path/to/document.jpg")
    print(result.aadhaar_number)
"""

import requests
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass


@dataclass
class ExtractionResult:
    """Result of document extraction"""
    id: str
    document_type: str
    extracted_data: Dict[str, Any]
    confidence: float
    processing_time_ms: int
    
    def __getattr__(self, name: str):
        """Allow accessing extracted fields directly"""
        if name in self.extracted_data:
            return self.extracted_data[name]
        raise AttributeError(f"'{type(self).__name__}' has no attribute '{name}'")


@dataclass
class BatchResult:
    """Result of batch extraction"""
    batch_id: str
    total: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    processing_time_ms: int


class ExtractAIError(Exception):
    """Base exception for ExtractAI SDK"""
    pass


class AuthenticationError(ExtractAIError):
    """API key is invalid or missing"""
    pass


class RateLimitError(ExtractAIError):
    """Rate limit exceeded"""
    pass


class UsageLimitError(ExtractAIError):
    """Monthly usage limit exceeded"""
    pass


class ExtractAI:
    """
    ExtractAI Python SDK Client
    
    Args:
        api_key: Your ExtractAI API key
        base_url: API base URL (default: https://api.extractai.in)
        timeout: Request timeout in seconds
    
    Example:
        client = ExtractAI(api_key="ocr_xxx...")
        
        # Extract from file
        result = client.extract("aadhaar.jpg")
        print(result.aadhaar_number)
        
        # Extract with document type hint
        result = client.extract("pan.jpg", document_type="pan")
        print(result.pan_number)
        
        # Extract from base64
        result = client.extract_base64(base64_string, document_type="invoice")
    """
    
    DEFAULT_BASE_URL = "https://api.extractai.in"
    
    def __init__(
        self, 
        api_key: str, 
        base_url: Optional[str] = None,
        timeout: int = 60
    ):
        self.api_key = api_key
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({
            "X-API-Key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "ExtractAI-Python/1.0"
        })
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make API request"""
        url = f"{self.base_url}/api{endpoint}"
        
        try:
            response = self._session.request(
                method=method,
                url=url,
                json=data,
                timeout=self.timeout
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid API key")
            elif response.status_code == 402:
                raise UsageLimitError("Usage limit exceeded. Upgrade plan or add wallet balance.")
            elif response.status_code == 429:
                raise RateLimitError("Rate limit exceeded. Please slow down.")
            elif response.status_code >= 400:
                error_detail = response.json().get("detail", "Unknown error")
                raise ExtractAIError(f"API error: {error_detail}")
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise ExtractAIError("Request timed out")
        except requests.exceptions.ConnectionError:
            raise ExtractAIError("Failed to connect to API")
    
    def _file_to_base64(self, file_path: Union[str, Path]) -> str:
        """Convert file to base64 string"""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def extract(
        self, 
        file_path: Union[str, Path],
        document_type: Optional[str] = None
    ) -> ExtractionResult:
        """
        Extract data from a document image file
        
        Args:
            file_path: Path to image file (jpg, png, webp)
            document_type: Optional hint (aadhaar, pan, dl, invoice, etc.)
        
        Returns:
            ExtractionResult with extracted data
        """
        image_base64 = self._file_to_base64(file_path)
        return self.extract_base64(image_base64, document_type)
    
    def extract_base64(
        self, 
        image_base64: str,
        document_type: Optional[str] = None
    ) -> ExtractionResult:
        """
        Extract data from base64-encoded image
        
        Args:
            image_base64: Base64-encoded image string
            document_type: Optional hint (aadhaar, pan, dl, invoice, etc.)
        
        Returns:
            ExtractionResult with extracted data
        """
        data = {
            "image_base64": image_base64,
            "document_type": document_type
        }
        
        response = self._make_request("POST", "/v1/extract", data)
        
        return ExtractionResult(
            id=response["id"],
            document_type=response["document_type"],
            extracted_data=response["extracted_data"],
            confidence=response["confidence"],
            processing_time_ms=response["processing_time_ms"]
        )
    
    def batch_extract(
        self,
        images: List[Dict[str, str]],
        webhook_url: Optional[str] = None,
        webhook_secret: Optional[str] = None
    ) -> BatchResult:
        """
        Extract data from multiple documents in a single request
        
        Args:
            images: List of {"image_base64": "...", "document_type": "..."} dicts
            webhook_url: Optional URL to receive completion webhook
            webhook_secret: Optional secret for webhook signature
        
        Returns:
            BatchResult with all extraction results
        
        Example:
            results = client.batch_extract([
                {"image_base64": base64_1, "document_type": "aadhaar"},
                {"image_base64": base64_2, "document_type": "pan"},
            ])
        """
        data = {
            "images": images,
            "webhook_url": webhook_url,
            "webhook_secret": webhook_secret
        }
        
        response = self._make_request("POST", "/v1/batch-extract", data)
        
        return BatchResult(
            batch_id=response["batch_id"],
            total=response["total"],
            successful=response["successful"],
            failed=response["failed"],
            results=response["results"],
            processing_time_ms=response["processing_time_ms"]
        )
    
    def batch_extract_files(
        self,
        file_paths: List[Union[str, Path]],
        document_types: Optional[List[str]] = None
    ) -> BatchResult:
        """
        Extract data from multiple document files
        
        Args:
            file_paths: List of paths to image files
            document_types: Optional list of document type hints
        
        Returns:
            BatchResult with all extraction results
        """
        images = []
        for i, path in enumerate(file_paths):
            image_data = {
                "image_base64": self._file_to_base64(path)
            }
            if document_types and i < len(document_types):
                image_data["document_type"] = document_types[i]
            images.append(image_data)
        
        return self.batch_extract(images)


# Convenience function for quick extraction
def extract(
    api_key: str,
    file_path: Union[str, Path],
    document_type: Optional[str] = None
) -> ExtractionResult:
    """
    Quick extraction without creating client instance
    
    Example:
        from extractai import extract
        result = extract("ocr_xxx...", "aadhaar.jpg")
    """
    client = ExtractAI(api_key=api_key)
    return client.extract(file_path, document_type)
