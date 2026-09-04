import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from main import create_app


class AnalyticsApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"
        init_database(self.database_path)

        with get_connection(self.database_path) as connection:
            self.user_id = connection.execute(
                "INSERT INTO users (firebase_uid, display_name) VALUES (?, ?)",
                ("firebase-user-1", "Test User"),
            ).lastrowid
            self.other_user_id = connection.execute(
                "INSERT INTO users (firebase_uid, display_name) VALUES (?, ?)",
                ("firebase-user-2", "Other User"),
            ).lastrowid

        self.verify_patcher = patch(
            "services.firebase.verify_firebase_id_token",
            return_value="firebase-user-1",
        )
        self.verify_patcher.start()
        self.month_patcher = patch(
            "api.analytics._current_month_start",
            return_value=date(2026, 9, 1),
        )
        self.month_patcher.start()

        self.client_context = TestClient(create_app(self.database_path))
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.month_patcher.stop()
        self.verify_patcher.stop()
        self.temp_directory.cleanup()

    @staticmethod
    def auth_headers() -> dict[str, str]:
        return {"Authorization": "Bearer valid-token"}

    def insert_recovery(
        self,
        *,
        user_id: int,
        activity: str,
        category: str | None,
        created_at: str,
        rating: int | None = None,
        ai_score: float | None = None,
    ) -> None:
        with get_connection(self.database_path) as connection:
            connection.execute(
                """
                INSERT INTO recoveries (
                    user_id, activity, category, rating, ai_score, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, activity, category, rating, ai_score, created_at),
            )

    def test_all_endpoints_require_authentication(self) -> None:
        for path in (
            "/analytics/monthly",
            "/analytics/ranking",
            "/analytics/breakdown",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)

    def test_empty_history_returns_six_zero_months_and_empty_lists(self) -> None:
        monthly = self.client.get(
            "/analytics/monthly", headers=self.auth_headers()
        )
        ranking = self.client.get(
            "/analytics/ranking", headers=self.auth_headers()
        )
        breakdown = self.client.get(
            "/analytics/breakdown", headers=self.auth_headers()
        )

        self.assertEqual(monthly.status_code, 200)
        self.assertEqual(
            monthly.json(),
            [
                {"month": month, "score": 0.0, "count": 0}
                for month in (
                    "2026-04",
                    "2026-05",
                    "2026-06",
                    "2026-07",
                    "2026-08",
                    "2026-09",
                )
            ],
        )
        self.assertEqual(ranking.json(), [])
        self.assertEqual(breakdown.json(), [])

    def test_monthly_uses_utc_months_score_priority_and_user_scope(self) -> None:
        self.insert_recovery(
            user_id=self.user_id,
            activity="散歩",
            category="からだ",
            rating=6,
            ai_score=8.5,
            created_at="2026-08-10T12:00:00Z",
        )
        self.insert_recovery(
            user_id=self.user_id,
            activity="ストレッチ",
            category="からだ",
            rating=7,
            created_at="2026-08-20T12:00:00Z",
        )
        self.insert_recovery(
            user_id=self.user_id,
            activity="未評価",
            category="その他",
            created_at="2026-08-25T12:00:00Z",
        )
        self.insert_recovery(
            user_id=self.user_id,
            activity="入浴",
            category="休息",
            rating=9,
            created_at="2026-08-31T23:30:00-01:00",
        )
        self.insert_recovery(
            user_id=self.other_user_id,
            activity="ゲーム",
            category="娯楽",
            rating=10,
            created_at="2026-09-02T12:00:00Z",
        )

        response = self.client.get(
            "/analytics/monthly", headers=self.auth_headers()
        )

        self.assertEqual(response.status_code, 200)
        months = {item["month"]: item for item in response.json()}
        self.assertEqual(
            months["2026-08"],
            {"month": "2026-08", "score": 7.8, "count": 3},
        )
        self.assertEqual(
            months["2026-09"],
            {"month": "2026-09", "score": 9.0, "count": 1},
        )
        self.assertEqual(
            months["2026-07"],
            {"month": "2026-07", "score": 0.0, "count": 0},
        )

    def test_ranking_excludes_unscored_and_uses_required_order(self) -> None:
        rows = (
            ("散歩", "からだ", 8, None),
            ("散歩", "からだ", 6, 8.0),
            ("入浴", "休息", 8, None),
            ("音楽", "こころ", 7, None),
            ("未評価", "その他", None, None),
        )
        for index, (activity, category, rating, ai_score) in enumerate(rows, 1):
            self.insert_recovery(
                user_id=self.user_id,
                activity=activity,
                category=category,
                rating=rating,
                ai_score=ai_score,
                created_at=f"2026-09-{index:02d}T12:00:00Z",
            )
        self.insert_recovery(
            user_id=self.other_user_id,
            activity="他ユーザー",
            category="その他",
            rating=10,
            created_at="2026-09-10T12:00:00Z",
        )

        response = self.client.get(
            "/analytics/ranking", headers=self.auth_headers()
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {"activity": "散歩", "score": 8.0, "count": 2},
                {"activity": "入浴", "score": 8.0, "count": 1},
                {"activity": "音楽", "score": 7.0, "count": 1},
            ],
        )

    def test_breakdown_groups_evaluated_records_by_category(self) -> None:
        rows = (
            ("散歩", "からだ", 8),
            ("ストレッチ", "からだ", 7),
            ("入浴", "休息", 9),
            ("未評価", "その他", None),
        )
        for index, (activity, category, rating) in enumerate(rows, 1):
            self.insert_recovery(
                user_id=self.user_id,
                activity=activity,
                category=category,
                rating=rating,
                created_at=f"2026-09-{index:02d}T12:00:00Z",
            )
        self.insert_recovery(
            user_id=self.other_user_id,
            activity="ゲーム",
            category="娯楽",
            rating=10,
            created_at="2026-09-10T12:00:00Z",
        )

        response = self.client.get(
            "/analytics/breakdown", headers=self.auth_headers()
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {"category": "からだ", "percentage": 66.7, "count": 2},
                {"category": "休息", "percentage": 33.3, "count": 1},
            ],
        )


if __name__ == "__main__":
    unittest.main()
