"""
DESTRUCTIVE, one-off admin script - NOT part of the running app.

Drops every table in whichever database DATABASE_URL points to, so the
app's auto-seed-on-startup logic (see app/main.py) repopulates it from
scratch on next boot - used here to wipe the Render production Postgres
database of its old mock-seeded data so it reseeds with real Rainforest
data instead.

Usage - run locally, pointed at the REMOTE database via a one-off shell
env var (never write the production DATABASE_URL into any .env file or
share it in chat - it contains a password):

    $env:DATABASE_URL = "<paste the Render Postgres External Database URL>"
    $env:PYTHONPATH = "D:\AI工具\Product_Hunter\backend"
    ..\.venv\Scripts\python.exe scripts\reset_remote_db.py

You will be asked to type "yes" to confirm before anything is dropped.
After it finishes, go back to Render and manually redeploy/restart the
`furniture-insight-backend` web service so its startup event recreates
the (now-empty) tables and auto-seeds them with real data.
"""
import os
import sys

from sqlalchemy import create_engine

import app.models  # noqa: F401 - populates Base.metadata as a side effect
from app.database.base import Base


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("Set the DATABASE_URL env var first (the Render Postgres External Database URL).")
        sys.exit(1)
    if url.startswith("sqlite"):
        print("Refusing to run against a sqlite URL - this script is only for resetting a remote Postgres DB.")
        sys.exit(1)

    # Print only the host/db portion, never the embedded credentials.
    visible = url.split("@")[-1] if "@" in url else "(unknown host)"
    print(f"About to DROP ALL TABLES on: {visible}")
    print("This deletes ALL data (categories, products, trends, reviews, opportunity reports).")
    confirm = input('Type "yes" to confirm: ')
    if confirm.strip().lower() != "yes":
        print("Aborted - nothing was changed.")
        sys.exit(0)

    engine = create_engine(url)
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped successfully.")
    print("Next: go to the Render dashboard and manually redeploy/restart "
          "furniture-insight-backend so it recreates the tables and "
          "auto-seeds them with real data.")


if __name__ == "__main__":
    main()
