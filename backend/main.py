from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from api.recoveries import router as recoveries_router
from api.users import router as users_router
from database import DEFAULT_DATABASE_PATH, init_database


def create_app(database_path: str | Path = DEFAULT_DATABASE_PATH) -> FastAPI:
    database_path = Path(database_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_database(database_path)
        app.state.database_path = database_path
        yield

    application = FastAPI(title="HeartQuest API", lifespan=lifespan)
    application.include_router(users_router)
    application.include_router(recoveries_router)
    return application


app = create_app()
