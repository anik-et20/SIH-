"""
Landslide & Slope Stability Risk Engine
Specialized for Himalayan Arc & Western Ghats geology and rain intensity-duration thresholds.
"""

from typing import Dict, Any, List
from .rainfall import classify_imd_rainfall

HILLY_TERRAIN_REGIONS = {
    "shimla": {"zone": "Himalayan", "slope_factor": 0.85, "highway": "NH-5 (Kalka-Shimla)"},
    "mandi": {"zone": "Himalayan", "slope_factor": 0.90, "highway": "NH-21 (Chandigarh-Manali)"},
    "kullu": {"zone": "Himalayan", "slope_factor": 0.88, "highway": "NH-21"},
    "dehradun": {"zone": "Himalayan", "slope_factor": 0.75, "highway": "NH-7"},
    "chamoli": {"zone": "Himalayan", "slope_factor": 0.95, "highway": "Badrinath Highway"},
    "wayanad": {"zone": "Western Ghats", "slope_factor": 0.85, "highway": "NH-766 (Meppadi-Chooralmala)"},
    "munnar": {"zone": "Western Ghats", "slope_factor": 0.82, "highway": "Kochi-Dhanushkodi Highway"},
    "nilgiris": {"zone": "Western Ghats", "slope_factor": 0.80, "highway": "Ooty-Mettupalayam Ghat Road"},
    "darjeeling": {"zone": "Eastern Himalayas", "slope_factor": 0.88, "highway": "Hill Cart Road NH-110"}
}

def calculate_landslide_risk(location_name: str, rainfall_24h_mm: float = 0.0, continuous_rain_days: int = 1) -> Dict[str, Any]:
    """
    Computes slope instability and landslide hazard index based on rainfall intensity-duration threshold.
    """
    clean_loc = location_name.strip().lower()
    hilly_info = None
    for hill, info in HILLY_TERRAIN_REGIONS.items():
        if hill in clean_loc:
            hilly_info = info
            break

    if not hilly_info:
        # Default non-mountainous terrain evaluation
        return {
            "location": location_name,
            "landslide_risk_score": 0.05,
            "category": "LOW",
            "alert_color": "GREEN",
            "headline": "Plain Terrain - Minimal Landslide Hazard",
            "contributing_factors": ["Location is outside high-gradient mountain slope corridor."],
            "trust_badge": "WEATHERGPT RISK ASSESSMENT"
        }

    slope_factor = hilly_info["slope_factor"]
    # Intensity-duration threshold (Rainfall > 80mm in 24h triggers elevated landslide probability in steep terrain)
    rain_threshold_ratio = min(1.0, rainfall_24h_mm / 100.0)
    duration_factor = min(0.3, continuous_rain_days * 0.1)

    composite_score = round(min(1.0, (slope_factor * 0.4) + (rain_threshold_ratio * 0.5) + duration_factor), 2)

    if composite_score >= 0.75:
        category = "EXTREME"
        color = "RED"
        headline = "Severe Landslide & Debris Flow Risk Active"
    elif composite_score >= 0.50:
        category = "HIGH"
        color = "ORANGE"
        headline = "Elevated Slope Instability - Caution on Ghat Roads"
    elif composite_score >= 0.30:
        category = "MODERATE"
        color = "YELLOW"
        headline = "Localized Rockfall Watch"
    else:
        category = "LOW"
        color = "GREEN"
        headline = "Normal Slope Conditions"

    factors = [
        f"Geological Terrain: {hilly_info['zone']} Sector (Slope Factor: {slope_factor})",
        f"24h Rainfall: {rainfall_24h_mm} mm",
        f"Continuous Precipitation Duration: {continuous_rain_days} days",
        f"Key Arterial Highway Watch: {hilly_info['highway']}"
    ]

    return {
        "location": location_name,
        "landslide_risk_score": composite_score,
        "category": category,
        "alert_color": color,
        "headline": headline,
        "contributing_factors": factors,
        "trust_badge": "WEATHERGPT RISK ASSESSMENT"
    }
