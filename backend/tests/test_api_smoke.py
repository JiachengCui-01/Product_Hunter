"""
Minimal smoke tests using FastAPI's TestClient.

These verify the app boots correctly and the most basic endpoints
respond, without requiring any AI provider keys to be configured. Run
with:

    pytest tests/test_api_smoke.py -v
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """/health should always return 200 with a status field."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_list_categories_returns_200_and_a_list():
    """/api/categories should return 200 and a JSON list (possibly empty)."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)


def test_get_nonexistent_category_returns_404():
    """Fetching a category id that doesn't exist should 404 with a clear message."""
    response = client.get("/api/categories/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
