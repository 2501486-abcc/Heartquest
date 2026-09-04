import sys
import tempfile
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from manage_database import _copy_database


class DatabaseBackupTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.source_path = Path(self.temp_directory.name) / "source.db"
        self.destination_path = Path(self.temp_directory.name) / "backup.db"
        init_database(self.source_path)
        with get_connection(self.source_path) as connection:
            connection.execute(
                "INSERT INTO users (firebase_uid) VALUES (?)",
                ("backed-up-user",),
            )

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def test_backup_copies_existing_data(self) -> None:
        _copy_database(self.source_path, self.destination_path)

        with get_connection(self.destination_path) as connection:
            user = connection.execute(
                "SELECT firebase_uid FROM users"
            ).fetchone()
        self.assertEqual(user["firebase_uid"], "backed-up-user")

    def test_restore_replaces_destination_data(self) -> None:
        init_database(self.destination_path)
        with get_connection(self.destination_path) as connection:
            connection.execute(
                "INSERT INTO users (firebase_uid) VALUES (?)",
                ("old-user",),
            )

        _copy_database(self.source_path, self.destination_path)

        with get_connection(self.destination_path) as connection:
            users = connection.execute(
                "SELECT firebase_uid FROM users ORDER BY id"
            ).fetchall()
        self.assertEqual(
            [user["firebase_uid"] for user in users],
            ["backed-up-user"],
        )


if __name__ == "__main__":
    unittest.main()
