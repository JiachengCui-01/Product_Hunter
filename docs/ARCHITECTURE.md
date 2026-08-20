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

### Schema migrations: Alembic, applied automatically on startup
Schema changes are versioned migrations under `backend/alembic/versions/`,
applied by `app/database/migrate.py` from the FastAPI startup event (and by
the seed script). There is no `create_all()` anymore.

This was retrofitted after `create_all()` caused three avoidable production
database rebuilds: it only ever CREATEs *missing tables*, so adding a column
to a model deployed cleanly and then produced a 500 on every query against
the still-stale table. Migrations make column changes a normal, data-preserving
deploy.

`run_migrations()` handles the three states a database can be in, detected by
table presence rather than a manual flag:

| State | Action |
|---|---|
| Empty | run all migrations from scratch |
| Pre-Alembic (tables exist, no `alembic_version`) | `stamp` at the baseline revision, then upgrade forward - **existing data is preserved** |
| Already under Alembic | upgrade to head (usually a no-op) |

That middle case is why `0001_baseline` describes the *old* schema as a
separate revision from `0002_product_links`: it gives an already-deployed
database a revision to be stamped at, so it can move forward with an
`ALTER TABLE` instead of being dropped.

Migrations are driven through a connection supplied by the caller
(`config.attributes["connection"]`, Alembic's documented pattern) rather than
letting `env.py` build its own engine from settings - otherwise
`run_migrations(engine)` would silently ignore its argument and migrate
whatever `DATABASE_URL` points at.

One portability note lives in `0002`: SQLite has no
`ALTER COLUMN ... DROP DEFAULT`, so the temporary server defaults (needed to
add NOT NULL columns to populated tables) are only dropped on non-SQLite
dialects. Leaving them on SQLite is harmless since they match the
application-level defaults exactly.

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

### Review text: a free static dataset, deliberately
Review text is treated as a separate concern from price/rank data, because its
cost profile is different: paid APIs bill per product for it, yet it is barely
freshness-sensitive (a complaint that a dresser's drawer rails arrive backwards
is just as actionable a year later). So instead of buying it, the repo ships
545 genuine Amazon reviews across the 7 categories in
`backend/app/seed/fixtures/reviews/`, extracted from the free
[Amazon Reviews'23](https://amazon-reviews-2023.github.io/) academic dataset by
the build-time script `backend/scripts/build_review_fixtures.py`.

That script range-downloads only a prefix of each multi-GB source department
file (Home_and_Kitchen, Office_Products, Patio_Lawn_and_Garden - the app's
categories do not all live under one Amazon department), then applies keyword
matching per category plus an unconditional accessory blocklist. The blocklist
matters: naive matching pulled in reviews of sofa *covers* and printer ink
cartridges, whose pain points are useless for furniture development.

`services/review_fixtures.py` reads those fixtures at runtime and is used as a
fallback in two places - the seed script (when the live provider returns no
reviews) and `opportunity_service._gather_review_texts` (when the provider
raises). Reviews are stored with `product_id=None` and only a `category_id`,
because they are real reviews of *comparable* products in the category, not of
the specific scraped listings - pinning them to a product would overstate what
the data is.

Precision is good but not perfect (roughly 70-90% on-topic by inspection);
keyword heuristics hit diminishing returns, and the fixtures are a large
improvement over synthetic templates either way. License caveat: the source is
an academic dataset with no explicit license on its card - suitable for
development and evaluation, verify terms before commercial use.

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
