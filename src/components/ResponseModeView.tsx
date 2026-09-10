import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Radio,
  Sparkles,
  MapPin,
  CheckSquare,
  Navigation,
  Printer,
  Compass,
  Satellite,
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Wind,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { HotspotRecord } from '../types';
import { ImpactRadar } from './ImpactRadar';
import { DhumraDharmaPanel } from './DhumraDharmaPanel';
import { getSensitiveLocationsForHotspot } from '../services/impactService';
import { exportResponseRunCardPDF, exportResponseRunCardXLSX } from '../services/exportService';

interface ResponseModeViewProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onOpenDossier?: (hotspot: HotspotRecord) => void;
  onStartInvestigation?: (hotspot: HotspotRecord) => void;
  onRaiseAlert?: (hotspot: HotspotRecord) => void;
}

export const ResponseModeView: React.FC<ResponseModeViewProps> = ({
  hotspots,
  selectedHotspot: propSelectedHotspot,
  onSelectHotspot,
  onOpenDossier,
  onStartInvestigation,
  onRaiseAlert,
}) => {
  const currentHotspot = useMemo(() => {
    if (propSelectedHotspot) return propSelectedHotspot;
    const high = hotspots.find((h) => h.priority_category === 'HIGH');
    return high || hotspots[0] || null;
  }, [propSelectedHotspot, hotspots]);

  // Routing option: Fastest vs Alternate
  const [routeType, setRouteType] = useState<'FASTEST' | 'ALTERNATE'>('FASTEST');
  const [checklistState, setChecklistState] = useState<{ [key: number]: boolean }>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  const sensitiveLocations = useMemo(() => {
    return currentHotspot ? getSensitiveLocationsForHotspot(currentHotspot) : [];
  }, [currentHotspot]);

  if (!currentHotspot) {
    return <div className="p-8 text-center text-slate-400 font-mono">No incident selected.</div>;
  }

  const score = currentHotspot.priority_score.toFixed(2);
  const persistenceScore = (currentHotspot.persistence_contribution ?? 0).toFixed(2);
  const thermalScore = (currentHotspot.thermal_contribution ?? 0).toFixed(2);
  const detectionScore = (currentHotspot.detection_contribution ?? 0).toFixed(2);
  const nightScore = (currentHotspot.night_contribution ?? 0).toFixed(2);
  const geoScore = (currentHotspot.geographic_contribution ?? 0).toFixed(2);

  const toggleChecklist = (id: number) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintBrief = () => {
    if (onOpenDossier) {
      onOpenDossier(currentHotspot);
    } else {
      window.print();
    }
  };

  return (
    <div
      id="response-mode-view"
      className="flex-1 flex flex-col min-h-0 bg-[#080C14] text-slate-200 overflow-y-auto font-mono text-xs select-none"
    >
      {/* Top Tactical Command Strip */}
      <div className="h-14 shrink-0 bg-[#0D1424] border-b border-slate-800 px-4 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">INCIDENT:</span>
            <select
              value={currentHotspot.source_id}
              onChange={(e) => {
                const target = hotspots.find((h) => h.source_id === e.target.value);
                if (target) onSelectHotspot(target);
              }}
              className="bg-slate-900 text-cyan-300 font-bold px-3 py-1.5 rounded-lg border border-cyan-500/40 focus:outline-none cursor-pointer"
            >
              {hotspots.map((h) => (
                <option key={h.source_id} value={h.source_id} className="bg-slate-900 text-slate-200">
                  {h.source_id} • Score: {h.priority_score.toFixed(1)} ({h.priority_category})
                </option>
              ))}
            </select>
          </div>

          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold">
            {currentHotspot.priority_category} PRIORITY
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Score: <strong className="text-cyan-300">{score}</strong>
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onStartInvestigation && (
            <button
              onClick={() => onStartInvestigation(currentHotspot)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              INVESTIGATION
            </button>
          )}

          <button
            onClick={() => exportResponseRunCardPDF(currentHotspot, checklistState)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
            title="Download Tactical First-Responder Run-Card in PDF format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>RUN-CARD (PDF)</span>
          </button>

          <button
            onClick={() => exportResponseRunCardXLSX(currentHotspot, checklistState)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
            title="Download Run-Card and Protocol Vitals in Excel (XLSX) format"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>RUN-CARD (XLSX)</span>
          </button>

          <button
            onClick={handlePrintBrief}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
            title="Preview or print dossier"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PREVIEW</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="p-4 max-w-7xl mx-auto w-full space-y-4">
        {/* 60-SECOND RESPONSE RUN-CARD HEADER */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-[#0D1424] to-slate-950 border border-cyan-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  STANDARD OPERATIONAL PROCEDURE
                </span>
                <span className="text-slate-500 text-[10px]">• SIH26162</span>
              </div>
              <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white tracking-wider mt-1">
                60-SECOND FIRST-RESPONDER RUN-CARD
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rapid tactical briefing for Incident Commander, Fire & Emergency Response Services, and District Disaster Management Authority (DDMA).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">PRIORITY SCORE</div>
              <div className="text-3xl font-bold font-['Chakra_Petch'] text-cyan-300">
                {score}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">LOCATION</div>
              <div className="text-sm font-bold text-white">
                {currentHotspot.nearest_city}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentHotspot.distance_to_city_km} km away
              </div>
            </div>
          </div>
        </div>

        {/* MANDATORY LIFE-SAFETY HAZARD NOTICE */}
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-xs uppercase tracking-wider text-rose-300">
              MANDATORY OPERATIONAL LIFE-SAFETY DIRECTIVE:
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              HAZARD MATERIAL UNKNOWN — VERIFY BEFORE INTERVENTION. Satellite thermal radiometry detects high heat signatures but cannot identify toxic gas or specific flammable compounds. Do NOT approach without positive substance identification and appropriate respiratory/protective equipment (SCBA/HAZMAT Level B).
            </p>
          </div>
        </div>

        {/* Three Column Tactical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* COLUMN 1: THERMAL TELEMETRY & SCORE CONTRIBUTIONS */}
          <div className="space-y-4">
            {/* Rapid Incident Statistics */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                THERMAL TELEMETRY
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">PERSISTENCE</div>
                  <div className="text-base font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                    {currentHotspot.persistence}%
                  </div>
                  <div className="text-[8px] text-slate-500">{currentHotspot.active_days}/5 days detected</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">DETECTION PIXELS</div>
                  <div className="text-base font-bold text-blue-300 font-['Chakra_Petch'] mt-0.5">
                    {currentHotspot.detections}
                  </div>
                  <div className="text-[8px] text-slate-500">DBSCAN cluster size</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">NIGHT OVERPASS</div>
                  <div className="text-base font-bold text-purple-300 font-['Chakra_Petch'] mt-0.5">
                    {((currentHotspot.night_ratio ?? 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-slate-500">VIIRS 01:30 pass</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">THERMAL RISK</div>
                  <div className="text-base font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                    {currentHotspot.thermal_risk?.toFixed(1) || 'Medium'}
                  </div>
                  <div className="text-[8px] text-slate-500">Peak Sensor FRP: {currentHotspot.max_frp}</div>
                </div>
              </div>
            </div>

            {/* Why Prioritized Score Bars */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                WHY PRIORITIZED (SCORE CONTRIBUTIONS)
              </span>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Persistence Contribution</span>
                    <span className="text-cyan-300 font-bold font-mono">+{persistenceScore} pts</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (Number(persistenceScore) / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Thermal Radiative Output</span>
                    <span className="text-amber-300 font-bold font-mono">+{thermalScore} pts</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (Number(thermalScore) / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Detection Volume Cluster</span>
                    <span className="text-blue-300 font-bold font-mono">+{detectionScore} pts</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${Math.min(100, (Number(detectionScore) / 18) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Nocturnal Persistence</span>
                    <span className="text-purple-300 font-bold font-mono">+{nightScore} pts</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-purple-400"
                      style={{ width: `${Math.min(100, (Number(nightScore) / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Geographic Spatial Context</span>
                    <span className="text-emerald-300 font-bold font-mono">+{geoScore} pts</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${Math.min(100, (Number(geoScore) / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Axis Radar */}
            <ImpactRadar hotspot={currentHotspot} />
          </div>

          {/* COLUMN 2: FIELD CONTEXT & SATELLITE BASELINE */}
          <div className="space-y-4">
            {/* Field Context */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                FIELD CONTEXT & MULTISPECTRAL BASELINE
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Sentinel-2 Availability</span>
                  <span
                    className={`font-bold ${
                      currentHotspot.satellite_available ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {currentHotspot.satellite_available ? 'ARCHIVAL AVAILABLE' : 'UNAVAILABLE'}
                  </span>
                </div>

                {currentHotspot.satellite_available && (
                  <>
                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Scene Date</span>
                      <span className="text-white font-mono">
                        {currentHotspot.satellite_scene_date || 'Archival Pass'}
                      </span>
                    </div>

                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Cloud Cover</span>
                      <span className="text-white font-mono">
                        {currentHotspot.satellite_cloud_cover !== null && currentHotspot.satellite_cloud_cover !== undefined
                          ? `${currentHotspot.satellite_cloud_cover}%`
                          : '< 5%'}
                      </span>
                    </div>

                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Vegetation / Built Context</span>
                      <span className="text-cyan-300 font-bold">
                        {currentHotspot.built_surface_context === 'HIGH' ? 'BUILT ENVIRONMENT' : 'VEGETATION / MIXED'}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Nearest City</span>
                  <span className="text-white font-bold">{currentHotspot.nearest_city}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Distance to City</span>
                  <span className="text-cyan-300 font-bold">{currentHotspot.distance_to_city_km} km</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="text-slate-300 font-mono">
                    {currentHotspot.latitude.toFixed(4)}° N, {currentHotspot.longitude.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Dhumra-Dharma Nighttime Auditor */}
            <DhumraDharmaPanel hotspot={currentHotspot} />

            {/* Sensitive Locations Checklist */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                CRITICAL INFRASTRUCTURE AT RISK (WITHIN 5 KM)
              </span>

              <div className="space-y-1.5">
                {sensitiveLocations.slice(0, 4).map((loc) => (
                  <div
                    key={loc.id}
                    className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 truncate max-w-[200px]">{loc.name}</span>
                    <span className="text-cyan-300 font-bold shrink-0 ml-2">{loc.distanceKm} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: OPERATIONAL CHECKLIST & SAFE ROUTE */}
          <div className="space-y-4">
            {/* Operational Checklist */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300 uppercase text-xs">
                  TACTICAL OPERATIONAL CHECKLIST
                </span>
                <span className="text-cyan-400 text-[10px]">
                  {Object.values(checklistState).filter(Boolean).length}/6 DONE
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 1, text: '1. Verify incident visually from safe distance (min 1 km).' },
                  { id: 2, text: '2. Check local atmospheric wind & dispersion direction.' },
                  { id: 3, text: '3. Identify primary and secondary egress access routes.' },
                  { id: 4, text: '4. Issue caution alerts to hospitals, schools & sensitive facilities.' },
                  { id: 5, text: '5. Confirm material & hazard identity before physical intervention.' },
                  { id: 6, text: '6. Establish staging area and coordinate with District Magistrate / DDMA.' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                      checklistState[item.id]
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-xs shrink-0 ${
                        checklistState[item.id]
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'border border-slate-600'
                      }`}
                    >
                      {checklistState[item.id] && '✓'}
                    </div>
                    <span className="text-[11px] leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe Response Route Panel */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300 uppercase text-xs">
                  SAFE RESPONSE ROUTE PLANNING
                </span>
                <span className="text-[10px] text-slate-500">Staging Navigation</span>
              </div>

              {/* Route Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setRouteType('FASTEST')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                    routeType === 'FASTEST'
                      ? 'bg-cyan-600 text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FASTEST ROUTE (NH/SH)
                </button>
                <button
                  onClick={() => setRouteType('ALTERNATE')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                    routeType === 'ALTERNATE'
                      ? 'bg-amber-600 text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  UPWIND ALTERNATE ROUTE
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Staging Point:</span>
                  <span className="text-white font-bold">{currentHotspot.nearest_city} Outer Ring Feeder</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Transit Distance:</span>
                  <span className="text-cyan-300 font-bold font-mono">
                    {routeType === 'FASTEST'
                      ? `${(currentHotspot.distance_to_city_km * 1.15).toFixed(1)} km`
                      : `${(currentHotspot.distance_to_city_km * 1.45).toFixed(1)} km`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Transit Time:</span>
                  <span className="text-amber-300 font-bold font-mono">
                    {routeType === 'FASTEST' ? '~18 mins' : '~28 mins (Upwind Safe Approach)'}
                  </span>
                </div>
              </div>

              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40 text-[10px] text-amber-300/90 leading-relaxed">
                <strong className="text-amber-200">NAVIGATION ADVISORY: </strong>
                Route must be verified against live road closures and field conditions. Never approach combustion smoke plumes downwind without protective equipment and hazard verification.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
