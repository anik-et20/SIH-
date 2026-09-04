"""
IMD Standard Rainfall Classification Engine
"""

from typing import Dict, Any

def classify_imd_rainfall(rainfall_24h_mm: float) -> Dict[str, Any]:
    """
    Classifies 24-hour accumulated rainfall according to official IMD meteorology standards.
    """
    if rainfall_24h_mm < 2.5:
        category = "Very Light Rain"
        alert_color = "GREEN"
        risk_level = "LOW"
    elif 2.5 <= rainfall_24h_mm <= 15.5:
        category = "Light Rain"
        alert_color = "GREEN"
        risk_level = "LOW"
    elif 15.6 <= rainfall_24h_mm <= 64.4:
        category = "Moderate Rain"
        alert_color = "YELLOW"
        risk_level = "MODERATE"
    elif 64.5 <= rainfall_24h_mm <= 115.5:
        category = "Heavy Rain"
        alert_color = "ORANGE"
        risk_level = "HIGH"
    elif 115.6 <= rainfall_24h_mm <= 204.4:
        category = "Very Heavy Rain"
        alert_color = "ORANGE"
        risk_level = "HIGH"
    else:
        category = "Extremely Heavy Rain"
        alert_color = "RED"
        risk_level = "EXTREME"

    return {
        "rainfall_24h_mm": rainfall_24h_mm,
        "imd_category": category,
        "alert_color": alert_color,
        "risk_level": risk_level,
        "source": "India Meteorological Department (IMD) Classification Standard"
    }
