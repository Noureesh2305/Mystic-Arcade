from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gesture", tags=["gesture"])


class GestureEvent(BaseModel):
    gesture: str
    confidence: float = 0.0


@router.get("/status")
async def status() -> dict:
    return {
        "available": True,
        "mode": "stub",
        "message": "Ready for MediaPipe Hands or OpenCV integration.",
    }


@router.post("/event")
async def event(payload: GestureEvent) -> dict:
    return {
        "accepted": payload.confidence >= 0.5,
        "gesture": payload.gesture,
        "effect": "portal-pulse" if payload.gesture in {"raise", "circle", "swipe"} else "spark",
    }
