import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DEFAULT_DATABASE_PATH = Path(__file__).with_name("heartquest.db")
BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]
SQLITE_BUSY_TIMEOUT_MS = 5_000
SCHEMA_VERSION = 1

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recoveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity TEXT NOT NULL,
    category TEXT,
    before_mood INTEGER CHECK (
        before_mood IS NULL
        OR (typeof(before_mood) = 'integer' AND before_mood BETWEEN 1 AND 10)
    ),
    before_state TEXT,
    memo TEXT,
    after_mood INTEGER CHECK (
        after_mood IS NULL
        OR (typeof(after_mood) = 'integer' AND after_mood BETWEEN 1 AND 10)
    ),
    after_comment TEXT,
    rating INTEGER CHECK (
        rating IS NULL
        OR (typeof(rating) = 'integer' AND rating BETWEEN 1 AND 10)
    ),
    ai_score REAL,
    ai_comment TEXT,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
"""


@contextmanager
def get_connection(
    database_path: str | Path | None = None,
) -> Iterator[sqlite3.Connection]:
    """Return a configured SQLite connection."""
    path = resolve_database_path(database_path)
    connection = sqlite3.connect(
        path,
        timeout=SQLITE_BUSY_TIMEOUT_MS / 1_000,
    )
    connection.row_factory = sqlite3.Row
    connection.execute(f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}")
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def resolve_database_path(
    database_path: str | Path | None = None,
) -> Path:
    """Resolve the configured DB path independently from the working directory."""
    configured_path = database_path
    if configured_path is None:
        configured_path = os.getenv("HEARTQUEST_DATABASE_PATH") or DEFAULT_DATABASE_PATH

    path = Path(configured_path)
    if not path.is_absolute():
        path = BACKEND_DIRECTORY / path
    return path.resolve()


def init_database(database_path: str | Path | None = None) -> None:
    """Create or migrate the HeartQuest database without removing existing data."""
    path = resolve_database_path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with get_connection(path) as connection:
        current_version = connection.execute("PRAGMA user_version").fetchone()[0]
        if current_version > SCHEMA_VERSION:
            raise RuntimeError(
                "Database schema is newer than this HeartQuest version"
            )

        if current_version < 1:
            connection.executescript(_SCHEMA)
            connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")


if __name__ == "__main__":
    init_database()
