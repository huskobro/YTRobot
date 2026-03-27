import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("RateLimiter")

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter per IP."""

    def __init__(self, app, requests_per_minute: int = 60, burst: int = 10):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.burst = burst
        self._hits = defaultdict(list)  # ip -> [timestamps]

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for WebSocket, static files, and localhost
        path = request.url.path
        ip = request.client.host if request.client else "unknown"
        if (path.startswith("/ws/") or path.startswith("/ui/")
            or path.endswith((".js", ".css", ".html", ".ico"))
            or ip in ("127.0.0.1", "::1", "localhost")):
            return await call_next(request)

        now = time.time()
        window = 60.0  # 1 minute window

        # Clean old entries
        self._hits[ip] = [t for t in self._hits[ip] if now - t < window]

        if len(self._hits[ip]) >= self.rpm:
            logger.warning(f"Rate limit exceeded for {ip}")
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        self._hits[ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.rpm - len(self._hits[ip])))
        return response
