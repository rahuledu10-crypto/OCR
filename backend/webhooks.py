"""
Webhook System for ExtractAI
Sends notifications to external URLs when extractions complete
"""
import aiohttp
import asyncio
import logging
import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def send_webhook(
    url: str,
    payload: Dict[str, Any],
    secret: Optional[str] = None,
    timeout: int = 30,
    retries: int = 3
) -> Dict[str, Any]:
    """
    Send webhook notification to external URL
    
    Args:
        url: Webhook endpoint URL
        payload: Data to send
        secret: Optional secret for HMAC signature
        timeout: Request timeout in seconds
        retries: Number of retry attempts
    
    Returns:
        Response details including success status
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "ExtractAI-Webhook/1.0",
        "X-Webhook-Timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    body = json.dumps(payload)
    
    # Add HMAC signature if secret provided
    if secret:
        signature = hmac.new(
            secret.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-Webhook-Signature"] = f"sha256={signature}"
    
    last_error = None
    
    for attempt in range(retries):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    data=body,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    response_text = await response.text()
                    
                    if response.status < 400:
                        return {
                            "success": True,
                            "status_code": response.status,
                            "response": response_text[:500],
                            "attempt": attempt + 1
                        }
                    else:
                        last_error = f"HTTP {response.status}: {response_text[:200]}"
                        
        except asyncio.TimeoutError:
            last_error = "Request timed out"
        except aiohttp.ClientError as e:
            last_error = str(e)
        except Exception as e:
            last_error = f"Unexpected error: {str(e)}"
        
        # Wait before retry (exponential backoff)
        if attempt < retries - 1:
            await asyncio.sleep(2 ** attempt)
    
    return {
        "success": False,
        "error": last_error,
        "attempts": retries
    }


def create_extraction_webhook_payload(
    extraction_id: str,
    document_type: str,
    extracted_data: Dict[str, Any],
    confidence: float,
    processing_time_ms: int,
    user_id: str,
    api_key_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create webhook payload for extraction completion
    """
    return {
        "event": "extraction.completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "id": extraction_id,
            "document_type": document_type,
            "extracted_data": extracted_data,
            "confidence": confidence,
            "processing_time_ms": processing_time_ms
        },
        "metadata": {
            "user_id": user_id,
            "api_key_id": api_key_id
        }
    }


def create_batch_webhook_payload(
    batch_id: str,
    total: int,
    successful: int,
    failed: int,
    results: list,
    user_id: str
) -> Dict[str, Any]:
    """
    Create webhook payload for batch extraction completion
    """
    return {
        "event": "batch.completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "batch_id": batch_id,
            "summary": {
                "total": total,
                "successful": successful,
                "failed": failed
            },
            "results": results
        },
        "metadata": {
            "user_id": user_id
        }
    }
