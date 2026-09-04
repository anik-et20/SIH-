package com.example.weathergpt.utils

import java.text.SimpleDateFormat
import java.util.*

object WeatherUtils {

    fun getWeatherIcon(code: Int): String {
        return when (code) {
            0 -> "☀️" // Clear sky
            1 -> "🌤️" // Mainly clear
            2 -> "⛅" // Partly cloudy
            3 -> "☁️" // Overcast
            45, 48 -> "🌫️" // Fog
            51, 53, 55 -> "🌧️" // Drizzle
            61, 63 -> "🌧️" // Rain
            65 -> "🌊" // Heavy Rain / Flood Risk
            71, 73, 75 -> "❄️" // Snow
            80, 81, 82 -> "🌦️" // Rain Showers
            95, 96, 99 -> "🌩️" // Severe Thunderstorm
            else -> "🌤️"
        }
    }

    fun getWeatherConditionText(code: Int): String {
        return when (code) {
            0 -> "Clear Sky"
            1 -> "Mainly Clear"
            2 -> "Partly Cloudy"
            3 -> "Overcast"
            45, 48 -> "Dense Fog"
            51 -> "Light Drizzle"
            53 -> "Moderate Drizzle"
            55 -> "Heavy Inundation Drizzle"
            61 -> "Slight Rain"
            63 -> "Moderate Rain"
            65 -> "Severe Torrential Rain"
            71, 73, 75 -> "Snowfall"
            80, 81, 82 -> "Violent Rain Showers"
            95, 96, 99 -> "Severe Thunderstorm & Lightning"
            else -> "Fair Weather"
        }
    }

    fun formatTemperature(tempCelsius: Double, unit: String): String {
        return if (unit.equals("F", ignoreCase = true)) {
            val tempF = (tempCelsius * 9 / 5) + 32
            String.format(Locale.getDefault(), "%.1f°F", tempF)
        } else {
            String.format(Locale.getDefault(), "%.1f°C", tempCelsius)
        }
    }

    fun formatDayName(dateStr: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = inputFormat.parse(dateStr) ?: return dateStr
            val calendar = Calendar.getInstance()
            val todayCalendar = Calendar.getInstance()
            calendar.time = date

            if (calendar.get(Calendar.YEAR) == todayCalendar.get(Calendar.YEAR) &&
                calendar.get(Calendar.DAY_OF_YEAR) == todayCalendar.get(Calendar.DAY_OF_YEAR)
            ) {
                "Today"
            } else {
                val dayFormat = SimpleDateFormat("EEE", Locale.getDefault())
                dayFormat.format(date)
            }
        } catch (e: Exception) {
            dateStr
        }
    }

    fun formatDateFormatted(dateStr: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = inputFormat.parse(dateStr) ?: return dateStr
            val outputFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
            outputFormat.format(date)
        } catch (e: Exception) {
            dateStr
        }
    }

    fun sanitizeTextForHindiSpeech(text: String): String {
        return text
            .replace(Regex("[*#_~`>]"), "")
            .replace(Regex("[📍🚨⚠️🌊⚡🔥❄️🌀🆘🚑👮🚒🌾🏛️🚗✈️🏃💬📊🎯]"), "")
            .replace(Regex("\n+"), ". ")
            .trim()
    }

    fun generateQuickAdvisory(
        persona: String,
        temp: Double,
        condition: String,
        rainProb: Double,
        humidity: Int,
        wind: Double
    ): String {
        return when (persona.lowercase()) {
            "responder" -> {
                if (rainProb > 40 || condition.contains("rain", ignoreCase = true) || wind > 30) {
                    "🚨 NDRF TACTICAL ALERT: Severe weather expected (${String.format(Locale.getDefault(), "%.0f", rainProb)}% precipitation probability, wind ${wind} km/h).\n• Prepare flood rescue boats and water pumping units.\n• Monitor low-lying road blockages and river inundation levels."
                } else {
                    "🛡️ NDRF SQUAD STATUS: Normal disaster monitoring mode. Emergency response teams on standby."
                }
            }
            "farmer" -> {
                if (rainProb > 40 || condition.contains("rain", ignoreCase = true)) {
                    "🌧️ AGRICULTURAL DISASTER WATCH: High flood/rain probability (${String.format(Locale.getDefault(), "%.0f", rainProb)}%).\n• Secure standing crops and clear drainage channels.\n• Move livestock to elevated dry shelters."
                } else if (temp > 35) {
                    "☀️ EXTREME HEAT ADVISORY: Temperature reaching ${temp}°C.\n• Irrigate crops early in the morning.\n• Protect livestock from heatstroke."
                } else {
                    "🌾 Normal farm conditions. Maintain standard crop protection & storm precautions."
                }
            }
            "admin" -> {
                if (condition.contains("thunder", ignoreCase = true) || wind > 30) {
                    "🏛️ INFRASTRUCTURE ALERT: Power grid hazard & urban flooding warning active. Inspect municipal pumps."
                } else {
                    "🏛️ Municipal & power grid infrastructure operating normally."
                }
            }
            "citizen" -> {
                if (rainProb > 40 || condition.contains("rain", ignoreCase = true)) {
                    "🆘 CITIZEN SAFETY ALERT: Severe weather active.\n• Check emergency evacuation routes and 72-hour survival kit.\n• Stay tuned to NDRF helpline 1078."
                } else {
                    "✅ Normal weather safety conditions in your region."
                }
            }
            else -> "Disaster risk status: Current weather $condition, temperature $temp°C."
        }
    }
}
