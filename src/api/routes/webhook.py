import hmac
import hashlib
import ipaddress
import json
import logging
import socket
import urllib.request as urllib_req
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/webhook", tags=["webhook"])
logger = logging.getLogger("ytrobot.webhook")


def _is_safe_url(url: str) -> bool:
    """Reject URLs pointing to localhost, private/link-local IPs, or file:// scheme."""
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    # Block non-HTTP schemes
    if parsed.scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    # Block obvious localhost names
    if hostname in ("localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"):
        return False

    # Resolve hostname and check IP ranges
    try:
        for info in socket.getaddrinfo(hostname, None):
            addr = info[4][0]
            ip = ipaddress.ip_address(addr)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
    except socket.gaierror:
        # Cannot resolve — reject to be safe
        return False

    return True


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 webhook signature."""
    if not secret or not signature:
        return True  # No secret configured = skip verification
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


class WebhookTestReq(BaseModel):
    url: str


def dispatch_webhook(url: str, payload: dict, mention: str = "") -> bool:
    """Send a webhook notification. Supports Slack and Discord format."""
    if not url:
        return False
    if not _is_safe_url(url):
        logger.warning(f"[Webhook] Blocked unsafe URL: {url}")
        return False
    try:
        emoji = "✅" if payload.get("status") == "completed" else "❌"
        mod_map = {"yt_video": "Normal Video", "bulletin": "Haber Bülteni",
                   "product_review": "Ürün İnceleme"}
        module = mod_map.get(payload.get("module", ""), payload.get("module", ""))
        text = (
            f"{emoji} *YTRobot* — {module} render "
            f"{'tamamlandı' if payload.get('status')=='completed' else 'başarısız'}!\n"
            f"Session: `{payload.get('session_id', 'N/A')}`\n"
        )
        if payload.get("error"):
            text += f"Hata: `{payload['error'][:100]}`\n"
        if payload.get("duration"):
            text += f"Süre: {round(payload['duration']/60, 1)} dakika\n"
        if mention:
            text = f"{mention} {text}"

        if "discord.com" in url:
            body = {"content": text}
        else:
            body = {"text": text}

        req = urllib_req.Request(
            url,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req, timeout=10) as resp:
            logger.info(f"[Webhook] Sent successfully, status={resp.status}")
            return True
    except Exception as e:
        logger.error(f"[Webhook] Failed: {e}")
        return False


@router.post("/test")
def test_webhook(body: WebhookTestReq):
    if not _is_safe_url(body.url):
        raise HTTPException(400, "Unsafe webhook URL: localhost, private IPs, and non-HTTP schemes are not allowed")
    result = dispatch_webhook(
        body.url,
        {"status": "completed", "module": "yt_video",
         "session_id": "test_session", "duration": 180},
    )
    return {"ok": result, "message": "Webhook gönderildi" if result else "Webhook hatası"}
