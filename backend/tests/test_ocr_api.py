"""
OCR API Backend Tests using pytest
==================================
Tests all OCR API endpoints including:
- Health check
- User authentication (register/login)
- API key management (CRUD)
- OCR extraction endpoints (playground and public)
- Analytics endpoints
"""

import pytest
import requests
import os
import base64
from datetime import datetime
from PIL import Image, ImageDraw
import io


# Get base URL from environment - must be set, no defaults
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL environment variable is required")
BASE_URL = BASE_URL.rstrip('/') + '/api'


# ================== FIXTURES ==================

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_user_credentials():
    """Generate unique test user credentials"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "email": f"TEST_user_{timestamp}@example.com",
        "password": "TestPassword123!",
        "company_name": "Test Company Inc"
    }


@pytest.fixture(scope="module")
def registered_user(api_client, test_user_credentials):
    """Register a test user and return auth data"""
    response = api_client.post(
        f"{BASE_URL}/auth/register",
        json=test_user_credentials
    )
    if response.status_code != 200:
        pytest.skip(f"Could not register test user: {response.text}")
    return response.json()


@pytest.fixture(scope="module")
def jwt_token(registered_user):
    """Extract JWT token from registered user"""
    return registered_user.get("access_token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, jwt_token):
    """Session with JWT auth header"""
    api_client.headers.update({"Authorization": f"Bearer {jwt_token}"})
    return api_client


@pytest.fixture(scope="module")
def created_api_key(authenticated_client):
    """Create an API key for testing"""
    response = authenticated_client.post(
        f"{BASE_URL}/keys",
        json={"name": "TEST_pytest_api_key", "rate_limit": 100}
    )
    if response.status_code != 200:
        pytest.skip(f"Could not create API key: {response.text}")
    return response.json()


@pytest.fixture
def pan_test_image_b64():
    """Generate a realistic PAN card test image as base64"""
    img = Image.new('RGB', (400, 250), color='#F5F5DC')
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([10, 10, 390, 40], fill='#003366')
    draw.text((20, 15), 'INCOME TAX DEPARTMENT', fill='white')
    draw.text((300, 15), 'GOVT OF INDIA', fill='white')
    
    # Content
    draw.text((20, 60), 'Permanent Account Number Card', fill='black')
    draw.text((20, 100), 'ABCDE1234F', fill='black')
    draw.text((20, 140), 'Name: RAHUL KUMAR SHARMA', fill='black')
    draw.text((20, 170), "Father's Name: RAMESH SHARMA", fill='black')
    draw.text((20, 200), 'DOB: 15/08/1990', fill='black')
    
    # Photo placeholder
    draw.rectangle([300, 60, 380, 180], outline='black', width=2)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()


@pytest.fixture
def aadhaar_test_image_b64():
    """Generate a realistic Aadhaar card test image as base64"""
    img = Image.new('RGB', (400, 250), color='white')
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([10, 10, 390, 50], fill='#FF9933')
    draw.text((20, 20), 'AADHAAR', fill='white')
    draw.text((200, 20), 'Mera Aadhaar, Meri Pehchaan', fill='white')
    
    # Content
    draw.text((20, 70), 'Name: AMIT KUMAR', fill='black')
    draw.text((20, 100), 'DOB: 01/01/1985', fill='black')
    draw.text((20, 130), 'Gender: Male', fill='black')
    draw.text((20, 160), 'Aadhaar No: 2345 6789 0123', fill='black')
    draw.text((20, 200), 'Address: 123 Main Street, New Delhi', fill='black')
    
    # Photo placeholder
    draw.rectangle([300, 70, 380, 170], outline='black', width=2)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()


@pytest.fixture
def dl_test_image_b64():
    """Generate a realistic Driving License test image as base64"""
    img = Image.new('RGB', (400, 250), color='#E6E6FA')
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([10, 10, 390, 45], fill='#4169E1')
    draw.text((20, 18), 'DRIVING LICENCE', fill='white')
    draw.text((250, 18), 'TRANSPORT DEPT', fill='white')
    
    # Content
    draw.text((20, 60), 'DL No: DL-0420190012345', fill='black')
    draw.text((20, 90), 'Name: PRIYA SINGH', fill='black')
    draw.text((20, 120), 'DOB: 10/05/1992', fill='black')
    draw.text((20, 150), 'Blood Group: B+', fill='black')
    draw.text((20, 180), 'Valid Till: 2030', fill='black')
    draw.text((20, 210), 'Class: LMV, MCWG', fill='black')
    
    # Photo placeholder
    draw.rectangle([300, 60, 380, 160], outline='black', width=2)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()


# ================== HEALTH CHECK TESTS ==================

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_root_endpoint(self, api_client):
        """Test root API endpoint returns healthy status"""
        response = api_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data or "message" in data
        print(f"Root endpoint response: {data}")
    
    def test_health_endpoint(self, api_client):
        """Test dedicated health check endpoint"""
        response = api_client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "healthy"
        assert "timestamp" in data
        print(f"Health check: {data}")


# ================== AUTH TESTS ==================

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self, api_client):
        """Test user registration creates account and returns token"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        response = api_client.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"TEST_register_{timestamp}@example.com",
                "password": "SecurePassword123!",
                "company_name": "Register Test Co"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
        assert "user" in data
        assert "id" in data["user"]
        assert "email" in data["user"]
        print(f"Registered user: {data['user']['email']}")
    
    def test_register_duplicate_email_fails(self, api_client, test_user_credentials, registered_user):
        """Test registering with existing email returns 400"""
        response = api_client.post(
            f"{BASE_URL}/auth/register",
            json=test_user_credentials
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        print(f"Duplicate registration error: {data['detail']}")
    
    def test_login_success(self, api_client, test_user_credentials, registered_user):
        """Test login with valid credentials returns token"""
        response = api_client.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": test_user_credentials["email"],
                "password": test_user_credentials["password"]
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
        assert "user" in data
        print(f"Login successful for: {data['user']['email']}")
    
    def test_login_invalid_password(self, api_client, test_user_credentials, registered_user):
        """Test login with wrong password returns 401"""
        response = api_client.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": test_user_credentials["email"],
                "password": "WrongPassword123!"
            }
        )
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
        print(f"Invalid login error: {data['detail']}")
    
    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email returns 401"""
        response = api_client.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": "nonexistent_user_xyz@example.com",
                "password": "SomePassword123!"
            }
        )
        assert response.status_code == 401
    
    def test_get_current_user(self, authenticated_client, test_user_credentials):
        """Test getting current user info with JWT token"""
        response = authenticated_client.get(f"{BASE_URL}/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("email") == test_user_credentials["email"]
        assert "id" in data
        assert "created_at" in data
        print(f"Current user: {data['email']}")
    
    def test_get_user_without_token(self, api_client):
        """Test getting user info without token returns 403"""
        # Use a fresh client without auth header
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.get(f"{BASE_URL}/auth/me")
        assert response.status_code == 403  # FastAPI returns 403 for missing auth


# ================== API KEY TESTS ==================

class TestAPIKeyManagement:
    """API key CRUD tests"""
    
    def test_create_api_key(self, authenticated_client):
        """Test creating a new API key"""
        response = authenticated_client.post(
            f"{BASE_URL}/keys",
            json={"name": "TEST_create_key", "rate_limit": 50}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "key" in data  # Full key only on creation
        assert data["key"].startswith("ocr_")
        assert data["name"] == "TEST_create_key"
        assert data["rate_limit"] == 50
        assert data["is_active"] == True
        print(f"Created API key: {data['key_prefix']}")
    
    def test_list_api_keys(self, authenticated_client, created_api_key):
        """Test listing user's API keys"""
        response = authenticated_client.get(f"{BASE_URL}/keys")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure of returned keys (no full key exposed)
        for key in data:
            assert "id" in key
            assert "name" in key
            assert "key_prefix" in key
            assert "key" not in key  # Full key should not be in list
        print(f"Found {len(data)} API keys")
    
    def test_update_api_key(self, authenticated_client, created_api_key):
        """Test updating API key settings"""
        key_id = created_api_key["id"]
        response = authenticated_client.patch(
            f"{BASE_URL}/keys/{key_id}",
            json={"name": "TEST_updated_key", "rate_limit": 200}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print(f"Updated API key: {key_id}")
    
    def test_revoke_api_key(self, authenticated_client):
        """Test revoking an API key"""
        # First create a key to revoke
        create_response = authenticated_client.post(
            f"{BASE_URL}/keys",
            json={"name": "TEST_key_to_revoke", "rate_limit": 10}
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]
        
        # Now revoke it
        response = authenticated_client.delete(f"{BASE_URL}/keys/{key_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print(f"Revoked API key: {key_id}")
    
    def test_revoke_nonexistent_key(self, authenticated_client):
        """Test revoking non-existent key returns 404"""
        response = authenticated_client.delete(f"{BASE_URL}/keys/nonexistent-key-id-12345")
        assert response.status_code == 404


# ================== OCR PLAYGROUND TESTS ==================

class TestPlaygroundOCR:
    """Playground OCR endpoint tests (authenticated users)"""
    
    def test_playground_extract_pan(self, authenticated_client, pan_test_image_b64):
        """Test OCR extraction for PAN card image"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            },
            timeout=60  # OCR can take time
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "document_type" in data
        assert "extracted_data" in data
        assert "confidence" in data
        assert "processing_time_ms" in data
        assert "timestamp" in data
        
        # Verify extraction worked
        assert isinstance(data["extracted_data"], dict)
        assert data["confidence"] >= 0.0
        assert data["confidence"] <= 1.0
        print(f"PAN extraction - Type: {data['document_type']}, Confidence: {data['confidence']}")
        print(f"Extracted data: {data['extracted_data']}")
    
    def test_playground_extract_aadhaar(self, authenticated_client, aadhaar_test_image_b64):
        """Test OCR extraction for Aadhaar card image"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": aadhaar_test_image_b64,
                "document_type": "aadhaar"
            },
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "document_type" in data
        assert "extracted_data" in data
        print(f"Aadhaar extraction - Type: {data['document_type']}, Confidence: {data['confidence']}")
        print(f"Extracted data: {data['extracted_data']}")
    
    def test_playground_extract_dl(self, authenticated_client, dl_test_image_b64):
        """Test OCR extraction for Driving License image"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": dl_test_image_b64,
                "document_type": "dl"
            },
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "extracted_data" in data
        print(f"DL extraction - Type: {data['document_type']}, Confidence: {data['confidence']}")
        print(f"Extracted data: {data['extracted_data']}")
    
    def test_playground_extract_auto_detect(self, authenticated_client, pan_test_image_b64):
        """Test OCR extraction with auto document type detection"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": None  # Auto detect
            },
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "document_type" in data
        # Should detect as PAN since image contains PAN card content
        print(f"Auto-detected type: {data['document_type']}")
    
    def test_playground_without_auth_fails(self, pan_test_image_b64):
        """Test playground endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            }
        )
        assert response.status_code == 403  # No auth header


# ================== PUBLIC API TESTS ==================

class TestPublicOCRAPI:
    """Public B2B OCR API tests (API key auth)"""
    
    def test_v1_extract_with_api_key(self, api_client, created_api_key, pan_test_image_b64):
        """Test public OCR extraction with valid API key"""
        response = api_client.post(
            f"{BASE_URL}/v1/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            },
            headers={"X-API-Key": created_api_key["key"]},
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "document_type" in data
        assert "extracted_data" in data
        assert "confidence" in data
        assert "processing_time_ms" in data
        print(f"Public API extraction - ID: {data['id']}")
        print(f"Processing time: {data['processing_time_ms']}ms")
    
    def test_v1_extract_without_api_key_fails(self, api_client, pan_test_image_b64):
        """Test public API requires API key header"""
        # Remove any existing auth headers
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(
            f"{BASE_URL}/v1/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            }
        )
        # Should be 401 or 422 (depending on FastAPI handling)
        assert response.status_code in [401, 422]
        print(f"No API key response: {response.status_code}")
    
    def test_v1_extract_with_invalid_api_key(self, api_client, pan_test_image_b64):
        """Test public API with invalid API key returns 401"""
        response = api_client.post(
            f"{BASE_URL}/v1/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            },
            headers={"X-API-Key": "ocr_invalid_key_12345"}
        )
        assert response.status_code == 401
    
    def test_v1_extract_with_revoked_api_key(self, authenticated_client, pan_test_image_b64):
        """Test public API with revoked API key fails"""
        # Create a new key
        create_response = authenticated_client.post(
            f"{BASE_URL}/keys",
            json={"name": "TEST_key_to_revoke_for_api", "rate_limit": 10}
        )
        assert create_response.status_code == 200
        key_data = create_response.json()
        
        # Revoke it
        revoke_response = authenticated_client.delete(f"{BASE_URL}/keys/{key_data['id']}")
        assert revoke_response.status_code == 200
        
        # Try to use it
        fresh_client = requests.Session()
        response = fresh_client.post(
            f"{BASE_URL}/v1/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            },
            headers={
                "Content-Type": "application/json",
                "X-API-Key": key_data["key"]
            }
        )
        assert response.status_code == 401


# ================== ANALYTICS TESTS ==================

class TestAnalytics:
    """Analytics endpoint tests"""
    
    def test_get_usage_stats(self, authenticated_client):
        """Test getting user usage statistics"""
        response = authenticated_client.get(f"{BASE_URL}/analytics/usage")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_requests" in data
        assert "successful_requests" in data
        assert "failed_requests" in data
        assert "document_breakdown" in data
        assert "daily_usage" in data
        
        assert isinstance(data["total_requests"], int)
        assert isinstance(data["document_breakdown"], dict)
        assert isinstance(data["daily_usage"], list)
        print(f"Usage stats: total={data['total_requests']}, successful={data['successful_requests']}")
    
    def test_get_recent_extractions(self, authenticated_client):
        """Test getting recent extraction history"""
        response = authenticated_client.get(f"{BASE_URL}/analytics/recent?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Recent extractions count: {len(data)}")
        
        if len(data) > 0:
            # Verify structure
            extraction = data[0]
            assert "id" in extraction
            assert "timestamp" in extraction
    
    def test_analytics_without_auth_fails(self):
        """Test analytics endpoints require authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.get(f"{BASE_URL}/analytics/usage")
        assert response.status_code == 403


# ================== DATA PERSISTENCE TESTS ==================

class TestDataPersistence:
    """Tests to verify data is actually persisted in MongoDB"""
    
    def test_api_key_persists(self, authenticated_client):
        """Test that created API key persists in database"""
        # Create a unique key
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        key_name = f"TEST_persist_{timestamp}"
        
        create_response = authenticated_client.post(
            f"{BASE_URL}/keys",
            json={"name": key_name, "rate_limit": 25}
        )
        assert create_response.status_code == 200
        created_key = create_response.json()
        
        # List keys and verify it exists
        list_response = authenticated_client.get(f"{BASE_URL}/keys")
        assert list_response.status_code == 200
        
        keys = list_response.json()
        found = any(k["id"] == created_key["id"] for k in keys)
        assert found, "Created API key not found in list"
        print(f"API key {key_name} persisted successfully")
    
    def test_ocr_request_persists(self, authenticated_client, pan_test_image_b64):
        """Test that OCR requests are logged and persisted"""
        # Make an OCR request
        ocr_response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": pan_test_image_b64,
                "document_type": "pan"
            },
            timeout=60
        )
        assert ocr_response.status_code == 200
        ocr_data = ocr_response.json()
        
        # Check recent extractions
        recent_response = authenticated_client.get(f"{BASE_URL}/analytics/recent?limit=10")
        assert recent_response.status_code == 200
        
        recent = recent_response.json()
        found = any(r["id"] == ocr_data["id"] for r in recent)
        assert found, "OCR request not found in recent extractions"
        print(f"OCR request {ocr_data['id']} persisted successfully")


# ================== EDGE CASE TESTS ==================

class TestEdgeCases:
    """Edge case and error handling tests"""
    
    def test_invalid_base64_image(self, authenticated_client):
        """Test OCR with invalid base64 returns error"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": "not_valid_base64!!!",
                "document_type": "pan"
            },
            timeout=60
        )
        # Should return 400 or 500 for invalid image
        assert response.status_code in [400, 422, 500]
    
    def test_empty_image_base64(self, authenticated_client):
        """Test OCR with empty base64 string"""
        response = authenticated_client.post(
            f"{BASE_URL}/playground/extract",
            json={
                "image_base64": "",
                "document_type": "pan"
            }
        )
        assert response.status_code in [400, 422, 500]
    
    def test_missing_required_fields(self):
        """Test API rejects requests with missing required fields"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        # Missing password
        response = fresh_client.post(
            f"{BASE_URL}/auth/register",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422
        
        # Missing email
        response = fresh_client.post(
            f"{BASE_URL}/auth/login",
            json={"password": "password123"}
        )
        assert response.status_code == 422
