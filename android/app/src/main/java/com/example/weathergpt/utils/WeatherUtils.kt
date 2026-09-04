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
            65 -> "⛈️" // Heavy Rain
            71, 73, 75 -> "❄️" // Snow
            80, 81, 82 -> "🌦️" // Rain Showers
            95, 96, 99 -> "🌩️" // Thunderstorm
            else -> "🌤️"
        }
    }

    fun getWeatherConditionText(code: Int): String {
        return when (code) {
            0 -> "Clear Sky"
            1 -> "Mainly Clear"
            2 -> "Partly Cloudy"
            3 -> "Overcast"
            45, 48 -> "Foggy"
            51 -> "Light Drizzle"
            53 -> "Moderate Drizzle"
            55 -> "Dense Drizzle"
            61 -> "Slight Rain"
            63 -> "Moderate Rain"
            65 -> "Heavy Rain"
            71, 73, 75 -> "Snowfall"
            80, 81, 82 -> "Rain Showers"
            95, 96, 99 -> "Thunderstorm"
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

    fun generateQuickAdvisory(
        persona: String,
        temp: Double,
        condition: String,
        rainProb: Double,
        humidity: Int,
        wind: Double
    ): String {
        return when (persona.lowercase()) {
            "farmer" -> {
                if (rainProb > 40 || condition.contains("rain", ignoreCase = true) || condition.contains("drizzle", ignoreCase = true)) {
                    "🌧️ Rain expected today (${String.format(Locale.getDefault(), "%.0f", rainProb)}% probability).\n• Delay field irrigation to prevent waterlogging.\n• Avoid spraying pesticides or fertilizers before rain."
                } else if (temp > 35) {
                    "☀️ High temperature conditions today (${temp}°C).\n• Schedule irrigation during early morning or late evening.\n• Ensure adequate shade and hydration for livestock."
                } else if (wind > 20) {
                    "💨 Strong winds (${wind} km/h) reported.\n• Secure young crops, support tall plants, and hold pesticide spraying."
                } else {
                    "🌾 Favorable agricultural conditions.\n• Good window for harvesting, weeding, and normal field operations.\n• Soil moisture guidance: Weather-based scheduling optimal."
                }
            }
            "commuter" -> {
                if (rainProb > 40 || condition.contains("rain", ignoreCase = true)) {
                    "☔ Rain is likely today.\n• Carry an umbrella and rain protection.\n• Allow 15–20 minutes extra travel time for wet roads."
                } else {
                    "🚗 Clear travel conditions expected.\n• Normal traffic flow; pleasant commuting weather."
                }
            }
            "aviation" -> {
                if (condition.contains("thunder", ignoreCase = true) || condition.contains("fog", ignoreCase = true) || wind > 25) {
                    "✈️ Potential travel alert: Low visibility or high wind gusts reported. Check flight statuses."
                } else {
                    "✈️ Excellent flight visibility and calm cruising weather."
                }
            }
            "outdoor" -> {
                if (temp > 35) {
                    "🏃 High heat index. Plan running or outdoor sports before 9 AM or after 6 PM. Stay hydrated!"
                } else if (rainProb > 50) {
                    "🌧️ Rain showers likely. Consider indoor workouts or waterproof gear."
                } else {
                    "🏃 Great conditions for outdoor sports, walking, and hiking."
                }
            }
            else -> "Weather is currently $condition with a temperature of $temp°C."
        }
    }
}
