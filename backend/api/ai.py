import logging
import os
import sqlite3
from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from database import get_connection
from services import ai
from services.firebase import get_current_firebase_uid


router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger("heartquest.ai")


class RecommendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    current_mood: int | None = Field(default=None, ge=1, le=5)


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    recovery_id: int = Field(gt=0)


@contextmanager
def _connection(request: Request):
    try:
        with get_connection(request.app.state.database_path) as connection:
            yield connection
    except (sqlite3.Error, OSError):
        logger.warning("AI database operation failed")
        raise HTTPException(503, "回復履歴の取得・保存に失敗しました。もう一度お試しください。") from None


def _user_id(connection, firebase_uid: str) -> int:
    row = connection.execute(
        "SELECT id FROM users WHERE firebase_uid = ?", (firebase_uid,),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "User not found")
    return row["id"]


def _excluded_values(request: Request, firebase_uid: str) -> tuple[str, ...]:
    # Used only locally by the redactor. Never part of the model input.
    authorization = request.headers.get("Authorization", "")
    token = authorization.partition(" ")[2]
    return (firebase_uid, token, os.getenv("OPENAI_API_KEY", "").strip())


def _history(connection, user_id: int, excluded_values, target=None):
    columns = ", ".join(ai.RECOVERY_FIELDS)
    target_filter = ""
    parameters = [user_id]
    if target is not None:
        target_filter = "AND (created_at < ? OR (created_at = ? AND id < ?))"
        parameters.extend((target["created_at"], target["created_at"], target["id"]))
    rows = connection.execute(
        f"""SELECT {columns} FROM recoveries WHERE user_id = ? {target_filter}
        ORDER BY created_at DESC, id DESC LIMIT ?""",
        (*parameters, ai.HISTORY_LIMIT),
    ).fetchall()
    return [ai.recovery_input(row, excluded_values) for row in rows]


@router.post("/recommend", response_model=ai.Recommendations)
def recommend(
    payload: RecommendRequest,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    excluded_values = _excluded_values(request, firebase_uid)
    with _connection(request) as connection:
        user_id = _user_id(connection, firebase_uid)
        history = _history(connection, user_id, excluded_values)
    return ai.recommend(ai.RecommendationInput(
        current_mood=payload.current_mood, history=history,
    ))


@router.post("/analyze", response_model=ai.Analysis)
def analyze(
    payload: AnalyzeRequest,
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    excluded_values = _excluded_values(request, firebase_uid)
    with _connection(request) as connection:
        user_id = _user_id(connection, firebase_uid)
        target = connection.execute(
            "SELECT * FROM recoveries WHERE id = ? AND user_id = ?",
            (payload.recovery_id, user_id),
        ).fetchone()
        if target is None:
            raise HTTPException(404, "Recovery not found")
        if target["rating"] is None:
            raise HTTPException(422, "回復効果を1〜10で評価してから分析してください。")
        history = _history(connection, user_id, excluded_values, target)
    result = ai.analyze(ai.AnalysisInput(
        recovery=ai.recovery_input(target, excluded_values), history=history,
    ))
    # Release the SQLite connection during the network request. Only persist if
    # the owner and analyzed input still match (including NULL values).
    unchanged = " AND ".join(f"{field} IS ?" for field in ai.RECOVERY_FIELDS)
    with _connection(request) as connection:
        cursor = connection.execute(
            f"""UPDATE recoveries
            SET ai_score = ?, ai_comment = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ? AND {unchanged}""",
            (result.score, result.summary, payload.recovery_id, user_id,
             *(target[field] for field in ai.RECOVERY_FIELDS)),
        )
        if cursor.rowcount != 1:
            raise HTTPException(409, "分析中に記録が変更または削除されました。履歴を確認してください。")
    return result
