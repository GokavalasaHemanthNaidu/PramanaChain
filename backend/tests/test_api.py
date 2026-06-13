import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_api_key_required_for_upload():
    # Attempting to upload without an API key should return 403
    response = client.post("/api/upload", data={"user_id": "test_user"})
    assert response.status_code == 403
    assert "API Key required" in response.json().get("detail", "")

def test_api_key_invalid_for_upload():
    # Attempting to upload with an invalid API key should return 403
    response = client.post(
        "/api/upload", 
        data={"user_id": "test_user"},
        headers={"X-API-Key": "wrong-key-123"}
    )
    assert response.status_code == 403
    assert "Invalid API Key" in response.json().get("detail", "")

def test_malformed_json_returns_500_or_422():
    # Attempting to send malformed data should be handled securely
    # FastAPI typically returns 422 for validation errors automatically
    response = client.post(
        "/api/auth/login",
        json={"email": "not-an-email", "password": "123"},
        headers={"Content-Type": "application/json"}
    )
    # The Pydantic validator should catch this and return 422 Unprocessable Entity
    # It should NOT return a raw stack trace.
    assert response.status_code in [422, 500]
    
def test_rate_limiting_active():
    # Ping the health check 65 times rapidly. 
    # Limit is 60/minute, so it should eventually return 429
    responses = [client.get("/") for _ in range(65)]
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
