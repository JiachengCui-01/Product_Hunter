"""
Opportunity service: the top-level orchestration for generating a new
product opportunity report. This is the most "agentic" service in the
codebase - it stitches together market trend data, review sentiment
analysis, RAG-based retrieval of prior reports, and the LLM agent's
recommendation into one persisted OpportunityReport row.

Pipeline (see generate_opportunity):
    1. Load the Category (+ its most recent MarketTrend, creating one via
       the active data provider if none exists yet).
    2. Obtain a ReviewAnalysis to ground the recommendation:
         - If real reviews exist in the DB for this product/category, run
           the agent's sentiment analysis over those.
         - Otherwise, ask the active data provider (so the pipeline works
           even for a brand new category with no submitted reviews yet).
         - If the provider cannot supply reviews at all (e.g. a live API's
           reviews endpoint is down), fall back to the committed
           real-review fixtures for the category.
    3. Query the RAG vector store (app.ai.rag) for similar prior reports,
       to nudge the LLM toward a differentiated recommendation.
    4. Call the agent's recommend_product() tool.
    5. Persist the resulting OpportunityReport row.
    6. Embed the new report into the RAG vector store for future queries.
"""

from sqlalchemy.orm import Session

from app.ai.agent import FurnitureInsightAgent
from app.ai import rag
from app.ai.llm_client import get_llm_client
from app.core.logging import get_logger
from app.models.category import Category
from app.models.opportunity_report import OpportunityReport
from app.models.product import Product
from app.models.review import Review
from app.schemas.opportunity_report import OpportunityReportRead
from app.services import review_fixtures
from app.services.provider_factory import get_data_provider
from app.services.trend_service import get_trend_for_category

logger = get_logger(__name__)

# Minimum number of stored reviews required before we trust them over the
# mock-data fallback (a single stray review isn't a reliable signal).
_MIN_STORED_REVIEWS = 3


def _gather_review_texts(db: Session, category: Category, product_id: int | None) -> list[str]:
    """
    Gather review text to ground the sentiment analysis step: prefer
    reviews actually stored in the database (for the given product and/or
    category), falling back to freshly generated mock reviews from the
    active data provider if too few are stored.
    """
    query = db.query(Review)
    if product_id is not None:
        query = query.filter(Review.product_id == product_id)
    else:
        query = query.filter(Review.category_id == category.id)

    stored = query.order_by(Review.submitted_at.desc()).limit(50).all()

    if len(stored) >= _MIN_STORED_REVIEWS:
        return [r.review_text for r in stored]

    # Fallback: not enough real review data yet, so synthesize review
    # text from the mock provider. If a specific product was requested,
    # use its name; otherwise use a representative product from the
    # category so the reviews are topically relevant.
    provider = get_data_provider()
    if product_id is not None:
        product = db.query(Product).filter(Product.id == product_id).first()
        product_name = product.name if product is not None else category.name
    else:
        representative = db.query(Product).filter(Product.category_id == category.id).first()
        product_name = representative.name if representative is not None else category.name

    try:
        return provider.get_reviews(product_name, limit=15)
    except RuntimeError as exc:
        # A live provider can be unable to supply reviews at all - Rainforest's
        # `type=reviews` endpoint has been returning 503 for an extended
        # period. Rather than failing the whole report (which left "Generate
        # Report" dead in production), fall back to the committed real-review
        # fixtures for this category. These are genuine customer reviews of
        # comparable products, so the recommendation stays grounded in real
        # language - see services/review_fixtures.py.
        fallback = review_fixtures.get_reviews(category.name, limit=25)
        if fallback:
            logger.warning(
                "Provider reviews unavailable for category '%s' (%s) - using "
                "%d real dataset reviews instead.",
                category.name, exc, len(fallback),
            )
            return fallback
        # No fixtures for this category either: re-raise so the API surfaces
        # a clear 503 rather than silently generating an ungrounded report.
        raise


# How many of the category's top-ranked real listings to record on a
# generated report as its source products.
_SOURCE_PRODUCT_LIMIT = 5


def _collect_source_products(db: Session, category_id: int, product_id: int | None) -> list[dict]:
    """
    Snapshot the real marketplace listings this report is based on, so the
    UI can link back to them and the reader can audit where the analysis
    came from.

    Products with no `url` (i.e. provider-synthesized mock products, which
    have no real listing) are excluded rather than listed link-less: a
    "source" the reader cannot verify is not a useful citation.
    """
    query = db.query(Product).filter(Product.category_id == category_id)
    if product_id is not None:
        query = query.filter(Product.id == product_id)

    rows = query.order_by(Product.opportunity_score.desc()).limit(_SOURCE_PRODUCT_LIMIT).all()
    return [
        {"name": p.name, "asin": p.asin, "url": p.url}
        for p in rows
        if p.url
    ]


def generate_opportunity(
    db: Session,
    category_id: int,
    product_id: int | None = None,
    language: str = "en",
) -> OpportunityReportRead | None:
    """
    Run the full opportunity-generation pipeline for a category (and
    optionally a specific product within it).

    Returns:
        OpportunityReportRead, or None if the category doesn't exist
        (lets the router translate that into an HTTP 404).

    Raises:
        RuntimeError: if the configured LLM provider's API key is missing (propagated
            from the LLM client) - intentional, so the API layer returns
            a clear error rather than fabricating a fake report.
        app.ai.agent.AgentParseError: if the LLM's JSON output can't be
            parsed.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        return None

    # Step 1: trend data (schema, not ORM - includes category_name).
    trend = get_trend_for_category(db, category_id)
    trend_data = {
        "trend_score": trend.trend_score,
        "growth": trend.growth,
        "keywords": trend.keywords,
    }

    llm_client = get_llm_client()
    agent = FurnitureInsightAgent(llm_client=llm_client, rag_module=rag)

    # Step 2: review analysis (real reviews if we have enough, else mock).
    review_texts = _gather_review_texts(db, category, product_id)
    review_analysis = agent.analyze_reviews(reviews=review_texts, language=language)

    # Step 3: RAG enrichment - find similar prior reports (best-effort;
    # query_similar() never raises, it returns [] on any failure).
    query_text = f"{category.name} furniture opportunity addressing: {', '.join(review_analysis.get('pain_points', []))}"
    similar_reports = rag.query_similar(query_text, n_results=3)

    # Step 4: generate the recommendation.
    recommendation = agent.recommend_product(
        category=category,
        trend_data=trend_data,
        review_analysis=review_analysis,
        similar_reports=similar_reports,
        language=language,
    )

    # Step 5: persist.
    report = OpportunityReport(
        category_id=category.id,
        product_name=recommendation["product_name"],
        target_customer=recommendation["target_customer"],
        pain_points=recommendation["pain_points"],
        solution=recommendation["solution"],
        features=recommendation["features"],
        selling_points=recommendation["selling_points"],
        language=language,
        source_products=_collect_source_products(db, category_id, product_id),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Step 6: embed for future RAG queries (best-effort; never raises).
    rag.embed_opportunity_report(report)

    return OpportunityReportRead.model_validate(report)


def list_opportunities(
    db: Session, category_id: int | None = None, skip: int = 0, limit: int = 50
) -> list[OpportunityReportRead]:
    """List previously generated opportunity reports, optionally filtered by category."""
    query = db.query(OpportunityReport)
    if category_id is not None:
        query = query.filter(OpportunityReport.category_id == category_id)

    reports = query.order_by(OpportunityReport.created_at.desc()).offset(skip).limit(limit).all()
    return [OpportunityReportRead.model_validate(r) for r in reports]


def get_opportunity(db: Session, report_id: int) -> OpportunityReportRead | None:
    """Fetch a single opportunity report by id, or None if it doesn't exist."""
    report = db.query(OpportunityReport).filter(OpportunityReport.id == report_id).first()
    if report is None:
        return None
    return OpportunityReportRead.model_validate(report)
