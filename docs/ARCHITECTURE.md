# Architecture

## System overview

```
┌──────────────────┐        REST/JSON         ┌───────────────────────┐
│   Next.js 14      │  ───────────────────►   │   FastAPI backend      │
│   (frontend/)     │  ◄───────────────────   │   (backend/app/)       │
│   Vercel-deployed │                          │                        │
└──────────────────┘                          │  api/  → services/     │
                                                │            │           │
                                                │            ▼           │
                                                │   database/ (SQLAlchemy)│
                                                │       │                │
                                                │       ▼                │
                                                │  SQLite (dev) /         │
                                                │  PostgreSQL (prod)      │
                                                │                        │
                                                │  ai/agent.py            │
                                                │    ├─ prompts.py        │
                                                │    ├─ llm_client.py ───►│──► DeepSeek API (default) / Anthropic Claude
                                                │    └─ rag.py ──────────►│──► ChromaDB (embedded, local dir)
                                                │                        │
                                                │  services/*_provider.py│
                                                │    ├─ MockDataProvider │ (default, runs today)
                                                │    └─ RainforestProvider│──► Rainforest API (future, needs key)
                                                └───────────────────────┘
```

## Why these choices

### Database: SQLAlchemy + SQLite default, PostgreSQL-ready
The dev machine had no working Python/Node/Docker at project start, and installing a
standalone PostgreSQL server adds real friction for a first-run MVP. Every model uses
only **cross-dialect-safe SQLAlchemy types** — `String`, `Text`, `Integer`, `Float`,
`DateTime`, and the generic `JSON` type for list fields (`keywords`, `features`,
`pain_points`, etc.) instead of Postgres-only `ARRAY`/`JSONB`. This means the exact
same model/service code runs unmodified against SQLite locally or PostgreSQL in
`docker-compose.yml` — the only change is the `DATABASE_URL` environment variable.

**To switch to real Postgres:** set `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
in `backend/.env` (or run `docker compose up`, which does this for you), reinstall/
restart the backend. No code changes required.

### Vector DB: ChromaDB, embedded mode
`chromadb`'s Python client can run fully in-process against a local persistent
directory (`CHROMA_PERSIST_DIR`) — no separate server/container needed. This keeps
the RAG scaffold usable with zero extra infrastructure, while still being the same
library you'd point at a hosted/server Chroma instance later.

### Market data: pluggable `MarketDataProvider`
Real furniture-marketplace data (Amazon/Wayfair/Home Depot) has no free public API.
`backend/app/services/market_data_provider.py` defines an abstract interface with
three methods (`get_trend`, `get_products`, `get_reviews`). Two implementations exist:

- **`MockDataProvider`** (default, `DATA_PROVIDER=mock`) — generates deterministic,
  realistic-looking trend/product/review data per category so every feature is
  demoable today without any external account.
- **`RainforestProvider`** (`DATA_PROVIDER=rainforest`) — calls the real Rainforest
  API (a paid third-party Amazon-data API; free 100-request trial available), reading
  `RAINFOREST_API_KEY` from the environment. **Verified working end-to-end** against
  a live trial key:
  - `get_trend()` / `get_products()` share a single real `type=search` request per
    category (cached per provider instance, so a full 7-category run costs ~7 API
    credits, not ~14) and return real Amazon titles/prices/ratings/review counts.
    `features` are heuristically extracted from listing titles (no bullet-point data
    in search results without an extra per-ASIN `type=product` call); `growth` is
    reported as `"Stable"` since a single point-in-time search has no historical
    basis for a real trend direction (see "Real trend monitoring" below); `keywords`
    are frequency-extracted from real listing titles.
  - `get_reviews()` calls Rainforest's `type=reviews` endpoint, resolving the ASIN
    from the same cached search results. **As of writing, this specific endpoint is
    down on Rainforest's own end** (a confirmed, longstanding intermittent issue,
    not particular to this integration) - every call currently returns a clean,
    non-crashing `RuntimeError` (surfaced as an HTTP 503 by the API layer) rather
    than silently falling back to fake data. `seed_data.py` isolates each product's
    review fetch in its own try/except so one failure never aborts the rest of the
    seed run. All network-level failures (timeouts, connection drops, non-2xx) are
    normalized to the same `RuntimeError` contract in `_request()`.

Every service (`trend_service.py`, `product_service.py`, etc.) talks only to the
abstract interface via `provider_factory.get_data_provider()` — swapping providers
never touches API or service code.

### AI: single agent today, router-ready structure
`FurnitureInsightAgent` (see `docs/AGENT_DESIGN.md`) exposes its three
responsibilities (market analysis, review analysis, product recommendation) as a
`tools` dict keyed by name, plus a `.run(task, **kwargs)` dispatcher. Every caller
(API routes, services) invokes it by tool name, never by directly poking internals.
This means the planned future `RouterAgent` — which fans requests out to specialist
`TrendAgent`/`ReviewAgent`/`DesignAgent`/`CostAgent` classes — is a matter of moving
methods into new classes behind the same dict shape, not rewriting call sites.

### Prompts: isolated in `prompts.py`
No prompt text lives inline in `agent.py`, services, or API code. Every prompt is a
named constant or a pure string-building function in `backend/app/ai/prompts.py`.
This keeps prompt iteration (the fastest-changing part of an AI feature) decoupled
from business logic.

## Deployment
- **Frontend**: Vercel (`frontend/`), env var `NEXT_PUBLIC_API_URL` pointed at the
  deployed backend.
- **Backend**: `backend/Dockerfile` + `docker-compose.yml` (opt-in — see above);
  works equally well run directly via `uvicorn` for local dev (see `docs/SETUP.md`).
