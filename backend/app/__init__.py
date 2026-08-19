"""
Furniture Market Insight AI - Backend Application Package.

This package contains the full FastAPI backend for the "Furniture Market
Insight AI" enterprise MVP. The application is organized into clear
layers:

    core/       - configuration, logging
    database/   - SQLAlchemy engine/session/init helpers
    models/     - SQLAlchemy ORM models (persistence layer)
    schemas/    - Pydantic request/response models (API contract layer)
    api/        - FastAPI routers (HTTP layer)
    services/   - business logic orchestration (service layer)
    ai/         - LLM client, agent, prompts, and RAG helpers
    seed/       - one-off/idempotent database seeding scripts

The layering is intentional: routers depend on services, services depend
on models/schemas/ai, and nothing "reaches up" the stack. This keeps the
codebase easy to extend as new data providers, LLM providers, or agent
architectures are introduced.
"""
