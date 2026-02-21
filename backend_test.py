import requests
import sys
import base64
import json
from datetime import datetime
from typing import Dict, Optional

class OCRAPITester:
    def __init__(self, base_url="https://docread-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.jwt_token = None
        self.api_key = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.api_key_id = None

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 auth_type: str = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add authorization headers
        if auth_type == 'jwt' and self.jwt_token:
            test_headers['Authorization'] = f'Bearer {self.jwt_token}'
        elif auth_type == 'api_key' and self.api_key:
            test_headers['X-API-Key'] = self.api_key
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health check endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH CHECKS")
        print("="*50)
        
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health check", "GET", "health", 200)

    def test_auth_flow(self):
        """Test user registration and login"""
        print("\n" + "="*50)
        print("TESTING AUTH FLOW")
        print("="*50)
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_{timestamp}@example.com"
        test_password = "TestPass123!"
        
        # Test registration
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "company_name": "Test Company"
            }
        )
        
        if success and "access_token" in response:
            self.jwt_token = response["access_token"]
            self.user_id = response["user"]["id"]
            print(f"   JWT Token obtained: {self.jwt_token[:20]}...")
        
        # Test login with same credentials
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and "access_token" in response:
            self.jwt_token = response["access_token"]
            print(f"   Login JWT Token: {self.jwt_token[:20]}...")

        # Test get current user
        self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_type='jwt'
        )

        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={
                "email": test_email,
                "password": "wrongpassword"
            }
        )

    def test_api_key_management(self):
        """Test API key CRUD operations"""
        print("\n" + "="*50)
        print("TESTING API KEY MANAGEMENT")
        print("="*50)
        
        if not self.jwt_token:
            print("❌ Skipping API key tests - No JWT token available")
            return

        # Test creating API key
        success, response = self.run_test(
            "Create API Key",
            "POST",
            "keys",
            200,
            data={
                "name": "Test API Key",
                "rate_limit": 100
            },
            auth_type='jwt'
        )
        
        if success and "key" in response:
            self.api_key = response["key"]
            self.api_key_id = response["id"]
            print(f"   API Key created: {self.api_key[:20]}...")

        # Test listing API keys
        self.run_test(
            "List API Keys",
            "GET",
            "keys",
            200,
            auth_type='jwt'
        )

        # Test updating API key
        if self.api_key_id:
            self.run_test(
                "Update API Key",
                "PATCH",
                f"keys/{self.api_key_id}",
                200,
                data={
                    "name": "Updated Test Key",
                    "rate_limit": 200
                },
                auth_type='jwt'
            )

    def test_ocr_playground(self):
        """Test playground OCR extraction"""
        print("\n" + "="*50)
        print("TESTING PLAYGROUND OCR")
        print("="*50)
        
        if not self.jwt_token:
            print("❌ Skipping playground tests - No JWT token available")
            return

        # Create a simple test image (1x1 pixel PNG) as base64
        # This is a minimal valid PNG file
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Test playground extraction with auto detection
        success, response = self.run_test(
            "Playground OCR - Auto Detect",
            "POST",
            "playground/extract",
            200,
            data={
                "image_base64": test_image_b64,
                "document_type": None
            },
            auth_type='jwt'
        )
        
        if success:
            print(f"   Document type detected: {response.get('document_type', 'Unknown')}")
            print(f"   Confidence: {response.get('confidence', 'Unknown')}")

        # Test with specific document type
        self.run_test(
            "Playground OCR - PAN Card",
            "POST",
            "playground/extract",
            200,
            data={
                "image_base64": test_image_b64,
                "document_type": "pan"
            },
            auth_type='jwt'
        )

    def test_public_api(self):
        """Test public B2B API endpoints"""
        print("\n" + "="*50)
        print("TESTING PUBLIC B2B API")
        print("="*50)
        
        if not self.api_key:
            print("❌ Skipping public API tests - No API key available")
            return

        # Test public OCR extraction
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        success, response = self.run_test(
            "Public API OCR Extraction",
            "POST",
            "v1/extract",
            200,
            data={
                "image_base64": test_image_b64,
                "document_type": "auto"
            },
            auth_type='api_key'
        )
        
        if success:
            print(f"   Request ID: {response.get('id', 'Unknown')}")
            print(f"   Processing time: {response.get('processing_time_ms', 'Unknown')}ms")

        # Test without API key (should fail)
        self.run_test(
            "Public API without key",
            "POST",
            "v1/extract",
            401,
            data={
                "image_base64": test_image_b64,
                "document_type": "auto"
            }
        )

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS")
        print("="*50)
        
        if not self.jwt_token:
            print("❌ Skipping analytics tests - No JWT token available")
            return

        # Test usage stats
        self.run_test(
            "Get Usage Stats",
            "GET",
            "analytics/usage",
            200,
            auth_type='jwt'
        )

        # Test recent extractions
        self.run_test(
            "Get Recent Extractions",
            "GET",
            "analytics/recent?limit=5",
            200,
            auth_type='jwt'
        )

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n" + "="*50)
        print("CLEANING UP")
        print("="*50)
        
        # Revoke the test API key
        if self.api_key_id and self.jwt_token:
            self.run_test(
                "Revoke Test API Key",
                "DELETE",
                f"keys/{self.api_key_id}",
                200,
                auth_type='jwt'
            )

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting OCR API Backend Tests")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites in order
        self.test_health_check()
        self.test_auth_flow()
        self.test_api_key_management()
        self.test_ocr_playground()
        self.test_public_api()
        self.test_analytics()
        self.cleanup_test_data()
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = OCRAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())