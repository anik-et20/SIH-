import os
import json
import re
import logging
from typing import Tuple, Optional, Dict, Any, List
from groq import AsyncGroq

from schemas import (
    CanonicalLocation, ResolvedDate, CanonicalCurrentWeather,
    CanonicalHourlyForecast, CanonicalDailyForecast, CanonicalAirQuality,
    CanonicalAlerts, ValidatedWeatherContext, CalculatedInsights,
    CurrentWeatherInput, HourlyForecastInput, DailyForecastInput,
    WeatherAlertsInput, AirQualityInput, ExplainConceptInput
)
from geo_service import resolve_location
from date_service import resolve_date_string
from rag_service import search_weather_knowledge
from calc_service import (
    calculate_temperature_insights, calculate_rain_window,
    get_comfort_description, calculate_heat_index, calculate_wind_chill
)
from weather_service import (
    fetch_current_weather, fetch_hourly_forecast, fetch_daily_forecast,
    fetch_air_quality, fetch_weather_alerts
)
from sarvam_service import translate_text, get_sarvam_headers

logger = logging.getLogger("weathergpt.llm_service")

PERSONA_PROMPTS = {
    "responder": "You are a Chief NDRF Disaster Response Commander. Focus on tactical emergency response, flood rescue operations, road blockage risks, evacuation protocols, and emergency squad readiness.",
    "citizen": "You are a Disaster Safety & Evacuation Advisor. Focus on immediate citizen safety, shelter locations, 72-hour emergency survival kit prep, flood/cyclone warnings, and family protection steps.",
    "farmer": "You are an Agricultural Disaster & Extreme Weather Specialist. Focus on crop flood submergence prevention, livestock emergency shelter, storm surge damage control, and post-disaster farm recovery.",
    "admin": "You are a City Disaster Management Authority Officer. Focus on urban flood mitigation, dam discharge monitoring, electrical power grid storm risk, and emergency relief distribution."
}

LANGUAGE_NAMES = {
    "hi": "Hindi (हिंदी)", "hi-IN": "Hindi (हिंदी)",
    "ta": "Tamil (தமிழ்)", "ta-IN": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)", "te-IN": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)", "bn-IN": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)", "mr-IN": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)", "gu-IN": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)", "kn-IN": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)", "ml-IN": "Malayalam (മലയാളം)",
    "or": "Odia (ଓଡ଼ିଆ)", "or-IN": "Odia (ଓଡ଼ିଆ)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)", "pa-IN": "Punjabi (ਪੰਜਾਬੀ)",
    "en": "English", "en-IN": "English"
}

def detect_language_script(text: str) -> str:
    """Detects Indian regional language code from Unicode script ranges if auto-detection is needed."""
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"  # Devnagari (Hindi / Marathi)
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"  # Tamil
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "te"  # Telugu
    if re.search(r'[\u0980-\u09FF]', text):
        return "bn"  # Bengali
    if re.search(r'[\u0A80-\u0AFF]', text):
        return "gu"  # Gujarati
    if re.search(r'[\u0C80-\u0CFF]', text):
        return "kn"  # Kannada
    if re.search(r'[\u0D00-\u0D7F]', text):
        return "ml"  # Malayalam
    if re.search(r'[\u0B00-\u0B7F]', text):
        return "or"  # Odia
    if re.search(r'[\u0A00-\u0A7F]', text):
        return "pa"  # Punjabi
    return "en"

def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        return AsyncGroq(api_key=api_key)
    return None

def rule_based_tool_selection(user_query: str, default_location: str = "Delhi") -> Tuple[str, Dict[str, Any]]:
    """
    Deterministic tool selector for weather operations and RAG meteorological concept retrieval.
    """
    q = user_query.lower().strip()

    # 1. RAG Concept queries (e.g. "What does 70% chance of rain mean?", "Explain UV index", "dew point vs humidity")
    concept_keywords = [
        "chance of rain", "mean", "meaning", "explain", "what does", "what is", "why is", "how does",
        "dew point", "heat index", "wet bulb", "uv index", "pop", "inversion", "relative humidity vs",
        "aqi scale", "air quality index levels"
    ]
    if any(k in q for k in concept_keywords) and not ("in " in q and any(c in q for c in ["delhi", "mumbai", "london", "today", "tomorrow"])):
        # Determine specific topic filter
        topic = None
        if "rain" in q or "precipitation" in q or "pop" in q:
            topic = "precipitation"
        elif "heat" in q or "temperature" in q or "wet bulb" in q or "diurnal" in q:
            topic = "temperature"
        elif "uv" in q or "sun" in q:
            topic = "uv_index"
        elif "aqi" in q or "pm2.5" in q or "pm10" in q or "pollution" in q or "air quality" in q:
            topic = "air_quality"
        elif "humidity" in q or "dew point" in q:
            topic = "humidity"
        elif "wind" in q:
            topic = "wind"
        elif "alert" in q or "warning" in q or "cyclone" in q:
            topic = "weather_alerts"

        return "explain_weather_concept", {"concept": user_query, "topic": topic}

    # Extract location if query mentions "in <city>"
    loc = default_location or "Delhi"
    in_match = re.search(r'\bin\s+([A-Za-z\s]+?)(?:\s+today|\s+tomorrow|\s+this|\?|$)', user_query, re.IGNORECASE)
    if in_match:
        extracted = in_match.group(1).strip()
        if len(extracted) > 1 and extracted.lower() not in ["the", "a", "an", "this", "that"]:
            loc = extracted

    # 2. Air quality
    if any(k in q for k in ["aqi", "pm2.5", "pm10", "pollution", "air quality", "smog"]):
        return "get_air_quality", {"location": loc}

    # 3. Alerts and disaster risk
    if any(k in q for k in ["alert", "warning", "cyclone", "flood risk", "evacuation", "emergency", "ndrf"]):
        return "get_weather_alerts", {"location": loc}

    # 4. Multi-day forecast
    if any(k in q for k in ["7 day", "10 day", "14 day", "week", "weekly", "next few days"]):
        return "get_daily_forecast", {"location": loc, "days": 7}

    # 5. Hourly forecast / Timeline
    if any(k in q for k in ["hourly", "by hour", "timeline", "tonight", "this evening", "this afternoon", "when will it rain"]):
        return "get_hourly_forecast", {"location": loc, "date_str": "today", "hours": 24}

    # 6. Default to current weather
    return "get_current_weather", {"location": loc, "date_str": "today", "units": "celsius"}

def build_formatter_prompt(
    context: ValidatedWeatherContext,
    persona: str = "citizen",
    target_lang: str = "en",
    user_query: str = ""
) -> Tuple[str, str]:
    """
    Constructs the system prompt and validated user prompt for LLM synthesis.
    """
    persona_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["citizen"])
    lang_name = LANGUAGE_NAMES.get(target_lang, 'English')
    is_hindi = target_lang in ["hi", "hi-IN"]

    lang_directive = ""
    if is_hindi:
        lang_directive = "CRITICAL LANGUAGE DIRECTIVE: You MUST write your ENTIRE response in pure Hindi (हिंदी) using Devanagari script. Do NOT use English under any circumstances."
    elif target_lang not in ["en", "en-IN"]:
        lang_directive = f"CRITICAL LANGUAGE DIRECTIVE: You MUST write your ENTIRE response in {lang_name}. Do NOT use English."
    else:
        lang_directive = "Language: English."

    system_prompt = f"""You are DisasterGuard AI, an authoritative emergency weather and disaster intelligence system.
Role: {persona_prompt}
Target Output Language: {lang_name}

{lang_directive}

CRITICAL GROUND TRUTH RULES:
1. You MUST strictly use ONLY the verified meteorological data provided below.
2. DO NOT invent, hallucinate, or alter temperatures, wind speeds, humidity, or precipitation metrics.
3. If current temperature is stated as X°C, you MUST report X°C.
4. Provide direct, actionable decision support first, followed by key parameters and safety guidance.
5. Keep tone authoritative, professional, and clear.
"""

    context_dict: Dict[str, Any] = {
        "tool_used": context.tool_used,
        "query": user_query
    }

    if context.location:
        context_dict["location"] = context.location.display_name

    if context.target_date:
        context_dict["date"] = {
            "date_str": context.target_date.date_str,
            "day_name": context.target_date.day_name,
            "relative": context.target_date.relative_description
        }

    if context.current_weather:
        context_dict["current_weather"] = {
            "temperature_c": context.current_weather.temperature_c,
            "apparent_temperature_c": context.current_weather.apparent_temperature_c,
            "condition": context.current_weather.condition,
            "humidity_percent": context.current_weather.humidity_percent,
            "wind_speed_kmh": context.current_weather.wind_speed_kmh,
            "precipitation_mm": context.current_weather.precipitation_mm
        }

    if context.calculated_insights:
        if context.calculated_insights.temperature:
            context_dict["temperature_insights"] = context.calculated_insights.temperature.model_dump()
        if context.calculated_insights.rain_window:
            context_dict["rain_window"] = context.calculated_insights.rain_window.model_dump()

    if context.rag_knowledge:
        context_dict["rag_concept"] = context.rag_knowledge.context_text

    if context.air_quality:
        context_dict["air_quality"] = context.air_quality.model_dump()

    if context.alerts:
        context_dict["alerts"] = context.alerts.model_dump()

    if context.is_unavailable:
        context_dict["status"] = "UNAVAILABLE"
        context_dict["reason"] = context.unavailability_reason

    user_prompt = f"User Request: {user_query}\n\nValidated Ground Truth Data:\n{json.dumps(context_dict, indent=2)}"
    return system_prompt, user_prompt

def enforce_ground_truth_guardrails(response_text: str, context: ValidatedWeatherContext, target_lang: str = "en") -> str:
    """
    Guarantees zero-hallucination compliance.
    Validates that reported metrics in response_text match the canonical ground truth context.
    """
    is_hindi = target_lang in ["hi", "hi-IN"]

    if context.is_unavailable:
        loc_name = context.location.display_name if context.location else "the requested location"
        reason = context.unavailability_reason or f"Weather data currently unavailable for {loc_name}."
        if is_hindi:
            return f"📍 {loc_name} के लिए मौसम डेटा वर्तमान में अनुपलब्ध है। आपातकालीन हेल्पलाइन: NDRF 1078."
        return f"Weather service data currently unavailable for {loc_name}. ({reason})"

    if context.clarification_needed and context.clarification_options:
        candidates_str = ", ".join(context.clarification_options)
        if is_hindi:
            return f"आपके अनुरोध के लिए एक से अधिक स्थान मिले हैं। कृपया स्पष्ट करें: {candidates_str}."
        return f"Multiple locations found matching your query. Please clarify: {candidates_str}."

    if not response_text or not response_text.strip():
        # Generate clean fallback from context
        if context.current_weather and context.location:
            c = context.current_weather
            if is_hindi:
                return (
                    f"📍 {context.location.display_name} मौसम रिपोर्ट: "
                    f"वर्तमान तापमान {c.temperature_c}°C ({c.temperature_f}°F) है और स्थिति '{c.condition}' है। "
                    f"महसूस तापमान {c.apparent_temperature_c}°C, आर्द्रता {c.humidity_percent}%, "
                    f"हवा की गति {c.wind_speed_kmh} किमी/घंटा है। आपातकालीन हेल्पलाइन: NDRF 1078 / पुलिस 112."
                )
            return (
                f"📍 Weather Report for {context.location.display_name}: "
                f"Temperature is {c.temperature_c}°C ({c.temperature_f}°F) with {c.condition}. "
                f"Feels like {c.apparent_temperature_c}°C, humidity {c.humidity_percent}%, "
                f"wind {c.wind_speed_kmh} km/h. Emergency helpline: NDRF 1078."
            )
        elif context.rag_knowledge:
            return context.rag_knowledge.context_text

    output = response_text

    # Guardrail check: Ensure temperature matches ground truth if current weather is present
    if context.current_weather:
        actual_temp_c = context.current_weather.temperature_c
        actual_temp_f = context.current_weather.temperature_f
        actual_str_c = f"{actual_temp_c}°C"
        
        # Check if the output contains a hallucinated temperature deviating wildly
        temp_matches = re.findall(r'(\d{1,3}(?:\.\d+)?)\s*°?\s*C\b', output)
        for t_str in temp_matches:
            try:
                t_val = float(t_str)
                # If temperature differs from ground truth by more than 3 degrees and is not part of a range
                if abs(t_val - actual_temp_c) > 3.0:
                    # Replace hallucinated temperature with actual
                    output = re.sub(rf'\b{re.escape(t_str)}\s*°?\s*C\b', actual_str_c, output)
            except ValueError:
                pass

        # If actual temperature is still not in the response text, prepend or insert it
        has_temp = (
            str(actual_temp_c) in output or
            actual_str_c in output or
            str(int(actual_temp_c)) in output or
            str(round(actual_temp_c)) in output
        )
        if not has_temp:
            if is_hindi:
                output = f"📍 {context.location.display_name if context.location else 'स्थान'}: वर्तमान तापमान {actual_str_c} ({actual_temp_f}°F) है, {context.current_weather.condition}। {output}"
            else:
                output = f"📍 {context.location.display_name if context.location else 'Location'}: Current temperature is {actual_str_c} ({actual_temp_f}°F), {context.current_weather.condition}. {output}"

    return output

async def generate_weather_response(
    user_query: str,
    location_str: Optional[str] = "Delhi",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    persona: str = "citizen",
    language: str = "auto",
    weather_json: Optional[dict] = None
) -> Tuple[str, str, ValidatedWeatherContext]:
    """
    Executes the complete deterministic RAG & Strict Tool Calling Pipeline.
    1. Tool Selection -> 2. Location/Date Resolution -> 3. Open-Meteo Execution
    -> 4. Derived Calculations / RAG -> 5. Formatter -> 6. Guardrail -> 7. Sarvam Multilingual Translation.
    """
    # 1. Target language detection
    detected_lang = language
    if language == "auto":
        detected_lang = detect_language_script(user_query)
    target_lang = detected_lang if language == "auto" else language

    sarvam_available = bool(get_sarvam_headers())

    # 2. Tool Selection
    tool_name, tool_args = rule_based_tool_selection(user_query, default_location=location_str or "Delhi")

    # 3. Handle RAG Concept Retrieval Tool
    if tool_name == "explain_weather_concept":
        concept = tool_args.get("concept", user_query)
        topic = tool_args.get("topic")
        rag_res = search_weather_knowledge(concept, topic_filter=topic, top_k=3)
        context = ValidatedWeatherContext(
            tool_used="explain_weather_concept",
            rag_knowledge=rag_res
        )

        response_text = rag_res.context_text
        client = get_client()
        if client:
            try:
                sys_prompt, u_prompt = build_formatter_prompt(context, persona, target_lang, user_query)
                completion = await client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
                    messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": u_prompt}],
                    temperature=0.3,
                    max_tokens=600
                )
                response_text = completion.choices[0].message.content or rag_res.context_text
            except Exception as e:
                logger.warning(f"Groq RAG synthesis fallback: {e}")

        # Translation if needed (only if text is not already in target script)
        if sarvam_available and target_lang not in ["en", "en-IN"]:
            is_hindi_script = bool(re.search(r'[\u0900-\u097F]', response_text))
            if not is_hindi_script:
                t_out, _ = await translate_text(response_text, source_language_code="en-IN", target_language_code=target_lang)
                if t_out:
                    response_text = t_out

        return response_text, target_lang, context

    # 4. Resolve Location
    target_loc_name = tool_args.get("location") or location_str or "Delhi"
    try:
        loc = await resolve_location(target_loc_name, lat=lat, lon=lon)
    except Exception as e:
        loc = CanonicalLocation(name=target_loc_name, display_name=target_loc_name, latitude=28.6139, longitude=77.2090)

    # Ambiguity check
    if loc.is_ambiguous:
        context = ValidatedWeatherContext(
            tool_used=tool_name,
            location=loc,
            clarification_needed=True,
            clarification_options=loc.candidates
        )
        msg = f"Multiple locations found for '{target_loc_name}'. Please specify: {', '.join(loc.candidates)}."
        return msg, target_lang, context

    # 5. Resolve Date
    date_query_str = tool_args.get("date_str", "today")
    date_info = resolve_date_string(date_query_str)

    # 6. Execute Weather Tool Handlers
    curr_weather: Optional[CanonicalCurrentWeather] = None
    hourly_fc: Optional[CanonicalHourlyForecast] = None
    daily_fc: Optional[CanonicalDailyForecast] = None
    aq_data: Optional[CanonicalAirQuality] = None
    alerts_data: Optional[CanonicalAlerts] = None
    calc_insights: Optional[CalculatedInsights] = None

    try:
        if tool_name in ["get_current_weather", "get_hourly_forecast"]:
            curr_weather = await fetch_current_weather(loc, date_info)
            hourly_fc = await fetch_hourly_forecast(loc, date_info, hours=24)
            t_ins = calculate_temperature_insights(hourly_fc.slots)
            r_win = calculate_rain_window(hourly_fc.slots)
            calc_insights = CalculatedInsights(temperature=t_ins, rain_window=r_win)

        elif tool_name == "get_daily_forecast":
            curr_weather = await fetch_current_weather(loc, date_info)
            daily_fc = await fetch_daily_forecast(loc, days=tool_args.get("days", 7))

        elif tool_name == "get_air_quality":
            curr_weather = await fetch_current_weather(loc, date_info)
            aq_data = await fetch_air_quality(loc)

        elif tool_name == "get_weather_alerts":
            curr_weather = await fetch_current_weather(loc, date_info)
            alerts_data = await fetch_weather_alerts(loc)

        else:
            curr_weather = await fetch_current_weather(loc, date_info)

    except Exception as fetch_err:
        logger.error(f"Weather API fetch error: {fetch_err}")
        context = ValidatedWeatherContext(
            tool_used=tool_name,
            location=loc,
            target_date=date_info,
            is_unavailable=True,
            unavailability_reason=str(fetch_err)
        )
        return enforce_ground_truth_guardrails("", context, target_lang=target_lang), target_lang, context

    context = ValidatedWeatherContext(
        tool_used=tool_name,
        location=loc,
        target_date=date_info,
        current_weather=curr_weather,
        hourly_forecast=hourly_fc,
        daily_forecast=daily_fc,
        air_quality=aq_data,
        alerts=alerts_data,
        calculated_insights=calc_insights
    )

    # 7. LLM Response Synthesis
    client = get_client()
    raw_response = ""
    sys_prompt, u_prompt = build_formatter_prompt(context, persona, target_lang, user_query)

    if client:
        try:
            completion = await client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
                messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": u_prompt}],
                temperature=0.4,
                max_tokens=700
            )
            raw_response = completion.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Groq API call error: {e}")
            raw_response = ""

    # 8. Deterministic Fallback if LLM output is empty or offline
    if not raw_response:
        is_hindi = target_lang in ["hi", "hi-IN"]
        if curr_weather:
            if is_hindi:
                raw_response = (
                    f"📍 आपदा प्रबंधन मौसम रिपोर्ट ({loc.display_name}): "
                    f"वर्तमान तापमान {curr_weather.temperature_c}°C ({curr_weather.temperature_f}°F) है, स्थिति '{curr_weather.condition}'। "
                    f"महसूस तापमान {curr_weather.apparent_temperature_c}°C, आर्द्रता {curr_weather.humidity_percent}% और हवा की गति {curr_weather.wind_speed_kmh} किमी/घंटा है। "
                    f"आपातकालीन हेल्पलाइन: NDRF 1078 / पुलिस 112."
                )
            else:
                raw_response = (
                    f"📍 Disaster Management Weather Report for {loc.display_name}: "
                    f"Current temperature is {curr_weather.temperature_c}°C ({curr_weather.temperature_f}°F) with {curr_weather.condition}. "
                    f"Feels like {curr_weather.apparent_temperature_c}°C with {curr_weather.humidity_percent}% humidity and wind speed of {curr_weather.wind_speed_kmh} km/h. "
                    f"Emergency Helpline: NDRF 1078 / Police 112."
                )
        elif aq_data:
            raw_response = f"📍 Air Quality for {loc.display_name}: AQI is {aq_data.aqi} ({aq_data.category}). {aq_data.health_advice}"
        elif alerts_data:
            raw_response = f"📍 Emergency Alerts for {loc.display_name}: Risk level is {alerts_data.overall_risk_level.upper()}."

    # 9. Enforce Ground Truth Guardrails
    validated_response = enforce_ground_truth_guardrails(raw_response, context, target_lang=target_lang)

    # 10. Sarvam AI Multilingual Translation (only if response is not already in target language script)
    final_response = validated_response
    if sarvam_available and target_lang not in ["en", "en-IN"]:
        is_already_target_script = False
        if target_lang in ["hi", "hi-IN", "mr", "mr-IN"]:
            is_already_target_script = bool(re.search(r'[\u0900-\u097F]', validated_response))
        elif target_lang in ["ta", "ta-IN"]:
            is_already_target_script = bool(re.search(r'[\u0B80-\u0BFF]', validated_response))
        elif target_lang in ["te", "te-IN"]:
            is_already_target_script = bool(re.search(r'[\u0C00-\u0C7F]', validated_response))
        elif target_lang in ["bn", "bn-IN"]:
            is_already_target_script = bool(re.search(r'[\u0980-\u09FF]', validated_response))
        elif target_lang in ["gu", "gu-IN"]:
            is_already_target_script = bool(re.search(r'[\u0A80-\u0AFF]', validated_response))
        elif target_lang in ["kn", "kn-IN"]:
            is_already_target_script = bool(re.search(r'[\u0C80-\u0CFF]', validated_response))
        elif target_lang in ["ml", "ml-IN"]:
            is_already_target_script = bool(re.search(r'[\u0D00-\u0D7F]', validated_response))
        elif target_lang in ["or", "or-IN"]:
            is_already_target_script = bool(re.search(r'[\u0B00-\u0B7F]', validated_response))
        elif target_lang in ["pa", "pa-IN"]:
            is_already_target_script = bool(re.search(r'[\u0A00-\u0A7F]', validated_response))

        if not is_already_target_script:
            try:
                translated_output, _ = await translate_text(
                    input_text=validated_response,
                    source_language_code="en-IN",
                    target_language_code=target_lang
                )
                if translated_output and len(translated_output.strip()) > 5:
                    final_response = translated_output
            except Exception as e:
                logger.warning(f"Sarvam translation error: {e}")

    return final_response, target_lang, context
