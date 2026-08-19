# Furniture Market Insight AI

An internal AI-assisted product-selection platform for furniture product managers.
Analyzes category trends, ranks hot products, extracts review pain points via AI,
and generates new-product opportunity reports — architected as an MVP that scales
into a multi-agent, real-data, enterprise system.

## What it does

| # | Feature | Page |
|---|---|---|
| 1 | Furniture category management (7 starter categories, extensible) | Category Explorer |
| 2 | Market trend analysis (trend score, growth, keywords) | Market Analysis |
| 3 | Hot-product ranking (AI opportunity score) | Product Ranking |
| 4 | Aspect-based review sentiment analysis + pain-point extraction | Review Insight |
| 5 | AI-generated new-product opportunity reports | AI Recommendation |
| — | High-level snapshot | Dashboard |

## Tech stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS → deployed to Vercel
- **Backend**: Python FastAPI, REST API → deployed via Docker (also runs standalone)
- **Database**: SQLAlchemy ORM, SQLite by default (zero-install), PostgreSQL-ready
- **Vector DB**: ChromaDB (embedded, local persistent directory — no server needed)
- **AI**: DeepSeek API (default, cost-effective; Anthropic Claude also supported), single `FurnitureInsightAgent` today, structured to
  grow into a Router Agent over specialist agents (see `docs/AGENT_DESIGN.md`)

## Project structure

```
Product_Hunter/
├── frontend/          Next.js 14 App Router UI
├── backend/
│   └── app/
│       ├── api/       FastAPI routers (one file per resource)
│       ├── models/    SQLAlchemy ORM models
│       ├── schemas/   Pydantic request/response schemas
│       ├── services/  business logic + pluggable market-data providers
│       ├── ai/        agent.py, prompts.py, rag.py, llm_client.py
│       ├── database/  engine/session/init
│       └── seed/      mock-data seed script + fixtures
├── data/              SQLite file + Chroma persist dir (gitignored, runtime-created)
├── docs/              ARCHITECTURE.md, API.md, AGENT_DESIGN.md, SETUP.md
├── docker-compose.yml opt-in Postgres + backend stack
└── .gitignore
```

## Quickstart (no Docker required)

Full step-by-step instructions, including Windows `winget` installs for
Python/Node if you don't have them, are in **[docs/SETUP.md](docs/SETUP.md)**.
Short version:

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env              # fill in DEEPSEEK_API_KEY for the AI endpoints
.venv\Scripts\python -m app.seed.seed_data
.venv\Scripts\uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```
Visit `http://localhost:3000`. Backend API docs at `http://localhost:8000/docs`.

**Verified working end-to-end**: backend seeded with 7 categories / 56 products /
315 reviews, all non-AI pages render live data; the two AI endpoints (review
analysis, opportunity generation) return a clean, non-crashing error until an
`DEEPSEEK_API_KEY` is added.

## Data sources: mock vs. real

Furniture marketplaces (Amazon/Wayfair/Home Depot) have no free public API. The
app ships with a `MarketDataProvider` abstraction, switched purely via env vars
(`DATA_PROVIDER` in `backend/.env`) — no code changes either way:
- **`MockDataProvider`** (`DATA_PROVIDER=mock`, the checked-in default) —
  realistic, structured, deterministic mock data. Zero external dependencies.
- **`RainforestProvider`** (`DATA_PROVIDER=rainforest`) — **real, verified
  working** against the live Rainforest API (real Amazon search results) for
  trends and products. Add `RAINFOREST_API_KEY` (a free 100-request trial is
  available at [rainforestapi.com](https://app.rainforestapi.com/signup), no
  card required) to activate it.
  - ⚠️ Rainforest's `reviews` request type is currently down on their end
    (a known, longstanding intermittent issue - confirmed independently, not
    specific to this integration). Categories/trends/products still seed with
    100% real data either way; only the automatic review-fetch fallback used
    by "Generate Report" is affected until Rainforest's side recovers - real
    reviews you submit yourself via the Review Insight page work regardless.

See `docs/ARCHITECTURE.md` for the full design rationale.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design & rationale
- [`docs/API.md`](docs/API.md) — full REST API reference with examples
- [`docs/AGENT_DESIGN.md`](docs/AGENT_DESIGN.md) — AI agent structure & router-agent migration path
- [`docs/SETUP.md`](docs/SETUP.md) — detailed setup, including Windows prerequisite installs

## Future upgrade path

- **Router Agent**: split `FurnitureInsightAgent` into Trend/Review/Design/Cost
  specialist agents behind a `RouterAgent.route()` — call sites don't change.
- **Real trend monitoring**: switch to `RainforestProvider` + a scheduled refresh job.
- **Sales forecasting**: time-series model over historical trend snapshots.
- **AI-generated product design**: a `DesignAgent` tool + image-gen integration.
- **Enterprise knowledge base**: activate the reserved `embed_review_batch()` in
  `rag.py`, add a Chroma-backed knowledge-search page.
