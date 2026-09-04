import React, { useState, useEffect } from 'react';

// Predefined list of popular Indian and Global locations categorized by region
export const POPULAR_LOCATIONS = [
  // Metro Cities
  { id: 'delhi', name: 'Delhi', region: 'metro', state: 'Delhi NCR', lat: 28.6139, lon: 77.2090, icon: '🏛️' },
  { id: 'mumbai', name: 'Mumbai', region: 'metro', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, icon: '🌊' },
  { id: 'bengaluru', name: 'Bengaluru', region: 'metro', state: 'Karnataka', lat: 12.9716, lon: 77.5946, icon: '💻' },
  { id: 'kolkata', name: 'Kolkata', region: 'metro', state: 'West Bengal', lat: 22.5726, lon: 88.3639, icon: '🚖' },
  { id: 'chennai', name: 'Chennai', region: 'metro', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, icon: '🏖️' },
  { id: 'hyderabad', name: 'Hyderabad', region: 'metro', state: 'Telangana', lat: 17.3850, lon: 78.4867, icon: '🏰' },
  { id: 'ahmedabad', name: 'Ahmedabad', region: 'metro', state: 'Gujarat', lat: 23.0225, lon: 72.5714, icon: '🪁' },
  { id: 'pune', name: 'Pune', region: 'metro', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, icon: '🎓' },

  // Northern & Himalayan
  { id: 'shimla', name: 'Shimla', region: 'north', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, icon: '🏔️' },
  { id: 'srinagar', name: 'Srinagar', region: 'north', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973, icon: '❄️' },
  { id: 'dehradun', name: 'Dehradun', region: 'north', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, icon: '🌲' },
  { id: 'jaipur', name: 'Jaipur', region: 'north', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, icon: '👑' },
  { id: 'chandigarh', name: 'Chandigarh', region: 'north', state: 'Punjab/Haryana', lat: 30.7333, lon: 76.7794, icon: '🌳' },
  { id: 'lucknow', name: 'Lucknow', region: 'north', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, icon: '🕌' },
  { id: 'leh', name: 'Leh', region: 'north', state: 'Ladakh', lat: 34.1526, lon: 77.5771, icon: '⛰️' },

  // Coastal & South
  { id: 'kochi', name: 'Kochi', region: 'south', state: 'Kerala', lat: 9.9312, lon: 76.2673, icon: '🌴' },
  { id: 'goa', name: 'Goa (Panaji)', region: 'south', state: 'Goa', lat: 15.4909, lon: 73.8278, icon: '🏖️' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', region: 'south', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, icon: '⚓' },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', region: 'south', state: 'Kerala', lat: 8.5241, lon: 76.9366, icon: '🥥' },
  { id: 'coimbatore', name: 'Coimbatore', region: 'south', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, icon: '🏭' },

  // East & North-East
  { id: 'guwahati', name: 'Guwahati', region: 'east', state: 'Assam', lat: 26.1445, lon: 91.7362, icon: '🦏' },
  { id: 'patna', name: 'Patna', region: 'east', state: 'Bihar', lat: 25.5941, lon: 85.1376, icon: '🌾' },
  { id: 'bhubaneswar', name: 'Bhubaneswar', region: 'east', state: 'Odisha', lat: 20.2961, lon: 85.8245, icon: '🛕' },
  { id: 'shillong', name: 'Shillong', region: 'east', state: 'Meghalaya', lat: 25.5788, lon: 91.8933, icon: '🌧️' },
  { id: 'ranchi', name: 'Ranchi', region: 'east', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, icon: '⛰️' },

  // Global Hubs
  { id: 'tokyo', name: 'Tokyo', region: 'global', state: 'Japan', lat: 35.6762, lon: 139.6503, icon: '🗼' },
  { id: 'london', name: 'London', region: 'global', state: 'United Kingdom', lat: 51.5074, lon: -0.1278, icon: '🎡' },
  { id: 'newyork', name: 'New York', region: 'global', state: 'USA', lat: 40.7128, lon: -74.0060, icon: '🗽' },
  { id: 'dubai', name: 'Dubai', region: 'global', state: 'UAE', lat: 25.2048, lon: 55.2708, icon: '🏙️' },
  { id: 'singapore', name: 'Singapore', region: 'global', state: 'Singapore', lat: 1.3521, lon: 103.8198, icon: '🦁' }
];

const WMO_CODES = {
  0: { text: 'Clear Sky', icon: '☀️' },
  1: { text: 'Mainly Clear', icon: '🌤️' },
  2: { text: 'Partly Cloudy', icon: '⛅' },
  3: { text: 'Overcast', icon: '☁️' },
  45: { text: 'Foggy', icon: '🌫️' },
  48: { text: 'Rime Fog', icon: '🌫️' },
  51: { text: 'Light Drizzle', icon: '🌦️' },
  53: { text: 'Drizzle', icon: '🌦️' },
  55: { text: 'Dense Drizzle', icon: '🌧️' },
  61: { text: 'Slight Rain', icon: '🌧️' },
  63: { text: 'Moderate Rain', icon: '🌧️' },
  65: { text: 'Heavy Rain', icon: '🌊' },
  71: { text: 'Light Snow', icon: '🌨️' },
  73: { text: 'Moderate Snow', icon: '❄️' },
  75: { text: 'Heavy Snow', icon: '❄️' },
  80: { text: 'Rain Showers', icon: '🌦️' },
  81: { text: 'Heavy Showers', icon: '🌧️' },
  82: { text: 'Violent Showers', icon: '⛈️' },
  95: { text: 'Thunderstorm', icon: '🌩️' },
  96: { text: 'Thunderstorm w/ Hail', icon: '⛈️' },
  99: { text: 'Severe Thunderstorm', icon: '⚡' }
};

export default function MultiCityWeather({
  currentLocation,
  onSelectCity,
  unit = 'C'
}) {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const categories = [
    { id: 'all', label: '🌟 All Places' },
    { id: 'metro', label: '🏙️ Metro Cities' },
    { id: 'north', label: '🏔️ Hills & North' },
    { id: 'south', label: '🌴 Coastal & South' },
    { id: 'east', label: '🌲 East & North-East' },
    { id: 'global', label: '🌐 Global Capitals' }
  ];

  // Fetch weather data for all places in parallel batches
  const fetchAllCitiesWeather = async () => {
    setLoading(true);
    try {
      const lats = POPULAR_LOCATIONS.map(l => l.lat).join(',');
      const lons = POPULAR_LOCATIONS.map(l => l.lon).join(',');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        const resultsArray = Array.isArray(raw) ? raw : [raw];
        const dataMap = {};

        resultsArray.forEach((item, index) => {
          if (index < POPULAR_LOCATIONS.length && item && item.current) {
            const loc = POPULAR_LOCATIONS[index];
            const code = item.current.weather_code || 0;
            const weatherInfo = WMO_CODES[code] || { text: 'Clear', icon: '☀️' };
            
            dataMap[loc.name.toLowerCase()] = {
              tempC: item.current.temperature_2m,
              feelsLikeC: item.current.apparent_temperature,
              humidity: item.current.relative_humidity_2m,
              wind: item.current.wind_speed_10m,
              precipitation: item.current.precipitation,
              condition: weatherInfo.text,
              icon: weatherInfo.icon,
              code: code
            };
          }
        });

        setWeatherData(dataMap);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Failed to batch fetch multi-city weather:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCitiesWeather();
    // Auto-refresh every 3 minutes
    const timer = setInterval(fetchAllCitiesWeather, 180000);
    return () => clearInterval(timer);
  }, []);

  const convertTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';
    if (unit === 'F') return Math.round((tempC * 9 / 5) + 32);
    return Math.round(tempC);
  };

  // Filter based on category and search query
  const filteredLocations = POPULAR_LOCATIONS.filter(loc => {
    const matchesCategory = selectedCategory === 'all' || loc.region === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (loc.state && loc.state.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header Controls */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '16px 20px', borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌍</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Live Temperatures Across Different Places
            </h2>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
              {POPULAR_LOCATIONS.length} Places Live
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Compare real-time temperatures &amp; weather conditions. Tap any place to switch full AI &amp; disaster radar.
            {lastRefreshed && ` • Updated at ${lastRefreshed}`}
          </p>
        </div>

        {/* Refresh & Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter places by name..."
              style={{
                background: 'rgba(7, 10, 17, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px', padding: '8px 14px 8px 32px', color: '#f8fafc', fontSize: '13px',
                outline: 'none', width: '200px'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={fetchAllCitiesWeather}
            disabled={loading}
            style={{
              background: 'rgba(30, 41, 59, 0.8)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="Refresh all place temperatures"
          >
            <span style={{ display: 'inline-block', transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh All'}
          </button>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '7px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: selectedCategory === cat.id ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'rgba(30, 41, 59, 0.6)',
              color: selectedCategory === cat.id ? '#ffffff' : '#cbd5e1',
              border: selectedCategory === cat.id ? '1px solid #7dd3fc' : '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: selectedCategory === cat.id ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Place Weather Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '14px'
      }}>
        {filteredLocations.map(place => {
          const info = weatherData[place.name.toLowerCase()];
          const isCurrent = currentLocation && currentLocation.toLowerCase().includes(place.name.toLowerCase());
          
          return (
            <div
              key={place.id || place.name}
              onClick={() => onSelectCity(place)}
              className="glass-card"
              style={{
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                border: isCurrent ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isCurrent ? 'rgba(14, 116, 144, 0.25)' : 'rgba(30, 41, 59, 0.55)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Active Location Indicator */}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#ffffff', fontSize: '9px', fontWeight: 800, padding: '3px 10px',
                  borderRadius: '0 0 0 10px', letterSpacing: '0.5px'
                }}>
                  ACTIVE
                </div>
              )}

              {/* City Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{place.icon || '📍'}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      {place.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {place.state || 'India'}
                    </span>
                  </div>
                </div>

                {/* Weather condition Icon */}
                <div style={{ fontSize: '28px', marginTop: '2px' }}>
                  {info ? info.icon : '⏳'}
                </div>
              </div>

              {/* Temperature & Condition */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                      {info ? convertTemp(info.tempC) : '--'}°
                    </span>
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 700 }}>
                      {unit}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {info ? info.condition : 'Loading weather...'}
                  </span>
                </div>

                {info && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Feels like</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                      {convertTemp(info.feelsLikeC)}°{unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Metrics Pills */}
              {info && (
                <div style={{
                  marginTop: '12px', paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '11px', color: '#94a3b8'
                }}>
                  <span>💧 {info.humidity}% Humidity</span>
                  <span>💨 {info.wind} km/h</span>
                </div>
              )}

              {/* Tap to View Full Radar hint */}
              <div style={{
                marginTop: '8px', textAlign: 'center', fontSize: '10px', color: '#64748b',
                background: 'rgba(15, 23, 42, 0.4)', padding: '4px', borderRadius: '6px'
              }}>
                👉 Tap to open full weather &amp; AI command
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
