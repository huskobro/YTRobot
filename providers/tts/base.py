import re
from abc import ABC, abstractmethod
from pathlib import Path


def clean_for_tts(text: str) -> str:
    """Normalize text to prevent unwanted TTS pauses.

    - Curly/smart quotes → straight apostrophe (prevents some TTS engines
      from inserting a glottal-stop pause at Turkish genitive suffixes like
      İran'ın, Trump'ın, etc.)
    - Triple dots (...) → single ellipsis character (…) so TTS treats it as
      one brief pause rather than three separate ones.
    - Collapse redundant whitespace.
    """
    # Smart / curly quotes → straight apostrophe
    text = text.replace("\u2018", "'")   # '
    text = text.replace("\u2019", "'")   # '
    text = text.replace("\u201A", "'")   # ‚
    # Triple dots → single ellipsis character
    text = text.replace("...", "…")
    # Collapse multiple spaces
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


class BaseTTSProvider(ABC):
    @abstractmethod
    def synthesize(self, text: str, output_path: Path) -> Path:
        """Convert text to speech and save to output_path. Returns the saved file path."""
        ...


def apply_speed(path: Path, speed: float) -> None:
    """Re-encode audio at the given speed using ffmpeg atempo. Modifies file in place.

    atempo accepts 0.5–2.0 per filter instance; values outside this range are handled
    by chaining multiple filters (e.g. 0.25 = atempo=0.5,atempo=0.5).
    Speed 1.0 is a no-op (file untouched).
    """
    if abs(speed - 1.0) < 0.01:
        return
    import shutil
    import subprocess

    # Build chained atempo filters to cover any speed
    filters: list[str] = []
    s = speed
    while s > 2.0:
        filters.append("atempo=2.0")
        s /= 2.0
    while s < 0.5:
        filters.append("atempo=0.5")
        s *= 2.0
    filters.append(f"atempo={s:.4f}")
    filter_str = ",".join(filters)

    tmp = path.with_suffix(".spd.mp3")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(path), "-filter:a", filter_str, str(tmp)],
            check=True, capture_output=True,
        )
        shutil.move(str(tmp), str(path))
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
