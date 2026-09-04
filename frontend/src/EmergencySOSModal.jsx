import React, { useState } from 'react';

export default function EmergencySOSModal({ isOpen, onClose, currentLocation, coords }) {
  const [statusType, setStatusType] = useState('TRAPPED_FLOOD');
  const [personCount, setPersonCount] = useState('1');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lat = coords?.lat ? coords.lat.toFixed(4) : 'Unknown';
  const lon = coords?.lon ? coords.lon.toFixed(4) : 'Unknown';
  const timestamp = new Date().toLocaleString();

  const getStatusLabel = () => {
    switch (statusType) {
      case 'TRAPPED_FLOOD': return '🌊 TRAPPED BY FLOODWATERS - IMMEDIATE RESCUE NEEDED';
      case 'MEDICAL_EMERGENCY': return '🚑 MEDICAL EMERGENCY - URGENT FIRST AID REQUIRED';
      case 'EVACUATION_NEEDED': return '🚨 CYCLONE / LANDSLIDE EVACUATION REQUIRED';
      case 'SAFE_SHELTER': return '✅ SAFE IN SHELTER - REPORTING STATUS';
      default: return '🆘 DISASTER EMERGENCY SOS';
    }
  };

  const sosMessage = `🚨 DISASTER EMERGENCY SOS BEACON 🚨
STATUS: ${getStatusLabel()}
LOCATION: ${currentLocation || 'Current Location'} (GPS: ${lat}, ${lon})
PEOPLE AT LOCATION: ${personCount}
TIME: ${timestamp}
NOTES: ${customNotes || 'None'}
Google Maps Link: https://maps.google.com/?q=${lat},${lon}

PLEASE FORWARD TO NDRF (1078) / POLICE (112)!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sosMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(sosMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: '#0f172a', border: '2px solid #ef4444', borderRadius: '20px',
        padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        
        {/* Modal Title Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px', animation: 'ping 1.5s infinite' }}>🆘</span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fef2f2' }}>
              Emergency SOS Signal Beacon
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Emergency Type Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Select Emergency Situation:
          </label>
          <select
            value={statusType}
            onChange={(e) => setStatusType(e.target.value)}
            style={{
              width: '100%', background: 'rgba(30, 41, 59, 0.9)', color: '#f8fafc',
              border: '1px solid rgba(239, 68, 68, 0.5)', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, outline: 'none'
            }}
          >
            <option value="TRAPPED_FLOOD">🌊 Trapped by Floodwaters (Immediate Rescue)</option>
            <option value="MEDICAL_EMERGENCY">🚑 Medical Emergency (Trauma / Injury)</option>
            <option value="EVACUATION_NEEDED">🚨 Severe Storm / Cyclone Evacuation Needed</option>
            <option value="SAFE_SHELTER">✅ Safe in Shelter (Status Update)</option>
          </select>
        </div>

        {/* Person Count & Additional Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>People Count:</label>
            <input
              type="number"
              min="1"
              value={personCount}
              onChange={(e) => setPersonCount(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Details / Landmark:</label>
            <input
              type="text"
              placeholder="e.g. Near Big Banyan Tree / 2nd Floor"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>
        </div>

        {/* Formatted SOS Message Preview Box */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px border-dashed rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '12px' }}>
          <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700, display: 'block', marginBottom: '4px' }}>AUTOMATIC SOS BROADCAST PREVIEW:</span>
          <pre style={{ fontSize: '11px', color: '#fee2e2', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
            {sosMessage}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
          <button
            onClick={shareViaWhatsApp}
            style={{
              flex: 1, background: '#25D366', color: '#ffffff', border: 'none',
              borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            💬 Share via WhatsApp
          </button>
          
          <button
            onClick={copyToClipboard}
            style={{
              flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff',
              border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Broadcast SOS'}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
          National Emergency Helpline: <a href="tel:112" style={{ color: '#ef4444', fontWeight: 800 }}>Dial 112</a> | NDRF: <a href="tel:1078" style={{ color: '#ef4444', fontWeight: 800 }}>Dial 1078</a>
        </div>

      </div>
    </div>
  );
}
