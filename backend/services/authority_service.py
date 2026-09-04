"""
Official Disaster Management Authority Service (NDMA / SDMA / DDMA)
Generates Situation Reports (SitRep), Evacuation Action Plans, and Mass Warning Broadcast payloads.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from risk.scoring import compute_composite_disaster_risk
from gis.affected_area import calculate_affected_area_impact
from services.sachet_service import fetch_sachet_cap_alerts

async def generate_authority_sitrep(
    location_name: str,
    lat: float,
    lon: float,
    rainfall_24h_mm: float = 85.0,
    wind_speed_kmh: float = 35.0,
    high_tide_m: float = 4.2
) -> Dict[str, Any]:
    """
    Generates an official Situation Report (SitRep) for District Disaster Management Authorities (DDMA).
    """
    risk_summary = compute_composite_disaster_risk(
        location_name=location_name,
        rainfall_24h_mm=rainfall_24h_mm,
        wind_speed_kmh=wind_speed_kmh,
        high_tide_m=high_tide_m
    )

    gis_summary = calculate_affected_area_impact(
        location_name=location_name,
        center_lat=lat,
        center_lon=lon,
        impact_radius_km=12.0
    )

    sachet_alerts = await fetch_sachet_cap_alerts(location_query=location_name)

    sitrep_id = f"SITREP-{datetime.now().strftime('%Y%m%d')}-{location_name[:3].upper()}-001"

    action_recommendations = [
        "Deploy NDRF / SDRF water rescue teams to pre-designated low-lying inundation spots.",
        "Activate District Control Room 24x7 hotlines (1077 / 112).",
        "Issue localized traffic diversions around flooded underpasses and waterlogged arterial roads.",
        "Ensure emergency backup power generators are functional at critical hospitals.",
        "Standby community shelters and emergency food/medicine ration stocks."
    ]

    return {
        "sitrep_id": sitrep_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "issuing_authority": f"District Disaster Management Authority ({location_name.title()})",
        "overall_threat_level": risk_summary["overall_severity"],
        "threat_badge": risk_summary["overall_badge"],
        "location": location_name.title(),
        "coordinates": {"lat": lat, "lon": lon},
        "meteorological_metrics": {
            "rainfall_24h_mm": rainfall_24h_mm,
            "wind_speed_kmh": wind_speed_kmh,
            "high_tide_m": high_tide_m
        },
        "multi_hazard_risk": risk_summary,
        "spatial_impact_analysis": gis_summary,
        "active_sachet_cap_warnings": sachet_alerts.alerts,
        "recommended_tactical_actions": action_recommendations,
        "classification": "OFFICIAL DISASTER SITUATION REPORT (SITREP)"
    }
