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
Edit `backend\.env` and fill in `DEEPSEEK_API_KEY` (get one at
[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) —
required for the two AI endpoints: review analysis and opportunity generation;
everything else works without it). To use Anthropic Claude instead, set
`LLM_PROVIDER=anthropic` and fill in `ANTHROPIC_API_KEY`. Leave
`RAINFOREST_API_KEY` blank until you have one; `DATA_PROVIDER` stays `mock`
until then.

Seed the database (7 categories, ~56 products, ~280 reviews - real or mock
depending on `DATA_PROVIDER`):
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

## 3b. Schema changes (Alembic)

The app applies pending migrations automatically on startup, so a normal
deploy needs no manual step. After changing a model, generate a migration:

```powershell
cd backend
.venv\Scripts\python.exe -m alembic revision --autogenerate -m "what changed"
.venv\Scripts\python.exe -m alembic upgrade head
```
Review the generated file before committing — autogenerate is a good first
draft, not a finished migration.

Useful commands: `alembic current` (where is this DB), `alembic history`,
`alembic downgrade -1` (undo one).

An already-deployed database created before Alembic was introduced is
detected and stamped at the baseline revision automatically on first
startup, then upgraded — its data is preserved, no drop-and-reseed.

## 4. Switching to a real market-data source

`RainforestProvider` is fully implemented and verified against the live
Rainforest API - no code changes needed, just:
1. Get a key at [app.rainforestapi.com/signup](https://app.rainforestapi.com/signup)
   (free 100-request trial, no card required).
2. Set `RAINFOREST_API_KEY=...` and `DATA_PROVIDER=rainforest` in `backend/.env`.
3. Restart the backend and re-run the seed script (or just start the API - it
   auto-seeds an empty DB on startup) to get real Amazon-derived
   categories/trends/products.

Known limitation: Rainforest's `type=reviews` endpoint is currently down on
their end (confirmed independently, not specific to this integration). This no
longer breaks anything - the app automatically falls back to the 545 real
Amazon reviews committed under `backend/app/seed/fixtures/reviews/` (free
Amazon Reviews'23 dataset; see `docs/ARCHITECTURE.md`). Trends and products
come from the live API; review text comes from the dataset. Reviews you paste
into the Review Insight page take priority over both.

To regenerate or expand the review fixtures:
```powershell
.venv\Scripts\python.exe scripts\build_review_fixtures.py --mb 60 --per-category 80
```
Downloads are cached under `backend/scripts/.cache/` (gitignored), so re-running
with different filters does not re-download.

For production (Render), set the same two env vars in the Render dashboard
(see step 5a below) instead of `backend/.env`.

## 5. Deployment

Deploy the **backend first** (you need its live URL for the frontend's env var),
then the **frontend**, then go back and tighten the backend's CORS setting.

### 5a. Backend → Render

Render can build straight from `backend/Dockerfile` on every push to `main` — no
local Docker install needed. A `render.yaml` Blueprint is included at the repo
root that provisions both the web service and a free managed Postgres database.

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in
   (GitHub OAuth is the easiest — Render needs you to authorize repo access
   yourself; this can't be done on your behalf).
2. **New → Blueprint** → connect the `JiachengCui-01/Product_Hunter` repo →
   Render reads `render.yaml` and shows you two resources: the
   `furniture-insight-backend` web service and the `furniture-insight-db`
   Postgres database.
3. You'll be prompted for four `sync: false` fields (these are intentionally
   *not* hardcoded in `render.yaml` - see the comment there - so a later
   "Manual Sync" never silently resets them):
   - `DEEPSEEK_API_KEY` — paste your key.
   - `RAINFOREST_API_KEY` — leave blank for now if you don't have one yet.
   - `DATA_PROVIDER` — type `mock` (safe default) or `rainforest` if you
     already have a Rainforest key ready.
   - `CORS_ORIGINS` — type `http://localhost:3000` for now; you'll add your
     Vercel URL to this later (step 5c).
   Type these directly into Render's dashboard fields, not anywhere else.
4. Click **Apply**. Render builds the Docker image, provisions Postgres, wires
   `DATABASE_URL` automatically, and deploys. First boot will auto-create
   tables and auto-seed mock data (see `app/main.py` startup hook) — no manual
   seed step needed.
5. Once live, copy the service URL Render gives you (e.g.
   `https://furniture-insight-backend.onrender.com`) — you'll need it for the
   frontend. Confirm it works: visit `<that-url>/health`.

**If you'd rather not use the Blueprint file**, the manual equivalent is:
New → Web Service → connect repo → Root Directory: `backend` → Runtime:
`Docker` → add a Postgres instance separately (New → PostgreSQL) → copy its
"Internal Connection String" into the web service's `DATABASE_URL` env var →
add `LLM_PROVIDER=deepseek`, `DEEPSEEK_API_KEY`, `DATA_PROVIDER=mock`,
`CHROMA_PERSIST_DIR=/app/data/chroma`, `CORS_ORIGINS=http://localhost:3000`
as additional env vars.

### 5b. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com), sign in (GitHub OAuth — again, you
   need to authorize this yourself).
2. **Add New → Project** → import `JiachengCui-01/Product_Hunter`.
3. Under **Root Directory**, set it to `frontend` (this repo is a monorepo —
   Vercel needs to know the Next.js app isn't at the repo root).
4. Add an environment variable: `NEXT_PUBLIC_API_URL` = the Render backend URL
   from step 5a (e.g. `https://furniture-insight-backend.onrender.com`).
5. Deploy. Vercel gives you a URL like `https://product-hunter-xyz.vercel.app`.

### 5c. Close the loop: update backend CORS

Go back to the Render service's environment variables and update
`CORS_ORIGINS` to include your real Vercel URL, e.g.:
```
http://localhost:3000,https://product-hunter-xyz.vercel.app
```
Save — Render redeploys automatically, no code changes needed. Without this
step the deployed frontend's API calls will be blocked by the browser's CORS
policy even though the backend itself is reachable.

### Notes
- The Chroma vector store lives on the web service's local (ephemeral) disk in
  this setup — it resets on every redeploy. That's fine for the MVP (it only
  affects "similar past reports" enrichment, not the RAG feature's stability
  more broadly); add a Render persistent disk later if you want it to survive
  redeploys.
- Render's free tier spins the service down after inactivity; the first
  request after idle can take ~30-60s to wake it back up.
