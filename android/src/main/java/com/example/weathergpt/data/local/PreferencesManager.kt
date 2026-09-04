package com.example.weathergpt.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.weathergpt.config.AppConfig

class PreferencesManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(AppConfig.PREFS_NAME, Context.MODE_PRIVATE)

    var isOnboardingCompleted: Boolean
        get() = prefs.getBoolean(AppConfig.KEY_ONBOARDING_COMPLETED, false)
        set(value) = prefs.edit().putBoolean(AppConfig.KEY_ONBOARDING_COMPLETED, value).apply()

    var language: String
        get() = prefs.getString(AppConfig.KEY_LANGUAGE, "en") ?: "en"
        set(value) = prefs.edit().putString(AppConfig.KEY_LANGUAGE, value).apply()

    var persona: String
        get() = prefs.getString(AppConfig.KEY_PERSONA, "farmer") ?: "farmer"
        set(value) = prefs.edit().putString(AppConfig.KEY_PERSONA, value).apply()

    var unit: String
        get() = prefs.getString(AppConfig.KEY_UNIT, "C") ?: "C"
        set(value) = prefs.edit().putString(AppConfig.KEY_UNIT, value).apply()

    var baseUrl: String
        get() = prefs.getString(AppConfig.KEY_CUSTOM_BASE_URL, AppConfig.DEFAULT_BASE_URL) ?: AppConfig.DEFAULT_BASE_URL
        set(value) = prefs.edit().putString(AppConfig.KEY_CUSTOM_BASE_URL, value.trimEnd('/')).apply()

    val wsUrl: String
        get() {
            val base = baseUrl
            val wsBase = if (base.startsWith("https://")) {
                base.replaceFirst("https://", "wss://")
            } else if (base.startsWith("http://")) {
                base.replaceFirst("http://", "ws://")
            } else {
                "ws://$base"
            }
            return "$wsBase${AppConfig.ENDPOINT_WS_ALERTS}"
        }

    var locationName: String
        get() = prefs.getString(AppConfig.KEY_LAST_LOCATION_NAME, AppConfig.DEFAULT_LOCATION_NAME) ?: AppConfig.DEFAULT_LOCATION_NAME
        set(value) = prefs.edit().putString(AppConfig.KEY_LAST_LOCATION_NAME, value).apply()

    var latitude: Double
        get() = prefs.getFloat(AppConfig.KEY_LAST_LATITUDE, AppConfig.DEFAULT_LATITUDE.toFloat()).toDouble()
        set(value) = prefs.edit().putFloat(AppConfig.KEY_LAST_LATITUDE, value.toFloat()).apply()

    var longitude: Double
        get() = prefs.getFloat(AppConfig.KEY_LAST_LONGITUDE, AppConfig.DEFAULT_LONGITUDE.toFloat()).toDouble()
        set(value) = prefs.edit().putFloat(AppConfig.KEY_LAST_LONGITUDE, value.toFloat()).apply()

    var isVoiceTtsEnabled: Boolean
        get() = prefs.getBoolean(AppConfig.KEY_VOICE_TTS_ENABLED, true)
        set(value) = prefs.edit().putBoolean(AppConfig.KEY_VOICE_TTS_ENABLED, value).apply()

    var isNotificationsEnabled: Boolean
        get() = prefs.getBoolean(AppConfig.KEY_NOTIFICATIONS_ENABLED, true)
        set(value) = prefs.edit().putBoolean(AppConfig.KEY_NOTIFICATIONS_ENABLED, value).apply()

    var cachedWeatherJson: String?
        get() = prefs.getString(AppConfig.KEY_CACHED_WEATHER_JSON, null)
        set(value) = prefs.edit().putString(AppConfig.KEY_CACHED_WEATHER_JSON, value).apply()
}
