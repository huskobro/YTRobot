"""Fernet-based encryption for API keys stored in data files."""
import base64
import hashlib
import json
import logging
import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger("Encryption")

_SALT_FILE = Path("data/.encryption_salt")
_ENC_PREFIX = "FENC:"
_LEGACY_PREFIX = "ENC:"


def _get_or_create_salt() -> bytes:
    """Return a persistent random salt, creating one if needed."""
    _SALT_FILE.parent.mkdir(parents=True, exist_ok=True)
    if _SALT_FILE.exists():
        return _SALT_FILE.read_bytes()
    salt = os.urandom(16)
    _SALT_FILE.write_bytes(salt)
    return salt


def _get_machine_seed() -> bytes:
    """Generate a machine-specific seed from hostname + username."""
    import platform
    import getpass
    raw = f"{platform.node()}:{getpass.getuser()}:ytrobot_salt_v1"
    return raw.encode()


def _derive_fernet_key(salt: bytes) -> bytes:
    """Derive a Fernet key from machine seed + stored salt via PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480_000,
    )
    key_bytes = kdf.derive(_get_machine_seed())
    return base64.urlsafe_b64encode(key_bytes)


def _get_fernet() -> Fernet:
    salt = _get_or_create_salt()
    return Fernet(_derive_fernet_key(salt))


# ── Legacy XOR helpers (for migration only) ─────────────────────────────────

def _legacy_machine_key() -> bytes:
    import platform
    import getpass
    raw = f"{platform.node()}:{getpass.getuser()}:ytrobot_salt_v1"
    return hashlib.sha256(raw.encode()).digest()


def _legacy_decrypt(encrypted: str) -> str:
    """Decrypt a value encrypted with the old XOR cipher."""
    if not encrypted or not encrypted.startswith(_LEGACY_PREFIX):
        return encrypted
    data = base64.b64decode(encrypted[len(_LEGACY_PREFIX):])
    key = _legacy_machine_key()
    decrypted = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return decrypted.decode()


# ── Public API ───────────────────────────────────────────────────────────────

def encrypt_value(plaintext: str) -> str:
    if not plaintext:
        return ""
    f = _get_fernet()
    token = f.encrypt(plaintext.encode())
    return _ENC_PREFIX + token.decode()


def decrypt_value(encrypted: str) -> str:
    if not encrypted:
        return ""
    # Fernet-encrypted value
    if encrypted.startswith(_ENC_PREFIX):
        try:
            f = _get_fernet()
            return f.decrypt(encrypted[len(_ENC_PREFIX):].encode()).decode()
        except (InvalidToken, Exception) as e:
            logger.error(f"Fernet decryption failed: {e}")
            return ""
    # Legacy XOR-encrypted value — decrypt and return
    if encrypted.startswith(_LEGACY_PREFIX):
        try:
            return _legacy_decrypt(encrypted)
        except Exception as e:
            logger.error(f"Legacy decryption failed: {e}")
            return ""
    # Plaintext passthrough
    return encrypted


def is_encrypted(value: str) -> bool:
    return isinstance(value, str) and (
        value.startswith(_ENC_PREFIX) or value.startswith(_LEGACY_PREFIX)
    )


def migrate_value(value: str) -> str:
    """Re-encrypt a legacy XOR or plaintext value with Fernet. Returns Fernet-encrypted string."""
    if not value:
        return ""
    if value.startswith(_ENC_PREFIX):
        return value  # Already Fernet
    if value.startswith(_LEGACY_PREFIX):
        plaintext = _legacy_decrypt(value)
        return encrypt_value(plaintext)
    # Plaintext
    return encrypt_value(value)


class SecureStorage:
    """Store and retrieve encrypted key-value pairs."""

    def __init__(self, path: str = "data/secure_store.json"):
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._migrate_if_needed()

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
            except Exception as e:
                logger.error(f"Failed to load secure storage from {self._path}: {e}")
                return {}
        return {}

    def _save(self, data: dict):
        self._path.write_text(json.dumps(data, indent=2))

    def _migrate_if_needed(self):
        """Re-encrypt any legacy XOR values to Fernet."""
        data = self._load()
        changed = False
        for key, value in data.items():
            if isinstance(value, str) and value.startswith(_LEGACY_PREFIX):
                data[key] = migrate_value(value)
                changed = True
                logger.info(f"Migrated key '{key}' from XOR to Fernet encryption")
        if changed:
            self._save(data)


secure_storage = SecureStorage()
