import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Ensure backend directory is in sys.path
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

@pytest.fixture
def sample_request():
    """A minimal valid request for the /api/retirement/ask-ai endpoint."""
    return {
        "question": "How can I make my retirement plan more resilient?",
        "profile": {"age": 48, "assets": 1000000, "monthlyExpenses": 6000},
        "results": [
            {"month": 1, "balance": 995000},
            {"month": 2, "balance": 990000}
        ]
    }


@patch("main.generate_ai_response")
def test_ask_ai_endpoint(mock_ai_response, sample_request):
    """Tests the ask-ai endpoint using a mocked AI response."""
    # Arrange: set mock return value
    mock_ai_response.return_value = {"answer": "Diversify your investments."}

    # Act: send POST request
    response = client.post("/api/retirement/ask-ai", json=sample_request)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "Diversify your investments."
    mock_ai_response.assert_called_once()

@patch("main.generate_ai_response", side_effect=Exception("Mocked failure"))
def test_ask_ai_endpoint_error_handling(mock_ai_response, sample_request):
    """Tests if the endpoint returns HTTP 500 on AI service failure."""
    response = client.post("/api/retirement/ask-ai", json=sample_request)

    assert response.status_code == 500
    assert "detail" in response.json()
    assert response.json()["detail"] == "Mocked failure"
