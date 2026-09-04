import pytest
from datetime import date
from date_service import resolve_date_string
from geo_service import resolve_location

# ==========================================
# 1. DETERMINISTIC DATE RESOLUTION TESTS
# ==========================================

def test_resolve_today():
    ref = date(2026, 9, 4) # Friday
    res = resolve_date_string("today", ref_date=ref)
    assert res.date_str == "2026-09-04"
    assert res.day_name == "Friday"
    assert res.day_offset == 0
    assert res.is_forecast is True
    assert res.is_historical is False

def test_resolve_tomorrow():
    ref = date(2026, 9, 4) # Friday
    res = resolve_date_string("tomorrow", ref_date=ref)
    assert res.date_str == "2026-09-05"
    assert res.day_name == "Saturday"
    assert res.day_offset == 1
    assert res.relative_description == "tomorrow"

def test_resolve_yesterday():
    ref = date(2026, 9, 4) # Friday
    res = resolve_date_string("yesterday", ref_date=ref)
    assert res.date_str == "2026-09-03"
    assert res.day_name == "Thursday"
    assert res.day_offset == -1
    assert res.is_historical is True

def test_resolve_in_n_days():
    ref = date(2026, 9, 4) # Friday
    res = resolve_date_string("in 4 days", ref_date=ref)
    assert res.date_str == "2026-09-08"
    assert res.day_offset == 4
    assert res.day_name == "Tuesday"

def test_resolve_weekday():
    ref = date(2026, 9, 4) # Friday
    res = resolve_date_string("next monday", ref_date=ref)
    assert res.day_name == "Monday"
    assert res.date_str == "2026-09-07"
    assert res.day_offset == 3

def test_resolve_iso_date():
    ref = date(2026, 9, 4)
    res = resolve_date_string("2026-09-10", ref_date=ref)
    assert res.date_str == "2026-09-10"
    assert res.day_offset == 6

def test_invalid_forecast_range():
    ref = date(2026, 9, 4)
    res = resolve_date_string("in 40 days", ref_date=ref)
    assert res.day_offset == 40
    assert res.is_valid_forecast_range is False # beyond 16 days

# ==========================================
# 2. LOCATION RESOLUTION & AMBIGUITY TESTS
# ==========================================

@pytest.mark.asyncio
async def test_coordinates_resolution():
    loc = await resolve_location("", lat=18.5204, lon=73.8567)
    assert loc.latitude == 18.5204
    assert loc.longitude == 73.8567
    assert loc.is_ambiguous is False

@pytest.mark.asyncio
async def test_specific_location_resolution():
    loc = await resolve_location("Mumbai, India")
    assert loc.is_ambiguous is False
    assert "Mumbai" in loc.name or "Mumbai" in loc.display_name
    assert loc.latitude is not None
    assert loc.longitude is not None

@pytest.mark.asyncio
async def test_empty_location_raises_error():
    with pytest.raises(ValueError):
        await resolve_location("   ")

@pytest.mark.asyncio
async def test_ambiguous_location_not_guessed():
    """
    When searching for a bare, highly ambiguous name like 'Springfield',
    the system must detect ambiguity and return candidate options
    rather than guessing.
    """
    from unittest.mock import patch, AsyncMock
    mock_results = {
        "results": [
            {"name": "Springfield", "admin1": "Missouri", "country": "United States", "latitude": 37.21, "longitude": -93.29, "population": 169000, "timezone": "America/Chicago"},
            {"name": "Springfield", "admin1": "Illinois", "country": "United States", "latitude": 39.80, "longitude": -89.64, "population": 114000, "timezone": "America/Chicago"},
            {"name": "Springfield", "admin1": "Massachusetts", "country": "United States", "latitude": 42.10, "longitude": -72.58, "population": 155000, "timezone": "America/New_York"}
        ]
    }
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: mock_results
        mock_get.return_value = mock_resp

        loc = await resolve_location("Springfield")
        assert loc.is_ambiguous is True
        assert len(loc.candidates) > 1
