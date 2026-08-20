# Furniture Market Insight AI - backend container image.
#
# Build:
#   docker build -t furniture-market-insight-ai-backend .
# Run:
#   docker run -p 8000:8000 --env-file .env furniture-market-insight-ai-backend
#
# Note: the `data/` directory (SQLite DB + Chroma persistence) is
# expected to be a sibling of `backend/` on the host. When containerizing,
# mount it as a volume, e.g.:
#   docker run -p 8000:8000 --env-file .env -v $(pwd)/../data:/data furniture-market-insight-ai-backend

FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (separate layer for better build caching).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code plus the Alembic migration environment - the app
# migrates its own schema to head on startup (app/database/migrate.py), so
# these must be present in the image, not just in the repo.
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

EXPOSE 8000

# Shell form (not exec/JSON-array form) so $PORT is expanded at container
# start. Managed hosts like Render inject a PORT env var and require the
# process to bind to it; local `docker run` / docker-compose without PORT
# set falls back to 8000.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
