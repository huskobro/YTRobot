from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.core.encryption import secure_storage

router = APIRouter(prefix="/api/secure", tags=["security"])


class StoreRequest(BaseModel):
    key: str
    value: str


@router.get("/keys")
async def list_stored_keys():
    return {"keys": secure_storage.list_keys()}


@router.post("/store")
async def store_value(req: StoreRequest):
    secure_storage.store(req.key, req.value)
    return {"status": "stored", "key": req.key}


@router.get("/retrieve/{key}")
async def retrieve_value(key: str):
    value = secure_storage.retrieve(key)
    if not value:
        raise HTTPException(404, "Key not found")
    masked = value[:2] + "****" + value[-2:] if len(value) > 4 else "****"
    return {"key": key, "masked_value": masked, "length": len(value)}


@router.delete("/{key}")
async def delete_value(key: str):
    secure_storage.delete(key)
    return {"status": "deleted"}
