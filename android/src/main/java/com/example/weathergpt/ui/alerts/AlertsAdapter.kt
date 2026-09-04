package com.example.weathergpt.ui.alerts

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.models.AlertSeverity
import com.example.weathergpt.data.models.WeatherAlert

class AlertsAdapter(
    private val alertsList: MutableList<WeatherAlert>
) : RecyclerView.Adapter<AlertsAdapter.AlertViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AlertViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_alert, parent, false)
        return AlertViewHolder(view)
    }

    override fun onBindViewHolder(holder: AlertViewHolder, position: Int) {
        val alert = alertsList[position]

        holder.tvSeverityBadge.text = when (alert.severity) {
            AlertSeverity.EMERGENCY -> "🚨 EMERGENCY WARNING"
            AlertSeverity.SEVERE -> "⚠️ SEVERE WEATHER ALERT"
            AlertSeverity.WARNING -> "⚡ WEATHER WATCH"
            AlertSeverity.INFO -> "ℹ️ WEATHER ADVISORY"
        }

        val badgeColor = when (alert.severity) {
            AlertSeverity.EMERGENCY -> Color.parseColor("#DC2626")
            AlertSeverity.SEVERE -> Color.parseColor("#F43F5E")
            AlertSeverity.WARNING -> Color.parseColor("#F59E0B")
            AlertSeverity.INFO -> Color.parseColor("#38BDF8")
        }
        holder.tvSeverityBadge.setTextColor(badgeColor)

        holder.tvMessage.text = alert.message
        holder.tvRecommendations.text = alert.recommendations.joinToString("\n") { "• $it" }
        holder.tvTime.text = "Updated ${alert.timestamp}"
    }

    override fun getItemCount(): Int = alertsList.size

    fun addAlert(alert: WeatherAlert) {
        alertsList.add(0, alert)
        notifyItemInserted(0)
    }

    class AlertViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvSeverityBadge: TextView = view.findViewById(R.id.tvAlertSeverityBadge)
        val tvMessage: TextView = view.findViewById(R.id.tvAlertMessage)
        val tvRecommendations: TextView = view.findViewById(R.id.tvAlertRecommendations)
        val tvTime: TextView = view.findViewById(R.id.tvAlertTime)
    }
}
