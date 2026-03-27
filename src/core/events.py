"""Simple in-process event bus to decouple queue from route handlers."""

import logging
from typing import Callable, Dict, List, Any

logger = logging.getLogger("EventBus")

_listeners: Dict[str, List[Callable]] = {}


def on(event: str, callback: Callable):
    """Register a callback for an event."""
    _listeners.setdefault(event, []).append(callback)
    logger.debug(f"Registered listener for '{event}': {callback.__name__}")


def off(event: str, callback: Callable = None):
    """Remove a callback (or all callbacks) for an event."""
    if callback is None:
        _listeners.pop(event, None)
    elif event in _listeners:
        _listeners[event] = [cb for cb in _listeners[event] if cb is not callback]


async def emit(event: str, **kwargs: Any):
    """Emit an event, calling all registered listeners."""
    import asyncio
    for cb in _listeners.get(event, []):
        try:
            result = cb(**kwargs)
            if asyncio.iscoroutine(result):
                await result
        except Exception as e:
            logger.error(f"Event listener error ({event}, {cb.__name__}): {e}")


def emit_sync(event: str, **kwargs: Any):
    """Emit an event synchronously (for use in non-async contexts)."""
    for cb in _listeners.get(event, []):
        try:
            cb(**kwargs)
        except Exception as e:
            logger.error(f"Sync event listener error ({event}, {cb.__name__}): {e}")
