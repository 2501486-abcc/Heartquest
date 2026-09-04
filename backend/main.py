import logging
import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.analytics import router as analytics_router
from api.recoveries import router as recoveries_router
from api.users import router as users_router
from database import get_connection, init_database, resolve_database_path


logger = logging.getLogger("heartquest")


def _cors_origins() -> list[str]:
    configured = os.getenv(
        "HEARTQUEST_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def create_app(database_path: str | Path | None = None) -> FastAPI:
    resolved_database_path = resolve_database_path(database_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("HeartQuest API startup started")
        try:
            init_database(resolved_database_path)
        except Exception as exc:
            logger.error(
                "Database initialization failed (%s)",
                type(exc).__name__,
            )
            raise
        app.state.database_path = resolved_database_path
        logger.info("HeartQuest database initialized")
        yield

    application = FastAPI(title="HeartQuest API", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(users_router)
    application.include_router(recoveries_router)
    application.include_router(analytics_router)

    @application.get("/health", tags=["health"])
    def health_check():
        try:
            with get_connection(application.state.database_path) as connection:
                connection.execute("SELECT 1").fetchone()
        except (sqlite3.Error, OSError) as exc:
            logger.error(
                "SQLite health check failed (%s)",
                type(exc).__name__,
            )
            return JSONResponse(
                status_code=503,
                content={"status": "error", "database": "unavailable"},
            )
        return {"status": "ok", "database": "ok"}

    return application


app = create_app()
