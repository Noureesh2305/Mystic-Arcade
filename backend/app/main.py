from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routes.experience import router as experience_router
from .routes.gesture import router as gesture_router


BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"
ASSETS_DIR = BASE_DIR / "assets"

app = FastAPI(
    title="Mystic Arcade",
    description="A lightweight cinematic browser arcade of magical mini-games.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experience_router, prefix="/api")
app.include_router(gesture_router, prefix="/api")

app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/", include_in_schema=False)
async def root() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")
