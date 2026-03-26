"""Shared resilience utilities for the YTRobot pipeline.

Provides retry logic, output validation, and a custom exception for
per-stage error reporting.
"""
import functools
import time
import traceback
from pathlib import Path


class PipelineStageError(Exception):
    """Raised when a pipeline stage fails, carrying stage name and diagnostics."""

    def __init__(self, stage: str, message: str, cause: Exception | None = None):
        self.stage = stage
        self.cause = cause
        super().__init__(f"[{stage}] {message}")


def validate_output(path: Path, min_size: int = 100, label: str = "") -> None:
    """Check that *path* exists and exceeds *min_size* bytes.

    Raises ``PipelineStageError`` on failure.
    """
    tag = label or path.name
    if not path.exists():
        raise PipelineStageError(tag, f"Output file missing: {path}")
    size = path.stat().st_size
    if size < min_size:
        raise PipelineStageError(tag, f"Output too small ({size} bytes): {path}")


def log_stage_error(session_dir: Path, stage: str, exc: Exception) -> None:
    """Append a stage error with traceback to ``session_dir/error.log``."""
    error_log = session_dir / "error.log"
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    with open(error_log, "a", encoding="utf-8") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"STAGE FAILED: {stage}\n")
        f.write(f"{'='*60}\n")
        f.write("".join(tb))
        f.write("\n")


def _is_retryable(exc: Exception) -> bool:
    """Determine whether an exception is worth retrying."""
    import requests

    # Network-level errors
    if isinstance(exc, (requests.exceptions.Timeout,
                        requests.exceptions.ConnectionError)):
        return True

    # HTTP errors with retryable status codes
    if isinstance(exc, requests.exceptions.HTTPError):
        resp = getattr(exc, "response", None)
        if resp is not None and resp.status_code in (429, 500, 502, 503, 504):
            return True

    # OpenAI SDK errors (imported lazily to avoid hard dependency)
    try:
        import openai
        if isinstance(exc, (openai.RateLimitError, openai.APIConnectionError)):
            return True
        if isinstance(exc, openai.APIError):
            status = getattr(exc, "status_code", None)
            if status and status in (429, 500, 502, 503, 504):
                return True
    except ImportError:
        pass

    # RuntimeError with HTTP status code in message (e.g. from speshaudio)
    if isinstance(exc, RuntimeError):
        msg = str(exc)
        for code in ("429", "500", "502", "503", "504"):
            if code in msg:
                return True

    return False


def retry_with_backoff(max_retries: int = 3, base_delay: float = 2.0):
    """Decorator that retries a function on transient failures.

    Uses exponential backoff: base_delay * 3^attempt (2s, 6s, 18s by default).
    Only retries exceptions deemed retryable by ``_is_retryable``.
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    if attempt < max_retries and _is_retryable(e):
                        wait = base_delay * (3 ** (attempt - 1))
                        print(
                            f"    [Retry] {func.__qualname__} attempt {attempt}/{max_retries} "
                            f"failed ({e.__class__.__name__}: {e}), retrying in {wait:.0f}s..."
                        )
                        time.sleep(wait)
                    else:
                        raise
            raise last_exc  # type: ignore[misc]

        return wrapper

    return decorator
