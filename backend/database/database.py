import sqlite3
from pathlib import Path


DEFAULT_DATABASE_PATH = Path(__file__).with_name("heartquest.db")

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


def get_connection(
    database_path: str | Path = DEFAULT_DATABASE_PATH,
) -> sqlite3.Connection:
    """Return a SQLite connection with foreign-key checks enabled."""
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_database(database_path: str | Path = DEFAULT_DATABASE_PATH) -> None:
    """Create the HeartQuest tables when they do not already exist."""
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with get_connection(path) as connection:
        connection.executescript(_SCHEMA)


if __name__ == "__main__":
    init_database()
