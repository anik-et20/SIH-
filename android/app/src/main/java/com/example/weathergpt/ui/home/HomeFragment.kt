package com.example.weathergpt.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.weathergpt.MainActivity
import com.example.weathergpt.R
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.models.WeatherData
import com.example.weathergpt.data.remote.ApiClient
import com.example.weathergpt.utils.LocationHelper
import com.example.weathergpt.utils.WeatherUtils
import androidx.appcompat.app.AlertDialog
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class HomeFragment : Fragment() {

    private lateinit var prefs: PreferencesManager
    private lateinit var apiClient: ApiClient
    private lateinit var locationHelper: LocationHelper

    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var tvLocationName: TextView
    private lateinit var tvLastUpdated: TextView
    private lateinit var tvCurrentTemp: TextView
    private lateinit var tvConditionText: TextView
    private lateinit var tvFeelsLike: TextView
    private lateinit var tvHeroIcon: TextView
    private lateinit var tvHumidity: TextView
    private lateinit var tvWind: TextView
    private lateinit var tvRainPercentage: TextView
    private lateinit var tvRainSummary: TextView
    private lateinit var tvAiAdvisoryHeader: TextView
    private lateinit var tvAiAdvisoryBody: TextView
    private lateinit var cardAiInsight: LinearLayout
    private lateinit var btnRefresh: ImageButton
    private lateinit var btnQuickAskAi: LinearLayout
    private lateinit var layoutLoading: LinearLayout
    private lateinit var layoutError: LinearLayout
    private lateinit var layoutMainContent: LinearLayout
    private lateinit var btnRetry: Button

    private val popularCities = arrayOf(
        "Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", 
        "Hyderabad", "Ahmedabad", "Pune", "Shimla", "Srinagar", 
        "Kochi", "Jaipur", "Guwahati", "Patna", "Custom Place..."
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_home, container, false)
        prefs = PreferencesManager(requireContext())
        apiClient = ApiClient(prefs)
        locationHelper = LocationHelper(requireContext())

        bindViews(view)
        setupListeners()
        loadWeatherData(forceRefresh = false)

        return view
    }

    private fun bindViews(view: View) {
        swipeRefresh = view.findViewById<SwipeRefreshLayout>(R.id.swipeRefreshHome)
        tvLocationName = view.findViewById(R.id.tvLocationName)
        tvLastUpdated = view.findViewById(R.id.tvLastUpdated)
        tvCurrentTemp = view.findViewById(R.id.tvCurrentTemp)
        tvConditionText = view.findViewById(R.id.tvConditionText)
        tvFeelsLike = view.findViewById(R.id.tvFeelsLike)
        tvHeroIcon = view.findViewById(R.id.tvHeroWeatherIcon)
        tvHumidity = view.findViewById(R.id.tvMetricHumidity)
        tvWind = view.findViewById(R.id.tvMetricWind)
        tvRainPercentage = view.findViewById(R.id.tvRainPercentage)
        tvRainSummary = view.findViewById(R.id.tvRainSummary)
        tvAiAdvisoryHeader = view.findViewById(R.id.tvAiAdvisoryHeader)
        tvAiAdvisoryBody = view.findViewById(R.id.tvAiAdvisoryBody)
        cardAiInsight = view.findViewById(R.id.cardAiInsight)
        btnRefresh = view.findViewById(R.id.btnRefresh)
        btnQuickAskAi = view.findViewById(R.id.btnQuickAskAi)
        layoutLoading = view.findViewById(R.id.layoutLoadingSkeleton)
        layoutError = view.findViewById(R.id.layoutError)
        layoutMainContent = view.findViewById(R.id.layoutMainContent)
        btnRetry = view.findViewById(R.id.btnRetryHome)
    }

    private fun setupListeners() {
        swipeRefresh.setOnRefreshListener {
            loadWeatherData(forceRefresh = true)
        }

        btnRefresh.setOnClickListener {
            loadWeatherData(forceRefresh = true)
        }

        btnRetry.setOnClickListener {
            loadWeatherData(forceRefresh = true)
        }

        btnQuickAskAi.setOnClickListener {
            (activity as? MainActivity)?.navigateToChatTab()
        }

        tvLocationName.setOnClickListener {
            showCitySelectorDialog()
        }
    }

    private fun showCitySelectorDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("🌍 Choose Place / City")
            .setItems(popularCities) { _, which ->
                val selected = popularCities[which]
                if (selected == "Custom Place...") {
                    showCustomCityInputDialog()
                } else {
                    switchCity(selected)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showCustomCityInputDialog() {
        val input = EditText(requireContext())
        input.hint = "e.g. London, Tokyo, Dehradun, Lucknow"
        input.setText(prefs.locationName)

        AlertDialog.Builder(requireContext())
            .setTitle("Enter Place / City Name")
            .setView(input)
            .setPositiveButton("Set Location") { _, _ ->
                val city = input.text.toString().trim()
                if (city.isNotEmpty()) {
                    switchCity(city)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun switchCity(cityName: String) {
        prefs.locationName = cityName
        tvLocationName.text = cityName
        (activity as? MainActivity)?.updateTopLocation(cityName)
        Toast.makeText(requireContext(), "Showing weather for $cityName", Toast.LENGTH_SHORT).show()
        loadWeatherData(forceRefresh = true)
    }

    fun loadWeatherData(forceRefresh: Boolean = false) {
        if (!forceRefresh && prefs.cachedWeatherJson != null) {
            // Already have cached view
        }

        layoutError.visibility = View.GONE
        if (layoutMainContent.visibility != View.VISIBLE) {
            layoutLoading.visibility = View.VISIBLE
        }

        viewLifecycleOwner.lifecycleScope.launch {
            val result = apiClient.fetchWeather(location = prefs.locationName)
            swipeRefresh.isRefreshing = false
            layoutLoading.visibility = View.GONE

            result.onSuccess { data ->
                layoutError.visibility = View.GONE
                layoutMainContent.visibility = View.VISIBLE
                populateUi(data)
                loadTransparencyBadge()
                (activity as? MainActivity)?.updateTopLocation(data.locationInfo)
            }.onFailure {
                if (layoutMainContent.visibility != View.VISIBLE) {
                    layoutError.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun populateUi(data: WeatherData) {
        tvLocationName.text = data.locationInfo
        val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
        tvLastUpdated.text = "Updated $timeStr"

        // Hero Values
        tvCurrentTemp.text = WeatherUtils.formatTemperature(data.current.temperature, prefs.unit)
        tvConditionText.text = data.current.conditionText
        tvHeroIcon.text = WeatherUtils.getWeatherIcon(data.current.weatherCode)
        tvFeelsLike.text = "Feels like ${WeatherUtils.formatTemperature(data.current.apparentTemperature, prefs.unit)}"

        // Metrics
        tvHumidity.text = "${data.current.relativeHumidity}%"
        tvWind.text = "${data.current.windSpeed} km/h"

        // Rain Probability / Today's forecast precipitation
        val todayForecast = data.forecastDays.firstOrNull()
        val precipSum = todayForecast?.precipitationSum ?: data.current.precipitation
        val estimatedRainProb = if (precipSum > 5.0) 80.0 else if (precipSum > 0.5) 50.0 else if (data.current.weatherCode in listOf(51, 53, 55, 61, 63, 65, 80)) 75.0 else 10.0
        
        tvRainPercentage.text = "${estimatedRainProb.toInt()}%"
        tvRainSummary.text = if (estimatedRainProb > 40) {
            "Rain likely today (~${precipSum}mm). Consider delaying field irrigation."
        } else {
            "Low chance of rain today. Favorable outdoor & farming conditions."
        }

        // Persona AI Insight Card
        val persona = prefs.persona
        when (persona.lowercase()) {
            "farmer" -> {
                tvAiAdvisoryHeader.text = getString(R.string.ai_farm_advisory_title)
                cardAiInsight.setBackgroundResource(R.drawable.bg_card_farmer)
            }
            "commuter" -> {
                tvAiAdvisoryHeader.text = getString(R.string.ai_commute_advisory_title)
                cardAiInsight.setBackgroundResource(R.drawable.bg_card_highlight)
            }
            "aviation" -> {
                tvAiAdvisoryHeader.text = getString(R.string.ai_aviation_advisory_title)
                cardAiInsight.setBackgroundResource(R.drawable.bg_card_dark)
            }
            "outdoor" -> {
                tvAiAdvisoryHeader.text = getString(R.string.ai_outdoor_advisory_title)
                cardAiInsight.setBackgroundResource(R.drawable.bg_card_highlight)
            }
        }

        tvAiAdvisoryBody.text = WeatherUtils.generateQuickAdvisory(
            persona = persona,
            temp = data.current.temperature,
            condition = data.current.conditionText,
            rainProb = estimatedRainProb,
            humidity = data.current.relativeHumidity,
            wind = data.current.windSpeed
        )
    }

    override fun onResume() {
        super.onResume()
        // Refresh unit or persona changes if needed
        loadWeatherData(forceRefresh = false)
    }

    private fun loadTransparencyBadge() {
        val tvBadge = view?.findViewById<TextView>(R.id.tvTransparencyBadge) ?: return
        viewLifecycleOwner.lifecycleScope.launch {
            apiClient.fetchTransparency().onSuccess { jsonStr ->
                try {
                    val jsonObj = org.json.JSONObject(jsonStr)
                    val isVerified = jsonObj.optBoolean("verified", false)
                    if (isVerified) {
                        tvBadge.text = "🛡️ Verified Source: " + jsonObj.optString("source_id", "Open-Meteo")
                        tvBadge.visibility = View.VISIBLE
                    }
                } catch (e: Exception) {}
            }
        }
    }

}
