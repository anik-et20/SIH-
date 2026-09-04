import pytest
import httpx
from main import app
from llm_service import generate_weather_response

@pytest.mark.asyncio
async def test_root_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "WeatherGPT" in data["service"]

@pytest.mark.asyncio
async def test_chat_pipeline_current_weather():
    response_text, lang, context = await generate_weather_response(
        user_query="What is the weather in Mumbai today?",
        location_str="Mumbai",
        persona="citizen",
        language="en"
    )
    assert response_text is not None
    assert len(response_text) > 0
    assert context.tool_used in ["get_current_weather", "get_hourly_forecast"]
    assert context.current_weather is not None
    assert "Mumbai" in context.location.display_name
    temp_c = context.current_weather.temperature_c
    assert (
        str(temp_c) in response_text or
        f"{temp_c}°C" in response_text or
        str(int(temp_c)) in response_text or
        str(round(temp_c)) in response_text
    )

@pytest.mark.asyncio
async def test_chat_pipeline_rag_concept():
    response_text, lang, context = await generate_weather_response(
        user_query="What does 70% chance of rain mean?",
        persona="citizen",
        language="en"
    )
    assert context.tool_used == "explain_weather_concept"
    assert context.rag_knowledge is not None
    assert "Probability of Precipitation" in context.rag_knowledge.context_text or "PoP" in context.rag_knowledge.context_text

@pytest.mark.asyncio
async def test_api_chat_endpoint():
    payload = {
        "query": "What is the weather in Delhi?",
        "location": "Delhi",
        "persona": "citizen",
        "language": "en",
        "generate_audio": False
    }
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "raw_weather" in data
    assert "deterministic_metadata" in data

@pytest.mark.asyncio
async def test_api_rag_endpoint():
    payload = {
        "concept": "Explain UV index",
        "topic": "uv_index"
    }
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/rag", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["matched_items"]) > 0
    assert "UV Index Scale" in data["context_text"]
