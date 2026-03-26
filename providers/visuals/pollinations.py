import logging
import time
import urllib.request as urllib_req
import urllib.parse
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ytrobot.pollinations")


def generate_thumbnail(prompt: str, output_path: Path,
                        width: int = 1280, height: int = 720,
                        seed: Optional[int] = None) -> bool:
    """
    Generate a thumbnail image using Pollinations.ai (free, no API key).
    Returns True on success, False on failure.
    """
    if seed is None:
        seed = int(time.time()) % 100000

    encoded_prompt = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width={width}&height={height}&seed={seed}&model=flux&nologo=true"
    )

    try:
        req = urllib_req.Request(url, headers={"User-Agent": "YTRobot/1.0"})
        with urllib_req.urlopen(req, timeout=60) as resp:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.read())
        if output_path.stat().st_size < 1000:
            logger.warning(f"[Pollinations] Suspiciously small file: {output_path.stat().st_size} bytes")
            return False
        logger.info(f"[Pollinations] Thumbnail saved: {output_path}")
        return True
    except Exception as e:
        logger.error(f"[Pollinations] Generation failed: {e}")
        return False
