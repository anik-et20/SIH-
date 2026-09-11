package com.example.weathergpt.ui.forecast

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.remote.ApiClient
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.*

class ForecastFragment : Fragment() {

    private lateinit var prefs: PreferencesManager
    private lateinit var apiClient: ApiClient

    private lateinit var tvLocation: TextView
    private lateinit var recyclerForecast: RecyclerView
    private lateinit var tvSunrise: TextView
    private lateinit var tvSunset: TextView
    private lateinit var tvPrecipTotal: TextView
    
    // NEW: Climate and Advisory views
    private lateinit var tvClimateTrend: TextView
    private lateinit var tvCropAdvisory: TextView
    private lateinit var layoutClimateSection: LinearLayout

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_forecast, container, false)
        prefs = PreferencesManager(requireContext())
        apiClient = ApiClient(prefs)

        tvLocation = view.findViewById(R.id.tvForecastHeaderLocation)
        recyclerForecast = view.findViewById(R.id.recyclerForecastDays)
        tvSunrise = view.findViewById(R.id.tvSunriseTime)
        tvSunset = view.findViewById(R.id.tvSunsetTime)
        tvPrecipTotal = view.findViewById(R.id.tvPrecipitationTotal)
        
        tvClimateTrend = view.findViewById(R.id.tvClimateTrend) ?: TextView(requireContext())
        tvCropAdvisory = view.findViewById(R.id.tvCropAdvisory) ?: TextView(requireContext())
        layoutClimateSection = view.findViewById(R.id.layoutClimateSection) ?: LinearLayout(requireContext())

        recyclerForecast.layoutManager = LinearLayoutManager(requireContext())
        tvLocation.text = prefs.locationName

        loadForecastData()
        loadAdvancedData()
        return view
    }

    private fun loadForecastData() {
        viewLifecycleOwner.lifecycleScope.launch {
            val result = apiClient.fetchWeather(location = prefs.locationName)
            result.onSuccess { data ->
                tvLocation.text = data.locationInfo
                recyclerForecast.adapter = ForecastAdapter(data.forecastDays, prefs.unit)

                val firstDay = data.forecastDays.firstOrNull()
                if (firstDay != null) {
                    tvSunrise.text = firstDay.sunrise
                    tvSunset.text = firstDay.sunset
                }

                val totalRain = data.forecastDays.sumOf { it.precipitationSum }
                tvPrecipTotal.text = String.format(Locale.getDefault(), "💧 7-Day Expected Rain: %.1f mm", totalRain)
            }
        }
    }
    
    private fun loadAdvancedData() {
        viewLifecycleOwner.lifecycleScope.launch {
            // Phase 7: Climate Analytics
            apiClient.fetchClimateTrend().onSuccess { jsonStr ->
                try {
                    val jsonObj = JSONObject(jsonStr)
                    val status = jsonObj.optString("trend", "Stable")
                    val dev = jsonObj.optDouble("temperature_deviation_c", 0.0)
                    tvClimateTrend.text = "30-Year Trend: $status (Deviation: ${if (dev > 0) "+" else ""}$dev°C)"
                    layoutClimateSection.visibility = View.VISIBLE
                } catch (e: Exception) {}
            }
            
            // Phase 7: Crop Advisory
            apiClient.fetchCropAdvisory().onSuccess { jsonStr ->
                try {
                    val jsonObj = JSONObject(jsonStr)
                    val recs = jsonObj.optJSONArray("recommendations")
                    if (recs != null && recs.length() > 0) {
                        tvCropAdvisory.text = "🌾 Farmer Advisory: ${recs.getString(0)}"
                        layoutClimateSection.visibility = View.VISIBLE
                    }
                } catch (e: Exception) {}
            }
        }
    }
}
