package com.example.weathergpt

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.models.WeatherAlert
import com.example.weathergpt.data.remote.WebSocketManager
import com.example.weathergpt.ui.alerts.AlertsFragment
import com.example.weathergpt.ui.chat.AskAiFragment
import com.example.weathergpt.ui.forecast.ForecastFragment
import com.example.weathergpt.ui.home.HomeFragment
import com.example.weathergpt.ui.profile.ProfileFragment
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity(), WebSocketManager.AlertListener {

    lateinit var prefs: PreferencesManager
        private set
    lateinit var webSocketManager: WebSocketManager
        private set

    private lateinit var bottomNav: BottomNavigationView
    private lateinit var tvTopLocation: TextView
    private lateinit var badgePersona: TextView

    private val homeFragment = HomeFragment()
    private val askAiFragment = AskAiFragment()
    private val forecastFragment = ForecastFragment()
    private val alertsFragment = AlertsFragment()
    private val profileFragment = ProfileFragment()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = PreferencesManager(this)
        webSocketManager = WebSocketManager(prefs)

        bottomNav = findViewById(R.id.bottom_navigation)
        tvTopLocation = findViewById(R.id.tvTopLocation)
        badgePersona = findViewById(R.id.badgePersona)

        setupTopBar()
        setupBottomNavigation()

        webSocketManager.addListener(this)
        webSocketManager.connect()

        if (savedInstanceState == null) {
            loadFragment(homeFragment)
        }
    }

    private fun setupTopBar() {
        tvTopLocation.text = prefs.locationName
        val personaDisplay = when (prefs.persona.lowercase()) {
            "farmer" -> "🌾 Farmer"
            "commuter" -> "🚗 Commuter"
            "aviation" -> "✈️ Aviation"
            "outdoor" -> "🏃 Outdoor"
            else -> "🌾 Farmer"
        }
        badgePersona.text = personaDisplay
    }

    fun updateTopLocation(locationName: String) {
        tvTopLocation.text = locationName
    }

    fun updatePersonaBadge(personaName: String) {
        badgePersona.text = personaName
    }

    private fun setupBottomNavigation() {
        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    loadFragment(homeFragment)
                    true
                }
                R.id.nav_chat -> {
                    loadFragment(askAiFragment)
                    true
                }
                R.id.nav_forecast -> {
                    loadFragment(forecastFragment)
                    true
                }
                R.id.nav_alerts -> {
                    loadFragment(alertsFragment)
                    true
                }
                R.id.nav_profile -> {
                    loadFragment(profileFragment)
                    true
                }
                else -> false
            }
        }
    }

    fun navigateToChatTab() {
        bottomNav.selectedItemId = R.id.nav_chat
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    fun reconnectWebSocket() {
        webSocketManager.disconnect()
        webSocketManager.connect()
    }

    override fun onAlertReceived(alert: WeatherAlert) {
        if (prefs.isNotificationsEnabled) {
            Toast.makeText(this, "🚨 ${alert.title}: ${alert.message}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onConnectionStatusChanged(connected: Boolean) {
        // Connection status updated
    }

    override fun onDestroy() {
        super.onDestroy()
        webSocketManager.removeListener(this)
        webSocketManager.disconnect()
    }
}
