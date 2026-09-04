from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from database import get_connection
from services.firebase import get_current_firebase_uid


router = APIRouter(prefix="/recoveries", tags=["recoveries"])
ActivityText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]
CategoryText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]
BeforeStateText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=1_000),
]
MemoText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=2_000),
]
AfterCommentText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=2_000),
]
SourceText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=100),
]


class RecoveryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    activity: ActivityText
    category: CategoryText
    before_mood: int | None = Field(default=None, ge=1, le=10)
    before_state: BeforeStateText | None = None
    memo: MemoText | None = None
    after_mood: int | None = Field(default=None, ge=1, le=10)
    after_comment: AfterCommentText | None = None
    rating: int | None = Field(default=None, ge=1, le=10)
    source: SourceText | None = None


class RecoveryResponse(RecoveryCreate):
    id: int
    user_id: int
    ai_score: float | None
    ai_comment: str | None
    created_at: datetime
    updated_at: datetime


class RecoveryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    after_mood: int | None = Field(default=None, ge=1, le=10)
    after_comment: AfterCommentText | None = None
    rating: int | None = Field(default=None, ge=1, le=10)


def _database_path(request: Request):
    return request.app.state.database_path


def _current_user_id(database_path, firebase_uid: str) -> int:
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT id FROM users WHERE firebase_uid = ?",
            (firebase_uid,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return row["id"]


@router.post("", response_model=RecoveryResponse, status_code=status.HTTP_201_CREATED)
def create_recovery(
    payload: RecoveryCreate,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)
    recovery_data = payload.model_dump()

    columns = ", ".join(("user_id", *recovery_data.keys()))
    placeholders = ", ".join("?" for _ in range(len(recovery_data) + 1))

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            f"INSERT INTO recoveries ({columns}) VALUES ({placeholders})",
            (user_id, *recovery_data.values()),
        )
        row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


@router.get("/{recovery_id}", response_model=RecoveryResponse)
def get_recovery(
    recovery_id: Annotated[int, Field(gt=0)],
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ? AND user_id = ?",
            (recovery_id, user_id),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery not found",
        )

    return dict(row)


@router.patch("/{recovery_id}", response_model=RecoveryResponse)
def update_recovery(
    recovery_id: Annotated[int, Field(gt=0)],
    payload: RecoveryUpdate,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)
    recovery_data = payload.model_dump(exclude_unset=True)

    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ? AND user_id = ?",
            (recovery_id, user_id),
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
                WHERE id = ? AND user_id = ?
                """,
                (*recovery_data.values(), recovery_id, user_id),
            )

        updated_row = connection.execute(
            "SELECT * FROM recoveries WHERE id = ? AND user_id = ?",
            (recovery_id, user_id),
        ).fetchone()

    return dict(updated_row)


@router.get("", response_model=list[RecoveryResponse])
def list_recoveries(
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM recoveries
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset),
        ).fetchall()

    return [dict(row) for row in rows]


@router.delete("/{recovery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recovery(
    recovery_id: Annotated[int, Field(gt=0)],
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
) -> Response:
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            "DELETE FROM recoveries WHERE id = ? AND user_id = ?",
            (recovery_id, user_id),
        )

    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
