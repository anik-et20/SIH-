package com.example.weathergpt.data.models

import org.json.JSONObject

data class CurrentWeather(
    val temperature: Double,
    val relativeHumidity: Int,
    val apparentTemperature: Double,
    val windSpeed: Double,
    val weatherCode: Int,
    val conditionText: String,
    val isDay: Int,
    val precipitation: Double
) {
    companion object {
        fun fromJson(json: JSONObject): CurrentWeather {
            return CurrentWeather(
                temperature = json.optDouble("temperature_2m", 0.0),
                relativeHumidity = json.optInt("relative_humidity_2m", 0),
                apparentTemperature = json.optDouble("apparent_temperature", json.optDouble("temperature_2m", 0.0)),
                windSpeed = json.optDouble("wind_speed_10m", 0.0),
                weatherCode = json.optInt("weather_code", 0),
                conditionText = json.optString("condition_text", "Clear"),
                isDay = json.optInt("is_day", 1),
                precipitation = json.optDouble("precipitation", 0.0)
            )
        }
    }
}

data class ForecastDayItem(
    val date: String,
    val dayName: String,
    val maxTemp: Double,
    val minTemp: Double,
    val weatherCode: Int,
    val conditionText: String,
    val conditionIcon: String,
    val precipitationSum: Double,
    val sunrise: String,
    val sunset: String
)

data class WeatherData(
    val locationInfo: String,
    val current: CurrentWeather,
    val forecastDays: List<ForecastDayItem>,
    val rawJson: String
)
