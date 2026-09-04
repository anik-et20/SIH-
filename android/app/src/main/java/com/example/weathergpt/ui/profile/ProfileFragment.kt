package com.example.weathergpt.ui.profile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.example.weathergpt.MainActivity
import com.example.weathergpt.R
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.utils.LocationHelper
import com.google.android.material.button.MaterialButtonToggleGroup
import com.google.android.material.materialswitch.MaterialSwitch

class ProfileFragment : Fragment() {

    private lateinit var prefs: PreferencesManager
    private lateinit var locationHelper: LocationHelper

    private lateinit var tvCurrentLocation: TextView
    private lateinit var tvSelectedLanguage: TextView
    private lateinit var tvSelectedPersona: TextView
    private lateinit var tvPersonaDesc: TextView
    private lateinit var tvBackendUrl: TextView

    private lateinit var btnGpsDetect: Button
    private lateinit var btnChangeCity: Button
    private lateinit var cardLanguageSelect: View
    private lateinit var cardPersonaSelect: View
    private lateinit var cardBackendUrl: View

    private lateinit var toggleUnit: MaterialButtonToggleGroup
    private lateinit var switchVoiceTts: MaterialSwitch
    private lateinit var switchNotifications: MaterialSwitch

    private val languages = arrayOf(
        "English" to "en",
        "हिंदी (Hindi)" to "hi",
        "தமிழ் (Tamil)" to "ta",
        "తెలుగు (Telugu)" to "te",
        "বাংলা (Bengali)" to "bn",
        "मराठी (Marathi)" to "mr",
        "ગુજરાતી (Gujarati)" to "gu"
    )

    private val personas = arrayOf(
        Triple("Farming & Agriculture 🌾", "farmer", "Crop advisories, irrigation timing & weather protection"),
        Triple("Daily Commuter 🚗", "commuter", "Rain timings, umbrella prep & traffic hazards"),
        Triple("Aviation & Travel ✈️", "aviation", "Visibility, flight delays & storm warnings"),
        Triple("Outdoor & Sports 🏃", "outdoor", "Heat index, UV safety & activity suitability")
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)
        prefs = PreferencesManager(requireContext())
        locationHelper = LocationHelper(requireContext())

        bindViews(view)
        populateData()
        setupListeners()

        return view
    }

    private fun bindViews(view: View) {
        tvCurrentLocation = view.findViewById(R.id.tvProfileCurrentLocation)
        tvSelectedLanguage = view.findViewById(R.id.tvSelectedLanguage)
        tvSelectedPersona = view.findViewById(R.id.tvSelectedPersona)
        tvPersonaDesc = view.findViewById(R.id.tvPersonaDesc)
        tvBackendUrl = view.findViewById(R.id.tvCurrentBackendUrl)

        btnGpsDetect = view.findViewById(R.id.btnGpsDetect)
        btnChangeCity = view.findViewById(R.id.btnChangeCity)
        cardLanguageSelect = view.findViewById(R.id.cardLanguageSelect)
        cardPersonaSelect = view.findViewById(R.id.cardPersonaSelect)
        cardBackendUrl = view.findViewById(R.id.cardBackendUrl)

        toggleUnit = view.findViewById(R.id.toggleGroupUnit)
        switchVoiceTts = view.findViewById(R.id.switchVoiceTts)
        switchNotifications = view.findViewById(R.id.switchNotifications)
    }

    private fun populateData() {
        tvCurrentLocation.text = prefs.locationName

        val currentLang = languages.firstOrNull { it.second == prefs.language }?.first ?: "English"
        tvSelectedLanguage.text = currentLang

        val currentPersona = personas.firstOrNull { it.second == prefs.persona } ?: personas[0]
        tvSelectedPersona.text = currentPersona.first
        tvPersonaDesc.text = currentPersona.third

        tvBackendUrl.text = prefs.baseUrl

        if (prefs.unit.equals("F", ignoreCase = true)) {
            toggleUnit.check(R.id.btnUnitF)
        } else {
            toggleUnit.check(R.id.btnUnitC)
        }

        switchVoiceTts.isChecked = prefs.isVoiceTtsEnabled
        switchNotifications.isChecked = prefs.isNotificationsEnabled
    }

    private fun setupListeners() {
        btnGpsDetect.setOnClickListener {
            if (!locationHelper.hasLocationPermission()) {
                requestPermissions(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ),
                    201
                )
                return@setOnClickListener
            }

            Toast.makeText(requireContext(), "Detecting GPS location...", Toast.LENGTH_SHORT).show()
            locationHelper.fetchCurrentLocation(object : LocationHelper.LocationCallback {
                override fun onLocationObtained(lat: Double, lon: Double) {
                    prefs.latitude = lat
                    prefs.longitude = lon
                    prefs.locationName = "GPS Coordinates (%.2f, %.2f)".format(lat, lon)
                    tvCurrentLocation.text = prefs.locationName
                    (activity as? MainActivity)?.updateTopLocation(prefs.locationName)
                    Toast.makeText(requireContext(), "Location updated from GPS", Toast.LENGTH_SHORT).show()
                }

                override fun onLocationFailed(errorMsg: String) {
                    Toast.makeText(requireContext(), "GPS error: $errorMsg", Toast.LENGTH_SHORT).show()
                }
            })
        }

        btnChangeCity.setOnClickListener {
            val input = EditText(requireContext())
            input.hint = "e.g. Delhi, Mumbai, Rewari, Tokyo"
            input.setText(prefs.locationName)

            AlertDialog.Builder(requireContext())
                .setTitle("Change City / Location")
                .setView(input)
                .setPositiveButton("Save") { _, _ ->
                    val newCity = input.text.toString().trim()
                    if (newCity.isNotEmpty()) {
                        prefs.locationName = newCity
                        tvCurrentLocation.text = newCity
                        (activity as? MainActivity)?.updateTopLocation(newCity)
                    }
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        cardLanguageSelect.setOnClickListener {
            val langNames = languages.map { it.first }.toTypedArray()
            val currentIdx = languages.indexOfFirst { it.second == prefs.language }.coerceAtLeast(0)

            AlertDialog.Builder(requireContext())
                .setTitle("Choose Language / भाषा चुनें")
                .setSingleChoiceItems(langNames, currentIdx) { dialog, which ->
                    val selected = languages[which]
                    prefs.language = selected.second
                    tvSelectedLanguage.text = selected.first
                    dialog.dismiss()
                    Toast.makeText(requireContext(), "Language set to ${selected.first}", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        cardPersonaSelect.setOnClickListener {
            val personaNames = personas.map { it.first }.toTypedArray()
            val currentIdx = personas.indexOfFirst { it.second == prefs.persona }.coerceAtLeast(0)

            AlertDialog.Builder(requireContext())
                .setTitle("Choose Persona / भूमिका चुनें")
                .setSingleChoiceItems(personaNames, currentIdx) { dialog, which ->
                    val selected = personas[which]
                    prefs.persona = selected.second
                    tvSelectedPersona.text = selected.first
                    tvPersonaDesc.text = selected.third
                    (activity as? MainActivity)?.updatePersonaBadge(selected.first)
                    dialog.dismiss()
                    Toast.makeText(requireContext(), "Persona updated to ${selected.first}", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        toggleUnit.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                if (checkedId == R.id.btnUnitF) {
                    prefs.unit = "F"
                } else {
                    prefs.unit = "C"
                }
            }
        }

        switchVoiceTts.setOnCheckedChangeListener { _, isChecked ->
            prefs.isVoiceTtsEnabled = isChecked
        }

        switchNotifications.setOnCheckedChangeListener { _, isChecked ->
            prefs.isNotificationsEnabled = isChecked
        }

        cardBackendUrl.setOnClickListener {
            val input = EditText(requireContext())
            input.hint = "http://10.0.2.2:8000 or http://192.168.1.X:8000"
            input.setText(prefs.baseUrl)

            AlertDialog.Builder(requireContext())
                .setTitle("Configure Backend Server URL")
                .setMessage("Enter your computer's local IP or backend URL to connect from a real device.")
                .setView(input)
                .setPositiveButton("Save") { _, _ ->
                    val url = input.text.toString().trim()
                    if (url.isNotEmpty()) {
                        prefs.baseUrl = url
                        tvBackendUrl.text = prefs.baseUrl
                        (activity as? MainActivity)?.reconnectWebSocket()
                        Toast.makeText(requireContext(), "Backend URL updated", Toast.LENGTH_SHORT).show()
                    }
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }
}
