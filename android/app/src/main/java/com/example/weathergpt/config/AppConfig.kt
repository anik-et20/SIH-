package com.example.weathergpt.config

object AppConfig {
    // Default base URL (10.0.2.2 for Android Emulator, can be switched to Wi-Fi IP e.g. 192.168.1.X or Production)
    const val DEFAULT_BASE_URL = "http://10.0.2.2:8000"
    const val DEFAULT_WS_URL = "ws://10.0.2.2:8000/ws/alerts"

    const val TIMEOUT_SECONDS = 30L

    // Endpoints
    const val ENDPOINT_WEATHER = "/api/weather"
    const val ENDPOINT_CHAT = "/api/chat"
    const val ENDPOINT_WS_ALERTS = "/ws/alerts"

    // Default Fallback Coordinates (Rewari, Haryana, India)
    const val DEFAULT_LOCATION_NAME = "Rewari, Haryana"
    const val DEFAULT_LATITUDE = 28.19
    const val DEFAULT_LONGITUDE = 76.62

    // SharedPreferences Keys
    const val PREFS_NAME = "weathergpt_preferences"
    const val KEY_ONBOARDING_COMPLETED = "key_onboarding_completed"
    const val KEY_LANGUAGE = "key_language"
    const val KEY_PERSONA = "key_persona"
    const val KEY_UNIT = "key_unit"
    const val KEY_CUSTOM_BASE_URL = "key_custom_base_url"
    const val KEY_LAST_LOCATION_NAME = "key_last_location_name"
    const val KEY_LAST_LATITUDE = "key_last_latitude"
    const val KEY_LAST_LONGITUDE = "key_last_longitude"
    const val KEY_VOICE_TTS_ENABLED = "key_voice_tts_enabled"
    const val KEY_NOTIFICATIONS_ENABLED = "key_notifications_enabled"
    const val KEY_CACHED_WEATHER_JSON = "key_cached_weather_json"
}
