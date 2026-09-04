import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import create_app


class HealthApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"
        self.client_context = TestClient(create_app(self.database_path))
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.temp_directory.cleanup()

    def test_health_returns_200_without_authentication(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok"})

    def test_health_returns_503_without_database_details(self) -> None:
        with patch(
            "main.get_connection",
            side_effect=sqlite3.OperationalError("private database details"),
        ):
            response = self.client.get("/health")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"status": "error", "database": "unavailable"},
        )
        self.assertNotIn("private database details", response.text)

    def test_configured_frontend_origin_is_allowed(self) -> None:
        frontend_origin = "https://heartquest.yamaguchi-tech.com"
        with patch.dict(
            os.environ,
            {"HEARTQUEST_CORS_ORIGINS": frontend_origin},
        ):
            with TestClient(create_app(self.database_path)) as client:
                response = client.options(
                    "/health",
                    headers={
                        "Origin": frontend_origin,
                        "Access-Control-Request-Method": "GET",
                    },
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            frontend_origin,
        )


if __name__ == "__main__":
    unittest.main()
