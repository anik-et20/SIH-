import React, { useState } from 'react';

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '🌊',
  95: '🌩️', 96: '⛈️', 99: '⛈️'
};

const getWmoDescription = (code) => {
  if ([95, 96, 99].includes(code)) return 'Thunderstorms evening — Halt field tilling & fertilizer application';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Moderate to heavy rain — Ensure surface drainage & grain storage';
  if ([51, 53, 55].includes(code)) return 'Light rain showers — Postpone foliar spraying by 12 hours';
  if ([0, 1].includes(code)) return 'Clear skies & low wind — Ideal for pesticide spraying & harvesting';
  if ([2, 3].includes(code)) return 'Partly cloudy — Good aeration window for mustard & wheat crops';
  return 'Overcast skies — Safe for machinery & routine field inspection';
};

const ForecastTab = ({ weatherData, unit = 'C', onAskAI }) => {
  const [filter, setFilter] = useState('all');

  const convertTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';
    if (unit === 'F') return Math.round((tempC * 9 / 5) + 32);
    return Math.round(tempC);
  };

  const daily = weatherData?.daily;
  const days = [];

  if (daily && daily.time) {
    for (let i = 0; i < daily.time.length; i++) {
      const dStr = daily.time[i];
      const dateObj = new Date(dStr);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const maxT = daily.temperature_2m_max?.[i] ?? 30;
      const minT = daily.temperature_2m_min?.[i] ?? 20;
      const precip = daily.precipitation_sum?.[i] ?? 0;
      const code = daily.weather_code?.[i] ?? 0;

      days.push({
        index: i,
        dayName,
        formattedDate,
        maxT,
        minT,
        precip,
        code,
        icon: WMO_ICONS[code] || '☀️',
        advice: getWmoDescription(code),
        rainProb: precip > 5 ? Math.min(95, Math.round(precip * 8)) : precip > 0 ? 35 : 10
      });
    }
  } else {
    // Fallback 7-day dummy slots if loading
    const defaultDays = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      days.push({
        index: i,
        dayName: defaultDays[i],
        formattedDate: `${18 + i} Mar`,
        maxT: 31 + (i % 3),
        minT: 24 - (i % 2),
        precip: i === 0 ? 14.2 : 2.0,
        code: i === 0 ? 95 : 1,
        icon: i === 0 ? '🌩️' : '☀️',
        advice: i === 0 ? 'Thunderstorms evening — Halt field tilling & fertilizer' : 'Sunny & dry — Recommended drip irrigation schedule',
        rainProb: i === 0 ? 72 : 15
      });
    }
  }

  // Calculate 7-day total rain
  const totalRain = days.reduce((sum, d) => sum + d.precip, 0).toFixed(1);

  // Sunrise/Sunset formatting
  const sunriseTime = daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '06:04 AM';
  const sunsetTime = daily?.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '06:48 PM';

  const filteredDays = days.filter(d => {
    if (filter === 'high_rain') return d.rainProb >= 40;
    if (filter === 'spraying') return d.rainProb < 30 && d.precip < 2;
    if (filter === 'harvesting') return d.rainProb < 20;
    return true;
  });

  return (
    <div className="space-y-4 pb-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-amber-950 tracking-tight">7-Day Forecast</h2>
          <p className="text-xs text-amber-800/70 font-medium">Agricultural & Disaster Outlook</p>
        </div>
        <span className="px-3 py-1 bg-amber-100/80 border border-amber-200/60 rounded-full text-xs font-bold text-amber-900">
          °{unit} Metric
        </span>
      </div>

      {/* Sun & Day Details Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-orange-100/30 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-3">
          <span className="flex items-center gap-1.5">
            <span>☀️</span> Sun & Day Details
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px]">
            12h 44m Daylight
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-amber-200/50 mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌅</span>
            <div>
              <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">SUNRISE</span>
              <span className="text-sm font-black text-amber-950">{sunriseTime}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌇</span>
            <div>
              <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">SUNSET</span>
              <span className="text-sm font-black text-amber-950">{sunsetTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-amber-900/80 pt-1">
          <span className="flex items-center gap-1">
            <span>💧</span> 7-Day Cumulative Rain
          </span>
          <strong className="text-sm font-black text-amber-950">{totalRain} mm</strong>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All 7 Days' },
          { id: 'high_rain', label: 'High Rain' },
          { id: 'spraying', label: 'Best Spraying' },
          { id: 'harvesting', label: 'Harvesting' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-amber-900 text-white shadow-sm'
                : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200/60 border border-amber-200/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 7-Day List Cards */}
      <div className="space-y-3">
        {filteredDays.map(d => (
          <div key={d.index} className="bg-white/90 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{d.icon}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    {d.dayName}
                    <span className="text-[11px] font-normal text-amber-800/70">{d.formattedDate}</span>
                  </h4>
                </div>
              </div>

              {/* Temperature Bar & Rain badge */}
              <div className="flex items-center space-x-3">
                <div className="text-right text-xs font-bold text-amber-950">
                  <span className="text-amber-700/80 mr-1">{convertTemp(d.minT)}°</span>
                  <div className="inline-block w-12 h-1.5 bg-amber-200/70 rounded-full mx-1 relative overflow-hidden align-middle">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-orange-600 rounded-full" 
                      style={{ width: `${Math.min(100, (d.maxT / 45) * 100)}%` }}
                    />
                  </div>
                  <span className="font-extrabold">{convertTemp(d.maxT)}°</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  d.rainProb >= 50 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-50 text-amber-800'
                }`}>
                  🌧️ {d.rainProb}%
                </span>
              </div>
            </div>

            {/* Advisory Banner for Day */}
            <div className={`p-2 rounded-xl text-xs flex items-start space-x-2 ${
              d.rainProb >= 50 ? 'bg-amber-50/90 text-amber-900 border border-amber-200/80' : 'bg-emerald-50/70 text-emerald-900 border border-emerald-200/60'
            }`}>
              <span className="text-xs mt-0.5">{d.rainProb >= 50 ? '⚠️' : '🌿'}</span>
              <p className="font-medium text-[11.5px] leading-tight">{d.advice}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div>
          <h4 className="font-bold text-sm">Need specific crop guidance?</h4>
          <p className="text-xs text-amber-200/80 mt-0.5">Ask AI how this forecast impacts your fields</p>
        </div>
        <button
          onClick={() => onAskAI?.("How does the 7-day forecast affect my crops?")}
          className="bg-white text-amber-950 hover:bg-amber-100 font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow"
        >
          Ask AI →
        </button>
      </div>
    </div>
  );
};

export default ForecastTab;
