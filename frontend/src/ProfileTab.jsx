import React, { useState } from 'react';

const ProfileTab = ({
  location,
  unit,
  setUnit,
  persona,
  setPersona,
  language,
  setLanguage,
  autoSpeech,
  setAutoSpeech,
  onDetectLocation,
  onChangeLocation,
  serverOnline
}) => {
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const personasList = [
    { id: 'farmer', label: 'Farming & Agriculture 🌾', tag: 'Kisan Pro', desc: 'Crop disease warnings, soil moisture timing, spray-window forecasts.' },
    { id: 'responder', label: 'NDRF Responder 🚨', tag: 'Tactical Command', desc: 'Real-time flood rescue protocols, road blockages, emergency squad deployment.' },
    { id: 'citizen', label: 'Citizen Safety 🆘', tag: 'Community Protection', desc: 'Evacuation routes, shelter locations, 72-hour survival kit preparedness.' },
    { id: 'admin', label: 'Disaster Admin 🏛️', tag: 'Municipal Infrastructure', desc: 'Urban flood mitigation, dam water discharge monitoring, power grid storm watch.' }
  ];

  const languagesList = [
    { code: 'auto', label: 'Auto-Detect (Sarvam AI) 🇮🇳' },
    { code: 'hi', label: 'हिंदी (Hindi) 🇮🇳' },
    { code: 'ta', label: 'தமிழ் (Tamil) 🇮🇳' },
    { code: 'te', label: 'తెలుగు (Telugu) 🇮🇳' },
    { code: 'bn', label: 'বাংলা (Bengali) 🇮🇳' },
    { code: 'mr', label: 'मराठी (Marathi) 🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati) 🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada) 🇮🇳' },
    { code: 'ml', label: 'മലയാളം (Malayalam) 🇮🇳' },
    { code: 'or', label: 'ଓଡ଼ିଆ (Odia) 🇮🇳' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi) 🇮🇳' },
    { code: 'en', label: 'English (India) 🌐' }
  ];

  const currentPersonaInfo = personasList.find(p => p.id === persona) || personasList[0];

  return (
    <div className="space-y-4 pb-4">
      {/* Header Profile Banner */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🧑🏽‍🌾
          </div>
          <div>
            <h3 className="font-black text-base text-amber-950">Kisan Member / User</h3>
            <p className="text-xs text-amber-800/70">{location} Grid • Regional Agro-Cluster</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
          {currentPersonaInfo.tag}
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-amber-950 tracking-tight flex items-center gap-1.5">
          <span>⚙️</span> Profile & Settings
        </h2>
        <span className="text-xs font-bold text-amber-800/60">Registered User</span>
      </div>

      {/* LOCATION Card */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            📍 LOCATION
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
            GPS Synced
          </span>
        </div>

        <div>
          <h3 className="font-extrabold text-base text-amber-950">{location}</h3>
          <p className="text-xs text-amber-800/70">Automatic Meteorological Station Sync</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onDetectLocation}
            className="bg-amber-900 text-white hover:bg-amber-950 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
          >
            🎯 GPS Auto-Detect
          </button>
          <button
            onClick={onChangeLocation}
            className="bg-amber-100/70 hover:bg-amber-200/70 text-amber-950 font-bold text-xs py-2.5 rounded-xl border border-amber-300 transition flex items-center justify-center gap-1"
          >
            🔍 Change City
          </button>
        </div>
      </div>

      {/* LANGUAGE Card */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            🗣️ LANGUAGE & VOICE
          </span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
            Sarvam AI
          </span>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-amber-50/70 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl p-3 focus:outline-none"
        >
          {languagesList.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-amber-800/70">10+ Indian languages supported via Sarvam AI Mayura & Bulbul models.</p>
      </div>

      {/* ACTIVE PERSONA Card */}
      <div className="bg-gradient-to-br from-emerald-50/70 to-amber-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
            🚜 ACTIVE OPERATIONAL ROLE
          </span>
          <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold">
            Specialized AI
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {personasList.map(p => (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={`p-2.5 rounded-xl text-left border text-xs transition font-bold ${
                persona === p.id
                  ? 'bg-amber-900 text-white border-amber-900 shadow-sm'
                  : 'bg-white/80 text-amber-950 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60 text-xs text-amber-900 space-y-1">
          <h4 className="font-extrabold text-amber-950">{currentPersonaInfo.label}</h4>
          <p className="text-[11.5px] leading-relaxed text-amber-800/80">{currentPersonaInfo.desc}</p>
        </div>
      </div>

      {/* PREFERENCES & TELEMETRY */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-3">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
          🎛️ PREFERENCES & TELEMETRY
        </span>

        {/* Temp unit */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h4 className="font-bold text-xs text-amber-950">Temperature Units</h4>
            <p className="text-[11px] text-amber-800/70">Celsius (°C) or Fahrenheit (°F)</p>
          </div>
          <div className="flex bg-amber-100 p-1 rounded-xl border border-amber-300">
            <button
              onClick={() => setUnit('C')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${unit === 'C' ? 'bg-amber-900 text-white' : 'text-amber-900'}`}
            >°C</button>
            <button
              onClick={() => setUnit('F')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${unit === 'F' ? 'bg-amber-900 text-white' : 'text-amber-900'}`}
            >°F</button>
          </div>
        </div>

        {/* Voice toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-100">
          <div>
            <h4 className="font-bold text-xs text-amber-950">Voice Read-Aloud</h4>
            <p className="text-[11px] text-amber-800/70">Spoken audio briefings in local dialect</p>
          </div>
          <button
            onClick={() => setAutoSpeech(!autoSpeech)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${autoSpeech ? 'bg-emerald-600' : 'bg-amber-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${autoSpeech ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Alerts toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-100">
          <div>
            <h4 className="font-bold text-xs text-amber-950">Emergency Alerts</h4>
            <p className="text-[11px] text-amber-800/70">Hailstorm, frost, high-wind push triggers</p>
          </div>
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${alertsEnabled ? 'bg-emerald-600' : 'bg-amber-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${alertsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* BACKEND SERVER STATUS */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3.5 flex items-center justify-between text-xs font-medium text-amber-900">
        <div>
          <span className="font-bold block text-amber-950">BACKEND SERVER API</span>
          <span className="text-[11px] text-amber-800/70">http://localhost:8000 • FastAPI</span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
          serverOnline ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'
        }`}>
          {serverOnline ? '● Connected' : '○ Offline'}
        </span>
      </div>
    </div>
  );
};

export default ProfileTab;
