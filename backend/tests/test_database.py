import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import (
    SCHEMA_VERSION,
    SQLITE_BUSY_TIMEOUT_MS,
    get_connection,
    init_database,
    resolve_database_path,
)


class DatabaseSchemaTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "heartquest.db"
        init_database(self.database_path)

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def table_columns(self, table_name: str) -> list[str]:
        with get_connection(self.database_path) as connection:
            rows = connection.execute(
                f"PRAGMA table_info({table_name})"
            ).fetchall()
        return [row["name"] for row in rows]

    def test_expected_tables_and_columns_are_created(self) -> None:
        with get_connection(self.database_path) as connection:
            rows = connection.execute(
                """
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name NOT LIKE 'sqlite_%'
                """
            ).fetchall()

        self.assertEqual(
            {row["name"] for row in rows},
            {"users", "recoveries", "bookmarks"},
        )
        self.assertEqual(
            self.table_columns("users"),
            [
                "id",
                "firebase_uid",
                "display_name",
                "created_at",
                "updated_at",
            ],
        )
        self.assertEqual(
            self.table_columns("recoveries"),
            [
                "id",
                "user_id",
                "activity",
                "category",
                "before_mood",
                "before_state",
                "memo",
                "after_mood",
                "after_comment",
                "rating",
                "ai_score",
                "ai_comment",
                "source",
                "created_at",
                "updated_at",
            ],
        )
        self.assertEqual(
            self.table_columns("bookmarks"),
            [
                "id",
                "user_id",
                "title",
                "description",
                "category",
                "source",
                "created_at",
            ],
        )

    def test_init_database_can_be_run_repeatedly(self) -> None:
        with get_connection(self.database_path) as connection:
            connection.execute(
                "INSERT INTO users (firebase_uid) VALUES (?)",
                ("preserved-user",),
            )

        init_database(self.database_path)

        with get_connection(self.database_path) as connection:
            user = connection.execute(
                "SELECT firebase_uid FROM users WHERE firebase_uid = ?",
                ("preserved-user",),
            ).fetchone()
        self.assertEqual(user["firebase_uid"], "preserved-user")

    def test_environment_database_path_is_used(self) -> None:
        environment_database_path = (
            Path(self.temp_directory.name) / "configured" / "heartquest.db"
        )

        with patch.dict(
            os.environ,
            {"HEARTQUEST_DATABASE_PATH": str(environment_database_path)},
        ):
            init_database()

        self.assertTrue(environment_database_path.is_file())
        with get_connection(environment_database_path) as connection:
            table = connection.execute(
                "SELECT name FROM sqlite_master WHERE name = 'users'"
            ).fetchone()
        self.assertEqual(table["name"], "users")

    def test_relative_database_path_is_resolved_from_backend_directory(self) -> None:
        relative_path = Path("runtime") / "heartquest.db"

        with patch.dict(
            os.environ,
            {"HEARTQUEST_DATABASE_PATH": str(relative_path)},
        ):
            resolved_path = resolve_database_path()

        self.assertEqual(resolved_path, (BACKEND_DIR / relative_path).resolve())

    def test_sqlite_runtime_settings_and_schema_version_are_configured(self) -> None:
        with get_connection(self.database_path) as connection:
            busy_timeout = connection.execute("PRAGMA busy_timeout").fetchone()[0]
            journal_mode = connection.execute("PRAGMA journal_mode").fetchone()[0]
            user_version = connection.execute("PRAGMA user_version").fetchone()[0]

        self.assertEqual(busy_timeout, SQLITE_BUSY_TIMEOUT_MS)
        self.assertEqual(journal_mode, "wal")
        self.assertEqual(user_version, SCHEMA_VERSION)

    def test_mood_and_rating_values_must_be_in_range(self) -> None:
        with get_connection(self.database_path) as connection:
            user_id = connection.execute(
                """
                INSERT INTO users (firebase_uid, display_name)
                VALUES (?, ?)
                """,
                ("firebase-user-1", "Test User"),
            ).lastrowid

            for column, invalid_value in (
                ("before_mood", 0),
                ("after_mood", 11),
                ("rating", 0),
            ):
                with self.subTest(column=column, value=invalid_value):
                    with self.assertRaises(sqlite3.IntegrityError):
                        connection.execute(
                            f"""
                            INSERT INTO recoveries
                                (user_id, activity, {column})
                            VALUES (?, ?, ?)
                            """,
                            (user_id, "散歩", invalid_value),
                        )

    def test_user_relationships_are_enforced(self) -> None:
        with get_connection(self.database_path) as connection:
            with self.assertRaises(sqlite3.IntegrityError):
                connection.execute(
                    """
                    INSERT INTO recoveries (user_id, activity)
                    VALUES (?, ?)
                    """,
                    (999, "散歩"),
                )

            user_id = connection.execute(
                "INSERT INTO users (firebase_uid) VALUES (?)",
                ("firebase-user-2",),
            ).lastrowid
            connection.execute(
                """
                INSERT INTO recoveries (user_id, activity)
                VALUES (?, ?)
                """,
                (user_id, "読書"),
            )
            connection.execute(
                """
                INSERT INTO bookmarks (user_id, title)
                VALUES (?, ?)
                """,
                (user_id, "音楽を聴く"),
            )
            connection.execute("DELETE FROM users WHERE id = ?", (user_id,))

            recovery_count = connection.execute(
                "SELECT COUNT(*) FROM recoveries"
            ).fetchone()[0]
            bookmark_count = connection.execute(
                "SELECT COUNT(*) FROM bookmarks"
            ).fetchone()[0]

        self.assertEqual(recovery_count, 0)
        self.assertEqual(bookmark_count, 0)


if __name__ == "__main__":
    unittest.main()
