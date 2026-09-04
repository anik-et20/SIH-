import pytest
from pydantic import ValidationError
from schemas import (
    CurrentWeatherInput, HourlyForecastInput, DailyForecastInput,
    WeatherAlertsInput, AirQualityInput, ExplainConceptInput
)

def test_valid_current_weather_input():
    data = CurrentWeatherInput(location="Mumbai", date_str="today", units="celsius")
    assert data.location == "Mumbai"
    assert data.units == "celsius"

def test_invalid_current_weather_empty_location():
    with pytest.raises(ValidationError):
        CurrentWeatherInput(location="   ", date_str="today")

def test_invalid_current_weather_bad_units():
    with pytest.raises(ValidationError):
        CurrentWeatherInput(location="Tokyo", units="kelvin") # only celsius or fahrenheit allowed

def test_valid_hourly_forecast_input():
    data = HourlyForecastInput(location="Pune", hours=24)
    assert data.location == "Pune"
    assert data.hours == 24

def test_invalid_hourly_forecast_out_of_bounds_hours():
    with pytest.raises(ValidationError):
        HourlyForecastInput(location="Pune", hours=0) # ge=1
    with pytest.raises(ValidationError):
        HourlyForecastInput(location="Pune", hours=100) # le=48

def test_valid_daily_forecast_input():
    data = DailyForecastInput(location="London", days=7)
    assert data.location == "London"
    assert data.days == 7

def test_invalid_daily_forecast_out_of_bounds_days():
    with pytest.raises(ValidationError):
        DailyForecastInput(location="London", days=30) # max 14 days

def test_valid_weather_alerts_input():
    data = WeatherAlertsInput(location="Miami")
    assert data.location == "Miami"

def test_invalid_weather_alerts_empty():
    with pytest.raises(ValidationError):
        WeatherAlertsInput(location="")

def test_valid_air_quality_input():
    data = AirQualityInput(location="Delhi")
    assert data.location == "Delhi"

def test_explain_concept_input():
    data = ExplainConceptInput(concept="What does 70% chance of rain mean?", topic="precipitation")
    assert data.topic == "precipitation"

def test_invalid_explain_concept_bad_topic():
    with pytest.raises(ValidationError):
        ExplainConceptInput(concept="Rain", topic="astronomy")
