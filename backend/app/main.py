from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import engine
from app.routers import api_router
from app.services.storage_service import StorageService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    StorageService().ensure_local_directory()
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ULTIMATE API",
        description="Plateforme de rencontres pour adultes",
        version="0.1.0",
        lifespan=lifespan,
    )

    cors_kwargs: dict = {
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    if settings.is_development:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            **cors_kwargs,
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_origin_regex=r"https://.*\.netlify\.app",
            **cors_kwargs,
        )

    app.include_router(api_router)

    if settings.storage_backend == "local":
        media_root = Path(settings.media_storage_path)
        media_root.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "ultimate-backend"}

    return app


app = create_app()
