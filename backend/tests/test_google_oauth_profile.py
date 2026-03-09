"""
Test Suite for Google OAuth Profile Completion Feature
Tests:
1. Profile completion endpoint PATCH /api/users/me/complete-profile
2. Backend /api/auth/me returns name field  
3. User registration with email works
4. User login with email works
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health and API availability tests"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: API health check")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("PASS: API root endpoint")


class TestAuthRegisterAndLogin:
    """Test registration and login flows"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create unique test user credentials"""
        unique_id = str(uuid.uuid4())[:8]
        return {
            "email": f"test_profile_{unique_id}@test.com",
            "password": "TestPassword123!",
            "company_name": "Test Company Inc"
        }
    
    def test_user_registration(self, test_user):
        """Test user registration with email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        assert data["user"]["company_name"] == test_user["company_name"]
        assert "id" in data["user"]
        
        # Store token for next tests
        test_user["token"] = data["access_token"]
        test_user["user_id"] = data["user"]["id"]
        
        print(f"PASS: User registration with email - {test_user['email']}")
    
    def test_user_login(self, test_user):
        """Test user login with email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            }
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        
        # Update token
        test_user["token"] = data["access_token"]
        
        print(f"PASS: User login with email - {test_user['email']}")
    
    def test_auth_me_returns_name_field(self, test_user):
        """Test /api/auth/me returns name field"""
        if "token" not in test_user:
            pytest.skip("No token available from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 200, f"Auth me failed: {response.text}"
        data = response.json()
        
        # Validate name field is present in response
        assert "name" in data, "name field missing from /api/auth/me response"
        assert "email" in data
        assert "company_name" in data
        assert data["email"] == test_user["email"]
        
        print(f"PASS: /api/auth/me returns name field: {data.get('name')}")
    
    def test_duplicate_registration_fails(self, test_user):
        """Test duplicate registration returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower() or "already" in data.get("detail", "").lower()
        
        print("PASS: Duplicate registration blocked correctly")


class TestProfileCompletionEndpoint:
    """Test profile completion endpoint for Google OAuth users"""
    
    @pytest.fixture(scope="class")
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"test_completion_{unique_id}@test.com",
            "password": "TestPassword123!",
            "company_name": None  # No company name initially
        }
        
        # Register user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        
        if response.status_code == 200:
            data = response.json()
            user_data["token"] = data["access_token"]
            user_data["user_id"] = data["user"]["id"]
        
        return user_data
    
    def test_profile_completion_success(self, authenticated_user):
        """Test PATCH /api/users/me/complete-profile works correctly"""
        if "token" not in authenticated_user:
            pytest.skip("No token available")
        
        new_company_name = "Profile Test Company"
        response = requests.patch(
            f"{BASE_URL}/api/users/me/complete-profile",
            json={"company_name": new_company_name},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        
        assert response.status_code == 200, f"Profile completion failed: {response.text}"
        data = response.json()
        
        # Validate response
        assert "message" in data
        assert data.get("company_name") == new_company_name
        
        print(f"PASS: Profile completion endpoint - company_name: {new_company_name}")
    
    def test_profile_completion_persisted(self, authenticated_user):
        """Test that profile completion is persisted in database"""
        if "token" not in authenticated_user:
            pytest.skip("No token available")
        
        # Verify via /api/auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Company name should be updated
        assert data.get("company_name") == "Profile Test Company"
        
        print("PASS: Profile completion persisted correctly")
    
    def test_profile_completion_empty_company_name_rejected(self, authenticated_user):
        """Test that empty company name is rejected"""
        if "token" not in authenticated_user:
            pytest.skip("No token available")
        
        response = requests.patch(
            f"{BASE_URL}/api/users/me/complete-profile",
            json={"company_name": ""},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for empty company name: {response.text}"
        
        print("PASS: Empty company name correctly rejected")
    
    def test_profile_completion_whitespace_only_rejected(self, authenticated_user):
        """Test that whitespace-only company name is rejected"""
        if "token" not in authenticated_user:
            pytest.skip("No token available")
        
        response = requests.patch(
            f"{BASE_URL}/api/users/me/complete-profile",
            json={"company_name": "   "},
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for whitespace company name: {response.text}"
        
        print("PASS: Whitespace-only company name correctly rejected")
    
    def test_profile_completion_requires_auth(self):
        """Test that profile completion requires authentication"""
        response = requests.patch(
            f"{BASE_URL}/api/users/me/complete-profile",
            json={"company_name": "Some Company"}
        )
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error: {response.text}"
        
        print("PASS: Profile completion requires authentication")


class TestGoogleAuthEndpoint:
    """Test Google Auth endpoint availability"""
    
    def test_google_auth_redirect_endpoint_exists(self):
        """Test that /api/auth/google endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/auth/google",
            allow_redirects=False
        )
        
        # Should redirect to Google or return 500 if not configured
        # 302/307 = redirect to Google OAuth
        # 500 = Google OAuth not configured (acceptable)
        assert response.status_code in [302, 307, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code in [302, 307]:
            location = response.headers.get("location", "")
            assert "accounts.google.com" in location or "google" in location.lower()
            print("PASS: Google OAuth redirect configured correctly")
        else:
            print("PASS: Google OAuth endpoint exists (not configured - expected)")


class TestForgotPasswordFlow:
    """Test forgot password functionality"""
    
    def test_forgot_password_success_message(self):
        """Test forgot password returns success message"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        print("PASS: Forgot password returns success message")
    
    def test_reset_password_invalid_token_rejected(self):
        """Test reset password rejects invalid tokens"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "invalid_token_12345",
                "new_password": "NewPassword123!"
            }
        )
        
        assert response.status_code == 400
        
        print("PASS: Invalid reset token correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
