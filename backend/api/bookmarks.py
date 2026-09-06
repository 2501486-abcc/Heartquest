from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from categories import RECOVERY_CATEGORIES
from database import get_connection
from services.firebase import get_current_firebase_uid


router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])
TitleText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]
DescriptionText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=1_000),
]
CategoryText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=100),
]
SourceText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=100),
]


class BookmarkCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: TitleText
    description: DescriptionText | None = None
    category: CategoryText | None = None
    source: SourceText | None = None


class BookmarkResponse(BookmarkCreate):
    id: int
    user_id: int
    created_at: datetime


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


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    payload: BookmarkCreate,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    if payload.category is not None and payload.category not in RECOVERY_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unsupported recovery category",
        )
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)
    bookmark_data = payload.model_dump()

    columns = ", ".join(("user_id", *bookmark_data.keys()))
    placeholders = ", ".join("?" for _ in range(len(bookmark_data) + 1))

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            f"INSERT INTO bookmarks ({columns}) VALUES ({placeholders})",
            (user_id, *bookmark_data.values()),
        )
        row = connection.execute(
            "SELECT * FROM bookmarks WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


@router.get("", response_model=list[BookmarkResponse])
def list_bookmarks(
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM bookmarks
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,),
        ).fetchall()

    return [dict(row) for row in rows]


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: Annotated[int, Field(gt=0)],
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
) -> Response:
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            "DELETE FROM bookmarks WHERE id = ? AND user_id = ?",
            (bookmark_id, user_id),
        )

    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
