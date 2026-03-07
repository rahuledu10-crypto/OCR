# Subscription Plans Configuration

PLANS = {
    "free": {
        "name": "Free",
        "price_inr": 0,
        "extractions_per_month": 100,
        "rate_limit_per_minute": 10,
        "features": ["Aadhaar, PAN, DL supported", "API access", "Dashboard access"],
        "is_one_time": True  # One-time 100 extractions, not monthly
    },
    "starter": {
        "name": "Starter",
        "price_inr": 499,
        "extractions_per_month": 1000,
        "rate_limit_per_minute": 30,
        "features": ["All document types", "Standard support", "99.5% uptime SLA"]
    },
    "growth": {
        "name": "Growth",
        "price_inr": 1999,
        "extractions_per_month": 5000,
        "rate_limit_per_minute": 100,
        "features": ["All document types", "Priority support", "99.9% uptime SLA", "Custom rate limits"]
    },
    "enterprise": {
        "name": "Enterprise",
        "price_inr": None,  # Custom pricing
        "extractions_per_month": None,  # Unlimited
        "rate_limit_per_minute": 500,
        "features": ["All document types", "24/7 dedicated support", "99.99% uptime SLA", "Custom integrations", "WhatsApp integration"]
    }
}

# Pay-as-you-go pricing (when plan limit exceeded)
PAYG_PRICE_PER_EXTRACTION = 0.20  # ₹0.20 per extraction
