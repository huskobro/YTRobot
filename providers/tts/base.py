import re
import shutil
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path


def clean_for_tts(text: str, remove_apostrophes: bool = True) -> str:
    """Normalize text to prevent unwanted TTS pauses and pronunciation errors.

    - Curly/smart quotes → straight apostrophe first, then optionally strip them.
      Turkish suffix apostrophes (İran'ın, Trump'ın) produce micro-pauses in
      ElevenLabs/SpesAudio because the engine treats them as glottal-stop markers.
      Removing them is phonetically safe — the TTS pronounces the merged form
      identically.  Set remove_apostrophes=False to keep them.
    - Triple dots (...) → single ellipsis character (…) so the TTS inserts one
      short pause, not three separate ones.
    - Collapse redundant whitespace.
    """
    # Normalise curly/smart quotes to straight apostrophe first
    text = text.replace("\u2018", "'")   # '
    text = text.replace("\u2019", "'")   # '
    text = text.replace("\u201A", "'")   # ‚

    if remove_apostrophes:
        text = text.replace("'", "")

    # Triple dots → single ellipsis so TTS makes ONE brief pause
    text = text.replace("...", "…")

    # Collapse multiple spaces left by apostrophe removal
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def trim_silence(
    path: Path,
    threshold_db: float = -35.0,
    min_dur: float = 0.1,
) -> None:
    """Remove leading AND trailing silence from an audio file in place.

    Uses ffmpeg's silenceremove filter:
      - First pass removes silence at the start.
      - areverse + second pass removes silence at the end.
    A threshold of -35 dB catches normal TTS breath/pad without cutting speech.
    """
    tmp = path.with_suffix(".trim.mp3")
    try:
        af = (
            f"silenceremove=start_periods=1"
            f":start_threshold={threshold_db}dB"
            f":start_duration={min_dur}"
            f",areverse"
            f",silenceremove=start_periods=1"
            f":start_threshold={threshold_db}dB"
            f":start_duration={min_dur}"
            f",areverse"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(path), "-af", af, str(tmp)],
            check=True,
            capture_output=True,
        )
        shutil.move(str(tmp), str(path))
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)


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
