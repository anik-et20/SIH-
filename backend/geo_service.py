import httpx
import logging
from typing import Optional, List, Dict, Any
from schemas import CanonicalLocation

logger = logging.getLogger("disasterguard.geo_service")

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
REVERSE_GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse"

# Common Indian City Multilingual Aliases (Hindi/Devanagari to Canonical English)
INDIAN_CITY_ALIASES = {
    "दिल्ली": "Delhi", "नई दिल्ली": "New Delhi", "मुंबई": "Mumbai", "बम्बई": "Mumbai",
    "कोलकाता": "Kolkata", "कलकत्ता": "Kolkata", "चेन्नई": "Chennai", "मद्रास": "Chennai",
    "बेंगलुरु": "Bengaluru", "बैंगलोर": "Bengaluru", "हैदराबाद": "Hyderabad",
    "अहमदाबाद": "Ahmedabad", "पुणे": "Pune", "जयपुर": "Jaipur", "सूरत": "Surat",
    "लखनऊ": "Lucknow", "कानपुर": "Kanpur", "नागपुर": "Nagpur", "इंदौर": "Indore",
    "भोपाल": "Bhopal", "पटना": "Patna", "वडोदरा": "Vadodara", "गाजियाबाद": "Ghaziabad",
    "लुधियाना": "Ludhiana", "आगरा": "Agra", "वाराणसी": "Varanasi", "काशी": "Varanasi",
    "प्रयागराज": "Prayagraj", "इलाहाबाद": "Prayagraj", "अमृतसर": "Amritsar",
    "विशाखापत्तनम": "Visakhapatnam", "रांची": "Ranchi", "गुवाहाटी": "Guwahati",
    "चंडीगढ़": "Chandigarh", "देहरादून": "Dehradun", "शिमला": "Shimla", "श्रीनगर": "Srinagar",
    "जम्मू": "Jammu", "भुवनेश्वर": "Bhubaneswar", "कटक": "Cuttack", "कोच्चि": "Kochi",
    "तिरुवनंतपुरम": "Thiruvananthapuram", "कोयंबटूर": "Coimbatore", "मदुरै": "Madurai"
}

async def resolve_location(
    location_query: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> CanonicalLocation:
    """
    Deterministically resolves ANY location name or coordinates into a CanonicalLocation worldwide.
    Queries Open-Meteo Global Geocoding database covering 1.5M+ cities and regions.
    """
    clean_query = (location_query or "").strip()
    # Normalize Indian script aliases if present
    if clean_query in INDIAN_CITY_ALIASES:
        clean_query = INDIAN_CITY_ALIASES[clean_query]

    # 1. Coordinate-based resolution (Reverse Geocoding only if explicit GPS coordinates or empty query)
    is_gps_query = clean_query.startswith("GPS") or clean_query.startswith("Coordinates")
    if (is_gps_query or not clean_query) and lat is not None and lon is not None:
        display_name = f"GPS ({lat:.2f}, {lon:.2f})"
        country = ""
        admin1 = ""
        city_name = f"Coordinates ({lat:.2f}, {lon:.2f})"
        
        try:
            async with httpx.AsyncClient(verify=False, timeout=8.0) as client:
                resp = await client.get(
                    REVERSE_GEOCODING_URL,
                    params={"lat": lat, "lon": lon, "format": "json"},
                    headers={"User-Agent": "DisasterGuard-AI/3.0"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    addr = data.get("address", {})
                    city_name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or city_name
                    country = addr.get("country", "")
                    admin1 = addr.get("state", "")
                    display_name = f"{city_name}, {admin1} {country}".strip(", ")
        except Exception as e:
            logger.warning(f"Reverse geocoding lookup failed: {e}")

        return CanonicalLocation(
            name=city_name,
            display_name=display_name,
            latitude=lat,
            longitude=lon,
            country=country,
            admin1=admin1,
            timezone="auto",
            is_ambiguous=False,
            candidates=[]
        )

    if not clean_query:
        raise ValueError("Location query cannot be empty.")

    # 2. Global Open-Meteo Geocoding API Search with retry resilience
    results: List[Dict[str, Any]] = []
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(verify=False, timeout=12.0) as client:
                resp = await client.get(
                    GEOCODING_URL,
                    params={"name": clean_query, "count": 10, "language": "en", "format": "json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results") or []
                    break
                elif resp.status_code != 200 and attempt == 1:
                    raise RuntimeError(f"Geocoding service returned status {resp.status_code}")
        except Exception as e:
            if attempt == 1:
                logger.error(f"Geocoding API network error: {e}")
                raise RuntimeError("Geocoding service is currently unreachable.")

    if not results:
        raise ValueError(f"Location '{clean_query}' not found. Please check spelling.")

    has_specifier = "," in clean_query or " in " in clean_query.lower()

    # Check for ambiguity among results
    candidates = []
    seen = set()
    for r in results:
        r_name = r.get("name", "")
        r_admin = r.get("admin1", "")
        r_country = r.get("country", "")
        disp = ", ".join([p for p in [r_name, r_admin, r_country] if p])
        if disp not in seen:
            seen.add(disp)
            candidates.append(disp)

    primary = results[0]
    same_name_matches = [r for r in results if r.get("name", "").lower() == clean_query.lower()]
    
    top_pop = primary.get("population") or 0
    second_pop = results[1].get("population") or 0 if len(results) > 1 else 0

    # Ambiguous only if multiple same-name places exist without a dominant primary city
    is_truly_ambiguous = (
        not has_specifier
        and len(same_name_matches) > 1
        and len(candidates) > 1
        and (top_pop == 0 or (second_pop > 0 and top_pop < 3.0 * second_pop))
    )

    if is_truly_ambiguous:
        name = primary.get("name", clean_query)
        return CanonicalLocation(
            name=name,
            display_name=candidates[0],
            latitude=primary["latitude"],
            longitude=primary["longitude"],
            country=primary.get("country", ""),
            admin1=primary.get("admin1", ""),
            timezone=primary.get("timezone", "auto"),
            is_ambiguous=True,
            candidates=candidates[:5]
        )

    # Pick top match sorted by population / relevance
    primary = results[0]
    name = primary.get("name", clean_query)
    admin1 = primary.get("admin1", "")
    country = primary.get("country", "")
    display_parts = [p for p in [name, admin1, country] if p]
    display_name = ", ".join(display_parts)

    return CanonicalLocation(
        name=name,
        display_name=display_name,
        latitude=primary["latitude"],
        longitude=primary["longitude"],
        country=country,
        admin1=admin1,
        timezone=primary.get("timezone", "auto"),
        is_ambiguous=False,
        candidates=[]
    )
