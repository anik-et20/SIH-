package com.example.weathergpt.ui.forecast

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.remote.ApiClient
import kotlinx.coroutines.launch
import java.util.*

class ForecastFragment : Fragment() {

    private lateinit var prefs: PreferencesManager
    private lateinit var apiClient: ApiClient

    private lateinit var tvLocation: TextView
    private lateinit var recyclerForecast: RecyclerView
    private lateinit var tvSunrise: TextView
    private lateinit var tvSunset: TextView
    private lateinit var tvPrecipTotal: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_forecast, container, false)
        prefs = PreferencesManager(requireContext())
        apiClient = ApiClient(prefs)

        tvLocation = view.findViewById(R.id.tvForecastHeaderLocation)
        recyclerForecast = view.findViewById(R.id.recyclerForecastDays)
        tvSunrise = view.findViewById(R.id.tvSunriseTime)
        tvSunset = view.findViewById(R.id.tvSunsetTime)
        tvPrecipTotal = view.findViewById(R.id.tvPrecipitationTotal)

        recyclerForecast.layoutManager = LinearLayoutManager(requireContext())
        tvLocation.text = prefs.locationName

        loadForecastData()
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
}
