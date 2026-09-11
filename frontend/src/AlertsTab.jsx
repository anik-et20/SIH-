import React from 'react';
import SachetAlertBanner from './SachetAlertBanner';

const AlertsTab = ({ location, currentWeather, onOpenSOS }) => {
  const windSpeed = currentWeather?.current?.wind_speed_10m || 14;

  return (
    <div className="space-y-4 pb-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-amber-950 tracking-tight">Severe Weather Alerts</h2>
          <p className="text-xs text-amber-800/70 font-medium">{location} Grid • Agro-Met Advisory</p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Doppler
        </span>
      </div>

      {/* Main SACHET CAP Banner */}
      <SachetAlertBanner location={location} />

      {/* Primary Alert Card Mockup Container */}
      <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-amber-100/40 border border-amber-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-black flex items-center gap-1">
            ⚡ WEATHER WATCH
          </span>
          <span className="text-xs font-bold text-amber-800/80">🔔 Active</span>
        </div>

        <h3 className="font-extrabold text-sm text-amber-950 leading-snug">
          Regional precipitation alert: Light to moderate showers expected across northern and central plains. Farmers advised to monitor moisture levels.
        </h3>

        {/* Recommended Field Actions Checklist */}
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 space-y-2.5">
          <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
            <span>🛡️</span> Recommended Field Actions
          </span>

          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/40 space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <span className="text-emerald-600">✓</span> Postpone open-air pesticide spraying
            </div>
            <p className="text-[11px] text-amber-800/80 pl-5">Wash-off risk is high within the next 4–6 hours</p>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/40 space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <span className="text-emerald-600">✓</span> Ensure field drainage outlets are unobstructed
            </div>
            <p className="text-[11px] text-amber-800/80 pl-5">Prevent water accumulation in mustard & wheat plots</p>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/40 space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <span className="text-emerald-600">✓</span> Drive with caution on wet rural roadways
            </div>
            <p className="text-[11px] text-amber-800/80 pl-5">Tractor haulage routes show reduced traction index</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-amber-800/70 pt-1">
          <span>🕒 Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg border border-amber-300 transition text-[11px]">
              📢 Share Alert
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Advisories Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="font-extrabold text-sm text-amber-950">Secondary Advisories</h3>
        <span className="text-[11px] font-bold text-amber-800/60 uppercase">SECTOR 4-B</span>
      </div>

      {/* Grid: Wind Advisory & Soil Moisture Watch */}
      <div className="space-y-3">
        <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl text-xl">💨</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">WIND ADVISORY</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">Low Impact</span>
            </div>
            <h4 className="font-extrabold text-xs text-amber-950">Gusts up to {windSpeed} km/h from NW</h4>
            <p className="text-[11px] text-amber-800/80">Light foliage flutter. Secure polyhouse side tarps and lightweight drip line fittings before noon.</p>
          </div>
        </div>

        <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-orange-100 text-orange-900 rounded-xl text-xl">💧</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">SOIL MOISTURE WATCH</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">{location} Zone</span>
            </div>
            <h4 className="font-extrabold text-xs text-amber-950">Saturated Topsoil (78% Capacity)</h4>
            <p className="text-[11px] text-amber-800/80">Pause routine canal sub-surface pumping. Natural capillary moisture is adequate for root zones.</p>
          </div>
        </div>
      </div>

      {/* Direct Kisan / NDRF Helpline Banner */}
      <div className="bg-gradient-to-r from-amber-100/90 via-orange-100/70 to-amber-200/60 border border-amber-300/70 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">DIRECT KISAN / NDRF HELPLINE</span>
          <h4 className="font-extrabold text-sm text-amber-950">Krishi Vigyan Kendra & NDRF</h4>
          <p className="text-[11px] text-amber-800/80">Agronomy & Emergency Desk: 1800-180-1551 • 1078</p>
        </div>
        <a 
          href="tel:1078"
          className="bg-amber-900 text-white hover:bg-amber-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
        >
          📞 Toll-Free
        </a>
      </div>
    </div>
  );
};

export default AlertsTab;
