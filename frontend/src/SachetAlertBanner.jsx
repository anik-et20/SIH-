import React, { useState, useEffect } from 'react';

const SachetAlertBanner = ({ location }) => {
  const [alertsData, setAlertsData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const targetLoc = location || 'Mumbai';
        const res = await fetch(`http://localhost:8000/api/alerts/sachet?location=${encodeURIComponent(targetLoc)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setAlertsData(data);
        }
      } catch (err) {
        console.warn('Failed to fetch SACHET CAP alerts:', err);
      }
    };
    fetchAlerts();
    return () => { isMounted = false; };
  }, [location]);

  if (!alertsData || !alertsData.alerts || alertsData.alerts.length === 0) {
    return null;
  }

  const topAlert = alertsData.alerts[0];
  const severityClass = alertsData.highest_severity === 'Extreme' ? 'bg-red-950/90 border-red-500 text-red-100' :
                        alertsData.highest_severity === 'Severe' ? 'bg-amber-950/90 border-amber-500 text-amber-100' :
                        'bg-blue-950/90 border-blue-500 text-blue-100';

  return (
    <div className={`w-full max-w-4xl mx-auto mb-4 border rounded-xl shadow-lg p-4 transition-all backdrop-blur-md ${severityClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded uppercase tracking-wider">
              {alertsData.trust_badge}
            </span>
            <h3 className="font-bold text-base mt-1 flex items-center gap-2">
              <span>⚠️</span> {topAlert.headline}
            </h3>
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg border border-white/20 font-medium transition"
        >
          {isCollapsed ? 'View Alert Details' : 'Minimize'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 text-sm space-y-2 border-t border-white/10 pt-3">
          <p className="opacity-90">{topAlert.description}</p>
          <div className="bg-black/30 p-2.5 rounded-lg border border-white/10 text-xs font-mono">
            <strong className="text-amber-300 block mb-1">📢 OFFICIAL INSTRUCTION:</strong>
            {topAlert.instruction}
          </div>
          <div className="flex items-center justify-between text-xs opacity-75 pt-1">
            <span>Issuer: {topAlert.sender}</span>
            <span>Area: {topAlert.area_desc}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SachetAlertBanner;
