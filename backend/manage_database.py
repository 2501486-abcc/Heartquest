import argparse
import sqlite3
from contextlib import closing
from pathlib import Path

from database import SQLITE_BUSY_TIMEOUT_MS, resolve_database_path


def _copy_database(source: Path, destination: Path) -> None:
    if source.resolve() == destination.resolve():
        raise ValueError("Source and destination databases must be different")
    if not source.is_file():
        raise FileNotFoundError("Source database does not exist")

    destination.parent.mkdir(parents=True, exist_ok=True)
    timeout_seconds = SQLITE_BUSY_TIMEOUT_MS / 1_000
    with closing(
        sqlite3.connect(source, timeout=timeout_seconds)
    ) as source_connection:
        source_connection.execute(
            f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}"
        )
        with closing(
            sqlite3.connect(
                destination,
                timeout=timeout_seconds,
            )
        ) as destination_connection:
            destination_connection.execute(
                f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}"
            )
            source_connection.backup(destination_connection)
            destination_connection.commit()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Back up or restore the configured HeartQuest SQLite database.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    backup_parser = subparsers.add_parser("backup")
    backup_parser.add_argument("destination", type=Path)

    restore_parser = subparsers.add_parser("restore")
    restore_parser.add_argument("source", type=Path)

    args = parser.parse_args()
    configured_database = resolve_database_path()

    try:
        if args.command == "backup":
            _copy_database(configured_database, args.destination.resolve())
        else:
            _copy_database(args.source.resolve(), configured_database)
    except (OSError, sqlite3.Error, ValueError) as exc:
        parser.error(f"Database {args.command} failed ({type(exc).__name__})")

    print(f"Database {args.command} completed")


if __name__ == "__main__":
    main()
