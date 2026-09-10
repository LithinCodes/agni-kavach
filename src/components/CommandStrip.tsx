import React, { useEffect, useState } from 'react';
import { Flame, ShieldAlert, Satellite, Activity } from 'lucide-react';
import { HotspotRecord, PriorityCategory } from '../types';

interface CommandStripProps {
  hotspots: HotspotRecord[];
  activePriorityFilter: 'ALL' | PriorityCategory;
  onSelectPriorityFilter: (priority: 'ALL' | PriorityCategory) => void;
  activeSatelliteFilter: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
  onSelectSatelliteFilter: (satellite: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE') => void;
}

export const CommandStrip: React.FC<CommandStripProps> = ({
  hotspots,
  activePriorityFilter,
  onSelectPriorityFilter,
  activeSatelliteFilter,
  onSelectSatelliteFilter,
}) => {
  // Compute dynamically from dataset
  const totalSources = hotspots.length;
  const highCount = hotspots.filter((h) => h.priority_category === 'HIGH').length;
  const persistentCount = hotspots.filter((h) => (h.persistence ?? 0) >= 50 || (h.active_days ?? 1) >= 2).length;
  const satelliteCount = hotspots.filter((h) => h.satellite_available).length;

  // Animated counter effect on load
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedHigh, setAnimatedHigh] = useState(0);
  const [animatedPersist, setAnimatedPersist] = useState(0);
  const [animatedSat, setAnimatedSat] = useState(0);

  useEffect(() => {
    let step = 0;
    const steps = 12;
    const interval = setInterval(() => {
      step++;
      const factor = step / steps;
      setAnimatedTotal(Math.round(totalSources * factor));
      setAnimatedHigh(Math.round(highCount * factor));
      setAnimatedPersist(Math.round(persistentCount * factor));
      setAnimatedSat(Math.round(satelliteCount * factor));
      if (step >= steps) {
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [totalSources, highCount, persistentCount, satelliteCount]);

  return (
    <div
      id="kpi-command-strip"
      className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 py-2 bg-[#080C14] border-b border-slate-800/80 text-slate-200"
    >
      {/* 1. THERMAL SOURCES */}
      <button
        id="kpi-total-sources"
        onClick={() => {
          onSelectPriorityFilter('ALL');
          onSelectSatelliteFilter('ALL');
        }}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left cursor-pointer ${
          activePriorityFilter === 'ALL' && activeSatelliteFilter === 'ALL'
            ? 'bg-cyan-950/30 border-cyan-500/50'
            : 'bg-[#0D1424]/60 border-slate-800 hover:border-slate-700'
        }`}
        title="View All Monitored Thermal Sources"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider uppercase truncate">
            THERMAL SOURCES
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-['Chakra_Petch'] text-cyan-300">
              {animatedTotal}
            </span>
            <span className="text-[9px] font-mono text-slate-500">MONITORED</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shrink-0 ml-2">
          <Flame className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </button>

      {/* 2. HIGH PRIORITY */}
      <button
        id="kpi-high-priority"
        onClick={() => onSelectPriorityFilter(activePriorityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left cursor-pointer ${
          activePriorityFilter === 'HIGH'
            ? 'bg-rose-950/40 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
            : 'bg-[#0D1424]/60 border-slate-800 hover:border-rose-500/40'
        }`}
        title="Filter by High Priority Anomaly Candidates"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono font-medium text-rose-400 tracking-wider uppercase truncate">
            HIGH PRIORITY
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-['Chakra_Petch'] text-rose-400">
              {animatedHigh}
            </span>
            <span className="text-[9px] font-mono text-rose-400/70">ACTIONABLE</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded bg-rose-950/40 border border-rose-500/40 flex items-center justify-center shrink-0 ml-2 relative">
          <span className="absolute w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-60" />
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 relative z-10" />
        </div>
      </button>

      {/* 3. PERSISTENT */}
      <button
        id="kpi-persistent-sources"
        onClick={() => {
          onSelectPriorityFilter('ALL');
        }}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left cursor-pointer ${
          activePriorityFilter === 'ALL' && activeSatelliteFilter === 'ALL'
            ? 'bg-[#0D1424]/80 border-slate-800'
            : 'bg-[#0D1424]/60 border-slate-800 hover:border-amber-500/40'
        }`}
        title="Persistent Thermal Activity Across Observations"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono font-medium text-amber-400 tracking-wider uppercase truncate">
            PERSISTENT
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-['Chakra_Petch'] text-amber-400">
              {animatedPersist}
            </span>
            <span className="text-[9px] font-mono text-amber-400/70">RECURRENT</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0 ml-2">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </button>

      {/* 4. SATELLITE CONTEXT */}
      <button
        id="kpi-satellite-coverage"
        onClick={() => onSelectSatelliteFilter(activeSatelliteFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left cursor-pointer ${
          activeSatelliteFilter === 'AVAILABLE'
            ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
            : 'bg-[#0D1424]/60 border-slate-800 hover:border-indigo-500/40'
        }`}
        title="Filter Hotspots with Available Sentinel-2 Multispectral Context"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono font-medium text-indigo-300 tracking-wider uppercase truncate">
            SATELLITE CONTEXT
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-['Chakra_Petch'] text-indigo-300">
              {animatedSat}
            </span>
            <span className="text-xs font-mono text-slate-400">/ {totalSources}</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center shrink-0 ml-2">
          <Satellite className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      </button>
    </div>
  );
};
