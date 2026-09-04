import pytest
from schemas import (
    CanonicalLocation, ResolvedDate, CanonicalCurrentWeather,
    ValidatedWeatherContext
)
from llm_service import enforce_ground_truth_guardrails, build_formatter_prompt

def test_guardrail_replaces_hallucinated_temperature():
    """
    CRITICAL TEST REQUIREMENT:
    If API validated temperature is 34.2°C and LLM hallucinates 99°C,
    the final output MUST enforce the validated 34.2°C.
    """
    loc = CanonicalLocation(
        name="Delhi", display_name="Delhi, India",
        latitude=28.6139, longitude=77.2090
    )
    dt = ResolvedDate(
        date_str="2026-09-05", day_name="Saturday",
        relative_description="today", day_offset=0,
        is_forecast=True, is_historical=False
    )
    curr = CanonicalCurrentWeather(
        location="Delhi, India",
        date="2026-09-05",
        temperature_c=34.2,
        temperature_f=93.6,
        apparent_temperature_c=39.0,
        humidity_percent=71,
        precipitation_mm=0.0,
        weather_code=2,
        condition="Partly cloudy",
        wind_speed_kmh=13.5,
        wind_speed_mph=8.4
    )

    context = ValidatedWeatherContext(
        tool_used="get_current_weather",
        location=loc,
        target_date=dt,
        current_weather=curr
    )

    # Simulate an LLM output hallucinating 99°C
    hallucinated_llm_response = (
        "Delhi is experiencing extreme abnormal weather today! "
        "The current temperature is 99°C and it feels sweltering."
    )

    corrected_response = enforce_ground_truth_guardrails(hallucinated_llm_response, context)
    
    # Assert 99°C was replaced and 34.2°C is present in final answer
    assert "99°C" not in corrected_response
    assert "34.2°C" in corrected_response

def test_guardrail_when_data_unavailable():
    """
    When API has no weather data (e.g. out of range or API failure),
    the system must return a clear unavailable message and NOT invent values.
    """
    loc = CanonicalLocation(
        name="Unknown City", display_name="Unknown City",
        latitude=0.0, longitude=0.0
    )
    dt = ResolvedDate(
        date_str="2026-09-05", day_name="Saturday",
        relative_description="today", day_offset=0,
        is_forecast=True, is_historical=False
    )

    context = ValidatedWeatherContext(
        tool_used="get_current_weather",
        location=loc,
        target_date=dt,
        is_unavailable=True,
        unavailability_reason="Weather service data currently unavailable for Unknown City."
    )

    output = enforce_ground_truth_guardrails("Some hallucinated weather report", context)
    assert "unavailable" in output.lower()
    assert "Unknown City" in output
