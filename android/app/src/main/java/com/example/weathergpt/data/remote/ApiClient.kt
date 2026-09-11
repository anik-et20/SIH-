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
        .retryOnConnectionFailure(true)
        .connectTimeout(60L, TimeUnit.SECONDS)
        .readTimeout(60L, TimeUnit.SECONDS)
        .writeTimeout(60L, TimeUnit.SECONDS)
        .build()

    /** Response from /api/chat.  audioBase64 is a base64 WAV from Sarvam AI TTS; null when absent. */
    data class ChatResponse(val text: String, val audioBase64: String?)

    suspend fun fetchWeather(
        location: String? = null,
        lat: Double? = null,
        lon: Double? = null
    ): Result<WeatherData> = withContext(Dispatchers.IO) {
        try {
            val urlBuilder = StringBuilder(prefs.baseUrl + AppConfig.ENDPOINT_WEATHER)
            if (lat != null && lon != null) {
                urlBuilder.append("?lat=$lat&lon=$lon")
            } else {
                val loc = location ?: prefs.locationName
                urlBuilder.append("?location=" + java.net.URLEncoder.encode(loc, "UTF-8"))
            }

            val request = Request.Builder().url(urlBuilder.toString()).get().build()
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(IOException("Server error: HTTP ${response.code}"))
            }

            val bodyStr = response.body?.string()
                ?: return@withContext Result.failure(IOException("Empty response body"))
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
                    forecastList.add(ForecastDayItem(
                        date = times.optString(i, ""),
                        dayName = WeatherUtils.formatDayName(times.optString(i, "")),
                        maxTemp = maxTemps.optDouble(i, 0.0),
                        minTemp = minTemps.optDouble(i, 0.0),
                        weatherCode = codes.optInt(i, 0),
                        conditionText = WeatherUtils.getWeatherConditionText(codes.optInt(i, 0)),
                        conditionIcon = WeatherUtils.getWeatherIcon(codes.optInt(i, 0)),
                        precipitationSum = precipSums.optDouble(i, 0.0),
                        sunrise = sunrises.optString(i, "").substringAfter("T", "06:00"),
                        sunset = sunsets.optString(i, "").substringAfter("T", "18:30")
                    ))
                }
            }

            Result.success(WeatherData(
                locationInfo = locationInfo,
                current = currentWeather,
                forecastDays = forecastList,
                rawJson = bodyStr
            ))
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun sendChatQuery(
        query: String,
        location: String,
        lat: Double? = null,
        lon: Double? = null,
        persona: String,
        language: String
    ): Result<ChatResponse> = withContext(Dispatchers.IO) {
        try {
            val jsonPayload = JSONObject().apply {
                put("query", query)
                put("location", location)
                if (lat != null && lon != null) { put("lat", lat); put("lon", lon) }
                put("persona", persona.lowercase())
                put("language", language.lowercase())
            }
            val requestBody = jsonPayload.toString()
                .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
            val request = Request.Builder()
                .url(prefs.baseUrl + AppConfig.ENDPOINT_CHAT)
                .post(requestBody)
                .build()
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(IOException("HTTP error: ${response.code}"))
            }
            val responseStr = response.body?.string()
                ?: return@withContext Result.failure(IOException("Empty response"))
            val responseJson = JSONObject(responseStr)
            val replyText = responseJson.optString("response", "Could not parse response.")
            val audioB64 = responseJson.optString("audio_base64", "").takeIf { it.isNotEmpty() }
            Result.success(ChatResponse(text = replyText, audioBase64 = audioB64))
        } catch (e: Exception) { Result.failure(e) }
    }

    // --- NEW API CALLS FOR WEB PARITY ---
    suspend fun fetchAlerts(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url(prefs.baseUrl + "/api/alerts/sachet").get().build()
            val res = client.newCall(req).execute()
            if (!res.isSuccessful) return@withContext Result.failure(IOException("HTTP ${res.code}"))
            Result.success(res.body?.string() ?: "")
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun fetchSitRep(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url(prefs.baseUrl + "/api/authority/sitrep?location=" + java.net.URLEncoder.encode(prefs.locationName, "UTF-8")).get().build()
            val res = client.newCall(req).execute()
            if (!res.isSuccessful) return@withContext Result.failure(IOException("HTTP ${res.code}"))
            Result.success(res.body?.string() ?: "")
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun fetchClimateTrend(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url(prefs.baseUrl + "/api/climate/trend?location=" + java.net.URLEncoder.encode(prefs.locationName, "UTF-8")).get().build()
            val res = client.newCall(req).execute()
            if (!res.isSuccessful) return@withContext Result.failure(IOException("HTTP ${res.code}"))
            Result.success(res.body?.string() ?: "")
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun fetchCropAdvisory(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url(prefs.baseUrl + "/api/advisory/farmer?location=" + java.net.URLEncoder.encode(prefs.locationName, "UTF-8")).get().build()
            val res = client.newCall(req).execute()
            if (!res.isSuccessful) return@withContext Result.failure(IOException("HTTP ${res.code}"))
            Result.success(res.body?.string() ?: "")
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun fetchTransparency(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url(prefs.baseUrl + "/api/transparency/verify?source_id=imd_delhi").get().build()
            val res = client.newCall(req).execute()
            if (!res.isSuccessful) return@withContext Result.failure(IOException("HTTP ${res.code}"))
            Result.success(res.body?.string() ?: "")
        } catch (e: Exception) { Result.failure(e) }
    }

}
