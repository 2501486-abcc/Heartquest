from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field, StringConstraints

from database import get_connection


router = APIRouter(prefix="/recoveries", tags=["recoveries"])
RequiredText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class RecoveryCreate(BaseModel):
    user_id: int = Field(gt=0)
    activity: RequiredText
    category: RequiredText
    before_mood: int | None = Field(default=None, ge=1, le=10)
    before_state: str | None = None
    memo: str | None = None
    after_mood: int | None = Field(default=None, ge=1, le=10)
    after_comment: str | None = None
    rating: int | None = Field(default=None, ge=1, le=10)
    ai_score: float | None = None
    ai_comment: str | None = None
    source: str | None = None


class RecoveryResponse(RecoveryCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class RecoveryUpdate(BaseModel):
    after_mood: int | None = Field(default=None, ge=1, le=10)
    after_comment: str | None = None
    rating: int | None = Field(default=None, ge=1, le=10)


def _database_path(request: Request):
    return request.app.state.database_path


def _user_exists(database_path, user_id: int) -> bool:
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT 1 FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return row is not None


@router.post("", response_model=RecoveryResponse, status_code=status.HTTP_201_CREATED)
def create_recovery(payload: RecoveryCreate, request: Request):
    database_path = _database_path(request)
    if not _user_exists(database_path, payload.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    recovery_data = payload.model_dump()
    columns = ", ".join(recovery_data)
    placeholders = ", ".join("?" for _ in recovery_data)

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            f"INSERT INTO recoveries ({columns}) VALUES ({placeholders})",
            tuple(recovery_data.values()),
        )
        row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


@router.patch("/{recovery_id}", response_model=RecoveryResponse)
def update_recovery(
    recovery_id: Annotated[int, Field(gt=0)],
    payload: RecoveryUpdate,
    request: Request,
):
    database_path = _database_path(request)
    recovery_data = payload.model_dump(exclude_unset=True)

    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ?",
            (recovery_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recovery not found",
            )

        if recovery_data:
            assignments = ", ".join(f"{column} = ?" for column in recovery_data)
            connection.execute(
                f"""
                UPDATE recoveries
                SET {assignments}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (*recovery_data.values(), recovery_id),
            )

        updated_row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ?",
            (recovery_id,),
        ).fetchone()

    return dict(updated_row)


@router.get("", response_model=list[RecoveryResponse])
def list_recoveries(
    request: Request,
    user_id: Annotated[int, Query(gt=0)],
):
    database_path = _database_path(request)
    if not _user_exists(database_path, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM recoveries
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,),
        ).fetchall()

    return [dict(row) for row in rows]
