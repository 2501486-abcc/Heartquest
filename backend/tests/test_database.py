import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database


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
        init_database(self.database_path)
        self.assertTrue(self.database_path.is_file())

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
