"""
RAG (retrieval-augmented generation) helpers backed by ChromaDB.

Used to enrich new opportunity report generation with context from
previously generated reports, so the LLM can be nudged toward
differentiated recommendations rather than repeating itself across
categories. All Chroma access is defensive: any failure here must NOT
crash the opportunity generation flow (RAG enrichment is a "nice to
have", not a hard dependency).
"""

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_COLLECTION_NAME = "opportunity_reports"

# Module-level cache so we don't reopen the persistent client on every call.
_client = None


def get_chroma_client():
    """
    Return (creating if necessary) a singleton chromadb.PersistentClient
    rooted at settings.CHROMA_PERSIST_DIR (resolved to an absolute path
    under <repo_root>/data/chroma).
    """
    global _client
    if _client is None:
        import chromadb

        _client = chromadb.PersistentClient(path=settings.resolved_chroma_dir)
    return _client


def get_or_create_collection(name: str = _COLLECTION_NAME):
    """Return (creating if necessary) the named Chroma collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(name)


def embed_opportunity_report(report) -> None:
    """
    Add a generated OpportunityReport to the vector store so future
    report generations can retrieve it as similar-report context.

    Args:
        report: an OpportunityReport ORM instance (must already have an
            id, i.e. be committed/flushed to the DB before calling this).

    Any failure is logged and swallowed - embedding is best-effort
    enrichment, never a hard requirement for the opportunity generation
    flow to succeed.
    """
    try:
        collection = get_or_create_collection()
        text = (
            f"Product: {report.product_name}\n"
            f"Target customer: {report.target_customer}\n"
            f"Solution: {report.solution}\n"
            f"Pain points addressed: {', '.join(report.pain_points or [])}\n"
            f"Features: {', '.join(report.features or [])}"
        )
        collection.add(
            ids=[str(report.id)],
            documents=[text],
            metadatas=[{"category_id": report.category_id, "product_name": report.product_name}],
        )
    except Exception as exc:  # noqa: BLE001 - never let embedding break the main flow
        logger.warning("embed_opportunity_report failed (non-fatal): %s", exc)


def query_similar(query_text: str, n_results: int = 3) -> list[dict]:
    """
    Query the opportunity_reports collection for the n most similar
    previously generated reports.

    Returns:
        A list of dicts: [{"product_name": ..., "solution": ..., "distance": float}, ...]
        Returns an empty list if the collection is empty or if anything
        goes wrong (Chroma errors must never crash opportunity generation).
    """
    try:
        collection = get_or_create_collection()
        if collection.count() == 0:
            return []

        result = collection.query(
            query_texts=[query_text],
            n_results=min(n_results, collection.count()),
        )

        similar = []
        metadatas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]
        documents = (result.get("documents") or [[]])[0]

        for i, metadata in enumerate(metadatas):
            product_name = metadata.get("product_name", "Unknown") if metadata else "Unknown"
            # Solution text isn't stored in metadata (to keep it small), so
            # fall back to extracting it from the embedded document text.
            doc_text = documents[i] if i < len(documents) else ""
            solution_line = next(
                (line for line in doc_text.splitlines() if line.startswith("Solution:")),
                "",
            ).removeprefix("Solution:").strip()
            distance = distances[i] if i < len(distances) else None
            similar.append(
                {
                    "product_name": product_name,
                    "solution": solution_line,
                    "distance": distance,
                }
            )
        return similar
    except Exception as exc:  # noqa: BLE001 - RAG is best-effort enrichment only
        logger.warning("query_similar failed (non-fatal, returning []): %s", exc)
        return []


def embed_review_batch(reviews: list[str], category_id: int) -> None:
    """
    RESERVED FOR FUTURE USE (Phase 6+: "Knowledge Search" feature).

    This will eventually embed raw review text into a separate Chroma
    collection to power semantic search over historical customer
    feedback (e.g. "find reviews similar to X across all categories").
    It is stubbed out today because no endpoint yet consumes it - wiring
    it up prematurely would mean maintaining an unused, untested code
    path. Intentionally left as a no-op.
    """
    pass  # TODO: reserved for future semantic review search feature
