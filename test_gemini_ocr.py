"""
Quick test for Gemini 3 Flash OCR
"""
import asyncio
import os
import sys
sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

# Simple test image - a clear 200x100 white rectangle with text
# We'll use a proper test after this initial smoke test

async def test_ocr():
    from ocr_engine import extract_document
    
    # Check if API key is set
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    print(f"API Key configured: {'Yes' if api_key else 'No'}")
    
    # Create a simple test - we'll use a minimal base64 image
    # This is just a smoke test to ensure the Gemini API is working
    import base64
    
    # Generate a simple test PNG (1x1 white pixel) - just for API connectivity test
    # Real testing will be done via the frontend
    test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    print("Testing Gemini 3 Flash Vision connectivity...")
    
    try:
        result = await extract_document(test_image, "aadhaar")
        print(f"✅ API Connected Successfully!")
        print(f"   Document Type: {result.document_type}")
        print(f"   Extraction Method: {result.extraction_method}")
        print(f"   Confidence: {result.confidence}")
        print(f"   Suggestions: {result.suggestions}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ocr())
    exit(0 if success else 1)
