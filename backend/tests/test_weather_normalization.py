import pytest
from unittest.mock import patch, AsyncMock
from schemas import CanonicalLocation, ResolvedDate
from weather_service import fetch_current_weather, fetch_hourly_forecast, fetch_daily_forecast, fetch_air_quality

SAMPLE_LOCATION = CanonicalLocation(
    name="Pune",
    display_name="Pune, Maharashtra, India",
    latitude=18.5204,
    longitude=73.8567,
    timezone="Asia/Kolkata"
)

SAMPLE_DATE = ResolvedDate(
    date_str="2026-09-05",
    day_name="Saturday",
    relative_description="tomorrow",
    day_offset=1,
    is_forecast=True,
    is_historical=False,
    is_valid_forecast_range=True
)

@pytest.mark.asyncio
async def test_fetch_current_weather_normalization():
    mock_response_data = {
        "current": {
            "temperature_2m": 34.2,
            "apparent_temperature": 39.1,
            "relative_humidity_2m": 71,
            "precipitation": 0.0,
            "weather_code": 2,
            "wind_speed_10m": 13.5,
            "wind_direction_10m": 240,
            "surface_pressure": 1012.3,
            "is_day": 1
        },
        "hourly": {
            "precipitation_probability": [15, 20],
            "uv_index": [6.2, 7.1]
        }
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: mock_response_data
        mock_get.return_value = mock_resp

        canonical = await fetch_current_weather(SAMPLE_LOCATION, SAMPLE_DATE)
        
        assert canonical.temperature_c == 34.2
        assert canonical.temperature_f == 93.6
        assert canonical.humidity_percent == 71
        assert canonical.condition == "Partly cloudy"
        assert canonical.wind_speed_kmh == 13.5
        assert canonical.wind_speed_mph == 8.4
        assert canonical.precipitation_probability == 15

@pytest.mark.asyncio
async def test_corrupted_api_response_rejection():
    # Corrupted response missing 'current' block
    corrupted_data = {"elevation": 560}

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: corrupted_data
        mock_get.return_value = mock_resp

        with pytest.raises(ValueError):
            await fetch_current_weather(SAMPLE_LOCATION, SAMPLE_DATE)

@pytest.mark.asyncio
async def test_api_network_failure_rejection():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 503
        mock_get.return_value = mock_resp

        with pytest.raises(RuntimeError):
            await fetch_current_weather(SAMPLE_LOCATION, SAMPLE_DATE)
