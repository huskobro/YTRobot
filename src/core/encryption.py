"""Simple encryption for API keys stored in data files."""
import base64
import hashlib
import json
import logging
from pathlib import Path

logger = logging.getLogger("Encryption")


def _get_machine_key() -> bytes:
    """Generate a machine-specific key based on hostname + username."""
    import platform
    import getpass
    raw = f"{platform.node()}:{getpass.getuser()}:ytrobot_salt_v1"
    return hashlib.sha256(raw.encode()).digest()


def encrypt_value(plaintext: str) -> str:
    if not plaintext:
        return ""
    key = _get_machine_key()
    data = plaintext.encode()
    encrypted = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return "ENC:" + base64.b64encode(encrypted).decode()


def decrypt_value(encrypted: str) -> str:
    if not encrypted:
        return ""
    if not encrypted.startswith("ENC:"):
        return encrypted
    data = base64.b64decode(encrypted[4:])
    key = _get_machine_key()
    decrypted = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return decrypted.decode()


def is_encrypted(value: str) -> bool:
    return isinstance(value, str) and value.startswith("ENC:")


class SecureStorage:
    """Store and retrieve encrypted key-value pairs."""

    def __init__(self, path: str = "data/secure_store.json"):
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def store(self, key: str, value: str):
        data = self._load()
        data[key] = encrypt_value(value)
        self._save(data)

    def retrieve(self, key: str) -> str:
        data = self._load()
        encrypted = data.get(key, "")
        return decrypt_value(encrypted)

    def delete(self, key: str):
        data = self._load()
        data.pop(key, None)
        self._save(data)

    def list_keys(self) -> list:
        return list(self._load().keys())

    def _load(self) -> dict:
        if self._path.exists():
            try:
                return json.loads(self._path.read_text())
            except Exception:
                return {}
        return {}

    def _save(self, data: dict):
        self._path.write_text(json.dumps(data, indent=2))


secure_storage = SecureStorage()
