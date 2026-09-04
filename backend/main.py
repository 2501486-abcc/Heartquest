import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.recoveries import router as recoveries_router
from api.users import router as users_router
from database import DEFAULT_DATABASE_PATH, init_database


def _cors_origins() -> list[str]:
    configured = os.getenv(
        "HEARTQUEST_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def create_app(database_path: str | Path = DEFAULT_DATABASE_PATH) -> FastAPI:
    database_path = Path(database_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_database(database_path)
        app.state.database_path = database_path
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
    return application


app = create_app()
