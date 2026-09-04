from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, StringConstraints

from database import get_connection
from services.firebase import get_current_firebase_uid


router = APIRouter(prefix="/users", tags=["users"])
DisplayName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=30),
]


class UserCreate(BaseModel):
    display_name: DisplayName


class UserUpdate(BaseModel):
    display_name: DisplayName


class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    display_name: str
    created_at: datetime
    updated_at: datetime


def _database_path(request: Request):
    return request.app.state.database_path


def _find_user(database_path, firebase_uid: str):
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE firebase_uid = ?",
            (firebase_uid,),
        ).fetchone()
    return row


@router.post("/me", response_model=UserResponse)
def create_or_get_current_user(
    payload: UserCreate,
    request: Request,
    response: Response,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)

    with get_connection(database_path) as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (firebase_uid, display_name)
            VALUES (?, ?)
            ON CONFLICT(firebase_uid) DO NOTHING
            """,
            (firebase_uid, payload.display_name),
        )
        row = connection.execute(
            "SELECT * FROM users WHERE firebase_uid = ?",
            (firebase_uid,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or load user",
        )

    if cursor.rowcount == 1:
        response.status_code = status.HTTP_201_CREATED

    return dict(row)


@router.get("/me", response_model=UserResponse)
def get_current_user(
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    row = _find_user(_database_path(request), firebase_uid)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return dict(row)


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    payload: UserUpdate,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)

    with get_connection(database_path) as connection:
        existing = connection.execute(
            "SELECT 1 FROM users WHERE firebase_uid = ?",
            (firebase_uid,),
        ).fetchone()
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        connection.execute(
            """
            UPDATE users
            SET display_name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE firebase_uid = ?
            """,
            (payload.display_name, firebase_uid),
        )
        row = connection.execute(
            "SELECT * FROM users WHERE firebase_uid = ?",
            (firebase_uid,),
        ).fetchone()

    return dict(row)
