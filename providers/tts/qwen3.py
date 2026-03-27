import threading
from pathlib import Path
import torch
import soundfile as sf
import os

try:
    from qwen_tts import Qwen3TTSModel
except ImportError:
    Qwen3TTSModel = None

from config import settings
from providers.tts.base import BaseTTSProvider, apply_speed, clean_for_tts, trim_silence

# Global cache to keep models in memory — protected by a lock for thread safety.
_MODEL_CACHE: dict = {}
_cache_lock = threading.Lock()

class Qwen3TTSProvider(BaseTTSProvider):
    def __init__(self):
        if Qwen3TTSModel is None:
            print("  [Qwen3] ERROR: qwen-tts package not installed. Run 'pip install qwen-tts'")

        self.model_id = settings.qwen3_model_id
        self.device = settings.qwen3_device
        if self.device == "auto":
            if torch.cuda.is_available():
                self.device = "cuda"
            elif torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"

    def _get_model(self):
        # Double-checked locking pattern to avoid loading the model twice.
        if self.model_id not in _MODEL_CACHE:
            with _cache_lock:
                if self.model_id not in _MODEL_CACHE:  # re-check inside lock
                    if Qwen3TTSModel is None:
                        raise ImportError("qwen-tts package is required for Qwen3 TTS.")

                    print(f"  [Qwen3] Loading model: {self.model_id} on {self.device}...")
                    dtype = torch.bfloat16 if self.device != "cpu" else torch.float32
                    attn_impl = self._attn_impl(self.device)

                    _MODEL_CACHE[self.model_id] = Qwen3TTSModel.from_pretrained(
                        self.model_id,
                        device_map=self.device,
                        dtype=dtype,
                        attn_implementation=attn_impl
                    )
        return _MODEL_CACHE[self.model_id]

    def _resolve_device(self, requested: str) -> str:
        """Resolve 'auto' to actual device string."""
        if requested and requested != "auto":
            return requested
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _attn_impl(self, device: str) -> str:
        """Pick the safest attention implementation for the device."""
        if device == "cpu":
            return "eager"
        if device == "mps":
            return "sdpa"
        # CUDA: only use flash_attention_2 if the package is actually installed
        try:
            import flash_attn  # noqa: F401
            return "flash_attention_2"
        except ImportError:
            return "sdpa"

    def synthesize(self, text: str, output_path: Path, **kwargs) -> Path:
        if Qwen3TTSModel is None:
            raise ImportError("qwen-tts package is required for Qwen3 TTS. Please install it first.")

        # Parameters (prefer kwargs over settings)
        model_id = kwargs.get("model_id") or self.model_id
        mode = kwargs.get("model_type") or settings.qwen3_model_type
        speaker = kwargs.get("speaker") or settings.qwen3_speaker
        voice_instruct = kwargs.get("voice_instruct") or settings.qwen3_voice_instruct
        ref_audio = kwargs.get("ref_audio") or settings.qwen3_ref_audio
        # Always resolve "auto" to a real device name
        device = self._resolve_device(kwargs.get("device") or self.device)

        text = clean_for_tts(text, remove_apostrophes=settings.tts_remove_apostrophes)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if model_id not in _MODEL_CACHE:
             print(f"  [Qwen3] Loading model: {model_id} on {device}...")
             dtype = torch.bfloat16 if device != "cpu" else torch.float32
             attn_impl = self._attn_impl(device)
             _MODEL_CACHE[model_id] = Qwen3TTSModel.from_pretrained(
                 model_id, device_map=device, dtype=dtype, attn_implementation=attn_impl
             )
        model = _MODEL_CACHE[model_id]
        
        wavs, sr = [], 0
        print(f"  [Qwen3] Synthesizing in {mode} mode: {text[:50]}...")

        try:
            if mode == "custom":
                wavs, sr = model.generate_custom_voice(
                    text=text,
                    language="Auto",
                    speaker=speaker,
                    instruct=voice_instruct
                )
            elif mode == "design":
                wavs, sr = model.generate_voice_design(
                    text=text,
                    language="Auto",
                    instruct=voice_instruct
                )
            elif mode == "clone":
                if not ref_audio:
                    raise ValueError("Qwen3 Voice clone requires a reference audio path (qwen3_ref_audio).")
                
                wavs, sr = model.generate_voice_clone(
                    text=text,
                    language="Auto",
                    ref_audio=ref_audio,
                    x_vector_only_mode=True
                )
            
            if len(wavs) > 0:
                # model.generate returns a list of wavs (for batch support)
                sf.write(str(output_path), wavs[0], sr)
                print(f"  [Qwen3] Saved to {output_path}")
            else:
                raise RuntimeError("Qwen3 synthesis returned no audio data.")

        except Exception as e:
            print(f"  [Qwen3] Error during synthesis: {e}")
            raise

        # Post-processing
        if abs(settings.tts_speed - 1.0) > 0.01:
            apply_speed(output_path, settings.tts_speed)
        
        if settings.tts_trim_silence:
            trim_silence(output_path)
            
        return output_path
