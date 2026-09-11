import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from './useVoice';
import GoogleSearchBar from './GoogleSearchBar';
import DisasterHelplines from './DisasterHelplines';
import EmergencySOSModal from './EmergencySOSModal';
import SurvivalKitChecklist from './SurvivalKitChecklist';
import SachetAlertBanner from './SachetAlertBanner';
import AuthoritySitRepModal from './AuthoritySitRepModal';
import HomeTab from './HomeTab';
import AskAiTab from './AskAiTab';
import ForecastTab from './ForecastTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';

// Supported Regional Languages (with Sarvam AI Auto-Detect & Multilingual LLM)
const LANGUAGES = [
  { code: 'auto', label: '🌐 Auto-Detect (Sarvam AI) 🇮🇳', voiceLang: 'hi-IN' },
  { code: 'hi', label: 'हिंदी (Hindi) 🇮🇳', voiceLang: 'hi-IN' },
  { code: 'ta', label: 'தமிழ் (Tamil) 🇮🇳', voiceLang: 'ta-IN' },
  { code: 'te', label: 'తెలుగు (Telugu) 🇮🇳', voiceLang: 'te-IN' },
  { code: 'bn', label: 'বাংলা (Bengali) 🇮🇳', voiceLang: 'bn-IN' },
  { code: 'mr', label: 'मराठी (Marathi) 🇮🇳', voiceLang: 'mr-IN' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati) 🇮🇳', voiceLang: 'gu-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada) 🇮🇳', voiceLang: 'kn-IN' },
  { code: 'ml', label: 'മലയാളം (Malayalam) 🇮🇳', voiceLang: 'ml-IN' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia) 🇮🇳', voiceLang: 'or-IN' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi) 🇮🇳', voiceLang: 'pa-IN' },
  { code: 'en', label: 'English (India) 🌐', voiceLang: 'en-US' }
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('Rewari, Haryana');
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [unit, setUnit] = useState('C');
  const [persona, setPersona] = useState('farmer'); // 'farmer', 'responder', 'citizen', 'admin'
  const [language, setLanguage] = useState('hi'); // Default to Hindi for high Indian usability
  const [autoSpeech, setAutoSpeech] = useState(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const audioRef = useRef(null);
  
  // Active Navigation Tab for Mobile App Interface: 'home', 'ask_ai', 'forecast', 'alerts', 'profile'
  const [activeTab, setActiveTab] = useState('home');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sitrepModalOpen, setSitrepModalOpen] = useState(false);

  const [currentWeather, setCurrentWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Sarvam AI Audio Player & Browser TTS Fallback Engine
  const playAudioOrSpeak = (msg) => {
    const id = msg.id;

    if (currentlySpeakingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    if (msg.audioBase64) {
      try {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(`data:audio/wav;base64,${msg.audioBase64}`);
        audioRef.current = audio;
        setCurrentlySpeakingId(id);

        audio.onended = () => setCurrentlySpeakingId(null);
        audio.onerror = () => {
          setCurrentlySpeakingId(null);
          speakTextBrowser(msg.content, msg.language, id);
        };

        audio.play().catch(e => {
          console.warn("Audio play error, falling back to browser TTS", e);
          speakTextBrowser(msg.content, msg.language, id);
        });
        return;
      } catch (e) {
        console.warn("Sarvam audio setup failed", e);
      }
    }

    speakTextBrowser(msg.content, msg.language || language, id);
  };

  const speakTextBrowser = (text, langCode, id) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || 'hi-IN';
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);

    setCurrentlySpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // WebSocket Real-Time Early Warning Alerts
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;

    const connectWS = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/alerts');
        ws.onopen = () => setServerOnline(true);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'alert') {
              setAlerts((prev) => [
                { id: Date.now(), text: data.message, time: new Date().toLocaleTimeString() },
                ...prev
              ]);
            }
          } catch (e) {
            console.error("WebSocket parse error", e);
          }
        };
        ws.onerror = () => setServerOnline(false);
        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWS, 5000);
        };
      } catch (e) {
        setServerOnline(false);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Fetch live weather data on location or GPS update
  useEffect(() => {
    if (coords) {
      fetchWeatherByCoords(coords.lat, coords.lon);
    } else if (location.trim()) {
      fetchWeatherByName(location);
    }
  }, [location, coords]);

  const fetchWeatherByName = async (loc) => {
    try {
      const res = await fetch(`http://localhost:8000/api/weather?location=${encodeURIComponent(loc)}`);
      if (res.ok) {
        const result = await res.json();
        setCurrentWeather(result.data);
      }
    } catch (e) {
      console.warn("Weather fetch error:", e);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const res = await fetch(`http://localhost:8000/api/weather?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const result = await res.json();
        setCurrentWeather(result.data);
      }
    } catch (e) {
      console.warn("Weather fetch by coords error:", e);
    }
  };

  // GPS Location Trigger
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLocation("Current GPS Location");
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve GPS coordinates. Please select city manually.");
      }
    );
  };

  const sendMessage = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg = { role: 'user', content: queryText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setActiveTab('ask_ai'); // Auto switch to Chat tab

    try {
      const bodyPayload = {
        query: queryText,
        location: location,
        persona: persona,
        language: language,
        generate_audio: true,
        lat: coords ? coords.lat : null,
        lon: coords ? coords.lon : null
      };

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (response.ok) {
        const msgId = Date.now();
        const assistantMsg = {
          id: msgId,
          role: 'assistant',
          content: data.response,
          cached: data.cached,
          persona: data.persona,
          language: data.language,
          languageName: data.language_name,
          audioBase64: data.audio_base64,
          locationInfo: data.location_info,
          rawWeather: data.raw_weather,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (autoSpeech) {
          playAudioOrSpeak(assistantMsg);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `⚠️ Error: ${data.detail || 'Failed to generate advisory'}` }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: '❌ Connection error: DisasterGuard AI backend server offline at http://localhost:8000.' }
      ]);
      setServerOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF3EE] flex justify-center items-start text-[#3D1E16]">
      
      {/* Mobile App Shell (Identical look on Desktop Web & Native App) */}
      <div className="mobile-app-shell min-h-screen pb-20">
        
        {/* Top App Header Bar */}
        <header className="sticky top-0 z-30 bg-[#FFFDFB]/95 backdrop-blur-md border-b border-[#8B3A1C]/15 px-4 py-3 shadow-xs flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ☀️
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="font-black text-sm text-[#3D1E16] tracking-tight">WeatherGPT</h1>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold border border-amber-300">
                  हर मौसम, आपके साथ
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#7C5C52]">
                <span className="font-semibold">📍 {location}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sensors Active
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Controls & Role Pill */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className="px-2.5 py-1 bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-emerald-200/80 transition"
              title="Operational Role Persona"
            >
              🚜 {persona.charAt(0).toUpperCase() + persona.slice(1)}
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full bg-amber-900 text-white flex items-center justify-center font-bold text-xs shadow-xs"
            >
              🧑🏽‍🌾
            </button>
          </div>
        </header>

        {/* Main Content Area based on Active Tab */}
        <main className="p-4 flex-1">
          {activeTab === 'home' && (
            <HomeTab
              location={location}
              currentWeather={currentWeather}
              unit={unit}
              onRefresh={() => fetchWeatherByName(location)}
              onAskAI={(query) => {
                if (query) sendMessage(query);
                else setActiveTab('ask_ai');
              }}
              persona={persona}
            />
          )}

          {activeTab === 'ask_ai' && (
            <AskAiTab
              messages={messages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              location={location}
              language={language}
              autoSpeech={autoSpeech}
              onPlayAudio={(base64, id) => playAudioOrSpeak({ audioBase64: base64, id })}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastTab
              weatherData={currentWeather}
              unit={unit}
              onAskAI={(query) => sendMessage(query)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              location={location}
              currentWeather={currentWeather}
              onOpenSOS={() => setSosModalOpen(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              location={location}
              unit={unit}
              setUnit={setUnit}
              persona={persona}
              setPersona={setPersona}
              language={language}
              setLanguage={setLanguage}
              autoSpeech={autoSpeech}
              setAutoSpeech={setAutoSpeech}
              onDetectLocation={detectLocation}
              onChangeLocation={() => {
                const newLoc = prompt("Enter city or district name:", location);
                if (newLoc && newLoc.trim()) {
                  setLocation(newLoc.trim());
                  setCoords(null);
                }
              }}
              serverOnline={serverOnline}
            />
          )}
        </main>

        {/* Bottom 5-Tab Navigation Bar */}
        <nav className="mobile-bottom-nav-bar max-w-[440px] mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 text-xs font-extrabold transition ${
              activeTab === 'home' ? 'text-[#8B3A1C]' : 'text-[#7C5C52] opacity-70'
            }`}
          >
            <span className="text-lg">🏠</span> Home
          </button>

          <button
            onClick={() => setActiveTab('ask_ai')}
            className={`flex flex-col items-center gap-0.5 text-xs font-extrabold transition ${
              activeTab === 'ask_ai' ? 'text-[#8B3A1C]' : 'text-[#7C5C52] opacity-70'
            }`}
          >
            <span className="text-lg">💬</span> Ask AI
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex flex-col items-center gap-0.5 text-xs font-extrabold transition ${
              activeTab === 'forecast' ? 'text-[#8B3A1C]' : 'text-[#7C5C52] opacity-70'
            }`}
          >
            <span className="text-lg">☀️</span> Forecast
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-0.5 text-xs font-extrabold transition relative ${
              activeTab === 'alerts' ? 'text-[#8B3A1C]' : 'text-[#7C5C52] opacity-70'
            }`}
          >
            <span className="text-lg">⚠️</span>
            <span>Alerts</span>
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 text-xs font-extrabold transition ${
              activeTab === 'profile' ? 'text-[#8B3A1C]' : 'text-[#7C5C52] opacity-70'
            }`}
          >
            <span className="text-lg">⚙️</span> Profile
          </button>
        </nav>

        {/* Emergency SOS Overlay Trigger */}
        <EmergencySOSModal
          isOpen={sosModalOpen}
          onClose={() => setSosModalOpen(false)}
          currentLocation={location}
          coords={coords}
        />

        {/* NDMA / SDMA Authority SitRep Dashboard Modal */}
        <AuthoritySitRepModal
          isOpen={sitrepModalOpen}
          onClose={() => setSitrepModalOpen(false)}
          location={location}
        />

      </div>

    </div>
  );
}
