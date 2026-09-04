from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from database import get_connection
from services.firebase import get_current_firebase_uid


router = APIRouter(prefix="/analytics", tags=["analytics"])


class MonthlyAnalyticsPoint(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    score: float
    count: int = Field(ge=0)


class RankingAnalyticsItem(BaseModel):
    activity: str
    score: float
    count: int = Field(ge=1)


class BreakdownAnalyticsItem(BaseModel):
    category: str
    percentage: float = Field(ge=0, le=100)
    count: int = Field(ge=1)


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


def _current_month_start() -> date:
    return datetime.now(timezone.utc).date().replace(day=1)


@router.get("/monthly", response_model=list[MonthlyAnalyticsPoint])
def get_monthly_analytics(
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)
    current_month = _current_month_start().isoformat()

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            WITH RECURSIVE months(month_start) AS (
                SELECT date(?, '-5 months')
                UNION ALL
                SELECT date(month_start, '+1 month')
                FROM months
                WHERE month_start < date(?)
            )
            SELECT
                strftime('%Y-%m', months.month_start) AS month,
                COALESCE(
                    ROUND(AVG(COALESCE(recoveries.ai_score, recoveries.rating)), 1),
                    0.0
                ) AS score,
                COUNT(recoveries.id) AS count
            FROM months
            LEFT JOIN recoveries
                ON recoveries.user_id = ?
                AND datetime(recoveries.created_at) >= datetime(months.month_start)
                AND datetime(recoveries.created_at) < datetime(months.month_start, '+1 month')
            GROUP BY months.month_start
            ORDER BY months.month_start
            """,
            (current_month, current_month, user_id),
        ).fetchall()

    return [dict(row) for row in rows]


@router.get("/ranking", response_model=list[RankingAnalyticsItem])
def get_ranking_analytics(
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT
                activity,
                ROUND(AVG(COALESCE(ai_score, rating)), 1) AS score,
                COUNT(*) AS count
            FROM recoveries
            WHERE user_id = ?
                AND COALESCE(ai_score, rating) IS NOT NULL
            GROUP BY activity
            ORDER BY score DESC, count DESC, activity ASC
            """,
            (user_id,),
        ).fetchall()

    return [dict(row) for row in rows]


@router.get("/breakdown", response_model=list[BreakdownAnalyticsItem])
def get_breakdown_analytics(
    request: Request,
    firebase_uid: str = Depends(get_current_firebase_uid),
):
    database_path = _database_path(request)
    user_id = _current_user_id(database_path, firebase_uid)

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            WITH category_counts AS (
                SELECT
                    COALESCE(NULLIF(TRIM(category), ''), '未分類') AS category,
                    COUNT(*) AS count
                FROM recoveries
                WHERE user_id = ?
                    AND COALESCE(ai_score, rating) IS NOT NULL
                GROUP BY COALESCE(NULLIF(TRIM(category), ''), '未分類')
            )
            SELECT
                category,
                ROUND(count * 100.0 / SUM(count) OVER (), 1) AS percentage,
                count
            FROM category_counts
            ORDER BY count DESC, category ASC
            """,
            (user_id,),
        ).fetchall()

    return [dict(row) for row in rows]
