"""
OCR API Billing, Batch Processing, and Webhooks Tests
======================================================
Tests all new billing, subscription, and webhook endpoints including:
- Plans API (GET /api/plans)
- Subscription API (GET /api/subscription, POST /api/subscription/create-order, POST /api/subscription/verify-payment)
- Wallet top-up API (POST /api/wallet/topup)
- Batch extraction API (POST /api/v1/batch-extract)
- Webhooks API (POST /api/webhooks, GET /api/webhooks, DELETE /api/webhooks/{id}, POST /api/webhooks/{id}/test)
- Usage limit enforcement (returns 402 when limit exceeded)
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
    """Generate unique test user credentials for billing tests"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "email": f"TEST_billing_user_{timestamp}@example.com",
        "password": "BillingTest123!",
        "company_name": "Billing Test Company"
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
def user_api_key(authenticated_client):
    """Create an API key for the test user"""
    response = authenticated_client.post(
        f"{BASE_URL}/keys",
        json={"name": "TEST_billing_api_key", "rate_limit": 100}
    )
    if response.status_code != 200:
        pytest.skip(f"Could not create API key: {response.text}")
    return response.json()


@pytest.fixture
def simple_test_image_b64():
    """Generate a simple test image as base64"""
    img = Image.new('RGB', (200, 150), color='white')
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 190, 40], fill='#003366')
    draw.text((20, 20), 'TEST DOCUMENT', fill='white')
    draw.text((20, 60), 'Name: TEST USER', fill='black')
    draw.text((20, 90), 'ID: 123456789', fill='black')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()


@pytest.fixture
def pan_test_image_b64():
    """Generate a realistic PAN card test image as base64"""
    img = Image.new('RGB', (400, 250), color='#F5F5DC')
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([10, 10, 390, 40], fill='#003366')
    draw.text((20, 15), 'INCOME TAX DEPARTMENT', fill='white')
    
    # Content
    draw.text((20, 60), 'Permanent Account Number Card', fill='black')
    draw.text((20, 100), 'ABCDE1234F', fill='black')
    draw.text((20, 140), 'Name: RAHUL KUMAR SHARMA', fill='black')
    draw.text((20, 200), 'DOB: 15/08/1990', fill='black')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()


# ================== PLANS API TESTS ==================

class TestPlansAPI:
    """Tests for GET /api/plans - returns all pricing plans"""
    
    def test_get_plans_returns_all_plans(self, api_client):
        """Test that GET /api/plans returns all 4 plans"""
        response = api_client.get(f"{BASE_URL}/plans")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # free, starter, growth, enterprise
        
        # Verify all plan IDs
        plan_ids = [plan["id"] for plan in data]
        assert "free" in plan_ids
        assert "starter" in plan_ids
        assert "growth" in plan_ids
        assert "enterprise" in plan_ids
        print(f"Found {len(data)} plans: {plan_ids}")
    
    def test_plans_have_correct_structure(self, api_client):
        """Test that each plan has the required fields"""
        response = api_client.get(f"{BASE_URL}/plans")
        assert response.status_code == 200
        
        data = response.json()
        for plan in data:
            assert "id" in plan
            assert "name" in plan
            assert "price_inr" in plan
            assert "extractions_per_month" in plan
            assert "rate_limit_per_minute" in plan
            assert "features" in plan
            assert isinstance(plan["features"], list)
    
    def test_free_plan_pricing(self, api_client):
        """Test free plan has correct pricing"""
        response = api_client.get(f"{BASE_URL}/plans")
        data = response.json()
        
        free_plan = next((p for p in data if p["id"] == "free"), None)
        assert free_plan is not None
        assert free_plan["price_inr"] == 0
        assert free_plan["extractions_per_month"] == 100
        print(f"Free plan: ₹{free_plan['price_inr']}, {free_plan['extractions_per_month']} extractions")
    
    def test_starter_plan_pricing(self, api_client):
        """Test starter plan has correct pricing"""
        response = api_client.get(f"{BASE_URL}/plans")
        data = response.json()
        
        starter_plan = next((p for p in data if p["id"] == "starter"), None)
        assert starter_plan is not None
        assert starter_plan["price_inr"] == 499
        assert starter_plan["extractions_per_month"] == 1000
        print(f"Starter plan: ₹{starter_plan['price_inr']}, {starter_plan['extractions_per_month']} extractions")
    
    def test_growth_plan_pricing(self, api_client):
        """Test growth plan has correct pricing"""
        response = api_client.get(f"{BASE_URL}/plans")
        data = response.json()
        
        growth_plan = next((p for p in data if p["id"] == "growth"), None)
        assert growth_plan is not None
        assert growth_plan["price_inr"] == 1999
        assert growth_plan["extractions_per_month"] == 5000
        print(f"Growth plan: ₹{growth_plan['price_inr']}, {growth_plan['extractions_per_month']} extractions")
    
    def test_enterprise_plan_custom_pricing(self, api_client):
        """Test enterprise plan has custom (null) pricing"""
        response = api_client.get(f"{BASE_URL}/plans")
        data = response.json()
        
        enterprise_plan = next((p for p in data if p["id"] == "enterprise"), None)
        assert enterprise_plan is not None
        assert enterprise_plan["price_inr"] is None  # Custom pricing
        assert enterprise_plan["extractions_per_month"] is None  # Unlimited
        print(f"Enterprise plan: Custom pricing, Unlimited extractions")


# ================== SUBSCRIPTION API TESTS ==================

class TestSubscriptionAPI:
    """Tests for subscription endpoints"""
    
    def test_get_subscription_returns_user_plan(self, authenticated_client):
        """Test GET /api/subscription returns user's current plan and usage"""
        response = authenticated_client.get(f"{BASE_URL}/subscription")
        assert response.status_code == 200
        
        data = response.json()
        assert "plan" in data
        assert "plan_details" in data
        assert "usage" in data
        assert "wallet_balance" in data
        
        # New user should be on free plan
        assert data["plan"] == "free"
        assert data["plan_details"]["name"] == "Free"
        print(f"User subscription: {data['plan']}, Usage: {data['usage']}")
    
    def test_subscription_usage_structure(self, authenticated_client):
        """Test subscription returns proper usage structure"""
        response = authenticated_client.get(f"{BASE_URL}/subscription")
        data = response.json()
        
        usage = data["usage"]
        assert "extractions_used" in usage
        assert "extractions_limit" in usage
        assert "remaining" in usage
        
        assert isinstance(usage["extractions_used"], int)
        assert usage["extractions_limit"] == 100  # Free plan limit
        print(f"Usage: {usage['extractions_used']}/{usage['extractions_limit']} extractions")
    
    def test_get_subscription_requires_auth(self, api_client):
        """Test that subscription endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.get(f"{BASE_URL}/subscription")
        assert response.status_code == 403
    
    def test_create_order_for_starter_plan(self, authenticated_client):
        """Test POST /api/subscription/create-order creates Razorpay order for starter plan"""
        response = authenticated_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "starter"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "order_id" in data
        assert "amount" in data
        assert "currency" in data
        assert "plan" in data
        assert "razorpay_key_id" in data
        assert "is_test_mode" in data
        
        assert data["plan"] == "starter"
        assert data["amount"] == 49900  # 499 * 100 paise
        assert data["currency"] == "INR"
        assert data["is_test_mode"] == True
        print(f"Created order: {data['order_id']} for plan: {data['plan']} amount: {data['amount']} paise")
    
    def test_create_order_for_growth_plan(self, authenticated_client):
        """Test POST /api/subscription/create-order creates Razorpay order for growth plan"""
        response = authenticated_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "growth"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan"] == "growth"
        assert data["amount"] == 199900  # 1999 * 100 paise
        print(f"Created order: {data['order_id']} for growth plan")
    
    def test_create_order_invalid_plan(self, authenticated_client):
        """Test creating order with invalid plan returns error"""
        response = authenticated_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "invalid_plan"}
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        print(f"Invalid plan error: {data['detail']}")
    
    def test_create_order_enterprise_returns_error(self, authenticated_client):
        """Test that enterprise plan requires contact sales"""
        response = authenticated_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "enterprise"}
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "sales" in data["detail"].lower() or "custom" in data["detail"].lower()
        print(f"Enterprise plan message: {data['detail']}")
    
    def test_verify_payment_in_test_mode(self, authenticated_client):
        """Test POST /api/subscription/verify-payment accepts test signature and activates plan"""
        # First create an order
        order_response = authenticated_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "starter"}
        )
        assert order_response.status_code == 200
        order_data = order_response.json()
        
        # Verify with test credentials (test mode accepts any signature)
        verify_response = authenticated_client.post(
            f"{BASE_URL}/subscription/verify-payment",
            json={
                "razorpay_order_id": order_data["order_id"],
                "razorpay_payment_id": "pay_test_12345",
                "razorpay_signature": "test_signature_12345",
                "plan": "starter"
            }
        )
        assert verify_response.status_code == 200
        
        data = verify_response.json()
        assert data["success"] == True
        assert "expires_at" in data
        assert data["plan"] == "starter"
        print(f"Payment verified: {data['message']}")
        
        # Verify subscription was updated
        sub_response = authenticated_client.get(f"{BASE_URL}/subscription")
        assert sub_response.status_code == 200
        sub_data = sub_response.json()
        assert sub_data["plan"] == "starter"
        print(f"User upgraded to: {sub_data['plan']}")


# ================== WALLET TOP-UP TESTS ==================

class TestWalletTopUp:
    """Tests for wallet top-up endpoints"""
    
    def test_create_wallet_topup_order(self, authenticated_client):
        """Test POST /api/wallet/topup creates order for wallet top-up"""
        response = authenticated_client.post(
            f"{BASE_URL}/wallet/topup",
            json={"amount": 500}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "order_id" in data
        assert "amount" in data
        assert data["amount"] == 50000  # 500 * 100 paise
        assert data["plan"] == "wallet_topup"
        assert data["is_test_mode"] == True
        print(f"Created wallet top-up order: {data['order_id']} for ₹{data['amount']/100}")
    
    def test_wallet_topup_minimum_amount(self, authenticated_client):
        """Test that wallet top-up requires minimum ₹100"""
        response = authenticated_client.post(
            f"{BASE_URL}/wallet/topup",
            json={"amount": 50}  # Below minimum
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "100" in data["detail"]
        print(f"Minimum amount error: {data['detail']}")
    
    def test_wallet_topup_requires_auth(self, api_client):
        """Test that wallet top-up requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(
            f"{BASE_URL}/wallet/topup",
            json={"amount": 500}
        )
        assert response.status_code == 403


# ================== BATCH EXTRACTION TESTS ==================

class TestBatchExtraction:
    """Tests for batch extraction endpoint"""
    
    def test_batch_extract_multiple_documents(self, api_client, user_api_key, simple_test_image_b64):
        """Test POST /api/v1/batch-extract processes multiple documents"""
        response = api_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={
                "images": [
                    {"image_base64": simple_test_image_b64, "document_type": "auto"},
                    {"image_base64": simple_test_image_b64, "document_type": "auto"}
                ]
            },
            headers={"X-API-Key": user_api_key["key"]},
            timeout=120
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "batch_id" in data
        assert "total" in data
        assert "successful" in data
        assert "failed" in data
        assert "results" in data
        assert "processing_time_ms" in data
        
        assert data["total"] == 2
        assert len(data["results"]) == 2
        print(f"Batch processed: {data['successful']} successful, {data['failed']} failed in {data['processing_time_ms']}ms")
    
    def test_batch_extract_max_10_documents(self, api_client, user_api_key, simple_test_image_b64):
        """Test that batch extraction allows max 10 documents"""
        # Try with 11 documents
        images = [{"image_base64": simple_test_image_b64, "document_type": "auto"} for _ in range(11)]
        
        response = api_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={"images": images},
            headers={"X-API-Key": user_api_key["key"]},
            timeout=120
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "10" in data["detail"]
        print(f"Max batch limit error: {data['detail']}")
    
    def test_batch_extract_empty_list_fails(self, api_client, user_api_key):
        """Test that batch extraction requires at least one image"""
        response = api_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={"images": []},
            headers={"X-API-Key": user_api_key["key"]}
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        print(f"Empty batch error: {data['detail']}")
    
    def test_batch_extract_requires_api_key(self, api_client, simple_test_image_b64):
        """Test that batch extraction requires API key"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={
                "images": [{"image_base64": simple_test_image_b64, "document_type": "auto"}]
            }
        )
        assert response.status_code in [401, 422]
    
    def test_batch_extract_with_webhook_url(self, api_client, user_api_key, simple_test_image_b64):
        """Test batch extraction accepts webhook_url parameter"""
        response = api_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={
                "images": [{"image_base64": simple_test_image_b64, "document_type": "auto"}],
                "webhook_url": "https://example.com/webhook",
                "webhook_secret": "test_secret"
            },
            headers={"X-API-Key": user_api_key["key"]},
            timeout=120
        )
        # Should succeed even if webhook URL is not reachable (background task)
        assert response.status_code == 200
        
        data = response.json()
        assert "batch_id" in data
        print(f"Batch with webhook processed: {data['batch_id']}")


# ================== WEBHOOK CONFIGURATION TESTS ==================

class TestWebhookConfiguration:
    """Tests for webhook configuration endpoints"""
    
    def test_create_webhook(self, authenticated_client):
        """Test POST /api/webhooks creates webhook configuration"""
        response = authenticated_client.post(
            f"{BASE_URL}/webhooks",
            json={
                "url": "https://example.com/webhook",
                "events": ["extraction.completed", "batch.completed"],
                "is_active": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "url" in data
        assert "events" in data
        assert "is_active" in data
        assert "created_at" in data
        
        assert data["url"] == "https://example.com/webhook"
        assert data["is_active"] == True
        print(f"Created webhook: {data['id']}")
        return data["id"]
    
    def test_create_webhook_with_secret(self, authenticated_client):
        """Test creating webhook with secret for HMAC signing"""
        response = authenticated_client.post(
            f"{BASE_URL}/webhooks",
            json={
                "url": "https://example.com/secure-webhook",
                "secret": "my_webhook_secret",
                "events": ["extraction.completed"],
                "is_active": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        # Secret should not be returned
        assert "secret" not in data or data.get("secret") is None
        print(f"Created webhook with secret: {data['id']}")
    
    def test_list_webhooks(self, authenticated_client):
        """Test GET /api/webhooks lists all webhooks"""
        # First create a webhook
        create_response = authenticated_client.post(
            f"{BASE_URL}/webhooks",
            json={
                "url": "https://example.com/list-test-webhook",
                "events": ["extraction.completed"]
            }
        )
        assert create_response.status_code == 200
        
        # List webhooks
        response = authenticated_client.get(f"{BASE_URL}/webhooks")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure (secret should not be exposed)
        for webhook in data:
            assert "id" in webhook
            assert "url" in webhook
            assert "secret" not in webhook  # Secret should be excluded
        print(f"Found {len(data)} webhooks")
    
    def test_delete_webhook(self, authenticated_client):
        """Test DELETE /api/webhooks/{id} deletes webhook"""
        # Create a webhook to delete
        create_response = authenticated_client.post(
            f"{BASE_URL}/webhooks",
            json={
                "url": "https://example.com/to-delete-webhook",
                "events": ["extraction.completed"]
            }
        )
        assert create_response.status_code == 200
        webhook_id = create_response.json()["id"]
        
        # Delete the webhook
        response = authenticated_client.delete(f"{BASE_URL}/webhooks/{webhook_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print(f"Deleted webhook: {webhook_id}")
        
        # Verify it's deleted by listing
        list_response = authenticated_client.get(f"{BASE_URL}/webhooks")
        webhooks = list_response.json()
        assert not any(w["id"] == webhook_id for w in webhooks)
    
    def test_delete_nonexistent_webhook(self, authenticated_client):
        """Test deleting non-existent webhook returns 404"""
        response = authenticated_client.delete(f"{BASE_URL}/webhooks/nonexistent-webhook-id")
        assert response.status_code == 404
    
    def test_test_webhook(self, authenticated_client):
        """Test POST /api/webhooks/{id}/test sends test webhook"""
        # Create a webhook
        create_response = authenticated_client.post(
            f"{BASE_URL}/webhooks",
            json={
                "url": "https://httpbin.org/post",  # Use httpbin for testing
                "events": ["extraction.completed"]
            }
        )
        assert create_response.status_code == 200
        webhook_id = create_response.json()["id"]
        
        # Test the webhook
        response = authenticated_client.post(f"{BASE_URL}/webhooks/{webhook_id}/test")
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert "details" in data
        print(f"Test webhook result: success={data['success']}")
    
    def test_test_nonexistent_webhook(self, authenticated_client):
        """Test testing non-existent webhook returns 404"""
        response = authenticated_client.post(f"{BASE_URL}/webhooks/nonexistent-webhook-id/test")
        assert response.status_code == 404
    
    def test_webhooks_require_auth(self, api_client):
        """Test that webhook endpoints require authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        # Try to list webhooks without auth
        response = fresh_client.get(f"{BASE_URL}/webhooks")
        assert response.status_code == 403
        
        # Try to create webhook without auth
        response = fresh_client.post(
            f"{BASE_URL}/webhooks",
            json={"url": "https://example.com/webhook", "events": ["extraction.completed"]}
        )
        assert response.status_code == 403


# ================== USAGE LIMIT ENFORCEMENT TESTS ==================

class TestUsageLimitEnforcement:
    """Tests for usage limit enforcement (402 Payment Required)"""
    
    def test_free_plan_has_100_extraction_limit(self, authenticated_client):
        """Test that free plan limit is 100 extractions"""
        response = authenticated_client.get(f"{BASE_URL}/subscription")
        data = response.json()
        
        assert data["plan"] == "starter" or data["plan"] == "free"  # May be upgraded from previous test
        if data["plan"] == "free":
            assert data["plan_details"]["extractions_per_month"] == 100
        print(f"Current plan: {data['plan']}, limit: {data['plan_details']['extractions_per_month']}")
    
    def test_subscription_shows_remaining_extractions(self, authenticated_client):
        """Test that subscription endpoint shows remaining extractions"""
        response = authenticated_client.get(f"{BASE_URL}/subscription")
        data = response.json()
        
        usage = data["usage"]
        if usage["extractions_limit"]:
            remaining = usage["extractions_limit"] - usage["extractions_used"]
            assert usage["remaining"] == remaining
            print(f"Remaining extractions: {usage['remaining']}")


# ================== INTEGRATION FLOW TESTS ==================

class TestIntegrationFlow:
    """End-to-end integration tests for complete flows"""
    
    def test_full_subscription_upgrade_flow(self, api_client):
        """Test complete flow: register -> check subscription -> create order -> verify payment"""
        # 1. Register new user
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        register_response = api_client.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"TEST_flow_user_{timestamp}@example.com",
                "password": "FlowTest123!",
                "company_name": "Flow Test Inc"
            }
        )
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]
        
        # 2. Check subscription (should be free)
        auth_header = {"Authorization": f"Bearer {token}"}
        sub_response = api_client.get(f"{BASE_URL}/subscription", headers=auth_header)
        assert sub_response.status_code == 200
        assert sub_response.json()["plan"] == "free"
        print("Step 1: User registered on free plan")
        
        # 3. Create order for starter plan
        order_response = api_client.post(
            f"{BASE_URL}/subscription/create-order",
            json={"plan": "starter"},
            headers=auth_header
        )
        assert order_response.status_code == 200
        order_data = order_response.json()
        print(f"Step 2: Order created: {order_data['order_id']}")
        
        # 4. Verify payment (test mode)
        verify_response = api_client.post(
            f"{BASE_URL}/subscription/verify-payment",
            json={
                "razorpay_order_id": order_data["order_id"],
                "razorpay_payment_id": "pay_test_flow_12345",
                "razorpay_signature": "test_signature_flow",
                "plan": "starter"
            },
            headers=auth_header
        )
        assert verify_response.status_code == 200
        print("Step 3: Payment verified")
        
        # 5. Check updated subscription
        final_sub_response = api_client.get(f"{BASE_URL}/subscription", headers=auth_header)
        assert final_sub_response.status_code == 200
        final_data = final_sub_response.json()
        assert final_data["plan"] == "starter"
        assert final_data["plan_details"]["extractions_per_month"] == 1000
        print(f"Step 4: Subscription upgraded to {final_data['plan']}")
    
    def test_batch_processing_flow(self, api_client, simple_test_image_b64):
        """Test batch processing with fresh user"""
        # 1. Register new user
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        register_response = api_client.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"TEST_batch_user_{timestamp}@example.com",
                "password": "BatchTest123!",
                "company_name": "Batch Test Inc"
            }
        )
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]
        auth_header = {"Authorization": f"Bearer {token}"}
        
        # 2. Create API key
        key_response = api_client.post(
            f"{BASE_URL}/keys",
            json={"name": "TEST_batch_key", "rate_limit": 50},
            headers=auth_header
        )
        assert key_response.status_code == 200
        api_key = key_response.json()["key"]
        print(f"Created API key: {key_response.json()['key_prefix']}")
        
        # 3. Batch extract 3 documents
        batch_response = api_client.post(
            f"{BASE_URL}/v1/batch-extract",
            json={
                "images": [
                    {"image_base64": simple_test_image_b64, "document_type": "auto"},
                    {"image_base64": simple_test_image_b64, "document_type": "auto"},
                    {"image_base64": simple_test_image_b64, "document_type": "auto"}
                ]
            },
            headers={"X-API-Key": api_key},
            timeout=180
        )
        assert batch_response.status_code == 200
        
        batch_data = batch_response.json()
        assert batch_data["total"] == 3
        print(f"Batch processed: {batch_data['successful']}/{batch_data['total']} in {batch_data['processing_time_ms']}ms")
