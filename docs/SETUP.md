# Setup Guide

## 0. Prerequisites (Windows)

If Python 3.11+ and Node.js 20+ aren't already installed, install them via `winget`
(no GUI interaction required):
```powershell
winget install --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements
winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
```
Open a **new terminal** afterward so `PATH` picks up the new installs, then confirm:
```powershell
python --version
node --version
npm --version
```

Docker is optional — only needed if you want to run against real PostgreSQL via
`docker-compose.yml` (see `docs/ARCHITECTURE.md`). Everything below runs without it.

## 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
```
Edit `backend\.env` and fill in `ANTHROPIC_API_KEY` (required for the two AI
endpoints: review analysis and opportunity generation — everything else works
without it). Leave `RAINFOREST_API_KEY` blank until you have one; `DATA_PROVIDER`
stays `mock` until then.

Seed the database with realistic mock data (7 categories, ~56 products, ~300+ reviews):
```powershell
.venv\Scripts\python -m app.seed.seed_data
```

Run the API:
```powershell
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for the interactive Swagger UI, or
`http://localhost:8000/health` for a liveness check.

## 2. Frontend

In a separate terminal:
```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```
Visit `http://localhost:3000`.

## 3. Switching to real PostgreSQL (optional, later)

Once Docker Desktop is installed:
```powershell
docker compose up --build
```
This starts Postgres + the backend container pointed at it. No code changes are
needed — every model uses cross-dialect-safe SQLAlchemy types (see
`docs/ARCHITECTURE.md`).

## 4. Switching to a real market-data source (optional, later)

Once you have a Rainforest API (or similar) key:
1. Set `RAINFOREST_API_KEY=...` and `DATA_PROVIDER=rainforest` in `backend/.env`.
2. Fill in the response-mapping TODOs in `backend/app/services/rainforest_provider.py`.
3. Restart the backend — no other code changes needed (see `docs/ARCHITECTURE.md`).

## 5. Deployment

- **Frontend** → Vercel: import the `frontend/` directory as the project root, set
  `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- **Backend** → any Docker host, using `backend/Dockerfile` (build context `backend/`).
