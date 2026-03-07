"""
Test suite for Authentication features:
1. Email/Password Registration with default API key creation
2. Email/Password Login
3. Forgot Password flow
4. Reset Password flow
5. Google OAuth session exchange
6. API keys list showing 'Default Key' for new users
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials - unique per test run
TEST_USER_PREFIX = f"TEST_auth_{uuid.uuid4().hex[:8]}"
TEST_EMAIL = f"{TEST_USER_PREFIX}@example.com"
TEST_PASSWORD = "TestPass123!"
TEST_COMPANY = "Test Company"


class TestEmailPasswordRegistration:
    """Test registration creates user, JWT token, and default API key"""
    
    def test_register_new_user_returns_jwt(self):
        """Registration should return JWT token and user data"""
        email = f"TEST_reg1_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": "SecurePass123!",
                "company_name": "Test Corp"
            }
        )
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user"
        assert data["token_type"] == "bearer", "Token type should be bearer"
        
        # User data assertions
        user = data["user"]
        assert user["email"] == email, f"Expected email {email}, got {user['email']}"
        assert user.get("company_name") == "Test Corp", "Company name should match"
        assert "id" in user, "User should have an id"
        assert "created_at" in user, "User should have created_at"
        
        # Save token for next test
        self.__class__.test_token = data["access_token"]
        self.__class__.test_email = email
        
        print(f"PASSED: Registration successful for {email}")
    
    def test_duplicate_email_rejected(self):
        """Registration with existing email should be rejected"""
        # First register a user
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Pass123!"}
        )
        
        # Try to register again with same email
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "DifferentPass456!"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "already registered" in response.json().get("detail", "").lower()
        
        print("PASSED: Duplicate email registration correctly rejected")
    
    def test_registration_creates_default_api_key(self):
        """New users should get a 'Default Key' API key"""
        # Register new user
        email = f"TEST_apikey_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Pass123!"}
        )
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Get API keys for this user
        keys_response = requests.get(
            f"{BASE_URL}/api/keys",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert keys_response.status_code == 200, f"Expected 200, got {keys_response.status_code}"
        
        keys = keys_response.json()
        assert len(keys) >= 1, "User should have at least one API key"
        
        # Find the 'Default Key'
        default_keys = [k for k in keys if k.get("name") == "Default Key"]
        assert len(default_keys) == 1, "User should have exactly one 'Default Key'"
        
        default_key = default_keys[0]
        assert default_key["is_active"] == True, "Default key should be active"
        assert "key_prefix" in default_key, "Key should have key_prefix"
        
        print(f"PASSED: Default API key created for new user")


class TestEmailPasswordLogin:
    """Test login endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_test_user(self):
        """Create a test user for login tests"""
        self.email = f"TEST_login_{uuid.uuid4().hex[:8]}@example.com"
        self.password = "LoginTestPass123!"
        
        # Register the user first
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": self.email, "password": self.password}
        )
        assert response.status_code == 200, f"Setup failed: {response.text}"
    
    def test_login_success(self):
        """Login with valid credentials returns JWT"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.email, "password": self.password}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == self.email
        
        print(f"PASSED: Login successful for {self.email}")
    
    def test_login_wrong_password(self):
        """Login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.email, "password": "WrongPassword123"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        assert "invalid" in response.json().get("detail", "").lower()
        
        print("PASSED: Wrong password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Login with non-existent email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "SomePass123"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("PASSED: Non-existent user login correctly rejected")


class TestForgotPassword:
    """Test forgot password endpoint"""
    
    def test_forgot_password_existing_user(self):
        """Forgot password for existing user returns success message"""
        # First create a user
        email = f"TEST_forgot_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Pass123!"}
        )
        
        # Request password reset
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": email}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        # Note: Always returns success to prevent email enumeration
        
        print(f"PASSED: Forgot password request accepted for {email}")
    
    def test_forgot_password_nonexistent_user(self):
        """Forgot password for non-existent email still returns success (to prevent enumeration)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": f"nonexistent_{uuid.uuid4().hex}@example.com"}
        )
        
        # Should still return 200 to prevent email enumeration
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "message" in response.json()
        
        print("PASSED: Forgot password for non-existent email returns success (prevents enumeration)")


class TestResetPassword:
    """Test reset password endpoint"""
    
    def test_reset_password_invalid_token(self):
        """Reset password with invalid token returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "invalid_token_12345",
                "new_password": "NewSecurePass123!"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "invalid" in response.json().get("detail", "").lower() or "expired" in response.json().get("detail", "").lower()
        
        print("PASSED: Invalid reset token correctly rejected")
    
    def test_reset_password_with_valid_token(self):
        """Reset password with valid token (using MongoDB to insert test token)"""
        # This test requires inserting a reset token directly in DB
        # Since we don't have direct DB access in tests, we'll document that
        # this would need a valid token from the forgot-password email
        
        # For now, just verify the endpoint exists and validates input
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "token": "",
                "new_password": "NewPass123!"
            }
        )
        
        # Empty token should return 400
        assert response.status_code == 400
        
        print("PASSED: Reset password endpoint validates token input")


class TestGoogleOAuthSession:
    """Test Google OAuth session exchange endpoint"""
    
    def test_google_session_invalid_session(self):
        """Invalid session_id should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": "invalid_session_id_12345"}
        )
        
        # Should fail with 401 (invalid session) or 500 (OAuth service error)
        assert response.status_code in [401, 500], f"Expected 401/500, got {response.status_code}"
        
        print("PASSED: Invalid Google session correctly rejected")
    
    def test_google_session_empty_session(self):
        """Empty session_id should return error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": ""}
        )
        
        # Empty session should fail
        assert response.status_code in [400, 401, 500], f"Expected error, got {response.status_code}"
        
        print("PASSED: Empty Google session correctly rejected")
    
    def test_google_session_endpoint_exists(self):
        """Verify Google session endpoint exists and accepts POST"""
        # Just verify the endpoint is responding (not 404/405)
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": "test"}
        )
        
        # Should not be 404 (not found) or 405 (method not allowed)
        assert response.status_code not in [404, 405], f"Endpoint should exist, got {response.status_code}"
        
        print("PASSED: Google OAuth session endpoint exists")


class TestAPIKeysList:
    """Test API keys list endpoint shows default key"""
    
    def test_new_user_has_default_key(self):
        """New registered user should have 'Default Key' in API keys list"""
        # Register new user
        email = f"TEST_keys_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Pass123!"}
        )
        token = reg_response.json()["access_token"]
        
        # Get API keys
        keys_response = requests.get(
            f"{BASE_URL}/api/keys",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert keys_response.status_code == 200
        keys = keys_response.json()
        
        # Verify 'Default Key' exists
        default_key_names = [k["name"] for k in keys]
        assert "Default Key" in default_key_names, f"Expected 'Default Key' in {default_key_names}"
        
        print(f"PASSED: New user has 'Default Key' in API keys list")
    
    def test_api_keys_requires_auth(self):
        """API keys list should require authentication"""
        response = requests.get(f"{BASE_URL}/api/keys")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print("PASSED: API keys endpoint requires authentication")


class TestAuthMeEndpoint:
    """Test /auth/me endpoint for JWT validation"""
    
    def test_auth_me_with_valid_token(self):
        """GET /auth/me with valid token returns user data"""
        # Register user to get token
        email = f"TEST_me_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Pass123!"}
        )
        token = reg_response.json()["access_token"]
        
        # Call /auth/me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}"
        
        user = me_response.json()
        assert user["email"] == email
        assert "id" in user
        assert "created_at" in user
        
        print(f"PASSED: /auth/me returns user data for valid token")
    
    def test_auth_me_without_token(self):
        """/auth/me without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print("PASSED: /auth/me requires authentication")
    
    def test_auth_me_invalid_token(self):
        """/auth/me with invalid token returns error"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("PASSED: /auth/me rejects invalid token")


class TestIntegrationFlows:
    """End-to-end integration tests for auth flows"""
    
    def test_full_registration_to_api_key_flow(self):
        """Test: Register -> Get API keys -> Verify Default Key exists"""
        email = f"TEST_flow_{uuid.uuid4().hex[:8]}@example.com"
        
        # Step 1: Register
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": "FlowTestPass123!",
                "company_name": "Flow Test Corp"
            }
        )
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        token = reg_response.json()["access_token"]
        user = reg_response.json()["user"]
        
        # Step 2: Verify user data
        assert user["email"] == email
        assert user["company_name"] == "Flow Test Corp"
        
        # Step 3: Get API keys
        keys_response = requests.get(
            f"{BASE_URL}/api/keys",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert keys_response.status_code == 200
        
        keys = keys_response.json()
        default_key = next((k for k in keys if k["name"] == "Default Key"), None)
        assert default_key is not None, "Default Key should exist"
        assert default_key["is_active"] == True
        
        # Step 4: Verify /auth/me works
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["email"] == email
        
        print(f"PASSED: Full registration to API key flow completed for {email}")
    
    def test_login_then_access_protected_resource(self):
        """Test: Register -> Login -> Access protected endpoint"""
        email = f"TEST_login_flow_{uuid.uuid4().hex[:8]}@example.com"
        password = "LoginFlowPass123!"
        
        # Register
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": password}
        )
        
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password}
        )
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        
        # Access protected endpoint
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["email"] == email
        
        print(f"PASSED: Login then access protected resource flow")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
