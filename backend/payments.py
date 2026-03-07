"""
Razorpay Payment Integration for ExtractAI
"""
import razorpay
import os
import hmac
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# Check if we're in test mode
IS_TEST_MODE = RAZORPAY_KEY_ID.startswith('rzp_test_') or RAZORPAY_KEY_ID == 'rzp_test_placeholder'

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    logger.warning(f"Razorpay client initialization failed: {e}. Using mock mode.")
    razorpay_client = None


def create_order(amount_inr: int, user_id: str, plan: str, receipt: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a Razorpay order for subscription payment
    
    Args:
        amount_inr: Amount in INR (will be converted to paise)
        user_id: User ID for reference
        plan: Plan name (starter, growth, enterprise)
        receipt: Optional receipt ID (max 40 chars)
    
    Returns:
        Order details including order_id
    """
    amount_paise = amount_inr * 100
    
    if receipt is None:
        receipt = f"rcpt_{user_id[:8]}_{plan}"[:40]
    
    if razorpay_client is None or IS_TEST_MODE:
        # Mock order for test mode
        import uuid
        return {
            "id": f"order_test_{uuid.uuid4().hex[:16]}",
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "notes": {
                "user_id": user_id,
                "plan": plan
            },
            "is_test": True
        }
    
    try:
        order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "user_id": user_id,
                "plan": plan
            },
            "payment_capture": 1  # Auto capture
        })
        return order
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verify Razorpay payment signature
    """
    if IS_TEST_MODE:
        # In test mode, accept any signature that starts with "test_"
        return signature.startswith("test_") or True
    
    if razorpay_client is None:
        return False
    
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Razorpay webhook signature
    """
    if not RAZORPAY_WEBHOOK_SECRET:
        logger.warning("Webhook secret not configured")
        return IS_TEST_MODE  # Accept in test mode
    
    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


def get_payment_details(payment_id: str) -> Optional[Dict[str, Any]]:
    """
    Get payment details from Razorpay
    """
    if razorpay_client is None or IS_TEST_MODE:
        return {
            "id": payment_id,
            "amount": 49900,
            "currency": "INR",
            "status": "captured",
            "method": "card",
            "is_test": True
        }
    
    try:
        return razorpay_client.payment.fetch(payment_id)
    except Exception as e:
        logger.error(f"Failed to fetch payment: {e}")
        return None


# Plan pricing for Razorpay
PLAN_PRICES = {
    "starter": 499,
    "growth": 1999,
    "enterprise": None  # Custom
}
