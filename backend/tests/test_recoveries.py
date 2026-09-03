import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from main import create_app


class RecoveriesApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"
        init_database(self.database_path)

        with get_connection(self.database_path) as connection:
            self.user_id = connection.execute(
                """
                INSERT INTO users (firebase_uid, display_name)
                VALUES (?, ?)
                """,
                ("firebase-user-1", "Test User"),
            ).lastrowid

        self.client_context = TestClient(create_app(self.database_path))
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.temp_directory.cleanup()

    def test_create_then_list_recovery(self) -> None:
        payload = {
            "user_id": self.user_id,
            "activity": "散歩",
            "category": "運動",
        }

        create_response = self.client.post("/recoveries", json=payload)

        self.assertEqual(create_response.status_code, 201)
        created = create_response.json()
        self.assertEqual(created["user_id"], self.user_id)
        self.assertEqual(created["activity"], "散歩")
        self.assertEqual(created["category"], "運動")
        self.assertIsNone(created["before_mood"])

        list_response = self.client.get(
            "/recoveries",
            params={"user_id": self.user_id},
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json(), [created])

    def test_list_returns_newest_record_first_and_preserves_categories(self) -> None:
        first = self.client.post(
            "/recoveries",
            json={
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
            },
        ).json()
        second = self.client.post(
            "/recoveries",
            json={
                "user_id": self.user_id,
                "activity": "音楽を聴く",
                "category": "音楽",
            },
        ).json()

        response = self.client.get(
            "/recoveries",
            params={"user_id": self.user_id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [second, first])

    def test_empty_history_returns_empty_list(self) -> None:
        response = self.client.get(
            "/recoveries",
            params={"user_id": self.user_id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_optional_fields_are_saved_and_returned(self) -> None:
        payload = {
            "user_id": self.user_id,
            "activity": "  入浴  ",
            "category": "  リラックス  ",
            "before_mood": 3,
            "before_state": "疲れている",
            "memo": "20分入浴した",
            "after_mood": 8,
            "after_comment": "落ち着いた",
            "rating": 9,
            "ai_score": 8.5,
            "ai_comment": "回復効果が高いです",
            "source": "manual",
        }

        response = self.client.post("/recoveries", json=payload)

        self.assertEqual(response.status_code, 201)
        created = response.json()
        self.assertEqual(created["activity"], "入浴")
        self.assertEqual(created["category"], "リラックス")
        for field in (
            "before_mood",
            "before_state",
            "memo",
            "after_mood",
            "after_comment",
            "rating",
            "ai_score",
            "ai_comment",
            "source",
        ):
            self.assertEqual(created[field], payload[field])

    def test_patch_adds_feedback_after_recovery(self) -> None:
        created = self.client.post(
            "/recoveries",
            json={
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
                "before_mood": 3,
                "before_state": "疲れている",
            },
        ).json()

        response = self.client.patch(
            f"/recoveries/{created['id']}",
            json={
                "after_mood": 8,
                "after_comment": "気分が軽くなった",
                "rating": 9,
            },
        )

        self.assertEqual(response.status_code, 200)
        updated = response.json()
        self.assertEqual(updated["after_mood"], 8)
        self.assertEqual(updated["after_comment"], "気分が軽くなった")
        self.assertEqual(updated["rating"], 9)
        self.assertEqual(updated["activity"], created["activity"])
        self.assertEqual(updated["before_mood"], created["before_mood"])

        list_response = self.client.get(
            "/recoveries",
            params={"user_id": self.user_id},
        )
        self.assertEqual(list_response.json(), [updated])

    def test_patch_only_changes_provided_fields(self) -> None:
        created = self.client.post(
            "/recoveries",
            json={
                "user_id": self.user_id,
                "activity": "入浴",
                "category": "リラックス",
                "after_mood": 6,
                "after_comment": "少し落ち着いた",
                "rating": 7,
            },
        ).json()

        response = self.client.patch(
            f"/recoveries/{created['id']}",
            json={"rating": 8},
        )

        self.assertEqual(response.status_code, 200)
        updated = response.json()
        self.assertEqual(updated["after_mood"], 6)
        self.assertEqual(updated["after_comment"], "少し落ち着いた")
        self.assertEqual(updated["rating"], 8)

    def test_patch_unknown_recovery_returns_404(self) -> None:
        response = self.client.patch(
            "/recoveries/99999",
            json={"rating": 8},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Recovery not found"})

    def test_patch_rejects_invalid_feedback(self) -> None:
        created = self.client.post(
            "/recoveries",
            json={
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
            },
        ).json()

        for payload in (
            {"after_mood": 0},
            {"after_mood": 11},
            {"rating": 0},
            {"rating": 11},
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(
                    f"/recoveries/{created['id']}",
                    json=payload,
                )
                self.assertEqual(response.status_code, 422)

    def test_unknown_user_returns_404(self) -> None:
        create_response = self.client.post(
            "/recoveries",
            json={"user_id": 99999, "activity": "散歩", "category": "運動"},
        )
        list_response = self.client.get(
            "/recoveries",
            params={"user_id": 99999},
        )

        self.assertEqual(create_response.status_code, 404)
        self.assertEqual(create_response.json(), {"detail": "User not found"})
        self.assertEqual(list_response.status_code, 404)

    def test_invalid_input_returns_422_and_is_not_saved(self) -> None:
        for payload in (
            {"user_id": self.user_id, "activity": "", "category": "運動"},
            {"user_id": self.user_id, "activity": "散歩", "category": "   "},
            {
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
                "before_mood": 11,
            },
            {
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
                "after_mood": 0,
            },
            {
                "user_id": self.user_id,
                "activity": "散歩",
                "category": "運動",
                "rating": 11,
            },
        ):
            with self.subTest(payload=payload):
                response = self.client.post("/recoveries", json=payload)
                self.assertEqual(response.status_code, 422)

        with get_connection(self.database_path) as connection:
            count = connection.execute(
                "SELECT COUNT(*) FROM recoveries"
            ).fetchone()[0]
        self.assertEqual(count, 0)


if __name__ == "__main__":
    unittest.main()
