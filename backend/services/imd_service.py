import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from schemas import (
    CanonicalLocation, CanonicalCurrentWeather, CanonicalDailyForecast,
    CanonicalDailySlot, CanonicalAlerts, CanonicalAlertItem
)

logger = logging.getLogger("disasterguard.services.imd_service")

# Official IMD API Endpoints
IMD_CITY_WX_URL = "https://mausam.imd.gov.in/api/citywxapi.php"
IMD_WARNING_URL = "https://mausam.imd.gov.in/api/warning_district.php"

# Curated IMD District & Station Code Mapping for major Indian Regions
IMD_STATION_CODES = {
  "delhi": {"id": "42182", "name": "New Delhi (Safdarjung)", "district": "Delhi", "state": "Delhi"},
  "mumbai": {"id": "43003", "name": "Mumbai (Colaba / Santacruz)", "district": "Mumbai Suburban", "state": "Maharashtra"},
  "kolkata": {"id": "42807", "name": "Kolkata (Alipore)", "district": "Kolkata", "state": "West Bengal"},
  "chennai": {"id": "43279", "name": "Chennai (Nungambakkam)", "district": "Chennai", "state": "Tamil Nadu"},
  "bhubaneswar": {"id": "42971", "name": "Bhubaneswar", "district": "Khurda", "state": "Odisha"},
  "patna": {"id": "42492", "name": "Patna", "district": "Patna", "state": "Bihar"},
  "guwahati": {"id": "42410", "name": "Guwahati (Borjhar)", "district": "Kamrup Metropolitan", "state": "Assam"},
  "shimla": {"id": "42083", "name": "Shimla", "district": "Shimla", "state": "Himachal Pradesh"},
  "dehradun": {"id": "42111", "name": "Dehradun", "district": "Dehradun", "state": "Uttarakhand"},
  "jaipur": {"id": "42348", "name": "Jaipur", "district": "Jaipur", "state": "Rajasthan"},
  "bhopal": {"id": "42667", "name": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh"},
  "kochi": {"id": "43353", "name": "Kochi (Cochin)", "district": "Ernakulam", "state": "Kerala"},
  "hyderabad": {"id": "43128", "name": "Hyderabad (Begumpet)", "district": "Hyderabad", "state": "Telangana"},
  "bengaluru": {"id": "43257", "name": "Bengaluru (HAL)", "district": "Bengaluru Urban", "state": "Karnataka"},
  "thiruvananthapuram": {"id": "43371", "name": "Thiruvananthapuram", "district": "Thiruvananthapuram", "state": "Kerala"}
}

async def fetch_imd_weather_observation(location_query: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Optional[Dict[str, Any]]:
    """
    Ingests official weather observations & forecast from India Meteorological Department (IMD).
    Returns normalized dictionary with IMD metadata or None if location is outside IMD coverage.
    """
    clean_loc = (location_query or "").strip().lower()
    station_info = None

    for key, info in IMD_STATION_CODES.items():
        if key in clean_loc or info["name"].lower() in clean_loc or info["district"].lower() in clean_loc:
            station_info = info
            break

    if not station_info:
        logger.info(f"Location '{location_query}' not directly matched in IMD station registry. Using primary meteorological service.")
        return None

    logger.info(f"Ingesting official IMD weather data for station: {station_info['name']} (ID: {station_info['id']})")

    try:
        async with httpx.AsyncClient(verify=False, timeout=8.0) as client:
            resp = await client.get(f"{IMD_CITY_WX_URL}?id={station_info['id']}")
            if resp.status_code == 200:
                raw_data = resp.json()
                if isinstance(raw_data, list) and len(raw_data) > 0:
                    data = raw_data[0]
                    return parse_imd_data(data, station_info)
    except Exception as e:
        logger.warning(f"IMD API lookup exception for {station_info['name']}: {e}")

    return None

def parse_imd_data(data: Dict[str, Any], station_info: Dict[str, str]) -> Dict[str, Any]:
    """Parses raw IMD API JSON into WeatherGPT canonical structure."""
    temp_c = float(data.get("temp", data.get("temperature", 28.0)))
    humidity = int(data.get("humidity", 65))
    wind = float(data.get("wind_speed", 12.0))
    weather_cond = data.get("weather_condition", data.get("sky", "Partly Cloudy"))

    return {
        "source": "India Meteorological Department (IMD)",
        "source_type": "OFFICIAL_GOVERNMENT_IMD",
        "station_name": station_info["name"],
        "district": station_info["district"],
        "state": station_info["state"],
        "location_info": f"{station_info['name']}, {station_info['state']} (IMD Official Station)",
        "current": {
            "temperature_2m": temp_c,
            "relative_humidity_2m": humidity,
            "apparent_temperature": temp_c,
            "is_day": 1,
            "precipitation": float(data.get("rainfall_24h", 0.0)),
            "weather_code": 2,
            "wind_speed_10m": wind,
            "condition_text": weather_cond
        },
        "imd_warnings": data.get("warnings", "No severe warning active.")
    }

async def fetch_imd_district_alerts(district_name: str) -> Optional[CanonicalAlerts]:
    """
    Ingests official district warnings from IMD Severe Weather Bulletin.
    """
    clean_dist = district_name.strip()
    if not clean_dist:
        return None

    try:
        async with httpx.AsyncClient(verify=False, timeout=8.0) as client:
            resp = await client.get(f"{IMD_WARNING_URL}?district={clean_dist}")
            if resp.status_code == 200:
                data = resp.json()
                alerts_list: List[CanonicalAlertItem] = []
                for item in data.get("warnings", []):
                    alerts_list.append(CanonicalAlertItem(
                        severity="warning",
                        title=f"IMD Official Warning: {item.get('hazard', 'Heavy Rainfall')}",
                        hazard_type=item.get("hazard_type", "heavy_rain"),
                        description=item.get("description", "Official warning issued by India Meteorological Department."),
                        recommended_actions=["Follow official district magistrate instructions", "Monitor IMD updates"]
                    ))

                if alerts_list:
                    return CanonicalAlerts(
                        location=district_name,
                        overall_risk_level="high",
                        active_alerts=alerts_list
                    )
    except Exception as e:
        logger.warning(f"IMD warning service lookup exception: {e}")

    return None
