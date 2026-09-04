import pytest
import pytest_asyncio
from services.sachet_service import fetch_sachet_cap_alerts
from risk.rainfall import classify_imd_rainfall
from risk.flood import calculate_flood_risk
from risk.landslide import calculate_landslide_risk
from risk.scoring import compute_composite_disaster_risk
from gis.affected_area import calculate_affected_area_impact, haversine_distance_km
from services.authority_service import generate_authority_sitrep
from services.climate_service import get_historical_climate_trends, get_farmer_crop_advisory
from services.transparency_service import generate_transparency_badge, create_audit_provenance_trace

@pytest.mark.asyncio
async def test_sachet_cap_alerts():
    response = await fetch_sachet_cap_alerts("Mumbai")
    assert response.location == "Mumbai"
    assert response.total_alerts > 0
    assert response.trust_badge == "OFFICIAL GOVERNMENT WARNING"
    first_alert = response.alerts[0]
    assert "Mumbai" in first_alert.area_desc or "NDMA" in first_alert.sender

def test_imd_rainfall_classification():
    heavy = classify_imd_rainfall(85.0)
    assert heavy["imd_category"] == "Heavy Rain"
    assert heavy["alert_color"] == "ORANGE"

    extreme = classify_imd_rainfall(220.0)
    assert extreme["imd_category"] == "Extremely Heavy Rain"
    assert extreme["alert_color"] == "RED"

def test_flood_risk_calculator():
    mumbai_flood = calculate_flood_risk("Mumbai", rainfall_24h_mm=160.0, high_tide_meters=4.3)
    assert mumbai_flood["category"] in ["HIGH", "EXTREME"]
    assert mumbai_flood["alert_color"] in ["ORANGE", "RED"]
    assert len(mumbai_flood["contributing_factors"]) >= 2

def test_landslide_risk_calculator():
    shimla_landslide = calculate_landslide_risk("Shimla", rainfall_24h_mm=110.0, continuous_rain_days=3)
    assert shimla_landslide["category"] in ["HIGH", "EXTREME"]
    assert "Himalayan" in shimla_landslide["contributing_factors"][0]

def test_composite_risk_scoring():
    composite = compute_composite_disaster_risk("Mumbai", rainfall_24h_mm=140.0, wind_speed_kmh=40.0, high_tide_m=4.2)
    assert composite["overall_severity"] in ["SEVERE", "EXTREME"]
    assert "FLOOD" in composite["primary_hazard"]

def test_gis_haversine_distance():
    dist = haversine_distance_km(19.0760, 72.8777, 18.9220, 72.8347)
    assert 15.0 < dist < 20.0  # Approx 17km CSMT to Santacruz

def test_gis_affected_area():
    gis_data = calculate_affected_area_impact("Mumbai", 19.0760, 72.8777, impact_radius_km=15.0)
    assert gis_data["estimated_exposed_population"] > 100000
    assert "Eastern Express Highway" in gis_data["at_risk_infrastructure"]["critical_highways"]

@pytest.mark.asyncio
async def test_authority_sitrep_generation():
    sitrep = await generate_authority_sitrep("Mumbai", 19.0760, 72.8777, rainfall_24h_mm=130.0)
    assert sitrep["sitrep_id"].startswith("SITREP-")
    assert sitrep["overall_threat_level"] in ["SEVERE", "EXTREME"]
    assert len(sitrep["recommended_tactical_actions"]) >= 3

def test_historical_climate_trends():
    trends = get_historical_climate_trends("Punjab", metric="precipitation")
    assert trends["location"] == "Punjab"
    assert len(trends["historical_anomalies"]) == 10
    assert "1995–2025" in trends["baseline_period"]

def test_farmer_crop_advisory():
    advisory = get_farmer_crop_advisory("Punjab", crop="rice", current_rainfall_mm=85.0)
    assert advisory["target_crop"] == "Rice"
    assert advisory["advisory_urgency"] == "HIGH"
    assert len(advisory["actionable_farmer_guidelines"]) >= 3

def test_transparency_badge_and_audit():
    badge = generate_transparency_badge("OFFICIAL_GOVERNMENT_IMD", "IMD")
    assert badge["badge_text"] == "OFFICIAL GOVERNMENT WARNING"
    assert badge["verification_hash"].startswith("SHA256-")

    audit = create_audit_provenance_trace("QX-100", "Delhi", ["Step1"], ["IMD"])
    assert audit["audit_id"] == "AUDIT-QX-100"
    assert audit["verification_status"] == "AUDITED & VERIFIED"
