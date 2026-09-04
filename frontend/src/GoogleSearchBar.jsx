import React, { useState, useEffect, useRef } from 'react';

// Comprehensive Indian States & UTs + Major Cities Database
const INDIAN_STATES_AND_CITIES = [
  { name: "Maharashtra", type: "State 🇮🇳", lat: 19.7515, lon: 75.7139, desc: "Coastal Cyclone & Heavy Rainfall Zone" },
  { name: "Delhi", type: "Union Territory 🇮🇳", lat: 28.6139, lon: 77.2090, desc: "Heatwave & Urban Flood Alert Zone" },
  { name: "Odisha", type: "State 🇮🇳", lat: 20.9517, lon: 85.0985, desc: "Super Cyclone & Coastal Surge Danger Zone" },
  { name: "Tamil Nadu", type: "State 🇮🇳", lat: 11.1271, lon: 78.6569, desc: "Northeast Monsoon & Flood Watch Zone" },
  { name: "West Bengal", type: "State 🇮🇳", lat: 22.9868, lon: 87.8550, desc: "Sundarbans Cyclone & Tidal Surge Risk" },
  { name: "Gujarat", type: "State 🇮🇳", lat: 22.2587, lon: 71.1924, desc: "Arabian Sea Storm & Earthquake Risk" },
  { name: "Kerala", type: "State 🇮🇳", lat: 10.8505, lon: 76.2711, desc: "Monsoon Landslide & Flash Flood Zone" },
  { name: "Uttar Pradesh", type: "State 🇮🇳", lat: 26.8467, lon: 80.9462, desc: "Ganga Basin Flood & Cold Wave Warning" },
  { name: "Bihar", type: "State 🇮🇳", lat: 25.0961, lon: 85.3131, desc: "Kosi Basin Severe Inundation Alert" },
  { name: "Assam", type: "State 🇮🇳", lat: 26.2006, lon: 92.9376, desc: "Brahmaputra Annual Flash Flood Region" },
  { name: "Uttarakhand", type: "State 🇮🇳", lat: 30.0668, lon: 79.0193, desc: "Cloudburst & Alpine Landslide Danger" },
  { name: "Himachal Pradesh", type: "State 🇮🇳", lat: 31.1048, lon: 77.1734, desc: "Flash Flood & Mountain Landslide Risk" },
  { name: "Jammu and Kashmir", type: "UT 🇮🇳", lat: 33.7782, lon: 76.5762, desc: "Avalanche & Alpine Storm Warning" },
  { name: "Ladakh", type: "UT 🇮🇳", lat: 34.1526, lon: 77.5771, desc: "High Altitude Extreme Freeze Zone" },
  { name: "Karnataka", type: "State 🇮🇳", lat: 15.3173, lon: 75.7139, desc: "Western Ghats Heavy Rain Zone" },
  { name: "Andhra Pradesh", type: "State 🇮🇳", lat: 15.9129, lon: 79.7400, desc: "Bay of Bengal Severe Cyclone Coast" },
  { name: "Telangana", type: "State 🇮🇳", lat: 18.1124, lon: 79.0193, desc: "Heatwave & Urban Flooding Region" },
  { name: "Rajasthan", type: "State 🇮🇳", lat: 27.0238, lon: 74.2179, desc: "Extreme Desert Heatwave & Dust Storm" },
  { name: "Punjab", type: "State 🇮🇳", lat: 31.1471, lon: 75.3412, desc: "Satluj Inundation & Fog Warning" },
  { name: "Haryana", type: "State 🇮🇳", lat: 29.0588, lon: 76.0856, desc: "Severe Summer Heatwave & Cold Wave" },
  { name: "Jharkhand", type: "State 🇮🇳", lat: 23.6102, lon: 85.2799, desc: "Thunderstorm & Lightning Strike Hazard" },
  { name: "Chhattisgarh", type: "State 🇮🇳", lat: 21.2787, lon: 81.8661, desc: "Heavy Precipitation & River Surge" },
  { name: "Goa", type: "State 🇮🇳", lat: 15.2993, lon: 74.1240, desc: "Coastal High Wind & Monsoon Watch" },
  { name: "Sikkim", type: "State 🇮🇳", lat: 27.5330, lon: 88.5122, desc: "Glacial Lake Outburst & Landslide Risk" },
  { name: "Meghalaya", type: "State 🇮🇳", lat: 25.4670, lon: 91.3662, desc: "Extreme Precipitation Record Zone" },
  { name: "Tripura", type: "State 🇮🇳", lat: 23.9408, lon: 91.9882, desc: "Flash Flood & River Inundation Zone" },
  { name: "Manipur", type: "State 🇮🇳", lat: 24.6637, lon: 93.9063, desc: "Hilly Landslide & Inundation Watch" },
  { name: "Nagaland", type: "State 🇮🇳", lat: 26.1584, lon: 94.5624, desc: "Seismic Fault & Mountain Landslide Zone" },
  { name: "Arunachal Pradesh", type: "State 🇮🇳", lat: 28.2180, lon: 94.7278, desc: "Himalayan Cloudburst & Seismic Zone" },
  { name: "Mizoram", type: "State 🇮🇳", lat: 23.1645, lon: 92.9376, desc: "Cyclonic Rain & Slope Collapse Risk" },
  { name: "Mumbai", type: "City (MH) 🇮🇳", lat: 19.0760, lon: 72.8777, desc: "High Tide & Coastal Urban Flood Risk" },
  { name: "Kolkata", type: "City (WB) 🇮🇳", lat: 22.5726, lon: 88.3639, desc: "Cyclonic Surge & Delta Flooding" },
  { name: "Chennai", type: "City (TN) 🇮🇳", lat: 13.0827, lon: 80.2707, desc: "Northeast Monsoon Cyclone Hazard" },
  { name: "Bhubaneswar", type: "City (OD) 🇮🇳", lat: 20.2961, lon: 85.8245, desc: "Cyclone Emergency Command Zone" },
  { name: "Guwahati", type: "City (AS) 🇮🇳", lat: 26.1445, lon: 91.7362, desc: "Brahmaputra Valley Flood Command" },
  { name: "Patna", type: "City (BR) 🇮🇳", lat: 25.5941, lon: 85.1376, desc: "Ganga Inundation Control Zone" },
  { name: "Shimla", type: "City (HP) 🇮🇳", lat: 31.1048, lon: 77.1734, desc: "Mountain Disaster Control Center" },
  { name: "Dehradun", type: "City (UK) 🇮🇳", lat: 30.3165, lon: 78.0322, desc: "Alpine Emergency Operations Zone" },
  { name: "Kochi", type: "City (KL) 🇮🇳", lat: 9.9312, lon: 76.2673, desc: "Coastal Flood & High Waves Zone" },
  { name: "Visakhapatnam", type: "City (AP) 🇮🇳", lat: 17.6868, lon: 83.2185, desc: "Severe Cyclonic Landfall Region" }
];

export default function GoogleSearchBar({ onSelectLocation, currentLocation }) {
  const [query, setQuery] = useState(currentLocation || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync external location changes
  useEffect(() => {
    if (currentLocation && currentLocation !== query) {
      setQuery(currentLocation);
    }
  }, [currentLocation]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local Indian states & cities, then fetch global API results
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    if (!val.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const valLower = val.toLowerCase().trim();

    // 1. Filter local curated list first
    const localMatches = INDIAN_STATES_AND_CITIES.filter(
      item => item.name.toLowerCase().includes(valLower) || item.desc.toLowerCase().includes(valLower)
    ).slice(0, 5);

    setSuggestions(localMatches);
    setIsOpen(true);

    // 2. Debounced fetch to Open-Meteo Geocoding API for global locations
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (val.length < 2) return;
      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=6&language=en&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const apiSuggestions = data.results.map(r => ({
              name: r.name,
              type: `${r.admin1 || ''} ${r.country || ''}`.trim() || 'Global Location 🌐',
              lat: r.latitude,
              lon: r.longitude,
              desc: `Lat: ${r.latitude.toFixed(2)}, Lon: ${r.longitude.toFixed(2)}`
            }));

            // Merge local and API recommendations without duplicates
            const existingNames = new Set(localMatches.map(m => m.name.toLowerCase()));
            const uniqueApi = apiSuggestions.filter(a => !existingNames.has(a.name.toLowerCase()));
            
            setSuggestions([...localMatches, ...uniqueApi].slice(0, 7));
          }
        }
      } catch (err) {
        console.warn("Geocoding fetch error", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    setSuggestions([]);
    if (onSelectLocation) {
      onSelectLocation(item);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        onSelectLocation({ name: query.trim() });
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        handleSelect({ name: query.trim() });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
      
      {/* Google-like Search Bar Container */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: isOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: isOpen ? '16px 16px 0 0' : '24px',
        padding: '8px 14px',
        boxShadow: isOpen ? '0 8px 25px rgba(56, 189, 248, 0.25)' : '0 4px 15px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease-in-out'
      }}>
        {/* Search Icon / Indicator */}
        <span style={{ fontSize: '16px', marginRight: '10px', filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.5))' }}>
          🔍
        </span>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search State, City or Region..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}
        />

        {/* Clear Button or Loading Spinner */}
        {loading ? (
          <span style={{ fontSize: '12px', color: '#38bdf8', animation: 'spin 1s linear infinite' }}>⏳</span>
        ) : query ? (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: '14px', padding: '0 4px', lineHeight: 1
            }}
            title="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Google-like Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #38bdf8',
          borderTop: 'none',
          borderRadius: '0 0 18px 18px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          zIndex: 100,
          overflow: 'hidden',
          maxHeight: '320px',
          overflowY: 'auto'
        }}>
          {suggestions.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={index}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {item.name}
                    </div>
                    {item.desc && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                        {item.desc}
                      </div>
                    )}
                  </div>
                </div>

                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: item.type.includes('State') || item.type.includes('UT') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: item.type.includes('State') || item.type.includes('UT') ? '#34d399' : '#38bdf8',
                  border: item.type.includes('State') || item.type.includes('UT') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {item.type}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
