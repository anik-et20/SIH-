package com.example.weathergpt.data.models

enum class AlertSeverity {
    INFO,
    WARNING,
    SEVERE,
    EMERGENCY
}

data class WeatherAlert(
    val id: String = System.currentTimeMillis().toString(),
    val title: String,
    val message: String,
    val severity: AlertSeverity,
    val recommendations: List<String>,
    val timestamp: String
)
