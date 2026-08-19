"""
Pydantic schemas package (the API contract layer).

Each submodule corresponds 1:1 with a resource in app.models. Schemas are
intentionally kept separate from ORM models so the HTTP contract can
evolve independently of the persistence schema.
"""
