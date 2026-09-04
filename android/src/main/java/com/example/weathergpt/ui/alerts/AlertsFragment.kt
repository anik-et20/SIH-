package com.example.weathergpt.ui.alerts

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.MainActivity
import com.example.weathergpt.R
import com.example.weathergpt.data.models.AlertSeverity
import com.example.weathergpt.data.models.WeatherAlert
import com.example.weathergpt.data.remote.WebSocketManager
import java.text.SimpleDateFormat
import java.util.*

class AlertsFragment : Fragment(), WebSocketManager.AlertListener {

    private lateinit var recyclerAlerts: RecyclerView
    private lateinit var layoutNoAlerts: LinearLayout
    private lateinit var badgeLiveStream: TextView
    private lateinit var alertsAdapter: AlertsAdapter
    private val alertsList = mutableListOf<WeatherAlert>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_alerts, container, false)

        recyclerAlerts = view.findViewById(R.id.recyclerAlerts)
        layoutNoAlerts = view.findViewById(R.id.layoutNoAlerts)
        badgeLiveStream = view.findViewById(R.id.badgeLiveStream)

        recyclerAlerts.layoutManager = LinearLayoutManager(requireContext())
        alertsAdapter = AlertsAdapter(alertsList)
        recyclerAlerts.adapter = alertsAdapter

        // Initial default regional advisory if list empty
        if (alertsList.isEmpty()) {
            val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
            alertsList.add(
                WeatherAlert(
                    title = "MONSOON WEATHER ADVISORY",
                    message = "Regional precipitation alert: Light to moderate showers expected across northern and central plains. Farmers advised to monitor moisture levels.",
                    severity = AlertSeverity.WARNING,
                    recommendations = listOf(
                        "Postpone open-air pesticide spraying",
                        "Ensure field drainage outlets are unobstructed",
                        "Drive with caution on wet roadways"
                    ),
                    timestamp = timeStr
                )
            )
            alertsAdapter.notifyDataSetChanged()
        }

        updateEmptyState()
        (activity as? MainActivity)?.webSocketManager?.addListener(this)

        return view
    }

    override fun onAlertReceived(alert: WeatherAlert) {
        alertsAdapter.addAlert(alert)
        recyclerAlerts.scrollToPosition(0)
        updateEmptyState()
    }

    override fun onConnectionStatusChanged(connected: Boolean) {
        if (connected) {
            badgeLiveStream.text = "🟢 Live Stream"
            badgeLiveStream.setTextColor(resources.getColor(R.color.accent_green, null))
        } else {
            badgeLiveStream.text = "🟡 Connecting..."
            badgeLiveStream.setTextColor(resources.getColor(R.color.accent_amber, null))
        }
    }

    private fun updateEmptyState() {
        if (alertsList.isEmpty()) {
            layoutNoAlerts.visibility = View.VISIBLE
            recyclerAlerts.visibility = View.GONE
        } else {
            layoutNoAlerts.visibility = View.GONE
            recyclerAlerts.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        (activity as? MainActivity)?.webSocketManager?.removeListener(this)
    }
}
