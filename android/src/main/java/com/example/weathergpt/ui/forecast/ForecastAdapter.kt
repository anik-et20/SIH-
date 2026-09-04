package com.example.weathergpt.ui.forecast

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.models.ForecastDayItem
import com.example.weathergpt.utils.WeatherUtils

class ForecastAdapter(
    private val forecastList: List<ForecastDayItem>,
    private val unit: String
) : RecyclerView.Adapter<ForecastAdapter.ForecastViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ForecastViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_forecast_day, parent, false)
        return ForecastViewHolder(view)
    }

    override fun onBindViewHolder(holder: ForecastViewHolder, position: Int) {
        val item = forecastList[position]
        holder.tvDayName.text = item.dayName
        holder.tvDate.text = WeatherUtils.formatDateFormatted(item.date)
        holder.tvConditionIcon.text = item.conditionIcon
        holder.tvCondition.text = item.conditionText

        val rainPercent = if (item.precipitationSum > 5.0) 80 else if (item.precipitationSum > 0.5) 50 else 15
        holder.tvRainChance.text = "Rain: $rainPercent% (${item.precipitationSum}mm)"

        holder.tvMaxTemp.text = WeatherUtils.formatTemperature(item.maxTemp, unit)
        holder.tvMinTemp.text = WeatherUtils.formatTemperature(item.minTemp, unit)
    }

    override fun getItemCount(): Int = forecastList.size

    class ForecastViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvDayName: TextView = view.findViewById(R.id.tvForecastDayName)
        val tvDate: TextView = view.findViewById(R.id.tvForecastDate)
        val tvConditionIcon: TextView = view.findViewById(R.id.tvForecastConditionIcon)
        val tvCondition: TextView = view.findViewById(R.id.tvForecastCondition)
        val tvRainChance: TextView = view.findViewById(R.id.tvForecastRainChance)
        val tvMaxTemp: TextView = view.findViewById(R.id.tvForecastMaxTemp)
        val tvMinTemp: TextView = view.findViewById(R.id.tvForecastMinTemp)
    }
}
