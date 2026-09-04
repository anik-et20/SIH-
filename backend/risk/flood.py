"""
Flood & Inundation Risk Engine
Calculates urban flash flood, riverine inundation, and coastal storm surge risks.
"""

from typing import Dict, Any, List
from .rainfall import classify_imd_rainfall

# Known high-vulnerability coastal & urban riverine flood zones
URBAN_FLOOD_HOTSPOTS = {
    "mumbai": {"base_vulnerability": 0.85, "coastal_tide_risk": True, "critical_subways": ["Hindmata", "Dadar", "Kurla", "Andheri Subway"]},
    "chennai": {"base_vulnerability": 0.80, "coastal_tide_risk": True, "critical_subways": ["Velachery", "Mudichur", "Tambaram"]},
    "kolkata": {"base_vulnerability": 0.75, "coastal_tide_risk": True, "critical_subways": ["Central Avenue", "Behala"]},
    "guwahati": {"base_vulnerability": 0.80, "coastal_tide_risk": False, "critical_subways": ["Zoo Road", "GS Road"]},
    "patna": {"base_vulnerability": 0.70, "coastal_tide_risk": False, "critical_subways": ["Rajendra Nagar", "Kankarbagh"]},
    "bengaluru": {"base_vulnerability": 0.65, "coastal_tide_risk": False, "critical_subways": ["Bellandur", "Silk Board", "Outer Ring Road"]}
}

def calculate_flood_risk(location_name: str, rainfall_24h_mm: float = 0.0, high_tide_meters: float = 0.0) -> Dict[str, Any]:
    """
    Computes explainable flood risk index (0.0 to 1.0) and safety recommendation.
    """
    clean_loc = location_name.strip().lower()
    hotspot_info = None
    for city, info in URBAN_FLOOD_HOTSPOTS.items():
        if city in clean_loc:
            hotspot_info = info
            break

    rain_meta = classify_imd_rainfall(rainfall_24h_mm)
    base_vulnerability = hotspot_info["base_vulnerability"] if hotspot_info else 0.40

    # Calculate rainfall risk contribution
    rain_factor = min(1.0, rainfall_24h_mm / 150.0)

    # High tide multiplier for coastal cities
    tide_factor = 0.0
    if hotspot_info and hotspot_info["coastal_tide_risk"] and high_tide_meters > 3.5:
        tide_factor = min(0.35, (high_tide_meters - 3.5) * 0.25)

    composite_score = round(min(1.0, (base_vulnerability * 0.3) + (rain_factor * 0.5) + tide_factor), 2)

    if composite_score >= 0.75:
        category = "EXTREME"
        color = "RED"
        headline = "High Urban Inundation & Flash Flood Threat"
    elif composite_score >= 0.50:
        category = "HIGH"
        color = "ORANGE"
        headline = "Moderate Waterlogging & Localized Flooding Expected"
    elif composite_score >= 0.30:
        category = "MODERATE"
        color = "YELLOW"
        headline = "Minor Low-Lying Drainage Overflow"
    else:
        category = "LOW"
        color = "GREEN"
        headline = "Minimal Flood Vulnerability"

    contributing_factors = [
        f"24h Precipitation: {rainfall_24h_mm} mm ({rain_meta['imd_category']})"
    ]
    if hotspot_info:
        contributing_factors.append(f"Urban Drainage & Terrain Vulnerability Score: {base_vulnerability}")
        if hotspot_info["critical_subways"]:
            contributing_factors.append(f"At-risk low-lying sectors: {', '.join(hotspot_info['critical_subways'])}")
    if tide_factor > 0:
        contributing_factors.append(f"Coastal High Tide Overlay: {high_tide_meters}m (Amplifies coastal backwater)")

    return {
        "location": location_name,
        "flood_risk_score": composite_score,
        "category": category,
        "alert_color": color,
        "headline": headline,
        "contributing_factors": contributing_factors,
        "trust_badge": "WEATHERGPT RISK ASSESSMENT"
    }
