"""
All LLM prompt strings live in this module, and nowhere else.

Rationale: centralizing prompts makes them easy to review, version, and
tune independently of the agent orchestration logic in app.ai.agent.
Every prompt-builder function returns a plain string; system prompts are
module-level constants.
"""

import json


# ---------------------------------------------------------------------------
# Shared persona
# ---------------------------------------------------------------------------

SYSTEM_PERSONA = (
    "You are Furniture Market Insight AI, a senior product strategist and "
    "market analyst specializing in the home furniture industry. You have "
    "deep expertise in consumer behavior, e-commerce review analysis, "
    "furniture manufacturing constraints, and new-product development. "
    "You communicate in precise, business-actionable language and you "
    "always ground your reasoning in the data provided to you rather than "
    "generic industry platitudes."
)


# ---------------------------------------------------------------------------
# Market analysis
# ---------------------------------------------------------------------------

MARKET_ANALYSIS_SYSTEM = (
    SYSTEM_PERSONA
    + "\n\nYour current task is MARKET ANALYSIS: given a furniture category's "
    "trend metrics, explain what is driving the trend and what it implies "
    "for a business considering entering or expanding in this category. "
    "Respond with ONLY valid JSON, no markdown code fences, no commentary "
    "before or after the JSON."
)


def market_analysis_prompt(
    category_name: str,
    description: str,
    trend_score: float,
    growth: str,
    keywords: list[str],
) -> str:
    """Build the user prompt for a category-level market analysis."""
    keyword_str = ", ".join(keywords) if keywords else "(none provided)"
    return (
        f"Analyze the following furniture market category.\n\n"
        f"Category: {category_name}\n"
        f"Description: {description}\n"
        f"Trend score (0-100, higher = stronger market momentum): {trend_score}\n"
        f"Growth direction: {growth}\n"
        f"Associated keywords: {keyword_str}\n\n"
        "Respond with ONLY valid JSON matching this exact shape:\n"
        "{\n"
        '  "summary": "<2-3 sentence analysis of the trend and its drivers>",\n'
        '  "opportunity_level": "<Low|Medium|High>",\n'
        '  "recommended_focus": "<one concrete area of focus for a new entrant>"\n'
        "}\n"
    )


# ---------------------------------------------------------------------------
# Review analysis (aspect-based sentiment)
# ---------------------------------------------------------------------------

REVIEW_ANALYSIS_SYSTEM = (
    SYSTEM_PERSONA
    + "\n\nYour current task is ASPECT-BASED SENTIMENT ANALYSIS of customer "
    "product reviews. Identify recurring positive themes, recurring "
    "negative themes, and - most importantly - specific, actionable pain "
    "points that a new product could solve. Pain points must be concrete "
    "(e.g. 'drawers are too shallow for folded towels'), never vague "
    "(e.g. 'quality issues'). "
    "Respond with STRICT, VALID JSON ONLY. Do not wrap the JSON in markdown "
    "code fences. Do not include any explanation before or after the JSON."
)


def review_analysis_prompt(reviews: list[str]) -> str:
    """
    Build the user prompt for analyzing a batch of raw review strings.

    Reviews are numbered so the model can reference/aggregate them, and a
    literal example of the expected output shape is embedded to reduce
    formatting drift.
    """
    numbered = "\n".join(f"{i + 1}. {r}" for i, r in enumerate(reviews))
    example = {
        "positive": ["Sturdy construction", "Great value for the price"],
        "negative": ["Assembly is difficult", "Color slightly differs from photos"],
        "pain_points": [
            "Assembly instructions lack clear diagrams for step 4",
            "Drawer slides stick after a few weeks of use",
        ],
    }
    return (
        f"Analyze the following {len(reviews)} customer reviews:\n\n"
        f"{numbered}\n\n"
        "Respond with ONLY valid JSON matching exactly this shape "
        "(field names must match exactly, values are illustrative):\n"
        f"{json.dumps(example, indent=2)}\n\n"
        "Rules:\n"
        "- 'positive' and 'negative' are short recurring themes (3-8 words each).\n"
        "- 'pain_points' must be specific and actionable, suitable for driving "
        "new product design decisions.\n"
        "- Do not invent information not implied by the reviews.\n"
        "- Respond with ONLY the JSON object, no markdown fences, no prose."
    )


# ---------------------------------------------------------------------------
# Opportunity report generation (product strategist)
# ---------------------------------------------------------------------------

OPPORTUNITY_REPORT_SYSTEM = (
    SYSTEM_PERSONA
    + "\n\nYour current task is NEW PRODUCT OPPORTUNITY GENERATION. You act "
    "as a product strategist synthesizing market trend data and customer "
    "review analysis into a concrete, buildable new-product recommendation. "
    "Your recommendation must directly address the given pain points and "
    "capitalize on the given market trend. "
    "Respond with STRICT, VALID JSON ONLY - no markdown fences, no prose "
    "outside the JSON object."
)


def opportunity_prompt(
    category_name: str,
    trend_score: float,
    growth: str,
    keywords: list[str],
    pain_points: list[str],
    positive_aspects: list[str],
    similar_reports: list[dict] | None = None,
) -> str:
    """
    Build the user prompt for generating a full opportunity report.

    `similar_reports` (optional) is the RAG-retrieved list of previously
    generated reports (see app.ai.rag.query_similar) used to nudge the
    model toward differentiation from what has already been proposed.
    """
    keyword_str = ", ".join(keywords) if keywords else "(none provided)"
    pain_point_str = "\n".join(f"- {p}" for p in pain_points) or "(none identified)"
    positive_str = "\n".join(f"- {p}" for p in positive_aspects) or "(none identified)"

    similar_block = ""
    if similar_reports:
        lines = "\n".join(
            f"- {r.get('product_name', 'Unknown')}: {r.get('solution', '')}"
            for r in similar_reports
        )
        similar_block = (
            "\n\nPreviously generated opportunity reports in similar categories "
            "(for context - propose something clearly differentiated, do not "
            f"just repeat these):\n{lines}\n"
        )

    return (
        f"Category: {category_name}\n"
        f"Trend score (0-100): {trend_score}\n"
        f"Growth direction: {growth}\n"
        f"Category keywords: {keyword_str}\n\n"
        f"Customer pain points identified from reviews:\n{pain_point_str}\n\n"
        f"Positive aspects customers already value:\n{positive_str}"
        f"{similar_block}\n\n"
        "Based on the above, generate ONE concrete new product opportunity. "
        "Respond with ONLY valid JSON matching exactly this shape:\n"
        "{\n"
        '  "product_name": "<a specific, marketable product name>",\n'
        '  "target_customer": "<1-2 sentence description of the ideal buyer>",\n'
        '  "pain_points": ["<pain point this product solves>", "..."],\n'
        '  "solution": "<2-4 sentence description of how the product solves the pain points>",\n'
        '  "features": ["<concrete feature>", "..."],\n'
        '  "selling_points": ["<concrete marketing selling point>", "..."]\n'
        "}\n"
    )
