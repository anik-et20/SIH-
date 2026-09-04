import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from './useVoice';
import GoogleSearchBar from './GoogleSearchBar';
import DisasterHelplines from './DisasterHelplines';
import EmergencySOSModal from './EmergencySOSModal';
import SurvivalKitChecklist from './SurvivalKitChecklist';

// WMO Disaster & Weather Icon Mapping
const WeatherIcon = ({ condition }) => {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('thunder') || cond.includes('storm')) return <span style={{ fontSize: '36px' }}>🌩️</span>;
  if (cond.includes('heavy rain') || cond.includes('violent')) return <span style={{ fontSize: '36px' }}>🌊</span>;
  if (cond.includes('rain') || cond.includes('drizzle')) return <span style={{ fontSize: '36px' }}>🌧️</span>;
  if (cond.includes('snow') || cond.includes('hail')) return <span style={{ fontSize: '36px' }}>❄️</span>;
  if (cond.includes('cloud') || cond.includes('overcast')) return <span style={{ fontSize: '36px' }}>⛅</span>;
  return <span style={{ fontSize: '36px' }}>☀️</span>;
};

// Supported Regional Languages (with Sarvam AI Auto-Detect & Multilingual LLM)
const LANGUAGES = [
  { code: 'auto', label: '🌐 Auto-Detect Language (Sarvam AI) 🇮🇳', voiceLang: 'hi-IN' },
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
  { code: 'en', label: 'English 🌐', voiceLang: 'en-US' }
];

// Disaster Management Roles & Personas
const DISASTER_PERSONAS = [
  { id: 'responder', label: 'NDRF Responder 🚨', desc: 'Rescue ops & tactical command' },
  { id: 'citizen', label: 'Citizen Safety 🆘', desc: 'Evacuation & shelter advice' },
  { id: 'farmer', label: 'Agricultural Risk 🌾', desc: 'Crop flood & storm damage' },
  { id: 'admin', label: 'Disaster Admin 🏛️', desc: 'Infra safety & dam monitoring' }
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('Delhi');
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [unit, setUnit] = useState('C');
  const [persona, setPersona] = useState('responder');
  const [language, setLanguage] = useState('hi'); // Default to Hindi for high Indian usability
  const [autoSpeech, setAutoSpeech] = useState(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const audioRef = useRef(null);
  
  // Active Navigation Tab for Mobile & Multi-View
  const [activeTab, setActiveTab] = useState('overview');
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const [currentWeather, setCurrentWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const chatEndRef = useRef(null);

  // Native Speech Recognition hook (dynamically bound to selected language)
  const activeVoiceLang = LANGUAGES.find(l => l.code === language)?.voiceLang || 'hi-IN';
  const { isListening, startListening, stopListening, supported: voiceSupported } = useVoice((transcript) => {
    setInput(transcript);
  }, activeVoiceLang);

  // Auto-scroll chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean Markdown & Symbols for Voice Synthesis
  const sanitizeTextForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/[*#_~`>]/g, '')
      .replace(/📍|🚨|⚠️|🌊|⚡|🔥|❄️|🌀|🆘|🚑|👮|🚒|🌾|🏛️|🚗|✈️|🏃|💬|📊|🎯|🔊|🛑|⚡/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

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

    // 1. Play Sarvam AI Base64 Audio if available
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

    // 2. Fallback to Web Speech API
    speakTextBrowser(msg.content, msg.language || language, id);
  };

  const speakTextBrowser = (text, langCode, id) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedLangObj = LANGUAGES.find(l => l.code === langCode);
    utterance.lang = selectedLangObj ? selectedLangObj.voiceLang : 'hi-IN';

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
        if (result.data.location_info) {
          setLocation(result.data.location_info);
        }
      }
    } catch (e) {
      console.warn("GPS weather fetch error:", e);
    }
  };

  // HTML5 Auto Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setIsLoading(false);
      },
      (err) => {
        alert("GPS Location access denied or unavailable.");
        setIsLoading(false);
      }
    );
  };

  const convertTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';
    if (unit === 'F') return Math.round((tempC * 9 / 5) + 32);
    return Math.round(tempC);
  };

  // Calculate Disaster Risk Matrix
  const getDisasterRiskLevel = () => {
    if (!currentWeather || !currentWeather.current) return { level: 'MODERATE', color: '#38bdf8', score: 45 };
    const wind = currentWeather.current.wind_speed_10m || 0;
    const precip = currentWeather.current.precipitation || 0;
    const code = currentWeather.current.weather_code || 0;

    if (wind > 60 || precip > 50 || [95, 96, 99, 82, 65].includes(code)) {
      return { level: 'CRITICAL WARNING', color: '#ef4444', score: 95, text: 'Severe Cyclone / Violent Storm Inundation Threat' };
    }
    if (wind > 35 || precip > 15 || [61, 63, 80, 81].includes(code)) {
      return { level: 'HIGH HAZARD', color: '#f97316', score: 75, text: 'Flash Flooding & Heavy Rainfall Warning' };
    }
    if (wind > 20 || precip > 2 || [51, 53, 55, 3].includes(code)) {
      return { level: 'MODERATE RISK', color: '#eab308', score: 50, text: 'Moderate Precipitation & Wind Activity' };
    }
    return { level: 'LOW DISASTER RISK', color: '#10b981', score: 20, text: 'Normal Weather & Stable Environmental Conditions' };
  };

  const riskInfo = getDisasterRiskLevel();

  const sendMessage = async (textToSend, customPersona = null) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const activePersona = customPersona || persona;
    const userMsg = { role: 'user', content: queryText, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const bodyPayload = {
        query: queryText,
        location: location,
        persona: activePersona,
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
          timestamp: new Date().toLocaleTimeString()
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto Read-Aloud via Sarvam Audio or Browser TTS if enabled
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

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Disaster Management Prompts (Hindi & Multilingual Support)
  const getDisasterPrompts = () => {
    if (language === 'hi' || language === 'auto') {
      switch (persona) {
        case 'responder':
          return [
            `${location} में NDRF बाढ़ राहत प्रोटोकॉल और सड़क मार्ग स्थिति की जांच करें।`,
            `${location} के लिए गंभीर तूफान और तेज हवाओं की चेतावनी देखें।`,
            `${location} में राहत बचाव दल की तैनाती सलाह तैयार करें।`
          ];
        case 'farmer':
          return [
            `क्या ${location} में फसलें जलभराव या तूफान के जोखिम में हैं?`,
            `${location} के लिए मिट्टी की नमी और तूफान के खतरे की जांच करें।`,
            `${location} में पशुधन सुरक्षा और आपातकालीन आश्रय निर्देश।`
          ];
        case 'admin':
          return [
            `${location} में शहरी बाढ़ का खतरा और जल निकासी क्षमता की जांच करें।`,
            `${location} के लिए बिजली ग्रिड तूफान जोखिम और बांध जल निकासी अलर्ट।`,
            `${location} में आपातकालीन राहत शिविर की तैयारियों का आकलन करें।`
          ];
        default: // citizen
          return [
            `${location} में बाढ़ निकासी मार्ग और नजदीकी राहत शिविर मार्गदर्शन क्या हैं?`,
            `क्या ${location} के लिए चक्रवात या भारी बारिश का रेड अलर्ट जारी है?`,
            `${location} में 72 घंटे की आपातकालीन उत्तरजीविता किट में क्या सामग्री होनी चाहिए?`
          ];
      }
    }

    switch (persona) {
      case 'responder':
        return [
          `What are the NDRF flood rescue protocols and road blockage risks in ${location}?`,
          `Check severe thunderstorm wind gusts and convective cell threats for ${location}.`,
          `Generate tactical deployment advice for disaster squads in ${location}.`
        ];
      case 'farmer':
        return [
          `Are crops in ${location} at risk of flood submergence or storm damage?`,
          `Check soil moisture saturation and storm surge warnings for ${location}.`,
          `What are the livestock shelter instructions for severe weather in ${location}?`
        ];
      case 'admin':
        return [
          `What is the urban flood risk and municipal drainage capacity for ${location}?`,
          `Check electrical power grid storm risk and dam water release warnings for ${location}.`,
          `Assess disaster emergency relief shelter preparedness in ${location}.`
        ];
      default: // citizen
        return [
          `What are the flood evacuation routes and nearest shelter guidance for ${location}?`,
          `Is there a cyclone or heavy rainfall red alert active for ${location}?`,
          `What emergency items should I prepare for a 72-hour survival kit in ${location}?`
        ];
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#070a11', color: '#f8fafc' }} className="mobile-padding-bottom">
      
      {/* Top Header Navigation Bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11, 15, 23, 0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 20px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          
          {/* Platform Branding & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}>
              🚨
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '19px', fontWeight: 900, background: 'linear-gradient(to right, #ffffff, #fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
                  DisasterGuard AI
                </h1>
                <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 700 }}>
                  Multilingual v3.0
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: serverOnline ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                <span>{serverOnline ? 'FastAPI & LLM Engine Active' : 'Offline'}</span>
                <span>•</span>
                <span>NDRF Weather Intelligence</span>
              </div>
            </div>
          </div>

          {/* Google-Style Autocomplete Search Bar & Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
            
            {/* Auto GPS Location Detector Button */}
            <button
              onClick={detectLocation}
              style={{
                background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Detect My GPS Coordinates"
            >
              🎯 GPS Location
            </button>

            {/* Google-like Autocomplete Search Bar Component */}
            <GoogleSearchBar
              currentLocation={location}
              onSelectLocation={(item) => {
                setLocation(item.name);
                if (item.lat && item.lon) {
                  setCoords({ lat: item.lat, lon: item.lon });
                } else {
                  setCoords(null);
                }
              }}
            />

            {/* Multilingual Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.9)', color: '#f8fafc', border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {l.label}
                </option>
              ))}
            </select>

            {/* Temperature Unit Switcher */}
            <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setUnit('C')}
                style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: unit === 'C' ? '#ef4444' : 'transparent', color: unit === 'C' ? '#ffffff' : '#94a3b8' }}
              >°C</button>
              <button
                onClick={() => setUnit('F')}
                style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: unit === 'F' ? '#ef4444' : 'transparent', color: unit === 'F' ? '#ffffff' : '#94a3b8' }}
              >°F</button>
            </div>

            {/* Voice Read-Aloud Toggle */}
            <button
              onClick={() => setAutoSpeech(!autoSpeech)}
              style={{
                background: autoSpeech ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                color: autoSpeech ? '#c084fc' : '#64748b',
                border: autoSpeech ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
              title="Toggle automatic speech read-aloud"
            >
              {autoSpeech ? '🔊 Voice On' : '🔇 Mute Voice'}
            </button>

            {/* 1-Tap SOS Beacon Button */}
            <button
              onClick={() => setSosModalOpen(true)}
              className="animate-pulse-red glow-danger"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '12px',
                fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              🆘 Emergency SOS
            </button>

          </div>

        </div>
      </header>

      {/* Real-Time Severe Disaster Early Warning Ticker Banner */}
      {alerts.length > 0 && (
        <div style={{ background: 'rgba(159, 18, 57, 0.95)', borderBottom: '1px solid rgba(225, 29, 72, 0.6)', padding: '10px 20px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(136, 19, 55, 0.8)', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffe4e6', fontSize: '13px' }}>
                  <span style={{ fontSize: '20px' }}>🚨</span>
                  <div>
                    <strong style={{ color: '#ffffff', marginRight: '6px' }}>DISASTER ALERT ({a.time}):</strong>
                    <span>{a.text}</span>
                  </div>
                </div>
                <button onClick={() => removeAlert(a.id)} style={{ background: 'rgba(76, 5, 25, 0.9)', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disaster Role Selector Bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '10px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', whitespace: 'nowrap' }}>
            Disaster Operational Role:
          </span>
          {DISASTER_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              style={{
                background: persona === p.id ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(30, 41, 59, 0.6)',
                color: '#ffffff',
                border: persona === p.id ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.05)',
                padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whitespace: 'nowrap'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: activeTab === 'overview' ? '#ef4444' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#94a3b8' }}
          >
            🏠 Overview & AI Command
          </button>
          <button
            onClick={() => setActiveTab('helplines')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: activeTab === 'helplines' ? '#ef4444' : 'transparent', color: activeTab === 'helplines' ? '#fff' : '#94a3b8' }}
          >
            🚨 Emergency Helplines
          </button>
          <button
            onClick={() => setActiveTab('survival')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: activeTab === 'survival' ? '#ef4444' : 'transparent', color: activeTab === 'survival' ? '#fff' : '#94a3b8' }}
          >
            🎒 72-Hour Survival Kit
          </button>
        </div>

        {/* View 1: Main Overview & AI Command Workspace */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Left Column: Environmental Metrics & Disaster Risk Meter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Disaster Risk Assessment Gauge Matrix */}
              <div className="glass-card" style={{ borderRadius: '20px', padding: '20px', border: `1px solid ${riskInfo.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                    DISASTER RISK MATRIX
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', background: `${riskInfo.color}22`, color: riskInfo.color, border: `1px solid ${riskInfo.color}44` }}>
                    SCORE: {riskInfo.score}/100
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>
                    {riskInfo.score > 70 ? '🚨' : riskInfo.score > 40 ? '⚠️' : '🛡️'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: riskInfo.color }}>
                      {riskInfo.level}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                      {riskInfo.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Weather Metric Card */}
              <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                    LIVE ENVIRONMENTAL METRICS
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    ⚡ Real-Time Sensor Stream
                  </span>
                </div>

                {currentWeather ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
                          {currentWeather.location_info || location}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
                          {currentWeather.current?.condition_text || 'Clear Sky'}
                        </p>
                      </div>
                      <WeatherIcon condition={currentWeather.current?.condition_text} />
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '58px', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                        {convertTemp(currentWeather.current?.temperature_2m)}°
                      </span>
                      <span style={{ fontSize: '20px', color: '#64748b', fontWeight: 700 }}>{unit}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Feels Like</span>
                        <strong style={{ fontSize: '15px', color: '#f1f5f9' }}>{convertTemp(currentWeather.current?.apparent_temperature)}°{unit}</strong>
                      </div>
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Humidity</span>
                        <strong style={{ fontSize: '15px', color: '#f1f5f9' }}>{currentWeather.current?.relative_humidity_2m ?? '--'}%</strong>
                      </div>
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Wind Speed</span>
                        <strong style={{ fontSize: '15px', color: '#f1f5f9' }}>{currentWeather.current?.wind_speed_10m ?? '--'} km/h</strong>
                      </div>
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Precipitation</span>
                        <strong style={{ fontSize: '15px', color: '#f1f5f9' }}>{currentWeather.current?.precipitation ?? '0'} mm</strong>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '13px' }}>
                    Loading environmental metrics...
                  </div>
                )}
              </div>

              {/* Dynamic Disaster Suggested Queries */}
              <div className="glass-card" style={{ borderRadius: '20px', padding: '20px' }}>
                <h3 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '12px' }}>
                  {persona.toUpperCase()} EMERGENCY PROMPTS
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getDisasterPrompts().map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(p)}
                      style={{
                        textAlign: 'left', padding: '10px 14px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      💬 "{p}"
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Conversational AI Disaster Command Center */}
            <div className="glass-container" style={{ borderRadius: '24px', display: 'flex', flexDirection: 'column', height: '640px', overflow: 'hidden' }}>
              
              {/* Workspace Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🤖</span>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                      DisasterGuard AI Command Engine
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Role: <strong style={{ color: '#ef4444' }}>{persona.toUpperCase()}</strong> | Mode: <strong style={{ color: '#c084fc' }}>{language === 'auto' ? 'Multilingual Auto-Detect' : language.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>

                {isLoading && (
                  <span style={{ fontSize: '12px', color: '#ef4444', animation: 'pulse 1.5s infinite' }}>
                    Generating Multilingual Advisory...
                  </span>
                )}
              </div>

              {/* Chat History Log */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '380px', color: '#64748b' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '30px' }}>
                      🇮🇳
                    </div>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#cbd5e1' }}>Multilingual Disaster Intelligence</h4>
                    <p style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                      Type or speak in <strong>Hindi (हिंदी), Tamil, Telugu, Marathi, Bengali, Gujarati</strong> or any regional language. The AI will respond in your selected language!
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%', padding: '14px 18px', borderRadius: '18px',
                          background: m.role === 'user'
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : m.role === 'system'
                            ? 'rgba(136, 19, 55, 0.8)'
                            : 'rgba(30, 41, 59, 0.85)',
                          color: m.role === 'system' ? '#fecdd3' : '#f8fafc',
                          border: m.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                          borderBottomRightRadius: m.role === 'user' ? '4px' : '18px',
                          borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '18px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                      >
                        {m.role === 'assistant' && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px', marginBottom: '8px', fontSize: '11px', color: '#94a3b8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#ef4444', fontWeight: 800 }}>
                                📍 {m.locationInfo || location}
                              </span>
                              {m.languageName && (
                                <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 700 }}>
                                  🌐 {m.languageName}
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Audio Play Button */}
                              <button
                                onClick={() => playAudioOrSpeak(m)}
                                style={{
                                  background: currentlySpeakingId === m.id ? '#a855f7' : 'rgba(255, 255, 255, 0.1)',
                                  color: '#ffffff', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                                title="Listen to voice audio"
                              >
                                {currentlySpeakingId === m.id ? '🛑 Stop' : '🔊 Listen'}
                              </button>

                              {m.cached && <span style={{ color: '#f59e0b', fontSize: '10px' }}>⚡ Cached</span>}
                            </div>
                          </div>
                        )}

                        <p style={{ fontSize: '14px', lineHeight: 1.6, whitespace: 'pre-wrap' }}>{m.content}</p>
                        <span style={{ fontSize: '10px', opacity: 0.5, marginTop: '6px', display: 'block', textAlign: 'right' }}>{m.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.5)', padding: '10px 16px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'ping 1s infinite' }} />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Generating Multilingual Advisory...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Voice Input & Action Bar */}
              <footer style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                
                {voiceSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    style={{
                      width: '44px', height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: isListening ? '#f43f5e' : 'rgba(30, 41, 59, 0.8)',
                      color: isListening ? '#ffffff' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', boxShadow: isListening ? '0 0 15px rgba(244, 63, 94, 0.5)' : 'none'
                    }}
                    title={isListening ? 'Stop Listening' : 'Voice Input (Hands-free)'}
                  >
                    🎤
                  </button>
                )}

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder={isListening ? 'Listening to your voice...' : `Ask DisasterGuard in ${language.toUpperCase()} for ${location}...`}
                  style={{
                    flex: 1, background: 'rgba(7, 10, 17, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px', padding: '12px 16px', color: '#f8fafc', fontSize: '14px', outline: 'none'
                  }}
                />

                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff',
                    fontWeight: 800, fontSize: '14px', opacity: isLoading || !input.trim() ? 0.4 : 1, transition: 'all 0.2s'
                  }}
                >
                  Send
                </button>
              </footer>

            </div>

          </div>
        )}

        {/* View 2: Emergency Helplines Hub */}
        {activeTab === 'helplines' && <DisasterHelplines />}

        {/* View 3: 72-Hour Survival Kit Checklist */}
        {activeTab === 'survival' && <SurvivalKitChecklist />}

      </div>

      {/* Emergency SOS Modal Component */}
      <EmergencySOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        currentLocation={location}
        coords={coords}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('overview')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'overview' ? '#ef4444' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
        >
          <span style={{ fontSize: '18px' }}>🏠</span> Overview
        </button>
        <button
          onClick={() => setActiveTab('helplines')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'helplines' ? '#ef4444' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
        >
          <span style={{ fontSize: '18px' }}>🚨</span> Helplines
        </button>
        <button
          onClick={() => setSosModalOpen(true)}
          style={{ background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 900 }}
        >
          <span style={{ fontSize: '20px', animation: 'ping 1.5s infinite' }}>🆘</span> SOS
        </button>
        <button
          onClick={() => setActiveTab('survival')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'survival' ? '#ef4444' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
        >
          <span style={{ fontSize: '18px' }}>🎒</span> Survival Kit
        </button>
      </nav>

    </div>
  );
}
