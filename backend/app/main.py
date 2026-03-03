from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.api import nutrition, coach


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path("./data").mkdir(exist_ok=True)
    await init_db()
    yield
    # shutdown if needed


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost",
            "http://127.0.0.1",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
    app.include_router(coach.router, prefix="/api/coach", tags=["coach"])
    return app


app = create_app()
