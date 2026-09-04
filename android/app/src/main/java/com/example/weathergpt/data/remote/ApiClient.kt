package com.example.weathergpt.data.remote

import com.example.weathergpt.config.AppConfig
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.models.CurrentWeather
import com.example.weathergpt.data.models.ForecastDayItem
import com.example.weathergpt.data.models.WeatherData
import com.example.weathergpt.utils.WeatherUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClient(private val prefs: PreferencesManager) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(AppConfig.TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(AppConfig.TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .writeTimeout(AppConfig.TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    suspend fun fetchWeather(location: String? = null, lat: Double? = null, lon: Double? = null): Result<WeatherData> =
        withContext(Dispatchers.IO) {
            try {
                val urlBuilder = StringBuilder("${prefs.baseUrl}${AppConfig.ENDPOINT_WEATHER}")
                if (lat != null && lon != null) {
                    urlBuilder.append("?lat=$lat&lon=$lon")
                } else {
                    val loc = location ?: prefs.locationName
                    urlBuilder.append("?location=${java.net.URLEncoder.encode(loc, "UTF-8")}")
                }

                val request = Request.Builder()
                    .url(urlBuilder.toString())
                    .get()
                    .build()

                val response = client.newCall(request).execute()
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Server error: HTTP ${response.code}"))
                }

                val bodyStr = response.body?.string() ?: return@withContext Result.failure(IOException("Empty response body"))
                prefs.cachedWeatherJson = bodyStr

                val json = JSONObject(bodyStr)
                val dataObj = json.optJSONObject("data") ?: json

                val locationInfo = dataObj.optString("location_info", prefs.locationName)
                val currentObj = dataObj.optJSONObject("current") ?: JSONObject()
                val currentWeather = CurrentWeather.fromJson(currentObj)

                val dailyObj = dataObj.optJSONObject("daily")
                val forecastList = mutableListOf<ForecastDayItem>()

                if (dailyObj != null) {
                    val times = dailyObj.optJSONArray("time") ?: JSONArray()
                    val codes = dailyObj.optJSONArray("weather_code") ?: JSONArray()
                    val maxTemps = dailyObj.optJSONArray("temperature_2m_max") ?: JSONArray()
                    val minTemps = dailyObj.optJSONArray("temperature_2m_min") ?: JSONArray()
                    val sunrises = dailyObj.optJSONArray("sunrise") ?: JSONArray()
                    val sunsets = dailyObj.optJSONArray("sunset") ?: JSONArray()
                    val precipSums = dailyObj.optJSONArray("precipitation_sum") ?: JSONArray()

                    for (i in 0 until times.length()) {
                        val dateStr = times.optString(i, "")
                        val code = codes.optInt(i, 0)
                        val maxT = maxTemps.optDouble(i, 0.0)
                        val minT = minTemps.optDouble(i, 0.0)
                        val sunriseStr = sunrises.optString(i, "").substringAfter("T", "06:00")
                        val sunsetStr = sunsets.optString(i, "").substringAfter("T", "18:30")
                        val precipSum = precipSums.optDouble(i, 0.0)

                        forecastList.add(
                            ForecastDayItem(
                                date = dateStr,
                                dayName = WeatherUtils.formatDayName(dateStr),
                                maxTemp = maxT,
                                minTemp = minT,
                                weatherCode = code,
                                conditionText = WeatherUtils.getWeatherConditionText(code),
                                conditionIcon = WeatherUtils.getWeatherIcon(code),
                                precipitationSum = precipSum,
                                sunrise = sunriseStr,
                                sunset = sunsetStr
                            )
                        )
                    }
                }

                val weatherData = WeatherData(
                    locationInfo = locationInfo,
                    current = currentWeather,
                    forecastDays = forecastList,
                    rawJson = bodyStr
                )

                Result.success(weatherData)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun sendChatQuery(
        query: String,
        location: String,
        lat: Double? = null,
        lon: Double? = null,
        persona: String,
        language: String
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val jsonPayload = JSONObject().apply {
                put("query", query)
                put("location", location)
                if (lat != null && lon != null) {
                    put("lat", lat)
                    put("lon", lon)
                }
                put("persona", persona.lowercase())
                put("language", language.lowercase())
            }

            val requestBody = jsonPayload.toString()
                .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

            val request = Request.Builder()
                .url("${prefs.baseUrl}${AppConfig.ENDPOINT_CHAT}")
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(IOException("HTTP error: ${response.code}"))
            }

            val responseStr = response.body?.string() ?: return@withContext Result.failure(IOException("Empty response"))
            val responseJson = JSONObject(responseStr)
            val reply = responseJson.optString("response", "Could not parse response.")
            Result.success(reply)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
