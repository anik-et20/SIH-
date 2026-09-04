"""
Multi-Hazard Risk Scoring Coordinator
Synthesizes rainfall, flood, landslide, and coastal hazards into unified explainable risk payload.
"""

from typing import Dict, Any, Optional
from .rainfall import classify_imd_rainfall
from .flood import calculate_flood_risk
from .landslide import calculate_landslide_risk

def compute_composite_disaster_risk(
    location_name: str,
    rainfall_24h_mm: float = 0.0,
    wind_speed_kmh: float = 12.0,
    high_tide_m: float = 0.0,
    rain_days: int = 1
) -> Dict[str, Any]:
    """
    Computes unified multi-hazard risk vector for weather decision support.
    """
    rain_assessment = classify_imd_rainfall(rainfall_24h_mm)
    flood_assessment = calculate_flood_risk(location_name, rainfall_24h_mm, high_tide_m)
    landslide_assessment = calculate_landslide_risk(location_name, rainfall_24h_mm, rain_days)

    # Wind / Squall Risk Evaluation
    if wind_speed_kmh >= 75.0:
        wind_risk = {"category": "EXTREME", "headline": "Cyclonic / Gale-Force Squall Winds (>75 km/h)"}
    elif wind_speed_kmh >= 45.0:
        wind_risk = {"category": "HIGH", "headline": "Strong Squally Winds (45-75 km/h)"}
    else:
        wind_risk = {"category": "LOW", "headline": "Normal Surface Wind Conditions"}

    # Determine dominant disaster vector
    scores = {
        "flood": flood_assessment["flood_risk_score"],
        "landslide": landslide_assessment["landslide_risk_score"]
    }
    max_hazard = max(scores, key=scores.get)
    max_score = scores[max_hazard]

    if max_score >= 0.75:
        overall_severity = "EXTREME"
        overall_badge = "RED ALERT - HIGH DISASTER THREAT"
    elif max_score >= 0.50:
        overall_severity = "SEVERE"
        overall_badge = "ORANGE ALERT - DISASTER PREPAREDNESS REQUIRED"
    elif max_score >= 0.30:
        overall_severity = "MODERATE"
        overall_badge = "YELLOW ALERT - BE UPDATED"
    else:
        overall_severity = "LOW"
        overall_badge = "GREEN ALERT - NO SEVERE WARNING"

    return {
        "location": location_name,
        "overall_severity": overall_severity,
        "overall_badge": overall_badge,
        "primary_hazard": max_hazard.upper(),
        "rainfall_analysis": rain_assessment,
        "flood_analysis": flood_assessment,
        "landslide_analysis": landslide_assessment,
        "wind_analysis": wind_risk,
        "trust_badge": "WEATHERGPT EXPLAINABLE MULTI-HAZARD RISK ENGINE"
    }
