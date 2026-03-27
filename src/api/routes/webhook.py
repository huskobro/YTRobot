import hmac
import hashlib
import ipaddress
import json
import logging
import smtplib
import socket
import urllib.request as urllib_req
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings

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


def _build_notification_text(payload: dict, mention: str = "") -> str:
    """Build a human-readable notification text from payload."""
    emoji = "\u2705" if payload.get("status") == "completed" else "\u274c"
    mod_map = {"yt_video": "Normal Video", "bulletin": "Haber B\u00fclteni",
               "product_review": "\u00dcr\u00fcn \u0130nceleme"}
    module = mod_map.get(payload.get("module", ""), payload.get("module", ""))
    text = (
        f"{emoji} *YTRobot* \u2014 {module} render "
        f"{'tamamland\u0131' if payload.get('status')=='completed' else 'ba\u015far\u0131s\u0131z'}!\n"
        f"Session: `{payload.get('session_id', 'N/A')}`\n"
    )
    if payload.get("error"):
        text += f"Hata: `{payload['error'][:100]}`\n"
    if payload.get("duration"):
        text += f"S\u00fcre: {round(payload['duration']/60, 1)} dakika\n"
    if mention:
        text = f"{mention} {text}"
    return text


def dispatch_telegram(payload: dict) -> bool:
    """Send notification via Telegram Bot API."""
    if not settings.telegram_enabled or not settings.telegram_bot_token or not settings.telegram_chat_id:
        return False
    try:
        text = _build_notification_text(payload)
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        body = {
            "chat_id": settings.telegram_chat_id,
            "text": text,
            "parse_mode": "Markdown",
        }
        req = urllib_req.Request(
            url,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req, timeout=10) as resp:
            logger.info(f"[Telegram] Sent successfully, status={resp.status}")
            return True
    except Exception as e:
        logger.error(f"[Telegram] Failed: {e}")
        return False


def dispatch_email(payload: dict) -> bool:
    """Send notification via SMTP email."""
    if not settings.email_enabled or not settings.email_smtp_user or not settings.email_to:
        return False
    try:
        text = _build_notification_text(payload).replace("*", "").replace("`", "")
        status = "Tamamland\u0131" if payload.get("status") == "completed" else "Ba\u015far\u0131s\u0131z"
        subject = f"YTRobot \u2014 Video Render {status}"

        msg = MIMEMultipart()
        msg["From"] = settings.email_from or settings.email_smtp_user
        msg["To"] = settings.email_to
        msg["Subject"] = subject
        msg.attach(MIMEText(text, "plain", "utf-8"))

        with smtplib.SMTP(settings.email_smtp_host, settings.email_smtp_port) as server:
            server.starttls()
            server.login(settings.email_smtp_user, settings.email_smtp_password)
            recipients = [r.strip() for r in settings.email_to.split(",") if r.strip()]
            server.sendmail(msg["From"], recipients, msg.as_string())

        logger.info("[Email] Sent successfully")
        return True
    except Exception as e:
        logger.error(f"[Email] Failed: {e}")
        return False


def dispatch_whatsapp(payload: dict) -> bool:
    """Send notification via WhatsApp Business API (Twilio or direct API)."""
    if not settings.whatsapp_enabled or not settings.whatsapp_api_url or not settings.whatsapp_to:
        return False
    try:
        text = _build_notification_text(payload).replace("*", "").replace("`", "")
        body = {"to": settings.whatsapp_to, "body": text}
        req = urllib_req.Request(
            settings.whatsapp_api_url,
            data=json.dumps(body).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.whatsapp_api_token}",
            },
            method="POST",
        )
        with urllib_req.urlopen(req, timeout=15) as resp:
            logger.info(f"[WhatsApp] Sent successfully, status={resp.status}")
            return True
    except Exception as e:
        logger.error(f"[WhatsApp] Failed: {e}")
        return False


def dispatch_all_notifications(payload: dict, mention: str = "") -> dict:
    """Send notifications to all enabled channels. Returns status per channel."""
    results = {}
    if settings.webhook_enabled and settings.webhook_url:
        results["webhook"] = dispatch_webhook(settings.webhook_url, payload, mention)
    if settings.telegram_enabled:
        results["telegram"] = dispatch_telegram(payload)
    if settings.email_enabled:
        results["email"] = dispatch_email(payload)
    if settings.whatsapp_enabled:
        results["whatsapp"] = dispatch_whatsapp(payload)
    return results


@router.post("/test")
def test_webhook(body: WebhookTestReq):
    if not _is_safe_url(body.url):
        raise HTTPException(400, "Unsafe webhook URL: localhost, private IPs, and non-HTTP schemes are not allowed")
    result = dispatch_webhook(
        body.url,
        {"status": "completed", "module": "yt_video",
         "session_id": "test_session", "duration": 180},
    )
    return {"ok": result, "message": "Webhook g\u00f6nderildi" if result else "Webhook hatas\u0131"}


class NotifTestReq(BaseModel):
    channel: str  # "telegram" | "email" | "whatsapp"


@router.post("/test-notification")
def test_notification(body: NotifTestReq):
    """Test a specific notification channel."""
    test_payload = {"status": "completed", "module": "yt_video",
                    "session_id": "test_session", "duration": 180}
    if body.channel == "telegram":
        ok = dispatch_telegram(test_payload)
    elif body.channel == "email":
        ok = dispatch_email(test_payload)
    elif body.channel == "whatsapp":
        ok = dispatch_whatsapp(test_payload)
    else:
        raise HTTPException(400, f"Unknown channel: {body.channel}")
    return {"ok": ok, "channel": body.channel}
