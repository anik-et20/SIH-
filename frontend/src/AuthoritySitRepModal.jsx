import React, { useState, useEffect } from 'react';

const AuthoritySitRepModal = ({ isOpen, onClose, location = 'Mumbai' }) => {
  const [sitrep, setSitrep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    const fetchSitrep = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/authority/sitrep?location=${encodeURIComponent(location)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSitrep(data);
        }
      } catch (err) {
        console.error('Failed to fetch authority SitRep:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSitrep();
    return () => { isMounted = false; };
  }, [isOpen, location]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-800 p-5 flex items-center justify-between z-10 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Disaster Management Authority SitRep</h2>
              <p className="text-xs text-slate-400">NDMA / SDMA / DDMA Command & Control Dashboard</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">Generating Official Disaster Situation Report...</p>
            </div>
          ) : sitrep ? (
            <>
              {/* SitRep Banner */}
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">{sitrep.sitrep_id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{sitrep.issuing_authority}</h3>
                  <p className="text-xs text-slate-400">Timestamp: {new Date(sitrep.timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  sitrep.overall_threat_level === 'EXTREME' ? 'bg-red-600 text-white' :
                  sitrep.overall_threat_level === 'SEVERE' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {sitrep.threat_badge}
                </span>
              </div>

              {/* Grid 1: Multi-Hazard Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase">Rainfall Analysis</span>
                  <div className="text-2xl font-black text-white mt-1">{sitrep.meteorological_metrics.rainfall_24h_mm} <span className="text-sm font-normal text-slate-400">mm/24h</span></div>
                  <p className="text-xs text-amber-400 font-semibold mt-1">{sitrep.multi_hazard_risk.rainfall_analysis.imd_category}</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase">Flood & Tidal Surge</span>
                  <div className="text-2xl font-black text-white mt-1">{sitrep.multi_hazard_risk.flood_analysis.flood_risk_score * 100}% <span className="text-sm font-normal text-slate-400">Risk Score</span></div>
                  <p className="text-xs text-red-400 font-semibold mt-1">{sitrep.multi_hazard_risk.flood_analysis.headline}</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase">Landslide Stability</span>
                  <div className="text-2xl font-black text-white mt-1">{sitrep.multi_hazard_risk.landslide_analysis.landslide_risk_score * 100}% <span className="text-sm font-normal text-slate-400">Risk Score</span></div>
                  <p className="text-xs text-blue-400 font-semibold mt-1">{sitrep.multi_hazard_risk.landslide_analysis.headline}</p>
                </div>
              </div>

              {/* GIS Spatial Impact */}
              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>🗺️</span> GIS Spatial Radius Impact ({sitrep.spatial_impact_analysis.impact_radius_km} km Geodesic Sector)
                </h4>
                <div className="text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Estimated Exposed Population:</span>
                    <p className="text-lg font-bold text-white mt-0.5">{sitrep.spatial_impact_analysis.estimated_exposed_population.toLocaleString()} citizens</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Critical Highways & Arteries:</span>
                    <p className="text-sm font-medium text-amber-300 mt-0.5">{sitrep.spatial_impact_analysis.at_risk_infrastructure.critical_highways.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Tactical Actions */}
              <div className="bg-blue-950/40 border border-blue-800/60 p-5 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <span>🚨</span> DDMA Recommended Tactical Evacuation & Response Actions
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {sitrep.recommended_tactical_actions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">{idx + 1}.</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400">Unable to load authority Situation Report.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthoritySitRepModal;
