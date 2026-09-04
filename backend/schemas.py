from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import date as date_type

# ==========================================
# 1. TOOL CALL INPUT SCHEMAS (Strict Pydantic)
# ==========================================

class CurrentWeatherInput(BaseModel):
    """Input arguments for fetching current weather."""
    location: str = Field(..., min_length=1, max_length=100, description="City, town, or location name (e.g. 'Mumbai', 'London', 'Tokyo')")
    date_str: Optional[str] = Field("today", description="Date description such as 'today', 'tomorrow', 'yesterday', or ISO 'YYYY-MM-DD'")
    units: Optional[Literal["celsius", "fahrenheit"]] = Field("celsius", description="Temperature unit preference")

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Location name cannot be empty or whitespace.")
        return clean

class HourlyForecastInput(BaseModel):
    """Input arguments for fetching hourly weather forecast."""
    location: str = Field(..., min_length=1, max_length=100, description="Location name")
    date_str: Optional[str] = Field("today", description="Target date ('today', 'tomorrow', 'next Monday', or 'YYYY-MM-DD')")
    hours: Optional[int] = Field(24, ge=1, le=48, description="Number of forecast hours to retrieve (1 to 48)")

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Location name cannot be empty.")
        return clean

class DailyForecastInput(BaseModel):
    """Input arguments for fetching multi-day forecast."""
    location: str = Field(..., min_length=1, max_length=100, description="Location name")
    days: Optional[int] = Field(7, ge=1, le=14, description="Number of forecast days (1 to 14)")

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Location name cannot be empty.")
        return clean

class WeatherAlertsInput(BaseModel):
    """Input arguments for fetching severe weather alerts and risk assessment."""
    location: str = Field(..., min_length=1, max_length=100, description="Location name")

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Location name cannot be empty.")
        return clean

class AirQualityInput(BaseModel):
    """Input arguments for fetching air quality metrics (AQI, PM2.5, PM10)."""
    location: str = Field(..., min_length=1, max_length=100, description="Location name")

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Location name cannot be empty.")
        return clean

class ExplainConceptInput(BaseModel):
    """Input arguments for meteorological concept knowledge retrieval (RAG)."""
    concept: str = Field(..., min_length=2, max_length=200, description="Meteorological term or concept (e.g. 'chance of rain', 'heat index', 'dew point')")
    topic: Optional[Literal["temperature", "precipitation", "humidity", "wind", "uv_index", "air_quality", "weather_alerts"]] = Field(None, description="Meteorological topic category")


# ==========================================
# 2. CANONICAL RESOLUTION & METADATA SCHEMAS
# ==========================================

class CanonicalLocation(BaseModel):
    """Canonical geocoded location."""
    name: str
    display_name: str
    latitude: float
    longitude: float
    country: str = ""
    admin1: str = ""
    timezone: str = "auto"
    is_ambiguous: bool = False
    candidates: List[str] = Field(default_factory=list)

class ResolvedDate(BaseModel):
    """Resolved date information."""
    date_str: str # YYYY-MM-DD
    day_name: str # e.g. "Monday"
    relative_description: str # e.g. "today", "tomorrow", "in 3 days"
    day_offset: int = 0 # 0 for today, 1 for tomorrow, -1 for yesterday
    is_forecast: bool = False
    is_historical: bool = False
    is_valid_forecast_range: bool = True


# ==========================================
# 3. CANONICAL WEATHER SCHEMAS (Normalized API data)
# ==========================================

class CanonicalCurrentWeather(BaseModel):
    location: str
    date: str
    temperature_c: float
    temperature_f: float
    apparent_temperature_c: float
    humidity_percent: int
    precipitation_mm: float
    precipitation_probability: Optional[int] = 0
    weather_code: int
    condition: str
    wind_speed_kmh: float
    wind_speed_mph: float
    wind_direction_deg: Optional[int] = None
    wind_gusts_kmh: Optional[float] = None
    pressure_hpa: Optional[float] = None
    uv_index: Optional[float] = None
    is_day: bool = True

class CanonicalHourlySlot(BaseModel):
    time: str
    temperature_c: float
    apparent_temperature_c: float
    humidity_percent: int
    precipitation_probability: int
    precipitation_mm: float
    weather_code: int
    condition: str
    wind_speed_kmh: float
    uv_index: Optional[float] = None

class CanonicalHourlyForecast(BaseModel):
    location: str
    date: str
    slots: List[CanonicalHourlySlot]

class CanonicalDailySlot(BaseModel):
    date: str
    day_name: str
    temperature_max_c: float
    temperature_min_c: float
    temperature_max_f: float
    temperature_min_f: float
    apparent_temperature_max_c: float
    apparent_temperature_min_c: float
    precipitation_probability_max: int
    precipitation_sum_mm: float
    weather_code: int
    condition: str
    wind_speed_max_kmh: float
    uv_index_max: Optional[float] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None

class CanonicalDailyForecast(BaseModel):
    location: str
    days: List[CanonicalDailySlot]

class CanonicalAirQuality(BaseModel):
    location: str
    us_aqi: int
    european_aqi: Optional[int] = None
    pm2_5: float
    pm10: float
    carbon_monoxide: Optional[float] = None
    nitrogen_dioxide: Optional[float] = None
    sulphur_dioxide: Optional[float] = None
    ozone: Optional[float] = None
    category: str
    health_advice: str

class CanonicalAlertItem(BaseModel):
    severity: Literal["advisory", "watch", "warning", "emergency", "info"]
    title: str
    hazard_type: str # e.g. "extreme_heat", "heavy_rain", "high_wind", "flood", "thunderstorm", "poor_air_quality"
    description: str
    recommended_actions: List[str]

class CanonicalAlerts(BaseModel):
    location: str
    overall_risk_level: Literal["low", "moderate", "high", "severe", "extreme"]
    active_alerts: List[CanonicalAlertItem]


# ==========================================
# 4. DETERMINISTIC CALCULATED INSIGHTS
# ==========================================

class RainWindow(BaseModel):
    rain_expected: bool
    start_time: Optional[str] = None
    peak_time: Optional[str] = None
    end_time: Optional[str] = None
    max_precipitation_probability: int = 0
    total_expected_precipitation_mm: float = 0.0
    summary: str

class TemperatureInsights(BaseModel):
    temp_min_c: float
    temp_max_c: float
    temp_avg_c: float
    diurnal_range_c: float
    trend_description: str
    heat_index_c: Optional[float] = None
    comfort_level: str

class ComparisonInsight(BaseModel):
    target_date: str
    baseline_date: str
    temp_difference_c: float
    temp_trend: Literal["warmer", "cooler", "identical"]
    rain_probability_difference: int
    summary: str

class CalculatedInsights(BaseModel):
    temperature: Optional[TemperatureInsights] = None
    rain_window: Optional[RainWindow] = None
    day_comparison: Optional[ComparisonInsight] = None
    wind_summary: Optional[Dict[str, Any]] = None
    summary_bullet_points: List[str] = Field(default_factory=list)


# ==========================================
# 5. RAG KNOWLEDGE BASE SCHEMAS
# ==========================================

class RAGKnowledgeItem(BaseModel):
    id: str
    topic: Literal["temperature", "precipitation", "humidity", "wind", "uv_index", "air_quality", "weather_alerts"]
    concept_title: str
    keywords: List[str]
    explanation: str
    practical_guidance: str

class RAGRetrievalResult(BaseModel):
    matched_items: List[RAGKnowledgeItem]
    query_concept: str
    context_text: str


# ==========================================
# 6. COMPLETE VALIDATED BACKEND CONTEXT
# ==========================================

class ValidatedWeatherContext(BaseModel):
    tool_used: str
    location: Optional[CanonicalLocation] = None
    target_date: Optional[ResolvedDate] = None
    current_weather: Optional[CanonicalCurrentWeather] = None
    hourly_forecast: Optional[CanonicalHourlyForecast] = None
    daily_forecast: Optional[CanonicalDailyForecast] = None
    air_quality: Optional[CanonicalAirQuality] = None
    alerts: Optional[CanonicalAlerts] = None
    calculated_insights: Optional[CalculatedInsights] = None
    rag_knowledge: Optional[RAGRetrievalResult] = None
    is_unavailable: bool = False
    unavailability_reason: Optional[str] = None
    clarification_needed: bool = False
    clarification_options: List[str] = Field(default_factory=list)
