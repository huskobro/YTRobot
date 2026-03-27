"""GPU encoder detection utility.

Probes FFmpeg for available hardware video encoders and returns
appropriate codec arguments for MoviePy and raw FFmpeg calls.

Priority order: h264_nvenc (NVIDIA) > h264_videotoolbox (macOS) > None (CPU/libx264)
"""
import subprocess
import logging
from functools import lru_cache

logger = logging.getLogger("GPUDetect")


@lru_cache(maxsize=1)
def detect_gpu_encoder() -> str | None:
    """Detect available hardware video encoder.

    Returns encoder name or None if only CPU is available.
    Result is cached after the first call so FFmpeg is not probed on every render.

    Priority: h264_nvenc (NVIDIA) > h264_videotoolbox (macOS) > None (CPU)
    """
    try:
        result = subprocess.run(
            ["ffmpeg", "-encoders"],
            capture_output=True, text=True, timeout=10
        )
        encoders_output = result.stdout

        # Check NVIDIA NVENC first (Windows/Linux with NVIDIA GPU)
        if "h264_nvenc" in encoders_output:
            logger.info("[GPU] NVIDIA NVENC encoder detected")
            return "h264_nvenc"

        # Check Apple VideoToolbox (macOS)
        if "h264_videotoolbox" in encoders_output:
            logger.info("[GPU] Apple VideoToolbox encoder detected")
            return "h264_videotoolbox"

        logger.info("[GPU] No hardware encoder found, using CPU (libx264)")
        return None

    except Exception as e:
        logger.warning(f"[GPU] Could not detect encoders: {e}")
        return None


def get_ffmpeg_codec_args(gpu_setting: str = "auto") -> dict:
    """Get FFmpeg codec arguments based on GPU setting.

    Args:
        gpu_setting: "auto" | "force" | "disabled"

    Returns:
        Dict with keys: codec, extra_args (list of ffmpeg CLI args)
    """
    if gpu_setting == "disabled":
        return {"codec": "libx264", "extra_args": ["-preset", "fast", "-crf", "23"]}

    encoder = detect_gpu_encoder()

    if gpu_setting == "force" and not encoder:
        raise RuntimeError("GPU encoding forced but no hardware encoder available")

    if encoder == "h264_nvenc":
        return {
            "codec": "h264_nvenc",
            "extra_args": ["-preset", "p1", "-rc", "vbr", "-cq", "24",
                           "-b:v", "10M", "-maxrate", "12M"],
        }
    elif encoder == "h264_videotoolbox":
        return {
            "codec": "h264_videotoolbox",
            "extra_args": ["-b:v", "8M", "-maxrate", "10M"],
        }
    else:
        return {"codec": "libx264", "extra_args": ["-preset", "fast", "-crf", "23"]}


def get_moviepy_codec_kwargs(gpu_setting: str = "auto") -> dict:
    """Get MoviePy write_videofile kwargs for GPU encoding.

    Returns a dict ready to be unpacked into write_videofile():
        {"codec": "...", "ffmpeg_params": [...]}
    """
    args = get_ffmpeg_codec_args(gpu_setting)
    return {
        "codec": args["codec"],
        "ffmpeg_params": args["extra_args"],
    }
