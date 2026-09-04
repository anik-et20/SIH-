import httpx
import logging
from typing import Optional, Tuple, Dict, Any, List
from schemas import (
    CanonicalLocation, ResolvedDate, CanonicalCurrentWeather,
    CanonicalHourlyForecast, CanonicalHourlySlot, CanonicalDailyForecast,
    CanonicalDailySlot, CanonicalAirQuality, CanonicalAlerts, CanonicalAlertItem
)
from calc_service import c_to_f, kmh_to_mph
from geo_service import resolve_location
from date_service import resolve_date_string
from database import get_cached_weather, set_cached_weather
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))
from services.imd_service import fetch_imd_weather_observation, fetch_imd_district_alerts

logger = logging.getLogger("weathergpt.weather_service")

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
HISTORICAL_URL = "https://archive-api.open-meteo.com/v1/archive"

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall", 77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
}

def get_wmo_text(code: int) -> str:
    return WMO_CODES.get(code, "Unknown conditions")

# =====================================================================
# CANONICAL FETCHERS (Tool Execution Handlers)
# =====================================================================

async def fetch_current_weather(
    loc: CanonicalLocation,
    date_info: ResolvedDate,
    units: str = "celsius"
) -> CanonicalCurrentWeather:
    """Fetches current weather and converts into CanonicalCurrentWeather."""
    params = {
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure",
        "hourly": "precipitation_probability,uv_index",
        "timezone": loc.timezone if loc.timezone != "auto" else "auto"
    }

    async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
        resp = await client.get(FORECAST_URL, params=params)
        if resp.status_code != 200:
            raise RuntimeError(f"Open-Meteo API returned status {resp.status_code}")
        
        data = resp.json()
        curr = data.get("current")
        if not curr:
            raise ValueError("Incomplete or missing current weather data in API response.")

        temp_c = float(curr.get("temperature_2m", 0.0))
        temp_f = c_to_f(temp_c)
        app_temp_c = float(curr.get("apparent_temperature", temp_c))
        humidity = int(curr.get("relative_humidity_2m", 0))
        precip = float(curr.get("precipitation", 0.0))
        w_code = int(curr.get("weather_code", 0))
        wind_kmh = float(curr.get("wind_speed_10m", 0.0))
        wind_mph = kmh_to_mph(wind_kmh)
        wind_deg = curr.get("wind_direction_10m")
        gusts = curr.get("wind_gusts_10m")
        pressure = curr.get("surface_pressure")
        is_day = bool(curr.get("is_day", 1))

        # Get first hour precip probability if available
        hourly_probs = data.get("hourly", {}).get("precipitation_probability", [])
        precip_prob = hourly_probs[0] if hourly_probs else 0
        hourly_uv = data.get("hourly", {}).get("uv_index", [])
        uv = hourly_uv[0] if hourly_uv else None

        return CanonicalCurrentWeather(
            location=loc.display_name,
            date=date_info.date_str,
            temperature_c=temp_c,
            temperature_f=temp_f,
            apparent_temperature_c=app_temp_c,
            humidity_percent=humidity,
            precipitation_mm=precip,
            precipitation_probability=precip_prob,
            weather_code=w_code,
            condition=get_wmo_text(w_code),
            wind_speed_kmh=wind_kmh,
            wind_speed_mph=wind_mph,
            wind_direction_deg=wind_deg,
            wind_gusts_kmh=gusts,
            pressure_hpa=pressure,
            uv_index=uv,
            is_day=is_day
        )

async def fetch_hourly_forecast(
    loc: CanonicalLocation,
    date_info: ResolvedDate,
    hours: int = 24
) -> CanonicalHourlyForecast:
    """Fetches hourly forecast and normalizes into CanonicalHourlyForecast."""
    params = {
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index",
        "timezone": loc.timezone if loc.timezone != "auto" else "auto",
        "forecast_days": min(14, max(1, date_info.day_offset + 2)) if date_info.day_offset >= 0 else 1
    }

    async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
        resp = await client.get(FORECAST_URL, params=params)
        if resp.status_code != 200:
            raise RuntimeError(f"Open-Meteo API error: status {resp.status_code}")
        
        data = resp.json()
        h_data = data.get("hourly")
        if not h_data or "time" not in h_data:
            raise ValueError("Missing hourly dataset in weather response.")

        times = h_data.get("time", [])
        temps = h_data.get("temperature_2m", [])
        app_temps = h_data.get("apparent_temperature", [])
        humidities = h_data.get("relative_humidity_2m", [])
        precip_probs = h_data.get("precipitation_probability", [])
        precips = h_data.get("precipitation", [])
        codes = h_data.get("weather_code", [])
        winds = h_data.get("wind_speed_10m", [])
        uvs = h_data.get("uv_index", [])

        slots: List[CanonicalHourlySlot] = []
        target_date_prefix = date_info.date_str

        # Filter for slots matching the target date or starting from target
        for idx, t in enumerate(times):
            if date_info.day_offset == 0:
                if len(slots) < hours:
                    c = codes[idx] if idx < len(codes) else 0
                    slots.append(CanonicalHourlySlot(
                        time=t,
                        temperature_c=temps[idx] if idx < len(temps) else 0.0,
                        apparent_temperature_c=app_temps[idx] if idx < len(app_temps) else 0.0,
                        humidity_percent=int(humidities[idx]) if idx < len(humidities) else 0,
                        precipitation_probability=int(precip_probs[idx]) if idx < len(precip_probs) else 0,
                        precipitation_mm=precips[idx] if idx < len(precips) else 0.0,
                        weather_code=c,
                        condition=get_wmo_text(c),
                        wind_speed_kmh=winds[idx] if idx < len(winds) else 0.0,
                        uv_index=uvs[idx] if idx < len(uvs) else None
                    ))
            else:
                if t.startswith(target_date_prefix) and len(slots) < hours:
                    c = codes[idx] if idx < len(codes) else 0
                    slots.append(CanonicalHourlySlot(
                        time=t,
                        temperature_c=temps[idx] if idx < len(temps) else 0.0,
                        apparent_temperature_c=app_temps[idx] if idx < len(app_temps) else 0.0,
                        humidity_percent=int(humidities[idx]) if idx < len(humidities) else 0,
                        precipitation_probability=int(precip_probs[idx]) if idx < len(precip_probs) else 0,
                        precipitation_mm=precips[idx] if idx < len(precips) else 0.0,
                        weather_code=c,
                        condition=get_wmo_text(c),
                        wind_speed_kmh=winds[idx] if idx < len(winds) else 0.0,
                        uv_index=uvs[idx] if idx < len(uvs) else None
                    ))

        if not slots and times:
            for idx in range(min(hours, len(times))):
                c = codes[idx] if idx < len(codes) else 0
                slots.append(CanonicalHourlySlot(
                    time=times[idx],
                    temperature_c=temps[idx] if idx < len(temps) else 0.0,
                    apparent_temperature_c=app_temps[idx] if idx < len(app_temps) else 0.0,
                    humidity_percent=int(humidities[idx]) if idx < len(humidities) else 0,
                    precipitation_probability=int(precip_probs[idx]) if idx < len(precip_probs) else 0,
                    precipitation_mm=precips[idx] if idx < len(precips) else 0.0,
                    weather_code=c,
                    condition=get_wmo_text(c),
                    wind_speed_kmh=winds[idx] if idx < len(winds) else 0.0,
                    uv_index=uvs[idx] if idx < len(uvs) else None
                ))

        return CanonicalHourlyForecast(
            location=loc.display_name,
            date=date_info.date_str,
            slots=slots
        )

async def fetch_daily_forecast(
    loc: CanonicalLocation,
    days: int = 7
) -> CanonicalDailyForecast:
    """Fetches daily forecast and normalizes into CanonicalDailyForecast."""
    params = {
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
        "timezone": loc.timezone if loc.timezone != "auto" else "auto",
        "forecast_days": min(14, max(1, days))
    }

    async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
        resp = await client.get(FORECAST_URL, params=params)
        if resp.status_code != 200:
            raise RuntimeError(f"Open-Meteo API error: status {resp.status_code}")
        
        data = resp.json()
        d_data = data.get("daily")
        if not d_data or "time" not in d_data:
            raise ValueError("Missing daily dataset in weather response.")

        times = d_data.get("time", [])
        codes = d_data.get("weather_code", [])
        max_temps = d_data.get("temperature_2m_max", [])
        min_temps = d_data.get("temperature_2m_min", [])
        app_max = d_data.get("apparent_temperature_max", [])
        app_min = d_data.get("apparent_temperature_min", [])
        sunrises = d_data.get("sunrise", [])
        sunsets = d_data.get("sunset", [])
        precip_sums = d_data.get("precipitation_sum", [])
        precip_probs = d_data.get("precipitation_probability_max", [])
        wind_maxs = d_data.get("wind_speed_10m_max", [])
        uv_maxs = d_data.get("uv_index_max", [])

        slots: List[CanonicalDailySlot] = []
        for i in range(len(times)):
            d_str = times[i]
            d_res = resolve_date_string(d_str)
            t_max_c = max_temps[i] if i < len(max_temps) else 0.0
            t_min_c = min_temps[i] if i < len(min_temps) else 0.0
            c = codes[i] if i < len(codes) else 0

            slots.append(CanonicalDailySlot(
                date=d_str,
                day_name=d_res.day_name,
                temperature_max_c=t_max_c,
                temperature_min_c=t_min_c,
                temperature_max_f=c_to_f(t_max_c),
                temperature_min_f=c_to_f(t_min_c),
                apparent_temperature_max_c=app_max[i] if i < len(app_max) else t_max_c,
                apparent_temperature_min_c=app_min[i] if i < len(app_min) else t_min_c,
                precipitation_probability_max=int(precip_probs[i]) if i < len(precip_probs) else 0,
                precipitation_sum_mm=precip_sums[i] if i < len(precip_sums) else 0.0,
                weather_code=c,
                condition=get_wmo_text(c),
                wind_speed_max_kmh=wind_maxs[i] if i < len(wind_maxs) else 0.0,
                uv_index_max=uv_maxs[i] if i < len(uv_maxs) else None,
                sunrise=sunrises[i] if i < len(sunrises) else None,
                sunset=sunsets[i] if i < len(sunsets) else None
            ))

        return CanonicalDailyForecast(
            location=loc.display_name,
            days=slots
        )

async def fetch_air_quality(loc: CanonicalLocation) -> CanonicalAirQuality:
    """Fetches air quality metrics and computes category and health guidance."""
    params = {
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "current": "us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
        "timezone": loc.timezone if loc.timezone != "auto" else "auto"
    }

    async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
        resp = await client.get(AIR_QUALITY_URL, params=params)
        if resp.status_code != 200:
            raise RuntimeError(f"Air Quality API returned status {resp.status_code}")
        
        data = resp.json()
        curr = data.get("current")
        if not curr:
            raise ValueError("Air quality data not available for this location.")

        us_aqi = int(curr.get("us_aqi", 0))
        eu_aqi = curr.get("european_aqi")
        pm25 = float(curr.get("pm2_5", 0.0))
        pm10 = float(curr.get("pm10", 0.0))
        co = curr.get("carbon_monoxide")
        no2 = curr.get("nitrogen_dioxide")
        so2 = curr.get("sulphur_dioxide")
        o3 = curr.get("ozone")

        if us_aqi <= 50:
            category = "Good (0-50)"
            advice = "Air quality is satisfactory and poses little to no risk. Ideal for outdoor activities."
        elif us_aqi <= 100:
            category = "Moderate (51-100)"
            advice = "Air quality is acceptable. Very sensitive individuals should consider limiting prolonged outdoor exertion."
        elif us_aqi <= 150:
            category = "Unhealthy for Sensitive Groups (101-150)"
            advice = "Children, elderly, and people with respiratory or heart conditions should reduce heavy outdoor exertion."
        elif us_aqi <= 200:
            category = "Unhealthy (151-200)"
            advice = "Everyone may begin to experience health effects. Sensitive individuals should avoid prolonged outdoor exposure. Wear N95 masks."
        elif us_aqi <= 300:
            category = "Very Unhealthy (201-300)"
            advice = "Health alert: significant risk for all inhabitants. Avoid outdoor activities; keep indoor windows closed with air filtration."
        else:
            category = "Hazardous (301+)"
            advice = "Emergency health conditions. Entire population is severely affected. Remain indoors and use high-efficiency air purifiers."

        return CanonicalAirQuality(
            location=loc.display_name,
            us_aqi=us_aqi,
            european_aqi=eu_aqi,
            pm2_5=pm25,
            pm10=pm10,
            carbon_monoxide=co,
            nitrogen_dioxide=no2,
            sulphur_dioxide=so2,
            ozone=o3,
            category=category,
            health_advice=advice
        )

async def fetch_weather_alerts(loc: CanonicalLocation) -> CanonicalAlerts:
    alerts_list: List[CanonicalAlertItem] = []
    highest_severity = "low"

    try:
        current_data = await fetch_current_weather(loc, resolve_date_string("today"))
        
        if current_data.temperature_c >= 42.0:
            alerts_list.append(CanonicalAlertItem(
                severity="emergency",
                title="Extreme Heatwave Emergency Warning",
                hazard_type="extreme_heat",
                description=f"Dangerous heat index with ambient temperature of {current_data.temperature_c}°C.",
                recommended_actions=["Stay in air-conditioned environments", "Avoid direct sunlight 11 AM - 4 PM", "Drink electrolyte fluids"]
            ))
            highest_severity = "extreme"
        elif current_data.temperature_c >= 38.0:
            alerts_list.append(CanonicalAlertItem(
                severity="warning",
                title="Severe Heat Advisory",
                hazard_type="extreme_heat",
                description=f"High temperature of {current_data.temperature_c}°C recorded.",
                recommended_actions=["Hydrate frequently", "Wear light loose cotton clothing", "Check on elderly family members"]
            ))
            if highest_severity in ["low", "moderate"]:
                highest_severity = "high"

        if current_data.wind_speed_kmh >= 65.0:
            alerts_list.append(CanonicalAlertItem(
                severity="warning",
                title="Gale-Force Wind Warning",
                hazard_type="high_wind",
                description=f"Strong sustained winds of {current_data.wind_speed_kmh} km/h with high gust hazard.",
                recommended_actions=["Secure loose outdoor rooftop fixtures", "Avoid driving high-sided vehicles", "Stay clear of power lines"]
            ))
            if highest_severity in ["low", "moderate", "high"]:
                highest_severity = "severe"

        if current_data.weather_code in [95, 96, 99]:
            alerts_list.append(CanonicalAlertItem(
                severity="warning",
                title="Severe Thunderstorm & Lightning Alert",
                hazard_type="thunderstorm",
                description="Active thunderstorm activity detected with lightning strike risk.",
                recommended_actions=["Seek immediate shelter in a sturdy building", "Do not shelter under solitary trees", "Unplug sensitive electronics"]
            ))
            if highest_severity in ["low", "moderate"]:
                highest_severity = "high"

        if current_data.precipitation_mm >= 15.0:
            alerts_list.append(CanonicalAlertItem(
                severity="warning",
                title="Flash Flood / Waterlogging Watch",
                hazard_type="flood",
                description=f"Heavy localized precipitation rate of {current_data.precipitation_mm} mm/hr.",
                recommended_actions=["Avoid waterlogged underpasses and riverbanks", "Move valuables to higher ground"]
            ))
            if highest_severity in ["low", "moderate"]:
                highest_severity = "high"

    except Exception as e:
        logger.warning(f"Could not calculate active weather alerts: {e}")

    if not alerts_list:
        alerts_list.append(CanonicalAlertItem(
            severity="info",
            title="No Severe Weather Warnings Active",
            hazard_type="routine",
            description=f"No hazardous meteorological warnings currently active for {loc.display_name}.",
            recommended_actions=["Continue monitoring local forecasts for changes"]
        ))
        risk_level = "low"
    else:
        risk_level = highest_severity

    return CanonicalAlerts(
        location=loc.display_name,
        overall_risk_level=risk_level,
        active_alerts=alerts_list
    )

# =====================================================================
# BACKWARD COMPATIBLE WRAPPERS (Integrated IMD Service Ingestion)
# =====================================================================

async def get_weather(pool, location: str, fetch_climate: bool = False) -> Tuple[Dict[str, Any], bool]:
    clean_location = location.strip()
    if not clean_location:
        raise ValueError("Location query cannot be empty.")

    # 1. PostgreSQL cache check
    cached = await get_cached_weather(pool, clean_location)
    if cached and not fetch_climate:
        logger.info(f"Serving weather for '{clean_location}' from cache.")
        return cached, True

    # 2. Check Authoritative IMD Station Ingestion first
    imd_data = await fetch_imd_weather_observation(clean_location)
    if imd_data:
        loc = await resolve_location(clean_location)
        daily_obj = await fetch_daily_forecast(loc, days=7)
        imd_data["daily"] = {
            "time": [d.date for d in daily_obj.days],
            "weather_code": [d.weather_code for d in daily_obj.days],
            "temperature_2m_max": [d.temperature_max_c for d in daily_obj.days],
            "temperature_2m_min": [d.temperature_min_c for d in daily_obj.days],
            "precipitation_sum": [d.precipitation_sum_mm for d in daily_obj.days],
            "sunrise": [d.sunrise for d in daily_obj.days],
            "sunset": [d.sunset for d in daily_obj.days]
        }
        await set_cached_weather(pool, clean_location, loc.latitude, loc.longitude, imd_data)
        return imd_data, False

    # 3. Resolve Canonical Location for Global Forecasts
    loc = await resolve_location(clean_location)
    date_info = resolve_date_string("today")
    curr_obj = await fetch_current_weather(loc, date_info)
    daily_obj = await fetch_daily_forecast(loc, days=7)
    
    weather_dict = {
        "source": "Global Meteorological Sensor Network (Open-Meteo)",
        "source_type": "WEATHERGPT_CANONICAL",
        "location_info": loc.display_name,
        "search_query": clean_location,
        "current": {
            "temperature_2m": curr_obj.temperature_c,
            "relative_humidity_2m": curr_obj.humidity_percent,
            "apparent_temperature": curr_obj.apparent_temperature_c,
            "is_day": 1 if curr_obj.is_day else 0,
            "precipitation": curr_obj.precipitation_mm,
            "weather_code": curr_obj.weather_code,
            "wind_speed_10m": curr_obj.wind_speed_kmh,
            "condition_text": curr_obj.condition
        },
        "daily": {
            "time": [d.date for d in daily_obj.days],
            "weather_code": [d.weather_code for d in daily_obj.days],
            "temperature_2m_max": [d.temperature_max_c for d in daily_obj.days],
            "temperature_2m_min": [d.temperature_min_c for d in daily_obj.days],
            "precipitation_sum": [d.precipitation_sum_mm for d in daily_obj.days],
            "sunrise": [d.sunrise for d in daily_obj.days],
            "sunset": [d.sunset for d in daily_obj.days]
        }
    }

    if fetch_climate:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(HISTORICAL_URL, params={
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "start_date": "2025-01-01",
                "end_date": "2025-01-30",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum"
            })
            if resp.status_code == 200:
                weather_dict["climate_trends"] = resp.json().get("daily", {})

    await set_cached_weather(pool, clean_location, loc.latitude, loc.longitude, weather_dict)

    return weather_dict, False

async def get_weather_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    loc = await resolve_location("", lat=lat, lon=lon)
    date_info = resolve_date_string("today")
    curr_obj = await fetch_current_weather(loc, date_info)
    daily_obj = await fetch_daily_forecast(loc, days=7)
    
    return {
        "source": "Global Meteorological Sensor Network",
        "source_type": "WEATHERGPT_CANONICAL",
        "location_info": loc.display_name,
        "search_query": loc.display_name,
        "current": {
            "temperature_2m": curr_obj.temperature_c,
            "relative_humidity_2m": curr_obj.humidity_percent,
            "apparent_temperature": curr_obj.apparent_temperature_c,
            "is_day": 1 if curr_obj.is_day else 0,
            "precipitation": curr_obj.precipitation_mm,
            "weather_code": curr_obj.weather_code,
            "wind_speed_10m": curr_obj.wind_speed_kmh,
            "condition_text": curr_obj.condition
        },
        "daily": {
            "time": [d.date for d in daily_obj.days],
            "weather_code": [d.weather_code for d in daily_obj.days],
            "temperature_2m_max": [d.temperature_max_c for d in daily_obj.days],
            "temperature_2m_min": [d.temperature_min_c for d in daily_obj.days],
            "precipitation_sum": [d.precipitation_sum_mm for d in daily_obj.days],
            "sunrise": [d.sunrise for d in daily_obj.days],
            "sunset": [d.sunset for d in daily_obj.days]
        }
    }
