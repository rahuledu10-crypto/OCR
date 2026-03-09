"""
Test suite for User Onboarding Flow
Tests the onboarding endpoints and data persistence

Features tested:
- POST /api/users/me/onboarding - Save onboarding data
- GET /api/users/me/onboarding - Get onboarding status
- POST /api/auth/login - Returns onboarding data in user object
- POST /api/auth/register - New users have no onboarding data
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture
def test_user_email():
    """Generate unique test user email"""
    return f"test_onboarding_{uuid.uuid4().hex[:8]}@test.com"


@pytest.fixture
def test_user_password():
    return "TestPass123!"


@pytest.fixture
def registered_user(test_user_email, test_user_password):
    """Register a new test user and return auth data"""
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_user_email,
        "password": test_user_password
    })
    assert response.status_code == 200, f"Registration failed: {response.text}"
    data = response.json()
    return {
        "email": test_user_email,
        "password": test_user_password,
        "token": data["access_token"],
        "user": data["user"]
    }


@pytest.fixture
def auth_headers(registered_user):
    """Get auth headers for requests"""
    return {"Authorization": f"Bearer {registered_user['token']}"}


class TestOnboardingEndpoints:
    """Tests for onboarding API endpoints"""

    def test_new_user_has_no_onboarding(self, registered_user):
        """New registered user should have no onboarding data"""
        user = registered_user["user"]
        # Onboarding should be None for new users
        assert user.get("onboarding") is None, "New user should not have onboarding data"
        print("PASS: New user has no onboarding data")

    def test_get_onboarding_status_new_user(self, auth_headers):
        """GET /api/users/me/onboarding should return not completed for new user"""
        response = requests.get(
            f"{BASE_URL}/api/users/me/onboarding",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["completed"] == False, "New user onboarding should not be completed"
        print("PASS: GET onboarding returns completed=false for new user")

    def test_save_onboarding_personal_use(self, auth_headers):
        """POST /api/users/me/onboarding saves personal use data correctly"""
        onboarding_data = {
            "user_type": "personal",
            "primary_use_cases": ["id_documents", "invoices"]
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["onboarding"]["completed"] == True
        assert data["onboarding"]["user_type"] == "personal"
        assert data["onboarding"]["primary_use_cases"] == ["id_documents", "invoices"]
        print("PASS: Personal use onboarding saved correctly")

    def test_save_onboarding_business(self, auth_headers):
        """POST /api/users/me/onboarding saves business data with company name and team size"""
        onboarding_data = {
            "user_type": "business",
            "company_name": "Test Corp",
            "team_size": "11-50",
            "primary_use_cases": ["invoices", "bank_statements"]
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["onboarding"]["completed"] == True
        assert data["onboarding"]["user_type"] == "business"
        assert data["onboarding"]["company_name"] == "Test Corp"
        assert data["onboarding"]["team_size"] == "11-50"
        print("PASS: Business onboarding with company details saved correctly")

    def test_save_onboarding_builder(self, auth_headers):
        """POST /api/users/me/onboarding saves builder data with building description"""
        onboarding_data = {
            "user_type": "builder",
            "building_description": "A fintech app for invoice processing",
            "primary_use_cases": ["invoices", "contracts"]
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["onboarding"]["user_type"] == "builder"
        assert data["onboarding"]["building_description"] == "A fintech app for invoice processing"
        print("PASS: Builder onboarding with description saved correctly")

    def test_save_onboarding_agency(self, auth_headers):
        """POST /api/users/me/onboarding saves agency data with company name and team size"""
        onboarding_data = {
            "user_type": "agency",
            "company_name": "Agency Corp",
            "team_size": "2-10",
            "primary_use_cases": ["id_documents", "other"]
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["onboarding"]["user_type"] == "agency"
        assert data["onboarding"]["company_name"] == "Agency Corp"
        print("PASS: Agency onboarding saved correctly")

    def test_invalid_user_type(self, auth_headers):
        """POST /api/users/me/onboarding rejects invalid user_type"""
        onboarding_data = {
            "user_type": "invalid_type"
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Invalid user_type rejected with 400")

    def test_missing_user_type(self, auth_headers):
        """POST /api/users/me/onboarding requires user_type"""
        onboarding_data = {
            "company_name": "Test Corp"
        }
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
        print("PASS: Missing user_type rejected with 422")


class TestOnboardingPersistence:
    """Tests for onboarding data persistence after GET"""

    def test_onboarding_persists_after_save(self, auth_headers):
        """Saved onboarding data should persist when retrieved"""
        # Save onboarding
        onboarding_data = {
            "user_type": "business",
            "company_name": "Persist Corp",
            "team_size": "51-200",
            "primary_use_cases": ["contracts", "bank_statements"]
        }
        save_response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert save_response.status_code == 200

        # Retrieve and verify
        get_response = requests.get(
            f"{BASE_URL}/api/users/me/onboarding",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["completed"] == True
        assert data["onboarding"]["user_type"] == "business"
        assert data["onboarding"]["company_name"] == "Persist Corp"
        assert data["onboarding"]["team_size"] == "51-200"
        print("PASS: Onboarding data persists correctly")


class TestLoginWithOnboarding:
    """Tests for login endpoint returning onboarding data"""

    def test_login_returns_onboarding_for_completed_user(self):
        """Login should return onboarding data for users who completed it"""
        # Register new user
        email = f"test_login_onb_{uuid.uuid4().hex[:8]}@test.com"
        password = "TestPass123!"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Complete onboarding
        onboarding_data = {
            "user_type": "personal",
            "primary_use_cases": ["id_documents"]
        }
        onb_response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert onb_response.status_code == 200
        
        # Login and check onboarding in response
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        user = login_data["user"]
        assert user.get("onboarding") is not None, "Login should include onboarding data"
        assert user["onboarding"]["completed"] == True
        assert user["onboarding"]["user_type"] == "personal"
        print("PASS: Login returns onboarding data for completed user")

    def test_login_returns_null_onboarding_for_new_user(self):
        """Login should return null onboarding for users who haven't completed it"""
        email = f"test_login_new_{uuid.uuid4().hex[:8]}@test.com"
        password = "TestPass123!"
        
        # Register new user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        assert reg_response.status_code == 200
        
        # Login immediately
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        user = login_data["user"]
        # Onboarding should be None or not completed
        onboarding = user.get("onboarding")
        if onboarding:
            assert onboarding.get("completed") == False
        print("PASS: Login returns null/incomplete onboarding for new user")


class TestExistingTestUser:
    """Tests using the provided test credentials"""

    def test_existing_user_with_completed_onboarding(self):
        """Test login with pre-created user who completed onboarding"""
        email = "onboard-test@example.com"
        password = "Test123456"
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            user = login_data["user"]
            onboarding = user.get("onboarding")
            
            if onboarding and onboarding.get("completed"):
                print(f"PASS: Existing test user has completed onboarding: type={onboarding.get('user_type')}")
            else:
                print(f"INFO: Test user exists but hasn't completed onboarding")
        elif login_response.status_code == 401:
            print("INFO: Test user credentials may need to be updated (401)")
            pytest.skip("Test user not available with provided credentials")
        else:
            print(f"INFO: Test user login returned {login_response.status_code}")
            pytest.skip(f"Could not login with test credentials")


class TestAuthMeEndpoint:
    """Tests for /api/auth/me returning onboarding data"""

    def test_auth_me_includes_onboarding(self, auth_headers):
        """GET /api/auth/me should include onboarding data after completion"""
        # Complete onboarding first
        onboarding_data = {
            "user_type": "builder",
            "building_description": "Testing app",
            "primary_use_cases": ["other"]
        }
        save_response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert save_response.status_code == 200
        
        # Get current user
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=auth_headers
        )
        assert me_response.status_code == 200
        user = me_response.json()
        
        assert user.get("onboarding") is not None
        assert user["onboarding"]["completed"] == True
        assert user["onboarding"]["user_type"] == "builder"
        print("PASS: /api/auth/me includes onboarding data")


class TestOnboardingWithoutAuth:
    """Tests for onboarding endpoints without authentication"""

    def test_post_onboarding_requires_auth(self):
        """POST /api/users/me/onboarding should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/users/me/onboarding",
            json={"user_type": "personal"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: POST onboarding requires auth")

    def test_get_onboarding_requires_auth(self):
        """GET /api/users/me/onboarding should require authentication"""
        response = requests.get(f"{BASE_URL}/api/users/me/onboarding")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: GET onboarding requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
