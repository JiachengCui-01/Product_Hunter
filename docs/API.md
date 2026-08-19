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

### `GET /api/products?category_id=1&sort_by=opportunity_score&order=desc`
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
    "opportunity_score": 78.4,
    "demand_score": 82.1
  }
]
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

## Review Analysis (AI — requires `ANTHROPIC_API_KEY`)

### `POST /api/analysis/reviews`
Aspect-Based Sentiment Analysis over a batch of reviews.
Request:
```json
{ "reviews": [{ "review": "Looks beautiful but drawers are too small" }] }
```
Response:
```json
{
  "positive": ["design", "appearance"],
  "negative": ["storage capacity"],
  "pain_points": ["drawer too shallow"]
}
```
Returns `503`/clear error JSON (not a stack trace) if `ANTHROPIC_API_KEY` is unset.

---

## Opportunity Reports (AI — requires `ANTHROPIC_API_KEY`)

### `POST /api/opportunities/generate`
Combines market trend + review analysis (+ similar past reports via RAG) into a new
product opportunity report.
Request:
```json
{ "category_id": 1, "product_id": null }
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
  "created_at": "2026-08-19T10:05:00Z"
}
```

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
