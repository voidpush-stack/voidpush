from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health() -> dict:
    return {"ok": True, "service": "voidpush-score-engine", "version": "0.1.0"}
