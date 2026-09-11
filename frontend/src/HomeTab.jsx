import React from 'react';

const HomeTab = ({
  location,
  currentWeather,
  unit,
  onRefresh,
  onAskAI,
  persona = 'farmer'
}) => {
  const convertTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';
    if (unit === 'F') return Math.round((tempC * 9 / 5) + 32);
    return Math.round(tempC);
  };

  const curr = currentWeather?.current || {};
  const tempC = curr.temperature_2m ?? 31;
  const condition = curr.condition_text || 'Partly Cloudy';
  const humidity = curr.relative_humidity_2m ?? 68;
  const wind = curr.wind_speed_10m ?? 14;
  const apparentTemp = curr.apparent_temperature ?? 34;
  const precip = curr.precipitation ?? 0;
  const rainProb = precip > 5 ? 85 : precip > 0 ? 50 : 72;

  const isFarmer = persona === 'farmer';

  return (
    <div className="space-y-4 pb-4">
      {/* City & Verified Station Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-amber-950 tracking-tight flex items-center gap-1.5">
            {location} <span className="text-emerald-700 text-sm">✔</span>
          </h2>
          <p className="text-xs text-amber-800/70 font-medium">Updated just now • IMD Regional Station</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 rounded-xl border border-amber-300 transition text-sm shadow-sm"
          title="Refresh Meteorological Data"
        >
          🔄
        </button>
      </div>

      {/* Main Warm Hero Weather Card */}
      <div className="bg-gradient-to-br from-amber-100/90 via-orange-100/60 to-amber-200/50 border border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-amber-200/80 text-amber-950 rounded-full text-xs font-bold border border-amber-300/60">
            ☀️ Day Forecast
          </span>
          <span className="text-xs font-bold text-amber-900/80">High UV Index</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-5xl font-black text-amber-950 tracking-tight">
              {convertTemp(tempC)}°<span className="text-3xl font-extrabold">{unit}</span>
            </div>
            <h3 className="text-lg font-extrabold text-amber-900 mt-1">{condition}</h3>
            <p className="text-xs text-amber-800/80 mt-0.5">Feels like {convertTemp(apparentTemp)}°{unit} • Optimal Moisture</p>
          </div>

          {/* Warm Sun Graphic */}
          <div className="text-6xl animate-pulse">
            🌤️
          </div>
        </div>

        {/* Sub-metrics pill */}
        <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-950">
          <span className="flex items-center gap-1.5">
            <span>🌱</span> Soil Temp: 26.4°C
          </span>
          <span className="text-amber-800 font-extrabold flex items-center gap-1 cursor-pointer" onClick={() => onAskAI("What is the optimal sowing advice for current soil temperature?")}>
            Optimal sowing →
          </span>
        </div>
      </div>

      {/* 2-Column Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Humidity */}
        <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800/70 font-extrabold uppercase">
            <span>HUMIDITY</span>
            <span className="text-base">💧</span>
          </div>
          <div className="text-2xl font-black text-amber-950">{humidity}%</div>
          <p className="text-[11px] text-amber-800/80 font-medium">Normal dew point (21°C)</p>
        </div>

        {/* Wind */}
        <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800/70 font-extrabold uppercase">
            <span>WIND</span>
            <span className="text-base">💨</span>
          </div>
          <div className="text-2xl font-black text-amber-950">{wind} <span className="text-sm font-normal">km/h</span></div>
          <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
            <span>✓</span> Safe for drone spray
          </p>
        </div>
      </div>

      {/* Rain Probability Progress Bar */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm font-extrabold text-amber-950">
          <span className="flex items-center gap-2">
            <span>🌧️</span> Rain Probability
          </span>
          <span className="text-amber-900 font-black text-base">{rainProb}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden p-0.5 border border-amber-200/60">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-900 rounded-full transition-all duration-500"
            style={{ width: `${rainProb}%` }}
          />
        </div>

        {/* Advice note box */}
        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start space-x-2">
          <span className="text-amber-800 text-sm mt-0.5">ℹ️</span>
          <p className="leading-snug">
            Rain likely this evening (around 5:30 PM). <strong>Delay irrigation</strong> to prevent root waterlogging.
          </p>
        </div>
      </div>

      {/* AI Advisory Card */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-amber-50/60 to-emerald-100/40 border border-emerald-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-extrabold rounded-md text-[11px] flex items-center gap-1">
            💡 AI FARM & DISASTER ADVISORY
          </span>
          <span className="text-[11px] font-bold text-emerald-800">● WeatherGPT Gen-4</span>
        </div>

        <h3 className="font-black text-sm text-amber-950">Monsoon precipitation incoming today:</h3>

        <div className="space-y-2 text-xs font-medium text-amber-900">
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Consider delaying canal & tubewell irrigation for 24 hours.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Avoid spraying pesticides or foliar urea before high rainfall.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Clear boundary channels in Bajra, Cotton & Wheat crop patches.</span>
          </div>
        </div>

        {/* Quick prompt chips */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => onAskAI("When is the best time to harvest current crops?")}
            className="px-3 py-1.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 transition shadow-sm"
          >
            🌾 Best time to harvest?
          </button>
          <button
            onClick={() => onAskAI("Should I run tubewell irrigation today?")}
            className="px-3 py-1.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 transition shadow-sm"
          >
            🚰 Tubewell advice
          </button>
        </div>
      </div>

      {/* Floating Prominent Voice CTA Button */}
      <button
        onClick={() => onAskAI("")}
        className="w-full bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 hover:opacity-95 transition transform active:scale-98"
      >
        <span className="text-lg animate-pulse">🎙️</span>
        <span>Ask WeatherGPT (बोलकर पूछें)</span>
      </button>
    </div>
  );
};

export default HomeTab;
