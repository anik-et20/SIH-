import math
from typing import List, Dict, Any, Optional
from schemas import (
    CanonicalHourlySlot, CanonicalDailySlot, RainWindow, 
    TemperatureInsights, ComparisonInsight, CalculatedInsights
)

# ==========================================
# 1. UNIT CONVERSIONS
# ==========================================

def c_to_f(c: float) -> float:
    return round((c * 9.0 / 5.0) + 32.0, 1)

def f_to_c(f: float) -> float:
    return round((f - 32.0) * 5.0 / 9.0, 1)

def kmh_to_mph(kmh: float) -> float:
    return round(kmh * 0.621371, 1)

def kmh_to_ms(kmh: float) -> float:
    return round(kmh / 3.6, 1)

def mm_to_inches(mm: float) -> float:
    return round(mm / 25.4, 2)

def hpa_to_inhg(hpa: float) -> float:
    return round(hpa * 0.02953, 2)

# ==========================================
# 2. METEOROLOGICAL FORMULAS
# ==========================================

def calculate_heat_index(temp_c: float, humidity_percent: int) -> float:
    """Calculates apparent temperature / heat index using Rothfusz regression equation."""
    if temp_c < 27.0 or humidity_percent < 40:
        return temp_c
    
    t_f = (temp_c * 9.0 / 5.0) + 32.0
    r = float(humidity_percent)
    
    hi_f = (-42.379 + 2.04901523*t_f + 10.14333127*r 
            - 0.22475541*t_f*r - 0.00683783*t_f*t_f 
            - 0.05481717*r*r + 0.00122874*t_f*t_f*r 
            + 0.00085282*t_f*r*r - 0.00000199*t_f*t_f*r*r)
    
    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 1)

def calculate_wind_chill(temp_c: float, wind_kmh: float) -> float:
    """Calculates wind chill temperature for cold weather."""
    if temp_c > 10.0 or wind_kmh < 4.8:
        return temp_c
    wc = 13.12 + (0.6215 * temp_c) - (11.37 * (wind_kmh ** 0.16)) + (0.3965 * temp_c * (wind_kmh ** 0.16))
    return round(wc, 1)

def get_comfort_description(temp_c: float, humidity_percent: int) -> str:
    """Provides objective comfort description based on heat index & relative humidity."""
    if temp_c > 38.0:
        return "Dangerously Hot (Extreme Heat Advisory)"
    elif temp_c > 32.0:
        if humidity_percent > 65:
            return "Oppressively Humid and Sweltering"
        return "Very Hot and Dry"
    elif 22.0 <= temp_c <= 32.0:
        if 40 <= humidity_percent <= 65:
            return "Pleasant and Comfortable"
        elif humidity_percent > 65:
            return "Warm and Muggy"
        else:
            return "Warm and Dry"
    elif 15.0 <= temp_c < 22.0:
        return "Mild and Pleasant"
    elif 5.0 <= temp_c < 15.0:
        return "Cool / Crisp"
    else:
        return "Cold / Freezing"

# ==========================================
# 3. DETERMINISTIC AGGREGATIONS & WINDOWS
# ==========================================

def calculate_temperature_insights(hourly_slots: List[CanonicalHourlySlot]) -> TemperatureInsights:
    """Computes min, max, average, and diurnal temperature range from hourly slots."""
    if not hourly_slots:
        return TemperatureInsights(
            temp_min_c=0.0, temp_max_c=0.0, temp_avg_c=0.0,
            diurnal_range_c=0.0, trend_description="No hourly data",
            comfort_level="Unknown"
        )

    temps = [s.temperature_c for s in hourly_slots]
    humidities = [s.humidity_percent for s in hourly_slots]
    
    t_min = min(temps)
    t_max = max(temps)
    t_avg = round(sum(temps) / len(temps), 1)
    diurnal = round(t_max - t_min, 1)
    avg_humidity = int(sum(humidities) / len(humidities))
    
    # Calculate trend from first quarter to last quarter
    q_len = max(1, len(temps) // 4)
    early_avg = sum(temps[:q_len]) / q_len
    late_avg = sum(temps[-q_len:]) / q_len
    diff = late_avg - early_avg
    
    if diff >= 2.0:
        trend = f"Warming trend (+{round(diff, 1)}°C over period)"
    elif diff <= -2.0:
        trend = f"Cooling trend ({round(diff, 1)}°C over period)"
    else:
        trend = "Stable temperature conditions"

    comfort = get_comfort_description(t_max, avg_humidity)
    heat_idx = calculate_heat_index(t_max, avg_humidity) if t_max >= 27.0 else None

    return TemperatureInsights(
        temp_min_c=round(t_min, 1),
        temp_max_c=round(t_max, 1),
        temp_avg_c=t_avg,
        diurnal_range_c=diurnal,
        trend_description=trend,
        heat_index_c=heat_idx,
        comfort_level=comfort
    )

def calculate_rain_window(hourly_slots: List[CanonicalHourlySlot]) -> RainWindow:
    """
    Identifies exact precipitation windows: start time, peak hour, end time, 
    max rain probability, and total precipitation volume.
    """
    if not hourly_slots:
        return RainWindow(rain_expected=False, summary="No precipitation data available.")

    rain_slots = [
        s for s in hourly_slots 
        if (s.precipitation_mm > 0.05 or s.precipitation_probability >= 30)
    ]

    if not rain_slots:
        max_prob = max((s.precipitation_probability for s in hourly_slots), default=0)
        return RainWindow(
            rain_expected=False,
            max_precipitation_probability=max_prob,
            total_expected_precipitation_mm=0.0,
            summary=f"No rain expected (maximum precipitation probability {max_prob}%)."
        )

    # Sort rain slots by precipitation rate / probability to find peak
    peak_slot = max(rain_slots, key=lambda s: (s.precipitation_mm, s.precipitation_probability))
    total_mm = round(sum(s.precipitation_mm for s in hourly_slots), 2)
    max_prob = max(s.precipitation_probability for s in hourly_slots)

    # Extract clean hour strings (e.g., "14:00" from "2026-09-05T14:00")
    def get_hour(t_str: str) -> str:
        return t_str.split("T")[-1] if "T" in t_str else t_str

    start_time = get_hour(rain_slots[0].time)
    end_time = get_hour(rain_slots[-1].time)
    peak_time = get_hour(peak_slot.time)

    summary = (
        f"Rain expected between {start_time} and {end_time}, "
        f"peaking around {peak_time} with {peak_slot.precipitation_probability}% probability "
        f"(total accumulation {total_mm} mm)."
    )

    return RainWindow(
        rain_expected=True,
        start_time=start_time,
        peak_time=peak_time,
        end_time=end_time,
        max_precipitation_probability=max_prob,
        total_expected_precipitation_mm=total_mm,
        summary=summary
    )

def compare_daily_slots(today_slot: CanonicalDailySlot, tomorrow_slot: CanonicalDailySlot) -> ComparisonInsight:
    """Computes exact mathematical comparison between two daily forecast days."""
    diff_temp = round(tomorrow_slot.temperature_max_c - today_slot.temperature_max_c, 1)
    diff_rain = tomorrow_slot.precipitation_probability_max - today_slot.precipitation_probability_max

    if diff_temp > 0.5:
        temp_trend = "warmer"
        temp_summary = f"{abs(diff_temp)}°C warmer"
    elif diff_temp < -0.5:
        temp_trend = "cooler"
        temp_summary = f"{abs(diff_temp)}°C cooler"
    else:
        temp_trend = "identical"
        temp_summary = "similar temperatures"

    summary = (
        f"Tomorrow ({tomorrow_slot.day_name}) will be {temp_summary} compared to today "
        f"(Max: {tomorrow_slot.temperature_max_c}°C vs {today_slot.temperature_max_c}°C) "
        f"with a rain chance of {tomorrow_slot.precipitation_probability_max}% "
        f"({'+' if diff_rain > 0 else ''}{diff_rain}% compared to today)."
    )

    return ComparisonInsight(
        target_date=tomorrow_slot.date,
        baseline_date=today_slot.date,
        temp_difference_c=diff_temp,
        temp_trend=temp_trend,
        rain_probability_difference=diff_rain,
        summary=summary
    )

def build_calculated_insights(
    hourly_slots: Optional[List[CanonicalHourlySlot]] = None,
    daily_slots: Optional[List[CanonicalDailySlot]] = None
) -> CalculatedInsights:
    """Assembles all calculated deterministic insights for inclusion in the validated context."""
    temp_insights = None
    rain_win = None
    comparison = None
    bullet_points = []

    if hourly_slots:
        temp_insights = calculate_temperature_insights(hourly_slots)
        rain_win = calculate_rain_window(hourly_slots)
        
        bullet_points.append(
            f"Temperature range: {temp_insights.temp_min_c}°C to {temp_insights.temp_max_c}°C "
            f"(Average {temp_insights.temp_avg_c}°C). {temp_insights.trend_description}."
        )
        bullet_points.append(rain_win.summary)

    if daily_slots and len(daily_slots) >= 2:
        comparison = compare_daily_slots(daily_slots[0], daily_slots[1])
        bullet_points.append(comparison.summary)

    return CalculatedInsights(
        temperature=temp_insights,
        rain_window=rain_win,
        day_comparison=comparison,
        summary_bullet_points=bullet_points
    )
