"""
FurnitureInsightAgent - the current (Phase 1-5) single-agent implementation
of all AI reasoning tasks for this product.

=============================================================================
FUTURE MIGRATION PATH (see AGENT_DESIGN in the project plan)
=============================================================================
This agent currently exposes three "tools" (analyze_market, analyze_reviews,
recommend_product) as bound methods on one class, dispatched through a
`self.tools` dict and a generic `run(task, **kwargs)` entry point.

In a future phase, a `RouterAgent` will be introduced that routes each task
to a *specialist* agent class instead of a single monolithic agent:

    TrendAgent      -> handles analyze_market
    ReviewAgent     -> handles analyze_reviews
    DesignAgent     -> handles recommend_product (product/feature design)
    CostAgent       -> (new) handles manufacturing/cost estimation

Each specialist agent will expose the *same* `self.tools = {...}` dict shape
and the *same* `run(task, **kwargs)` dispatch method as this class does
today. The RouterAgent will simply pick which specialist's `tools` dict
contains the requested task name and delegate to it. Because call sites
throughout app.services.* only ever call `agent.analyze_market(...)`,
`agent.analyze_reviews(...)`, `agent.recommend_product(...)`, or generically
`agent.run(task, **kwargs)`, none of them will need to change when this
migration happens - only this module (and a new router module) will.
=============================================================================
"""

import json
import re

from app.ai.llm_client import LLMClient
from app.ai.prompts import (
    MARKET_ANALYSIS_SYSTEM,
    market_analysis_prompt,
    REVIEW_ANALYSIS_SYSTEM,
    review_analysis_prompt,
    OPPORTUNITY_REPORT_SYSTEM,
    opportunity_prompt,
)
from app.core.logging import get_logger

logger = get_logger(__name__)

# Matches a fenced code block like ```json ... ``` or ``` ... ``` so we can
# strip it before attempting json.loads(), since some LLMs wrap JSON in
# markdown fences despite being instructed not to.
_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class AgentParseError(Exception):
    """
    Raised when the LLM's response cannot be parsed as valid JSON.

    Carries the raw, unmodified LLM output text so callers/logs can
    inspect exactly what the model returned (useful for prompt tuning).
    """

    def __init__(self, message: str, raw_text: str):
        super().__init__(f"{message}\n--- raw LLM output ---\n{raw_text}")
        self.raw_text = raw_text


class FurnitureInsightAgent:
    """
    The single agent responsible for all three AI reasoning tasks in this
    product today: market analysis, review sentiment analysis, and new
    product opportunity recommendation.

    Args:
        llm_client: an object implementing LLMClient.complete(system, prompt) -> str
        rag_module: optional module/object exposing query_similar(...) etc.
            (app.ai.rag is passed in by services that need RAG enrichment;
            it is optional so the agent can be unit-tested without Chroma).
    """

    def __init__(self, llm_client: LLMClient, rag_module=None):
        self.llm = llm_client
        self.rag = rag_module

        # Tool registry - see the module docstring for why this shape
        # matters for the future RouterAgent migration.
        self.tools = {
            "analyze_market": self.analyze_market,
            "analyze_reviews": self.analyze_reviews,
            "recommend_product": self.recommend_product,
        }

    def run(self, task: str, **kwargs):
        """
        Generic dispatch entry point: `agent.run("analyze_reviews", reviews=[...])`
        is equivalent to `agent.analyze_reviews(reviews=[...])`.

        Raises KeyError (via dict access) with a clear message if `task`
        is not a registered tool name.
        """
        if task not in self.tools:
            raise KeyError(
                f"Unknown agent task {task!r}. Available tools: {list(self.tools.keys())}"
            )
        return self.tools[task](**kwargs)

    # ------------------------------------------------------------------
    # Internal helper
    # ------------------------------------------------------------------

    def _call_llm_json(self, system: str, prompt: str) -> dict:
        """
        Call the LLM and parse its response as JSON.

        Strips markdown code fences defensively (some models add them
        even when instructed not to), then json.loads()s the result.

        Raises:
            AgentParseError: if the (fence-stripped) text is not valid JSON.
                The raw, un-stripped LLM text is attached for debugging.
        """
        raw_text = self.llm.complete(system=system, prompt=prompt)
        cleaned = _CODE_FENCE_RE.sub("", raw_text).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse LLM response as JSON: %s", exc)
            raise AgentParseError(
                f"LLM response was not valid JSON ({exc})", raw_text
            ) from exc

    # ------------------------------------------------------------------
    # Public tools
    # ------------------------------------------------------------------

    def analyze_market(self, category, trend_data: dict, language: str = "en") -> dict:
        """
        Analyze a category's market trend data and return a summary dict.

        Args:
            category: a Category ORM instance (or any object with .name
                and .description attributes).
            trend_data: dict with keys trend_score, growth, keywords.

        Returns:
            dict with keys: summary (str), opportunity_level (str),
            recommended_focus (str).
        """
        prompt = market_analysis_prompt(
            category_name=category.name,
            description=category.description or "",
            trend_score=trend_data.get("trend_score", 0.0),
            growth=trend_data.get("growth", "Stable"),
            keywords=trend_data.get("keywords", []),
            language=language,
        )
        return self._call_llm_json(MARKET_ANALYSIS_SYSTEM, prompt)

    def analyze_reviews(self, reviews: list[str], language: str = "en") -> dict:
        """
        Run aspect-based sentiment analysis over a batch of raw review
        strings.

        Returns:
            dict shaped like ReviewAnalysisResponse:
            {"positive": [...], "negative": [...], "pain_points": [...]}
        """
        prompt = review_analysis_prompt(reviews, language=language)
        result = self._call_llm_json(REVIEW_ANALYSIS_SYSTEM, prompt)
        # Defensively normalize shape in case the model omits a key.
        return {
            "positive": result.get("positive", []),
            "negative": result.get("negative", []),
            "pain_points": result.get("pain_points", []),
        }

    def recommend_product(
        self,
        category,
        trend_data: dict,
        review_analysis: dict,
        similar_reports: list[dict] | None = None,
        language: str = "en",
    ) -> dict:
        """
        Generate a full new-product opportunity recommendation.

        Args:
            category: a Category ORM instance (or object with .name).
            trend_data: dict with keys trend_score, growth, keywords.
            review_analysis: dict with keys positive, negative, pain_points
                (typically the output of analyze_reviews).
            similar_reports: optional RAG-retrieved list of prior reports
                (see app.ai.rag.query_similar) used to steer the model
                toward differentiated recommendations.

        Returns:
            dict shaped like OpportunityReportRead minus id/created_at:
            {product_name, target_customer, pain_points, solution,
             features, selling_points}
        """
        prompt = opportunity_prompt(
            category_name=category.name,
            trend_score=trend_data.get("trend_score", 0.0),
            growth=trend_data.get("growth", "Stable"),
            keywords=trend_data.get("keywords", []),
            pain_points=review_analysis.get("pain_points", []),
            positive_aspects=review_analysis.get("positive", []),
            similar_reports=similar_reports,
            language=language,
        )
        result = self._call_llm_json(OPPORTUNITY_REPORT_SYSTEM, prompt)
        return {
            "product_name": result.get("product_name", ""),
            "target_customer": result.get("target_customer", ""),
            "pain_points": result.get("pain_points", []),
            "solution": result.get("solution", ""),
            "features": result.get("features", []),
            "selling_points": result.get("selling_points", []),
        }
