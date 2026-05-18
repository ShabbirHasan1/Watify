"""WhatsApp connection endpoints under /api/wa."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.whatsapp import WaSingleton

router = APIRouter(prefix="/api/wa", tags=["whatsapp"])


class WaState(BaseModel):
    state: str
    qr_data_url: str | None = None
    owner_phone: str | None = None
    last_error: str | None = None
    last_event_at: str | None = None


def _snapshot_to_dto() -> WaState:
    snap = WaSingleton.snapshot()
    return WaState(
        state=snap.state,
        qr_data_url=snap.qr_data_url,
        owner_phone=snap.owner_phone,
        last_error=snap.last_error,
        last_event_at=snap.last_event_at,
    )


@router.get("/state", response_model=WaState)
def get_state() -> WaState:
    return _snapshot_to_dto()


@router.post("/connect", response_model=WaState)
def connect() -> WaState:
    WaSingleton.connect()
    return _snapshot_to_dto()


@router.post("/disconnect", response_model=WaState)
def disconnect() -> WaState:
    WaSingleton.disconnect()
    return _snapshot_to_dto()
