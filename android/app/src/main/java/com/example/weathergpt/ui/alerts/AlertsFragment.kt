package com.example.weathergpt.ui.alerts

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
import com.example.weathergpt.MainActivity
import com.example.weathergpt.R
import com.example.weathergpt.data.models.AlertSeverity
import com.example.weathergpt.data.models.WeatherAlert
import com.example.weathergpt.data.remote.ApiClient
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.remote.WebSocketManager
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class AlertsFragment : Fragment(), WebSocketManager.AlertListener {

    private lateinit var prefs: PreferencesManager
    private lateinit var apiClient: ApiClient

    private lateinit var recyclerAlerts: RecyclerView
    private lateinit var layoutNoAlerts: LinearLayout
    private lateinit var badgeLiveStream: TextView
    private lateinit var alertsAdapter: AlertsAdapter
    private val alertsList = mutableListOf<WeatherAlert>()
    
    // Phase 6: SitRep
    private lateinit var layoutSitRep: LinearLayout
    private lateinit var tvSitRepContent: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_alerts, container, false)
        prefs = PreferencesManager(requireContext())
        apiClient = ApiClient(prefs)

        recyclerAlerts = view.findViewById(R.id.recyclerAlerts)
        layoutNoAlerts = view.findViewById(R.id.layoutNoAlerts)
        badgeLiveStream = view.findViewById(R.id.badgeLiveStream)
        
        layoutSitRep = view.findViewById(R.id.layoutSitRep) ?: LinearLayout(requireContext())
        tvSitRepContent = view.findViewById(R.id.tvSitRepContent) ?: TextView(requireContext())

        recyclerAlerts.layoutManager = LinearLayoutManager(requireContext())
        alertsAdapter = AlertsAdapter(alertsList)
        recyclerAlerts.adapter = alertsAdapter

        updateEmptyState()
        (activity as? MainActivity)?.webSocketManager?.addListener(this)

        fetchSachetAlerts()
        fetchAuthoritySitRep()

        return view
    }
    
    private fun fetchSachetAlerts() {
        viewLifecycleOwner.lifecycleScope.launch {
            apiClient.fetchAlerts().onSuccess { jsonStr ->
                try {
                    val jsonObj = JSONObject(jsonStr)
                    val active = jsonObj.optJSONArray("active_alerts") ?: JSONArray()
                    
                    val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                    
                    for (i in 0 until active.length()) {
                        val alertObj = active.getJSONObject(i)
                        alertsList.add(
                            WeatherAlert(
                                title = alertObj.optString("title", "NDMA SACHET Alert"),
                                message = alertObj.optString("description", ""),
                                severity = AlertSeverity.WARNING,
                                recommendations = listOf("Follow official channels"),
                                timestamp = timeStr
                            )
                        )
                    }
                    alertsAdapter.notifyDataSetChanged()
                    updateEmptyState()
                } catch (e: Exception) {}
            }
        }
    }
    
    private fun fetchAuthoritySitRep() {
        viewLifecycleOwner.lifecycleScope.launch {
            apiClient.fetchSitRep().onSuccess { jsonStr ->
                try {
                    val jsonObj = JSONObject(jsonStr)
                    val summary = jsonObj.optString("summary", "")
                    if (summary.isNotEmpty()) {
                        tvSitRepContent.text = summary
                        layoutSitRep.visibility = View.VISIBLE
                    }
                } catch (e: Exception) {}
            }
        }
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
