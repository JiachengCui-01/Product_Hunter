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

# Copy application code.
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
