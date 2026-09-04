import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from firebase_admin import auth


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import create_app
from services.firebase import verify_firebase_id_token


class FirebaseAuthenticationTests(unittest.TestCase):
    def assert_authentication_error(self, firebase_error: Exception) -> None:
        with (
            patch("services.firebase._get_firebase_app", return_value=object()),
            patch("services.firebase.auth.verify_id_token", side_effect=firebase_error),
            self.assertRaises(HTTPException) as raised,
        ):
            verify_firebase_id_token("secret-token-value")

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(
            raised.exception.headers,
            {"WWW-Authenticate": "Bearer"},
        )
        self.assertNotIn("secret-token-value", raised.exception.detail)
        self.assertNotIn(str(firebase_error), raised.exception.detail)

    def test_invalid_token_returns_401(self) -> None:
        self.assert_authentication_error(auth.InvalidIdTokenError("private detail"))

    def test_expired_token_returns_401(self) -> None:
        self.assert_authentication_error(
            auth.ExpiredIdTokenError("private detail", RuntimeError("private cause"))
        )

    def test_revoked_token_returns_401(self) -> None:
        self.assert_authentication_error(auth.RevokedIdTokenError("private detail"))

    def test_disabled_user_returns_401(self) -> None:
        self.assert_authentication_error(auth.UserDisabledError("private detail"))

    def test_token_verification_checks_revocation(self) -> None:
        firebase_app = object()
        with (
            patch("services.firebase._get_firebase_app", return_value=firebase_app),
            patch(
                "services.firebase.auth.verify_id_token",
                return_value={"uid": "firebase-user-1"},
            ) as verify,
        ):
            uid = verify_firebase_id_token("valid-token")

        self.assertEqual(uid, "firebase-user-1")
        verify.assert_called_once_with(
            "valid-token",
            app=firebase_app,
            check_revoked=True,
        )

    def test_missing_authorization_returns_401_with_bearer_challenge(self) -> None:
        with tempfile.TemporaryDirectory() as temp_directory:
            database_path = Path(temp_directory) / "heartquest.db"
            with TestClient(create_app(database_path)) as client:
                response = client.get("/users/me")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_invalid_token_response_keeps_bearer_challenge(self) -> None:
        with tempfile.TemporaryDirectory() as temp_directory:
            database_path = Path(temp_directory) / "heartquest.db"
            with (
                patch(
                    "services.firebase.auth.verify_id_token",
                    side_effect=auth.InvalidIdTokenError("private token detail"),
                ),
                patch("services.firebase._get_firebase_app", return_value=object()),
                TestClient(create_app(database_path)) as client,
            ):
                response = client.get(
                    "/users/me",
                    headers={"Authorization": "Bearer secret-token-value"},
                )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers["www-authenticate"], "Bearer")
        self.assertNotIn("secret-token-value", response.text)
        self.assertNotIn("private token detail", response.text)

    def test_certificate_fetch_failure_returns_safe_503(self) -> None:
        firebase_error = auth.CertificateFetchError(
            "private certificate URL",
            RuntimeError("private network detail"),
        )
        with (
            patch("services.firebase._get_firebase_app", return_value=object()),
            patch("services.firebase.auth.verify_id_token", side_effect=firebase_error),
            self.assertLogs("heartquest.auth", level="WARNING") as captured_logs,
            self.assertRaises(HTTPException) as raised,
        ):
            verify_firebase_id_token("secret-token-value")

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(
            raised.exception.detail,
            "Authentication service is temporarily unavailable",
        )
        exposed_text = raised.exception.detail + " ".join(captured_logs.output)
        self.assertNotIn("secret-token-value", exposed_text)
        self.assertNotIn("private certificate URL", exposed_text)
        self.assertNotIn("private network detail", exposed_text)

    def test_firebase_initialization_failure_returns_safe_503(self) -> None:
        with (
            patch("services.firebase.firebase_admin.get_app", side_effect=ValueError),
            patch(
                "services.firebase.firebase_admin.initialize_app",
                side_effect=RuntimeError("C:/private/service-account.json"),
            ),
            self.assertLogs("heartquest.auth", level="ERROR") as captured_logs,
            self.assertRaises(HTTPException) as raised,
        ):
            verify_firebase_id_token("secret-token-value")

        self.assertEqual(raised.exception.status_code, 503)
        exposed_text = raised.exception.detail + " ".join(captured_logs.output)
        self.assertNotIn("secret-token-value", exposed_text)
        self.assertNotIn("C:/private/service-account.json", exposed_text)


class CorsSecurityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def preflight(self, client: TestClient, origin: str):
        return client.options(
            "/users/me",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization, Content-Type",
            },
        )

    def test_default_localhost_origins_are_allowed(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with TestClient(create_app(self.database_path)) as client:
                for origin in (
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ):
                    with self.subTest(origin=origin):
                        response = self.preflight(client, origin)
                        self.assertEqual(response.status_code, 200)
                        self.assertEqual(
                            response.headers["access-control-allow-origin"],
                            origin,
                        )

    def test_configured_origins_trim_whitespace_and_ignore_empty_values(self) -> None:
        first_origin = "https://heartquest.yamaguchi-tech.com"
        second_origin = "https://preview.example.com"
        configured = f"  {first_origin}, ,{second_origin}  ,"
        with patch.dict(
            os.environ,
            {"HEARTQUEST_CORS_ORIGINS": configured},
        ):
            with TestClient(create_app(self.database_path)) as client:
                for origin in (first_origin, second_origin):
                    with self.subTest(origin=origin):
                        response = self.preflight(client, origin)
                        self.assertEqual(response.status_code, 200)
                        self.assertEqual(
                            response.headers["access-control-allow-origin"],
                            origin,
                        )

    def test_production_origin_is_exact_and_api_origin_is_not_allowed(self) -> None:
        frontend_origin = "https://heartquest.yamaguchi-tech.com"
        denied_origins = (
            "http://heartquest.yamaguchi-tech.com",
            "https://heartquest.yamaguchi-tech.com.example.com",
            "https://preview.heartquest.yamaguchi-tech.com",
            "https://heartquest-api.yamaguchi-tech.com",
        )
        with patch.dict(
            os.environ,
            {"HEARTQUEST_CORS_ORIGINS": frontend_origin},
        ):
            with TestClient(create_app(self.database_path)) as client:
                allowed = self.preflight(client, frontend_origin)
                self.assertEqual(allowed.status_code, 200)
                self.assertEqual(
                    allowed.headers["access-control-allow-origin"],
                    frontend_origin,
                )
                self.assertIn(
                    "authorization",
                    allowed.headers["access-control-allow-headers"].lower(),
                )
                self.assertIn(
                    "content-type",
                    allowed.headers["access-control-allow-headers"].lower(),
                )
                self.assertIn(
                    "POST",
                    allowed.headers["access-control-allow-methods"],
                )

                for origin in denied_origins:
                    with self.subTest(origin=origin):
                        denied = self.preflight(client, origin)
                        self.assertNotIn(
                            "access-control-allow-origin",
                            denied.headers,
                        )

    def test_wildcard_origin_is_rejected_when_credentials_are_enabled(self) -> None:
        with patch.dict(
            os.environ,
            {"HEARTQUEST_CORS_ORIGINS": "*"},
        ):
            with self.assertRaisesRegex(ValueError, "cannot contain"):
                create_app(self.database_path)


if __name__ == "__main__":
    unittest.main()
