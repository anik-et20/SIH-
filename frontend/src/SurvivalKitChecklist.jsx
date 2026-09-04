import React, { useState } from 'react';

const INITIAL_ITEMS = [
  { id: 1, text: 'Drinking Water (Minimum 3 liters per person per day)', category: 'Hydration', essential: true },
  { id: 2, text: 'Non-Perishable Food (Energy bars, canned food, dry fruits)', category: 'Nutrition', essential: true },
  { id: 3, text: 'First Aid Kit & Prescription Medicines (Bandages, antiseptic, painkillers)', category: 'Medical', essential: true },
  { id: 4, text: 'Waterproof Torch / Flashlight & Extra Batteries', category: 'Lighting', essential: true },
  { id: 5, text: 'Battery or Solar Powered Emergency Radio (NDRF news alerts)', category: 'Communication', essential: true },
  { id: 6, text: 'Full-Charged Power Bank & Mobile Charging Cables', category: 'Power', essential: true },
  { id: 7, text: 'Waterproof Pouch with Aadhaar, Passport, Insurance & Cash', category: 'Documents', essential: true },
  { id: 8, text: 'Emergency Loud Whistle & Signal Mirror (Rescue squad call)', category: 'Safety', essential: true },
  { id: 9, text: 'N95 Respirator Masks & Hand Sanitizers', category: 'Hygiene', essential: false },
  { id: 10, text: 'Thermal Blanket, Raincoat & Extra Warm Clothing', category: 'Shelter', essential: false }
];

export default function SurvivalKitChecklist() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('disaster_kit_checklist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ITEMS.map(item => ({ ...item, checked: false }));
  });

  const toggleItem = (id) => {
    const updated = items.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setItems(updated);
    localStorage.setItem('disaster_kit_checklist', JSON.stringify(updated));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progressPercent = Math.round((checkedCount / items.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview Banner & Progress Bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              🎒 72-Hour Emergency Disaster Preparedness Kit
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Essential survival items recommended by National Disaster Management Authority (NDMA)
            </p>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, color: progressPercent === 100 ? '#34d399' : '#38bdf8' }}>
            {progressPercent}% Ready
          </span>
        </div>

        {/* Progress Bar Container */}
        <div style={{ background: 'rgba(30, 41, 59, 0.8)', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`, height: '100%',
            background: progressPercent === 100 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Checklist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              background: item.checked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              border: item.checked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px', padding: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => {}} // handled by parent div onClick
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981', cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
                {item.essential && (
                  <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    ESSENTIAL
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '13px', fontWeight: 600, marginTop: '4px',
                color: item.checked ? '#94a3b8' : '#f8fafc',
                textDecoration: item.checked ? 'line-through' : 'none'
              }}>
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Survival Action Protocol Accordion */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '10px' }}>
          🛡️ Critical Disaster Survival Protocols
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>🌊 In Case of Severe Flooding:</strong>
            Move immediately to higher ground/rooftops. Switch off main electric circuit breaker. Do not walk or drive through moving floodwaters.
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1' }}>
            <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px' }}>🌀 In Case of Cyclone / Storm Surge:</strong>
            Stay indoors away from glass windows. Keep emergency radio on. Unplug electrical appliances and secure loose roof items.
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1' }}>
            <strong style={{ color: '#facc15', display: 'block', marginBottom: '4px' }}>⚡ In Case of Lightning & Thunderstorms:</strong>
            Seek shelter in a sturdy building. Avoid open fields, tall trees, water bodies, and metal poles.
          </div>
        </div>
      </div>

    </div>
  );
}
