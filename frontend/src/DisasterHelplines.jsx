import React, { useState } from 'react';

const NATIONAL_HELPLINES = [
  { name: 'NDRF Disaster Helpline', number: '1078', desc: 'National Disaster Response Force (24x7 Control Room)', icon: '🚨', priority: 'Critical' },
  { name: 'National Emergency Number', number: '112', desc: 'All-in-one Emergency Helpline (Police, Fire, Ambulance)', icon: '🆘', priority: 'Critical' },
  { name: 'State Disaster Control Room', number: '1070', desc: 'State Level Relief & Rescue Command', icon: '🏛️', priority: 'High' },
  { name: 'Ambulance Emergency', number: '108', desc: 'Medical Emergency & Trauma Response Services', icon: '🚑', priority: 'High' },
  { name: 'Police Control Room', number: '100', desc: 'Police Emergency Response', icon: '👮', priority: 'Standard' },
  { name: 'Fire Services', number: '101', desc: 'Fire & Explosive Rescue Operations', icon: '🚒', priority: 'Standard' },
  { name: 'Indian Coast Guard', number: '1554', desc: 'Maritime Search & Cyclone Rescue Operations', icon: '⚓', priority: 'High' }
];

const STATE_CONTROL_ROOMS = [
  { state: 'Odisha', number: '0674-2534177', desc: 'OSDMA Control Room (Bhubaneswar)' },
  { state: 'Maharashtra', number: '022-22027990', desc: 'State Disaster Management Authority (Mumbai)' },
  { state: 'Tamil Nadu', number: '044-28888000', desc: 'TNSDMA Emergency Operations Center (Chennai)' },
  { state: 'West Bengal', number: '033-22143526', desc: 'WB State Disaster Management Command (Kolkata)' },
  { state: 'Kerala', number: '0471-2331639', desc: 'KSDMA Emergency Control Room (Thiruvananthapuram)' },
  { state: 'Gujarat', number: '079-23251900', desc: 'GSDMA Disaster Control Command (Gandhinagar)' },
  { state: 'Uttar Pradesh', number: '0522-2238083', desc: 'UPSDMA Disaster Control Room (Lucknow)' },
  { state: 'Bihar', number: '0612-2547232', desc: 'BSDMA Relief Operations Command (Patna)' },
  { state: 'Delhi', number: '011-23860000', desc: 'DDMA Emergency Helpline (Delhi NCR)' },
  { state: 'Assam', number: '0361-2237042', desc: 'ASDMA Brahmaputra Flood Control (Guwahati)' },
  { state: 'Uttarakhand', number: '0135-2710334', desc: 'USDMA Alpine Emergency Operations (Dehradun)' },
  { state: 'Himachal Pradesh', number: '0177-2812344', desc: 'HPSDMA Hill Disaster Control (Shimla)' }
];

export default function DisasterHelplines() {
  const [filterState, setFilterState] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(null);

  const copyToClipboard = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const filteredStates = STATE_CONTROL_ROOMS.filter(s =>
    s.state.toLowerCase().includes(filterState.toLowerCase()) ||
    s.desc.toLowerCase().includes(filterState.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '16px', padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🚨</span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fef2f2' }}>
              National & State Disaster Helplines Hub
            </h2>
            <p style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>
              24x7 Emergency Response Services, Rescue Squads & Control Rooms across India
            </p>
          </div>
        </div>
        <span style={{ fontSize: '11px', background: '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '9999px', fontWeight: 700 }}>
          ⚡ 24x7 ACTIVE
        </span>
      </div>

      {/* National Helplines Grid */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          NATIONAL EMERGENCY HOTLINES
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {NATIONAL_HELPLINES.map((h, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px', padding: '14px',
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{h.icon}</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{h.name}</h4>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{h.desc}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={`tel:${h.number}`}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff', textDecoration: 'none',
                    padding: '6px 14px', borderRadius: '10px',
                    fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  📞 {h.number}
                </a>

                <button
                  onClick={() => copyToClipboard(h.number)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}
                  title="Copy helpline number"
                >
                  {copiedNumber === h.number ? '✓ Copied' : '📋'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* State Operations Control Rooms Directory */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            STATE DISASTER EMERGENCY OPERATIONS CENTERS (EOC)
          </h3>

          <input
            type="text"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            placeholder="Search state..."
            style={{
              background: 'rgba(7, 10, 17, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px', padding: '6px 12px', color: '#f8fafc', fontSize: '12px', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {filteredStates.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', color: '#38bdf8' }}>{s.state} EOC</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{s.desc}</span>
              </div>
              <a
                href={`tel:${s.number.replace(/-/g, '')}`}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)', textDecoration: 'none',
                  padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700
                }}
              >
                📞 {s.number}
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
