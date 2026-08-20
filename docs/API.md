# API Reference

Base URL (local dev): `http://localhost:8000`

All endpoints are prefixed `/api` except `/health`. All responses are JSON.

---

## Health

### `GET /health`
Liveness check.
```json
{ "status": "ok" }
```

---

## Categories

### `GET /api/categories`
List all furniture categories.
```json
[
  {
    "id": 1,
    "name": "Laundry Room",
    "description": "Storage and organization furniture for laundry spaces.",
    "keywords": ["laundry storage", "washer dryer cabinet", "folding station"]
  }
]
```

### `GET /api/categories/{id}`
Single category detail (same shape as above, 404 if not found).

### `POST /api/categories`
Create a new category (supports adding categories beyond the initial 7).
Request:
```json
{ "name": "Kids Room", "description": "...", "keywords": ["bunk bed", "toy storage"] }
```
Response: the created `CategoryRead` object.

---

## Market Trends

### `GET /api/trends/{category_id}`
```json
{
  "category_id": 1,
  "category_name": "Laundry Room",
  "trend_score": 85,
  "growth": "Increasing",
  "keywords": ["laundry storage", "washer dryer cabinet"]
}
```
`growth` is one of `"Increasing" | "Stable" | "Decreasing"`.

---

## Products

### `GET /api/products`
Query params (all optional): `category_id`, `min_price`, `max_price`,
`min_rating` (0-5), `material` (comma-separated, matches ANY),
`sort_by`, `order` (`asc`|`desc`), `skip`, `limit`.

Returns `422` if `min_price > max_price`.

```json
[
  {
    "id": 12,
    "name": "Vertical Laundry Storage Cabinet",
    "category_id": 1,
    "price": 249.99,
    "rating": 4.3,
    "review_count": 812,
    "features": ["adjustable shelves", "wheeled base", "soft-close doors"],
    "material": ["Engineered Wood", "Steel"],
    "asin": "B0ABC12345",
    "url": "https://www.amazon.com/dp/B0ABC12345",
    "opportunity_score": 78.4,
    "demand_score": 82.1,
    "score_breakdown": {
      "rating_norm": 86.0,
      "demand_score": 82.1,
      "trend_score": 77.3,
      "weights": { "rating": 0.35, "demand": 0.40, "trend": 0.25 },
      "demand_formula": "log10(review_count + 1) / log10(5001) * 100, clamped to 5-100",
      "opportunity_formula": "0.35 * rating_norm + 0.40 * demand_score + 0.25 * trend_score"
    }
  }
]
```
`material` may be `[]` when the listing text names no recognizable material.
`asin`/`url` are `null` for provider-synthesized (mock) products, which have
no real listing to link to.

`score_breakdown` exists so a ranking can be audited rather than taken on
trust: substituting its values into `opportunity_formula` reproduces
`opportunity_score` exactly. The weights and formula strings are emitted by
the same module that computes the score, so they cannot drift from it.

### `GET /api/products/facets?category_id=1`
Filter metadata for building the filter UI from the data that actually
exists (`category_id` optional; omit for all categories).
```json
{
  "price_min": 45.99,
  "price_max": 1499.99,
  "rating_min": 3.3,
  "rating_max": 4.6,
  "materials": [ { "value": "Corduroy", "count": 3 }, { "value": "Leather", "count": 1 } ]
}
```

### `GET /api/products/{id}`
Single product (same shape, 404 if not found).

---

## Reviews

### `POST /api/reviews`
Submit a batch of raw reviews for storage.
Request:
```json
{
  "product_id": 12,
  "category_id": null,
  "reviews": [{ "review": "Looks beautiful but drawers are too small" }]
}
```
Response:
```json
{ "count": 1, "review_ids": [301] }
```

### `GET /api/reviews?product_id=12`
```json
[{ "id": 301, "review_text": "Looks beautiful but drawers are too small", "submitted_at": "2026-08-19T10:00:00Z" }]
```

---

## Review Analysis (AI — requires `DEEPSEEK_API_KEY`, or `ANTHROPIC_API_KEY` if `LLM_PROVIDER=anthropic`)

### `POST /api/analysis/reviews`
Aspect-Based Sentiment Analysis over a batch of reviews.
Request (`language` optional, `"en"` | `"zh"`, defaults to `"en"`):
```json
{
  "reviews": [{ "review": "Looks beautiful but drawers are too small" }],
  "language": "zh"
}
```
`language` controls the language of the returned aspect labels and pain
points. JSON keys always stay English - only values are localized.
Response:
```json
{
  "positive": ["design", "appearance"],
  "negative": ["storage capacity"],
  "pain_points": ["drawer too shallow"]
}
```
Returns `503`/clear error JSON (not a stack trace) if the configured provider's API key is unset.

---

## Opportunity Reports (AI — requires `DEEPSEEK_API_KEY`, or `ANTHROPIC_API_KEY` if `LLM_PROVIDER=anthropic`)

### `POST /api/opportunities/generate`
Combines market trend + review analysis (+ similar past reports via RAG) into a new
product opportunity report.
Request (`language` optional, `"en"` | `"zh"`, defaults to `"en"`):
```json
{ "category_id": 1, "product_id": null, "language": "zh" }
```
Response:
```json
{
  "id": 5,
  "category_id": 1,
  "product_name": "Vertical Laundry Station",
  "target_customer": "Apartment dwellers with limited laundry room space",
  "pain_points": ["drawers too shallow for towels", "no room for detergent storage"],
  "solution": "A slim vertical cabinet that maximizes storage in tight footprints",
  "features": ["stackable modular bins", "fold-out ironing surface", "wheeled base"],
  "selling_points": ["saves floor space", "tool-free assembly", "matches modern decor"],
  "language": "en",
  "source_products": [
    {
      "name": "OKZEST Slim Laundry Room Organization Cart ...",
      "asin": "B0ABC12345",
      "url": "https://www.amazon.com/dp/B0ABC12345"
    }
  ],
  "created_at": "2026-08-19T10:05:00Z"
}
```
`language` records which language the stored prose is actually in (a past
report cannot be re-rendered in another language without re-running the
model). `source_products` is the set of real listings the report was based
on, snapshotted at generation time; it is empty when generated from mock
data, and listings without a real URL are omitted rather than shown as
unverifiable citations.

### `GET /api/opportunities?category_id=1`
List past reports for a category (or all, if omitted).

### `GET /api/opportunities/{id}`
Single report detail.

---

## Dashboard

### `GET /api/dashboard/summary`
```json
{
  "category_count": 7,
  "report_count": 3,
  "trending_categories": [
    { "category_id": 1, "name": "Laundry Room", "trend_score": 85, "growth": "Increasing" }
  ]
}
```
