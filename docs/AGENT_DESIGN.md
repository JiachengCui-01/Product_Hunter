# AI Agent Design

## v1: single `FurnitureInsightAgent`

Location: `backend/app/ai/agent.py`

```python
class FurnitureInsightAgent:
    def __init__(self, llm_client, rag_module=None):
        self.llm = llm_client
        self.rag = rag_module
        self.tools = {
            "analyze_market": self.analyze_market,
            "analyze_reviews": self.analyze_reviews,
            "recommend_product": self.recommend_product,
        }

    def run(self, task: str, **kwargs):
        return self.tools[task](**kwargs)
```

Three responsibilities, one method each:

| Method | Responsibility | Prompt used (from `prompts.py`) |
|---|---|---|
| `analyze_market(category, trend_data)` | Commentary on why a trend score/growth makes sense | `market_analysis_prompt()` |
| `analyze_reviews(reviews: list[str])` | Aspect-Based Sentiment Analysis → `{positive, negative, pain_points}` | `review_analysis_prompt()` |
| `recommend_product(category, trend_data, review_analysis, similar_reports=None)` | Synthesizes a new-product opportunity report | `opportunity_prompt()` |

All three funnel through a private `_call_llm_json(system, prompt)` helper that
calls the LLM, strips markdown code fences, and `json.loads()`s the result —
raising a typed `AgentParseError` (with the raw text attached) on malformed output.
This keeps JSON-parsing/error-handling logic in exactly one place.

## Why this shape, specifically

The agent is deliberately **not** a single monolithic prompt/call. Each
responsibility is:
1. An independently callable method with its own typed inputs/outputs.
2. Registered in a `tools` dict keyed by a stable string name.
3. Backed by its own prompt-building function in `prompts.py` — no prompt text
   lives in `agent.py` itself.

Every caller (`api/analysis.py`, `services/opportunity_service.py`, etc.) invokes
the agent by tool name — `agent.tools["analyze_reviews"](reviews=texts)` or
`agent.run("analyze_reviews", reviews=texts)` — never by reaching into the class
directly. This is what makes the future refactor cheap.

## Future: Router Agent

```
Router Agent
│
├── Trend Agent     (absorbs analyze_market)
├── Review Agent    (absorbs analyze_reviews)
├── Design Agent     (new — product/visual design generation)
└── Cost Agent       (new — pricing/BOM cost estimation)
```

Migration path: each specialist agent class exposes the *same* `tools` dict shape
(e.g. `TrendAgent.tools = {"analyze_market": ...}`). `RouterAgent.route(task, **kwargs)`
looks up which specialist owns `task` and delegates. Because every existing call
site already calls by tool name (never by class internals), this refactor is:
**move a method from `FurnitureInsightAgent` into a new specialist class** — not a
rewrite of `api/`/`services/` code.

## `prompts.py` convention

All prompt engineering lives in `backend/app/ai/prompts.py`, structured as:
- Named **constants** for system/persona framing (`SYSTEM_PERSONA`,
  `REVIEW_ANALYSIS_SYSTEM`, `OPPORTUNITY_REPORT_SYSTEM`, ...).
- Named **functions** for parameterized user prompts (`review_analysis_prompt(reviews)`,
  `opportunity_prompt(category_name, trend_score, ...)`) that do pure string
  assembly — no LLM calls, no business logic, no I/O.

This isolates prompt iteration from everything else: changing how the AI is asked
to do something never requires touching `agent.py`, a service, or an API route.

## RAG (`ai/rag.py`) — v1 real use case

ChromaDB runs embedded (local persistent directory, no server). The one concrete
v1 wiring:

1. After an `OpportunityReport` is generated and saved, `embed_opportunity_report()`
   embeds a text summary of it into the `opportunity_reports` Chroma collection.
2. Before generating a *new* report, `opportunity_service.py` calls `query_similar()`
   to fetch the most similar past reports, and passes them into
   `recommend_product(..., similar_reports=...)` so the LLM can build on (and
   differentiate from) prior ideas instead of starting from zero every time.

`embed_review_batch()` exists with a full docstring but is **intentionally not
called** in v1 — it's reserved for a future semantic review-search feature so we
don't scope-creep the MVP into a full knowledge-base page.

## Future: enterprise knowledge base

Expand `rag.py` beyond opportunity reports: activate `embed_review_batch()`, embed
category descriptions and market commentary too, and add a dedicated
`/api/knowledge/search` endpoint + a "Knowledge Search" page querying across all
embedded content types.
