import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from main import create_app


class BookmarksApiTests(unittest.TestCase):
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

        self.verify_patcher = patch(
            "services.firebase.verify_firebase_id_token",
            return_value="firebase-user-1",
        )
        self.verify_mock = self.verify_patcher.start()

        self.client_context = TestClient(create_app(self.database_path))
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.verify_patcher.stop()
        self.temp_directory.cleanup()

    @staticmethod
    def auth_headers() -> dict[str, str]:
        return {"Authorization": "Bearer valid-token"}

    def bookmark_count(self) -> int:
        with get_connection(self.database_path) as connection:
            return connection.execute(
                "SELECT COUNT(*) FROM bookmarks"
            ).fetchone()[0]

    def test_create_then_list_bookmark(self) -> None:
        response = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={
                "title": "  緑のある道を散歩  ",
                "description": "外の空気を吸いながら歩く",
                "category": "運動",
                "source": "classic",
            },
        )

        self.assertEqual(response.status_code, 201)
        created = response.json()
        self.assertEqual(created["user_id"], self.user_id)
        self.assertEqual(created["title"], "緑のある道を散歩")

        list_response = self.client.get(
            "/bookmarks",
            headers=self.auth_headers(),
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json(), [created])

    def test_list_returns_only_current_users_bookmarks_newest_first(self) -> None:
        first = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={"title": "散歩"},
        ).json()
        second = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={"title": "音楽"},
        ).json()

        with get_connection(self.database_path) as connection:
            other_user_id = connection.execute(
                """
                INSERT INTO users (firebase_uid, display_name)
                VALUES (?, ?)
                """,
                ("firebase-user-2", "Other User"),
            ).lastrowid
            connection.execute(
                "INSERT INTO bookmarks (user_id, title) VALUES (?, ?)",
                (other_user_id, "他ユーザーの保存"),
            )

        response = self.client.get(
            "/bookmarks",
            headers=self.auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [second, first])

    def test_duplicate_bookmarks_are_allowed(self) -> None:
        payload = {"title": "散歩", "description": "10分歩く"}

        first = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json=payload,
        )
        second = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json=payload,
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertNotEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(self.bookmark_count(), 2)

    def test_invalid_text_returns_422_and_is_not_saved(self) -> None:
        cases = (
            {"title": "   "},
            {"title": "a" * 201},
            {"title": "散歩", "description": "a" * 1_001},
            {"title": "散歩", "category": "その他"},
            {"title": "散歩", "category": "a" * 101},
            {"title": "散歩", "source": "a" * 101},
        )

        for payload in cases:
            with self.subTest(payload=payload):
                response = self.client.post(
                    "/bookmarks",
                    headers=self.auth_headers(),
                    json=payload,
                )
                self.assertEqual(response.status_code, 422)

        self.assertEqual(self.bookmark_count(), 0)

    def test_client_cannot_supply_user_id(self) -> None:
        response = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={"title": "散歩", "user_id": 999},
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.bookmark_count(), 0)

    def test_delete_own_bookmark_returns_204(self) -> None:
        created = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={"title": "散歩"},
        ).json()

        response = self.client.delete(
            f"/bookmarks/{created['id']}",
            headers=self.auth_headers(),
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertEqual(self.bookmark_count(), 0)

    def test_delete_unknown_or_another_users_bookmark_returns_404(self) -> None:
        with get_connection(self.database_path) as connection:
            other_user_id = connection.execute(
                """
                INSERT INTO users (firebase_uid, display_name)
                VALUES (?, ?)
                """,
                ("firebase-user-2", "Other User"),
            ).lastrowid
            other_bookmark_id = connection.execute(
                "INSERT INTO bookmarks (user_id, title) VALUES (?, ?)",
                (other_user_id, "他ユーザーの保存"),
            ).lastrowid

        for bookmark_id in (99_999, other_bookmark_id):
            with self.subTest(bookmark_id=bookmark_id):
                response = self.client.delete(
                    f"/bookmarks/{bookmark_id}",
                    headers=self.auth_headers(),
                )
                self.assertEqual(response.status_code, 404)
                self.assertEqual(
                    response.json(),
                    {"detail": "Bookmark not found"},
                )

        self.assertEqual(self.bookmark_count(), 1)

    def test_unregistered_firebase_user_returns_404(self) -> None:
        self.verify_mock.return_value = "unregistered-user"

        create_response = self.client.post(
            "/bookmarks",
            headers=self.auth_headers(),
            json={"title": "散歩"},
        )
        list_response = self.client.get(
            "/bookmarks",
            headers=self.auth_headers(),
        )
        delete_response = self.client.delete(
            "/bookmarks/1",
            headers=self.auth_headers(),
        )

        self.assertEqual(create_response.status_code, 404)
        self.assertEqual(list_response.status_code, 404)
        self.assertEqual(delete_response.status_code, 404)
        self.assertEqual(self.bookmark_count(), 0)

    def test_without_authentication_returns_401(self) -> None:
        create_response = self.client.post(
            "/bookmarks",
            json={"title": "散歩"},
        )
        list_response = self.client.get("/bookmarks")
        delete_response = self.client.delete("/bookmarks/1")

        self.assertEqual(create_response.status_code, 401)
        self.assertEqual(list_response.status_code, 401)
        self.assertEqual(delete_response.status_code, 401)
        self.assertEqual(self.bookmark_count(), 0)


if __name__ == "__main__":
    unittest.main()
