import pytest
from rag_service import search_weather_knowledge, METEOROLOGICAL_KNOWLEDGE_BASE

def test_rag_retrieves_chance_of_rain_concept():
    query = "What does 70% chance of rain mean?"
    res = search_weather_knowledge(query, topic_filter="precipitation")
    assert len(res.matched_items) > 0
    top_item = res.matched_items[0]
    assert "Probability of Precipitation" in top_item.concept_title or "PoP" in top_item.explanation
    assert "PoP = C × A" in top_item.explanation

def test_rag_retrieves_aqi_concept():
    query = "Explain PM2.5 and air quality index levels"
    res = search_weather_knowledge(query, topic_filter="air_quality")
    assert len(res.matched_items) > 0
    top_item = res.matched_items[0]
    assert "Air Quality Index" in top_item.concept_title
    assert "PM2.5" in top_item.explanation

def test_rag_retrieves_uv_index_concept():
    query = "What is UV index and sunscreen protection?"
    res = search_weather_knowledge(query, topic_filter="uv_index")
    assert len(res.matched_items) > 0
    assert "UV Index Scale" in res.matched_items[0].concept_title

def test_rag_retrieves_dew_point_humidity():
    query = "Why is dew point better than relative humidity?"
    res = search_weather_knowledge(query)
    assert len(res.matched_items) > 0
    assert "Relative Humidity vs Dew Point" in res.matched_items[0].concept_title

def test_no_live_weather_forecasts_in_rag():
    """
    CRITICAL MANDATE: RAG knowledge base MUST contain ONLY stable meteorological concepts,
    NEVER live weather forecasts for specific cities or dates.
    """
    for item in METEOROLOGICAL_KNOWLEDGE_BASE:
        # Check that no live city forecasts exist in the RAG corpus
        assert "tomorrow in delhi" not in item.explanation.lower()
        assert "current forecast for" not in item.explanation.lower()
        assert item.topic in ["temperature", "precipitation", "humidity", "wind", "uv_index", "air_quality", "weather_alerts"]
