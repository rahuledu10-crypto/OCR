"""
Test Razorpay Subscription Integration - ExtractAI
Tests: /api/subscription/create-order and /api/subscription/verify-payment
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionEndpoints:
    """Test subscription and payment endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user and authentication"""
        # Create test user
        self.test_email = f"test_subscription_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "TestPass123!"
        
        # Register user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "company_name": "Test Company"
            }
        )
        
        if register_response.status_code == 200:
            self.token = register_response.json().get("access_token")
            self.user = register_response.json().get("user")
        else:
            # User might exist, try login
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.test_email,
                    "password": self.test_password
                }
            )
            if login_response.status_code == 200:
                self.token = login_response.json().get("access_token")
                self.user = login_response.json().get("user")
            else:
                pytest.skip("Could not authenticate test user")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_get_plans_endpoint(self):
        """Test GET /api/plans - returns all available plans"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        plans = response.json()
        assert isinstance(plans, list), "Plans should be a list"
        
        # Check we have 4 plans (free, starter, growth, enterprise)
        plan_ids = [p["id"] for p in plans]
        assert "free" in plan_ids, "Missing free plan"
        assert "starter" in plan_ids, "Missing starter plan"
        assert "growth" in plan_ids, "Missing growth plan"
        assert "enterprise" in plan_ids, "Missing enterprise plan"
        
        print(f"PASS: GET /api/plans returns {len(plans)} plans: {plan_ids}")
    
    def test_get_subscription_status(self):
        """Test GET /api/subscription - returns current user subscription"""
        response = requests.get(
            f"{BASE_URL}/api/subscription",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "plan" in data, "Missing plan in response"
        assert "usage" in data, "Missing usage in response"
        assert "wallet_balance" in data, "Missing wallet_balance in response"
        
        # Default plan should be free
        assert data["plan"] == "free", f"Expected 'free' plan, got {data['plan']}"
        
        print(f"PASS: GET /api/subscription returns plan={data['plan']}, wallet={data['wallet_balance']}")
    
    def test_create_order_starter_plan(self):
        """Test POST /api/subscription/create-order for starter plan"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "starter"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "order_id" in data, f"Missing order_id in response: {data}"
        assert "amount" in data, "Missing amount in response"
        assert "currency" in data, "Missing currency in response"
        assert "razorpay_key_id" in data, "Missing razorpay_key_id in response"
        
        # Verify amount (starter = 499 INR = 49900 paise)
        assert data["amount"] == 49900, f"Expected 49900 paise, got {data['amount']}"
        assert data["currency"] == "INR", f"Expected INR, got {data['currency']}"
        assert data["plan"] == "starter", f"Expected starter, got {data['plan']}"
        
        print(f"PASS: Create order for starter: order_id={data['order_id'][:20]}..., amount={data['amount']}")
        return data
    
    def test_create_order_growth_plan(self):
        """Test POST /api/subscription/create-order for growth plan"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "growth"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify amount (growth = 1999 INR = 199900 paise)
        assert data["amount"] == 199900, f"Expected 199900 paise, got {data['amount']}"
        assert data["plan"] == "growth", f"Expected growth, got {data['plan']}"
        
        print(f"PASS: Create order for growth: order_id={data['order_id'][:20]}..., amount={data['amount']}")
    
    def test_create_order_invalid_plan(self):
        """Test POST /api/subscription/create-order with invalid plan"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "invalid_plan"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Invalid plan returns 400 error")
    
    def test_create_order_enterprise_plan(self):
        """Test POST /api/subscription/create-order for enterprise (should fail - custom pricing)"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "enterprise"}
        )
        # Enterprise should return error since it has custom pricing
        assert response.status_code == 400, f"Expected 400 for enterprise, got {response.status_code}"
        print("PASS: Enterprise plan returns 400 (custom pricing)")
    
    def test_create_order_free_plan(self):
        """Test POST /api/subscription/create-order for free plan (should fail)"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "free"}
        )
        # Free plan should return error
        assert response.status_code == 400, f"Expected 400 for free plan, got {response.status_code}"
        print("PASS: Free plan returns 400 error")
    
    def test_create_order_unauthorized(self):
        """Test POST /api/subscription/create-order without auth"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            json={"plan": "starter"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Unauthorized request returns 401/403")
    
    def test_verify_payment_with_test_signature(self):
        """Test POST /api/subscription/verify-payment in test mode"""
        # First create an order
        order_response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "starter"}
        )
        assert order_response.status_code == 200
        order_data = order_response.json()
        
        # Verify with test signature (test mode accepts any signature)
        verify_response = requests.post(
            f"{BASE_URL}/api/subscription/verify-payment",
            headers=self.headers,
            json={
                "razorpay_order_id": order_data["order_id"],
                "razorpay_payment_id": f"pay_test_{uuid.uuid4().hex[:16]}",
                "razorpay_signature": "test_signature_placeholder",
                "plan": "starter"
            }
        )
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert data.get("success") == True, f"Expected success=True: {data}"
        assert "message" in data, "Missing message in response"
        assert "expires_at" in data, "Missing expires_at in response"
        
        print(f"PASS: Payment verification successful: {data['message']}")
    
    def test_verify_payment_updates_user_plan(self):
        """Test that verify-payment actually updates user plan"""
        # Create order for growth plan
        order_response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "growth"}
        )
        order_data = order_response.json()
        
        # Verify payment
        verify_response = requests.post(
            f"{BASE_URL}/api/subscription/verify-payment",
            headers=self.headers,
            json={
                "razorpay_order_id": order_data["order_id"],
                "razorpay_payment_id": f"pay_test_{uuid.uuid4().hex[:16]}",
                "razorpay_signature": "test_signature",
                "plan": "growth"
            }
        )
        assert verify_response.status_code == 200
        
        # Check subscription status was updated
        subscription_response = requests.get(
            f"{BASE_URL}/api/subscription",
            headers=self.headers
        )
        assert subscription_response.status_code == 200
        
        sub_data = subscription_response.json()
        assert sub_data["plan"] == "growth", f"Expected plan='growth', got {sub_data['plan']}"
        
        print(f"PASS: User plan updated to growth after payment")
    
    def test_razorpay_key_in_order_response(self):
        """Test that order response includes razorpay_key_id for frontend"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/create-order",
            headers=self.headers,
            json={"plan": "starter"}
        )
        data = response.json()
        
        assert "razorpay_key_id" in data, "Missing razorpay_key_id for frontend"
        assert "is_test_mode" in data, "Missing is_test_mode flag"
        assert data["razorpay_key_id"].startswith("rzp_"), f"Invalid razorpay key format: {data['razorpay_key_id']}"
        
        print(f"PASS: Order includes razorpay_key_id={data['razorpay_key_id'][:15]}..., is_test_mode={data['is_test_mode']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
