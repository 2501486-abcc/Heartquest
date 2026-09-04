import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, status
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from main import create_app


class UsersApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"
        init_database(self.database_path)
        self.client_context = TestClient(create_app(self.database_path))
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.temp_directory.cleanup()

    @staticmethod
    def auth_headers(token: str = "valid-token") -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def user_count(self) -> int:
        with get_connection(self.database_path) as connection:
            row = connection.execute(
                "SELECT COUNT(*) AS count FROM users"
            ).fetchone()
        return row["count"]

    @patch("services.firebase.verify_firebase_id_token", return_value="firebase-user-1")
    def test_post_me_creates_user_only_after_authentication(self, _verify) -> None:
        response = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "  Test User  "},
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["firebase_uid"], "firebase-user-1")
        self.assertEqual(body["display_name"], "Test User")
        self.assertEqual(self.user_count(), 1)

    @patch("services.firebase.verify_firebase_id_token", return_value="firebase-user-1")
    def test_post_me_returns_existing_user_without_changing_display_name(self, _verify) -> None:
        first = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "First Name"},
        )
        second = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "Different Name"},
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()["display_name"], "First Name")
        self.assertEqual(self.user_count(), 1)

    @patch("services.firebase.verify_firebase_id_token", return_value="firebase-user-1")
    def test_get_me_returns_existing_user(self, _verify) -> None:
        self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "Test User"},
        )

        response = self.client.get("/users/me", headers=self.auth_headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["firebase_uid"], "firebase-user-1")

    @patch("services.firebase.verify_firebase_id_token", return_value="unregistered-user")
    def test_get_me_returns_404_for_unregistered_user(self, _verify) -> None:
        response = self.client.get("/users/me", headers=self.auth_headers())

        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.user_count(), 0)

    @patch("services.firebase.verify_firebase_id_token", return_value="firebase-user-1")
    def test_patch_me_updates_display_name(self, _verify) -> None:
        self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "Old Name"},
        )

        response = self.client.patch(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "  New Name  "},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["display_name"], "New Name")

    @patch("services.firebase.verify_firebase_id_token", return_value="unregistered-user")
    def test_patch_me_returns_404_for_unregistered_user(self, _verify) -> None:
        response = self.client.patch(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "New Name"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.user_count(), 0)

    @patch("services.firebase.verify_firebase_id_token", return_value="new-firebase-user")
    def test_signup_flow_creates_sqlite_user_before_loading_history(self, _verify) -> None:
        create_response = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "New User"},
        )
        get_response = self.client.get(
            "/users/me",
            headers=self.auth_headers(),
        )
        history_response = self.client.get(
            "/recoveries",
            headers=self.auth_headers(),
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["firebase_uid"], "new-firebase-user")
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(history_response.json(), [])
        self.assertEqual(self.user_count(), 1)

    def test_post_me_without_authentication_returns_401_and_creates_nothing(self) -> None:
        response = self.client.post(
            "/users/me",
            json={"display_name": "Test User"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.user_count(), 0)

    @patch(
        "services.firebase.verify_firebase_id_token",
        side_effect=HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        ),
    )
    def test_post_me_with_invalid_token_creates_nothing(self, _verify) -> None:
        response = self.client.post(
            "/users/me",
            headers=self.auth_headers("invalid-token"),
            json={"display_name": "Test User"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.user_count(), 0)

    @patch("services.firebase.verify_firebase_id_token", return_value="firebase-user-1")
    def test_display_name_is_required_and_limited_to_30_characters(self, _verify) -> None:
        empty = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "   "},
        )
        too_long = self.client.post(
            "/users/me",
            headers=self.auth_headers(),
            json={"display_name": "a" * 31},
        )

        self.assertEqual(empty.status_code, 422)
        self.assertEqual(too_long.status_code, 422)
        self.assertEqual(self.user_count(), 0)


if __name__ == "__main__":
    unittest.main()
