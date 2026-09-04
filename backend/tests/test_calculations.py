import pytest
from schemas import CanonicalHourlySlot, CanonicalDailySlot
from calc_service import (
    c_to_f, f_to_c, kmh_to_mph, kmh_to_ms, mm_to_inches,
    calculate_heat_index, calculate_temperature_insights,
    calculate_rain_window, compare_daily_slots
)

# ==========================================
# 1. UNIT CONVERSIONS TESTS
# ==========================================

def test_unit_conversions():
    assert c_to_f(0.0) == 32.0
    assert c_to_f(34.2) == 93.6
    assert c_to_f(100.0) == 212.0
    assert f_to_c(32.0) == 0.0
    assert f_to_c(212.0) == 100.0

    assert kmh_to_mph(10.0) == 6.2
    assert kmh_to_ms(36.0) == 10.0
    assert mm_to_inches(25.4) == 1.0

# ==========================================
# 2. HEAT INDEX & COMFORT
# ==========================================

def test_heat_index():
    # 32°C at 75% humidity should produce a high heat index (> 40°C)
    hi = calculate_heat_index(32.0, 75)
    assert hi > 40.0
    # Cool temp should return raw temp
    assert calculate_heat_index(22.0, 50) == 22.0

# ==========================================
# 3. TEMPERATURE INSIGHTS
# ==========================================

def test_temperature_insights_calculation():
    slots = [
        CanonicalHourlySlot(
            time=f"2026-09-05T{h:02d}:00",
            temperature_c=22.0 + (h * 0.5 if h <= 12 else (24 - h) * 0.5),
            apparent_temperature_c=24.0,
            humidity_percent=60,
            precipitation_probability=10,
            precipitation_mm=0.0,
            weather_code=1,
            condition="Mainly clear",
            wind_speed_kmh=10.0
        )
        for h in range(24)
    ]
    insights = calculate_temperature_insights(slots)
    assert insights.temp_min_c == 22.0
    assert insights.temp_max_c == 28.0
    assert insights.diurnal_range_c == 6.0
    assert 24.0 <= insights.temp_avg_c <= 26.0

# ==========================================
# 4. RAIN WINDOW CALCULATION
# ==========================================

def test_rain_window_calculation():
    slots = []
    for h in range(24):
        # Rain occurs between 14:00 and 18:00 peaking at 16:00
        if 14 <= h <= 18:
            prob = 80 if h == 16 else 60
            precip = 5.5 if h == 16 else 2.0
        else:
            prob = 5
            precip = 0.0

        slots.append(CanonicalHourlySlot(
            time=f"2026-09-05T{h:02d}:00",
            temperature_c=28.0,
            apparent_temperature_c=30.0,
            humidity_percent=80,
            precipitation_probability=prob,
            precipitation_mm=precip,
            weather_code=63 if prob > 50 else 1,
            condition="Moderate rain" if prob > 50 else "Mainly clear",
            wind_speed_kmh=15.0
        ))

    rain_window = calculate_rain_window(slots)
    assert rain_window.rain_expected is True
    assert rain_window.start_time == "14:00"
    assert rain_window.peak_time == "16:00"
    assert rain_window.end_time == "18:00"
    assert rain_window.max_precipitation_probability == 80
    assert rain_window.total_expected_precipitation_mm == pytest.approx(13.5, 0.1)

# ==========================================
# 5. DAY COMPARISON CALCULATION
# ==========================================

def test_compare_daily_slots():
    today = CanonicalDailySlot(
        date="2026-09-05", day_name="Saturday",
        temperature_max_c=30.0, temperature_min_c=22.0,
        temperature_max_f=86.0, temperature_min_f=71.6,
        apparent_temperature_max_c=32.0, apparent_temperature_min_c=23.0,
        precipitation_probability_max=20, precipitation_sum_mm=0.0,
        weather_code=1, condition="Mainly clear", wind_speed_max_kmh=12.0
    )
    tomorrow = CanonicalDailySlot(
        date="2026-09-06", day_name="Sunday",
        temperature_max_c=33.5, temperature_min_c=24.0,
        temperature_max_f=92.3, temperature_min_f=75.2,
        apparent_temperature_max_c=37.0, apparent_temperature_min_c=25.0,
        precipitation_probability_max=70, precipitation_sum_mm=12.0,
        weather_code=63, condition="Moderate rain", wind_speed_max_kmh=20.0
    )

    comparison = compare_daily_slots(today, tomorrow)
    assert comparison.temp_difference_c == 3.5
    assert comparison.temp_trend == "warmer"
    assert comparison.rain_probability_difference == 50
    assert "3.5°C warmer" in comparison.summary
