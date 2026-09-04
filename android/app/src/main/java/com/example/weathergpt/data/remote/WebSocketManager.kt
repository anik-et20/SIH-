package com.example.weathergpt.data.remote

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.models.AlertSeverity
import com.example.weathergpt.data.models.WeatherAlert
import okhttp3.*
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class WebSocketManager(private val prefs: PreferencesManager) {

    private val client = OkHttpClient()
    private var webSocket: WebSocket? = null
    private var isConnected = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private var reconnectRunnable: Runnable? = null

    interface AlertListener {
        fun onAlertReceived(alert: WeatherAlert)
        fun onConnectionStatusChanged(connected: Boolean)
    }

    private val listeners = mutableListOf<AlertListener>()

    fun addListener(listener: AlertListener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener)
            listener.onConnectionStatusChanged(isConnected)
        }
    }

    fun removeListener(listener: AlertListener) {
        listeners.remove(listener)
    }

    fun connect() {
        if (webSocket != null) return

        val wsUrl = prefs.wsUrl
        val request = Request.Builder().url(wsUrl).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                mainHandler.post {
                    listeners.forEach { it.onConnectionStatusChanged(true) }
                }
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")
                    if (type == "alert") {
                        val message = json.optString("message", "Severe weather warning")
                        val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())

                        // Parse severity based on keywords
                        val severity = when {
                            message.contains("EMERGENCY", true) || message.contains("TORNADO", true) || message.contains("CYCLONE", true) -> AlertSeverity.EMERGENCY
                            message.contains("SEVERE", true) || message.contains("WARNING", true) -> AlertSeverity.SEVERE
                            message.contains("WATCH", true) || message.contains("ADVISORY", true) -> AlertSeverity.WARNING
                            else -> AlertSeverity.INFO
                        }

                        val recommendations = mutableListOf<String>()
                        if (message.contains("FLOOD", true) || message.contains("RAIN", true)) {
                            recommendations.add("Avoid low-lying areas and flooded roads.")
                            recommendations.add("Clear agricultural drainage channels.")
                        } else if (message.contains("HEAT", true)) {
                            recommendations.add("Stay indoors between 12 PM - 3 PM and drink water.")
                            recommendations.add("Provide shade and water for crops & cattle.")
                        } else if (message.contains("WIND", true) || message.contains("STORM", true)) {
                            recommendations.add("Secure loose outdoor objects and farming equipment.")
                            recommendations.add("Seek sturdy indoor shelter immediately.")
                        } else {
                            recommendations.add("Monitor local weather updates closely.")
                            recommendations.add("Follow safety directives from authorities.")
                        }

                        val alert = WeatherAlert(
                            title = if (severity == AlertSeverity.EMERGENCY) "EMERGENCY WEATHER WARNING" else "SEVERE WEATHER ALERT",
                            message = message,
                            severity = severity,
                            recommendations = recommendations,
                            timestamp = timeStr
                        )

                        mainHandler.post {
                            listeners.forEach { it.onAlertReceived(alert) }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("WebSocketManager", "Error parsing WebSocket alert", e)
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                mainHandler.post {
                    listeners.forEach { it.onConnectionStatusChanged(false) }
                }
                scheduleReconnect()
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                mainHandler.post {
                    listeners.forEach { it.onConnectionStatusChanged(false) }
                }
            }
        })
    }

    private fun scheduleReconnect() {
        disconnect()
        reconnectRunnable = Runnable { connect() }
        mainHandler.postDelayed(reconnectRunnable!!, 8000)
    }

    fun disconnect() {
        reconnectRunnable?.let { mainHandler.removeCallbacks(it) }
        try {
            webSocket?.close(1000, "Normal closure")
        } catch (e: Exception) {
            // Ignore
        }
        webSocket = null
        isConnected = false
    }
}
