"""Shared FastAPI dependencies used across multiple routers."""

from dataclasses import dataclass

from fastapi import Query


@dataclass
class PaginationParams:
    """Simple offset/limit pagination parameters."""

    skip: int
    limit: int


def pagination_params(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max number of records to return"),
) -> PaginationParams:
    """FastAPI dependency providing standard skip/limit pagination query params."""
    return PaginationParams(skip=skip, limit=limit)
