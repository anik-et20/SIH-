import re
from typing import List, Optional, Dict, Any
from schemas import RAGKnowledgeItem, RAGRetrievalResult

# =====================================================================
# DETERMINISTIC METEOROLOGICAL KNOWLEDGE CORPUS
# (Strictly stable meteorological scientific facts. NO live weather forecasts)
# =====================================================================

METEOROLOGICAL_KNOWLEDGE_BASE: List[RAGKnowledgeItem] = [
    # -------------------------------------------------------------
    # PRECIPITATION
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="precip_pop_formula",
        topic="precipitation",
        concept_title="Probability of Precipitation (PoP / Chance of Rain)",
        keywords=["chance of rain", "probability of precipitation", "pop", "percentage of rain", "rain likelihood", "will it rain"],
        explanation=(
            "Probability of Precipitation (PoP) is defined by meteorologists as PoP = C × A, "
            "where 'C' is the forecaster's confidence that rain will occur somewhere in the forecast area, "
            "and 'A' is the percentage of the area expected to receive at least 0.01 inches (0.25 mm) of rain. "
            "For example, a 70% chance of rain can mean a 100% confidence that 70% of the city will get rain, "
            "or a 70% confidence that 100% of the city will get rain."
        ),
        practical_guidance="A PoP above 50% generally warrants carrying an umbrella or planning indoor backup activities."
    ),
    RAGKnowledgeItem(
        id="precip_intensity_scales",
        topic="precipitation",
        concept_title="Rainfall Intensity Categories & Measurements",
        keywords=["rainfall intensity", "heavy rain", "light rain", "drizzle", "torrential rain", "cloudburst", "mm of rain"],
        explanation=(
            "Rainfall intensity is categorized by accumulation rate per hour: "
            "1. Very Light / Drizzle: < 0.5 mm/hr (scarcely wets surfaces). "
            "2. Light Rain: 0.5 to 2.5 mm/hr. "
            "3. Moderate Rain: 2.5 to 7.5 mm/hr. "
            "4. Heavy Rain: 7.5 to 35.0 mm/hr (causes street runoff and reduced visibility). "
            "5. Violent / Torrential Rain: > 35.0 mm/hr. "
            "A 'Cloudburst' is an extreme meteorological event with precipitation exceeding 100 mm/hr over a small geographic area."
        ),
        practical_guidance="Rainfall rates above 15 mm/hr typically trigger urban waterlogging and traffic disruption."
    ),
    RAGKnowledgeItem(
        id="precip_convective_vs_stratiform",
        topic="precipitation",
        concept_title="Showers vs Continuous Rain (Convective vs Stratiform)",
        keywords=["showers", "continuous rain", "intermittent rain", "thunder shower", "cloudburst"],
        explanation=(
            "Showers are convective in nature, produced by cumulonimbus or cumulus clouds, characterized by sudden starts, rapid stops, and variable intensity over localized zones. "
            "Continuous rain is stratiform, produced by nimbostratus clouds, covering broad geographic regions for prolonged hours with steady intensity."
        ),
        practical_guidance="Showers allow brief dry intervals, whereas stratiform rain requires continuous rain gear."
    ),

    # -------------------------------------------------------------
    # TEMPERATURE
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="temp_heat_index",
        topic="temperature",
        concept_title="Heat Index & Apparent Temperature (Feels Like)",
        keywords=["heat index", "feels like", "apparent temperature", "heatwave", "sweltering", "humidity effect"],
        explanation=(
            "Heat Index is the apparent temperature perceived by the human body when relative humidity is combined with air temperature. "
            "When humidity is high, the evaporation rate of sweat from human skin is drastically reduced, severely inhibiting the body's natural cooling mechanism. "
            "For example, at 32°C air temperature with 75% relative humidity, the Heat Index reaches 42°C, entering the danger zone for heat cramps and heat exhaustion."
        ),
        practical_guidance="When Heat Index exceeds 40°C (104°F), avoid strenuous outdoor exertion and maintain continuous hydration."
    ),
    RAGKnowledgeItem(
        id="temp_diurnal_variation",
        topic="temperature",
        concept_title="Diurnal Temperature Range (Day-Night Swing)",
        keywords=["diurnal range", "day night temperature", "temperature swing", "night cooling", "min max difference"],
        explanation=(
            "Diurnal temperature variation is the difference between the daily maximum and daily minimum temperature. "
            "Arid and desert regions experience high diurnal swings (> 15°C) due to lack of atmospheric moisture to trap infrared radiation. "
            "Coastal and humid regions experience low diurnal swings (< 6°C) as water vapor acts as a natural greenhouse blanket."
        ),
        practical_guidance="Large diurnal swings require layered clothing for cool mornings and warm afternoons."
    ),
    RAGKnowledgeItem(
        id="temp_wet_bulb",
        topic="temperature",
        concept_title="Wet-Bulb Temperature & Human Survivability",
        keywords=["wet bulb temperature", "wet bulb", "heat survivability", "thermal limit", "heat stress"],
        explanation=(
            "Wet-bulb temperature is the lowest temperature that can be achieved purely by evaporative cooling of a water-wetted ventilated surface. "
            "A sustained wet-bulb temperature of 35°C (95°F) marks the physiological limit of human survivability; beyond this, even healthy individuals in the shade cannot shed metabolic heat through perspiration."
        ),
        practical_guidance="Wet-bulb temperatures above 30°C warrant emergency cooling centers and cessation of manual labor."
    ),

    # -------------------------------------------------------------
    # HUMIDITY
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="humidity_rh_vs_dewpoint",
        topic="humidity",
        concept_title="Relative Humidity vs Dew Point",
        keywords=["dew point", "relative humidity", "humidity", "muggy", "sticky air", "comfort level"],
        explanation=(
            "Relative Humidity (RH) expresses the percentage of moisture in the air relative to the saturation capacity at that specific temperature. Because warm air holds more moisture than cold air, 70% RH at 35°C contains far more moisture than 70% RH at 10°C. "
            "Dew Point is the absolute temperature to which air must be cooled to achieve 100% saturation. Dew point is the truest scientific measure of human comfort: "
            "< 10°C is dry/crisp, 10-15°C is comfortable, 16-20°C is noticeable humidity, 21-24°C is muggy and oppressive, and > 24°C is sweltering."
        ),
        practical_guidance="Check the dew point rather than relative humidity alone to gauge how sticky or oppressive outdoor air will feel."
    ),

    # -------------------------------------------------------------
    # WIND
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="wind_beaufort_scale",
        topic="wind",
        concept_title="Beaufort Wind Scale & Wind Gusts",
        keywords=["wind speed", "wind gusts", "beaufort scale", "gale", "high winds", "storm wind"],
        explanation=(
            "The Beaufort Scale classifies wind speed based on observable physical effects: "
            "• Calm/Light Breeze (0-19 km/h): Leaves rustle. "
            "• Moderate/Fresh Breeze (20-38 km/h): Small trees sway, dust raised. "
            "• Strong Breeze (39-49 km/h): Large branches in motion, umbrellas used with difficulty. "
            "• Near Gale/Gale (50-74 km/h): Whole trees in motion, walking impeded, structural twigs break. "
            "• Storm/Violent Storm (75-102 km/h): Trees uprooted, considerable structural damage. "
            "• Hurricane Force (> 103 km/h): Devastating widespread destruction. "
            "A 'Wind Gust' is a sudden, brief increase in wind speed lasting less than 20 seconds, often 30-50% higher than sustained wind."
        ),
        practical_guidance="Secure loose outdoor furniture and solar panels when sustained winds exceed 40 km/h or gusts exceed 55 km/h."
    ),
    RAGKnowledgeItem(
        id="wind_chill_effect",
        topic="wind",
        concept_title="Wind Chill Index & Hypothermia Risk",
        keywords=["wind chill", "feels colder", "wind frostbite", "hypothermia"],
        explanation=(
            "Wind Chill Index calculates how cold air feels on exposed skin by accounting for wind-driven convective heat loss. Wind strips away the thin insulating layer of warm air that the human body generates above skin, causing the body's core temperature to drop rapidly."
        ),
        practical_guidance="Dress in windproof outer layers when temperatures drop below 10°C in brisk winds."
    ),

    # -------------------------------------------------------------
    # UV INDEX
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="uv_index_scale",
        topic="uv_index",
        concept_title="UV Index Scale & Sun Protection Guidelines",
        keywords=["uv index", "ultraviolet radiation", "sunburn", "uv scale", "sun protection", "sunscreen"],
        explanation=(
            "The Global Solar UV Index is an international standard measurement of skin-damaging ultraviolet radiation: "
            "• 0 to 2 (Low): Safe, no protection required for normal exposure. "
            "• 3 to 5 (Moderate): Wear sunglasses, broad-spectrum SPF 30+ sunscreen, and a hat. "
            "• 6 to 7 (High): Protection essential. Reduce sun exposure between 10 AM and 4 PM. "
            "• 8 to 10 (Very High): High risk of skin and eye damage. Minimize midday outdoor exposure. "
            "• 11+ (Extreme): Unprotected skin can burn in under 10 minutes. Stay in shade or indoors."
        ),
        practical_guidance="UV radiation cannot be felt as heat and penetrates cloud cover. High UV index can occur on cool or cloudy days."
    ),

    # -------------------------------------------------------------
    # AIR QUALITY (AQI)
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="aqi_brackets_pm25",
        topic="air_quality",
        concept_title="Air Quality Index (AQI) & Particulate Matter (PM2.5 / PM10)",
        keywords=["aqi", "air quality index", "pm2.5", "pm10", "smog", "pollution", "air quality categories"],
        explanation=(
            "The Air Quality Index (US AQI Standard) translates atmospheric pollutant concentrations into a health-risk scale: "
            "• 0-50 (Good): Air quality is satisfactory; little to no risk. "
            "• 51-100 (Moderate): Acceptable; unusually sensitive individuals may experience mild symptoms. "
            "• 101-150 (Unhealthy for Sensitive Groups): Children, elderly, and people with asthma/respiratory conditions are at risk. "
            "• 151-200 (Unhealthy): Everyone may begin to experience adverse health effects. "
            "• 201-300 (Very Unhealthy): Health alert; serious health risks for the general population. "
            "• 301+ (Hazardous): Emergency health warnings. "
            "PM2.5 refers to microscopic particles ≤ 2.5 micrometers that penetrate deep into the alveoli and bloodstream."
        ),
        practical_guidance="Wear N95/FFP2 masks and operate indoor HEPA purifiers when AQI exceeds 150."
    ),

    # -------------------------------------------------------------
    # WEATHER ALERTS & DISASTER CLASSIFICATIONS
    # -------------------------------------------------------------
    RAGKnowledgeItem(
        id="alerts_advisory_watch_warning",
        topic="weather_alerts",
        concept_title="Weather Alert Hierarchy: Advisory vs Watch vs Warning",
        keywords=["weather alert", "weather warning", "weather watch", "weather advisory", "flood alert", "cyclone warning"],
        explanation=(
            "Meteorological alert systems operate on a 3-tier escalation hierarchy: "
            "1. ADVISORY (Yellow): An event is occurring, imminent, or likely that could cause inconvenience or moderate hazard. Be aware. "
            "2. WATCH (Orange): Hazardous weather conditions are possible in the next 24-48 hours. Risk is elevated. Be prepared and monitor updates. "
            "3. WARNING (Red): Severe, life-threatening weather conditions are occurring or imminent within 12-24 hours. Take immediate protective action and heed evacuation orders."
        ),
        practical_guidance="Never wait for a warning to escalate before inspecting emergency supplies and flood/cyclone escape routes."
    )
]

def search_weather_knowledge(
    query_text: str,
    topic_filter: Optional[str] = None,
    top_k: int = 2
) -> RAGRetrievalResult:
    """
    Deterministically retrieves matching meteorological knowledge chunks.
    Filters by topic if provided, and performs keyword relevance scoring.
    """
    clean_query = query_text.lower().strip()
    words = set(re.findall(r'\b\w+\b', clean_query))

    scored_items = []
    for item in METEOROLOGICAL_KNOWLEDGE_BASE:
        # Apply topic filtering if specified
        if topic_filter and item.topic != topic_filter:
            continue

        score = 0
        # 1. Title match
        title_lower = item.concept_title.lower()
        if any(w in title_lower for w in words if len(w) > 2):
            score += 4

        # 2. Keyword matches
        for kw in item.keywords:
            if kw in clean_query:
                score += 8
            elif any(w in kw for w in words if len(w) > 3):
                score += 3

        # 3. Explanation text match
        expl_lower = item.explanation.lower()
        matched_words = sum(1 for w in words if len(w) > 3 and w in expl_lower)
        score += matched_words

        if score > 0:
            scored_items.append((score, item))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)
    top_items = [item for _, item in scored_items[:top_k]]

    if not top_items and topic_filter:
        # Fallback to default items in that topic if filtered
        top_items = [item for item in METEOROLOGICAL_KNOWLEDGE_BASE if item.topic == topic_filter][:1]

    # Synthesize context block for LLM explanation
    context_lines = []
    for item in top_items:
        context_lines.append(f"### Concept: {item.concept_title} ({item.topic.upper()})")
        context_lines.append(f"Explanation: {item.explanation}")
        context_lines.append(f"Guidance: {item.practical_guidance}\n")

    context_text = "\n".join(context_lines)

    return RAGRetrievalResult(
        matched_items=top_items,
        query_concept=query_text,
        context_text=context_text
    )
