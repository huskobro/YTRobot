import logging
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException

logger = logging.getLogger("UploadValidator")

MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}


def validate_image_upload(file: UploadFile, max_size: int = MAX_IMAGE_SIZE) -> None:
    """Validate an uploaded image file. Raises HTTPException on failure."""
    # Check content type
    if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz dosya tipi: {file.content_type}. İzin verilen: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # Check extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Geçersiz dosya uzantısı: {ext}. İzin verilen: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )

    # Note: size check happens after reading content in the route handler


def validate_file_size(content: bytes, max_size: int, filename: str = "") -> None:
    """Validate file size after reading content."""
    if len(content) > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Dosya çok büyük ({len(content) / (1024*1024):.1f} MB). Maksimum: {size_mb:.0f} MB"
        )


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal."""
    # Get just the filename (strips any directory components)
    name = Path(filename).name
    name = re.sub(r'[^\w\-.]', '_', name)  # Only allow word chars, hyphens, dots
    if not name or name.startswith('.'):
        name = 'upload' + name
    return name
