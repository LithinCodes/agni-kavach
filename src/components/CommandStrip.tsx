import React from 'react';
import { Flame, ShieldAlert, Satellite, Activity, Download, FileSpreadsheet, ShieldX } from 'lucide-react';
import { HotspotRecord, PriorityCategory } from '../types';
import { exportHotspotsCatalogPDF, exportHotspotsCatalogXLSX } from '../services/exportService';

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
  const totalSources = hotspots.length;
  const highCount = hotspots.filter((h) => h.priority_category === 'HIGH').length;
  const mediumCount = hotspots.filter((h) => h.priority_category === 'MEDIUM').length;
  const lowCount = hotspots.filter((h) => h.priority_category === 'LOW').length;
  const criticalCount = hotspots.filter((h) => (h as any).priority_category === 'CRITICAL').length;
  const persistentCount = hotspots.filter(
    (h) => (h.persistence ?? 0) >= 50 || (h.active_days ?? 1) >= 2
  ).length;
  const satelliteCount = hotspots.filter((h) => h.satellite_available).length;

  return (
    <div
      id="compact-status-bar"
      className="h-8 bg-[#0A1118] border-b border-[#243441] px-3.5 flex items-center justify-between text-slate-300 select-none font-mono text-[11px] shrink-0 z-20"
    >
      {/* Left: Compact Command Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
        {/* Total Sources */}
        <button
          id="status-total-sources"
          onClick={() => {
            onSelectPriorityFilter('ALL');
            onSelectSatelliteFilter('ALL');
          }}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            activePriorityFilter === 'ALL' && activeSatelliteFilter === 'ALL'
              ? 'bg-[#131F29] text-white border border-[#304351]'
              : 'text-slate-400 hover:text-white hover:bg-[#101A23]'
          }`}
          title="All monitored thermal sources"
        >
          <Flame className="w-3 h-3 text-[#35C6E8]" />
          <span>
            <strong className="text-[#35C6E8] font-bold">{totalSources}</strong>{' '}
            <span className="text-slate-400">SOURCES</span>
          </span>
        </button>

        <span className="text-[#243441]">|</span>

        {/* Persistent Sources */}
        <button
          id="status-persistent-sources"
          onClick={() => {
            onSelectPriorityFilter('ALL');
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-[#101A23] transition-all cursor-pointer"
          title="Persistent thermal signatures across multi-day passes"
        >
          <Activity className="w-3 h-3 text-[#35C6E8]" />
          <span>
            <strong className="text-slate-200 font-bold">{persistentCount}</strong>{' '}
            <span className="text-slate-400">PERSISTENT</span>
          </span>
        </button>

        <span className="text-[#243441]">|</span>

        {/* High Priority (RED #EF4444) */}
        <button
          id="status-high-priority"
          onClick={() =>
            onSelectPriorityFilter(activePriorityFilter === 'HIGH' ? 'ALL' : 'HIGH')
          }
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            activePriorityFilter === 'HIGH'
              ? 'bg-red-950/70 text-red-400 border border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
              : 'text-slate-400 hover:text-red-400 hover:bg-[#101A23]'
          }`}
          title="High-priority persistent anomaly candidates"
        >
          <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block shadow-[0_0_4px_#EF4444]" />
          <span>
            <strong className="text-[#EF4444] font-bold">{highCount}</strong>{' '}
            <span className="text-slate-400">HIGH</span>
          </span>
        </button>

        <span className="text-[#243441]">|</span>

        {/* Medium Priority (AMBER #F59E0B) */}
        <button
          id="status-medium-priority"
          onClick={() =>
            onSelectPriorityFilter(activePriorityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')
          }
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            activePriorityFilter === 'MEDIUM'
              ? 'bg-amber-950/70 text-amber-400 border border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-amber-400 hover:bg-[#101A23]'
          }`}
          title="Medium-priority persistent anomaly candidates"
        >
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block shadow-[0_0_4px_#F59E0B]" />
          <span>
            <strong className="text-[#F59E0B] font-bold">{mediumCount}</strong>{' '}
            <span className="text-slate-400">MEDIUM</span>
          </span>
        </button>

        <span className="text-[#243441]">|</span>

        {/* Low Priority (GREEN #10B981) */}
        <button
          id="status-low-priority"
          onClick={() =>
            onSelectPriorityFilter(activePriorityFilter === 'LOW' ? 'ALL' : 'LOW')
          }
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            activePriorityFilter === 'LOW'
              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-[#101A23]'
          }`}
          title="Low-priority persistent anomaly candidates"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_4px_#10B981]" />
          <span>
            <strong className="text-[#10B981] font-bold">{lowCount}</strong>{' '}
            <span className="text-slate-400">LOW</span>
          </span>
        </button>

        <span className="text-[#243441]">|</span>

        {/* Critical Priority (Semantic Crimson only) */}
        <div
          className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500"
          title="0 Critical alerts in verified October window"
        >
          <span className="w-2 h-2 rounded-full bg-[#B91C1C]/40 inline-block" />
          <span>
            <strong className="text-slate-400 font-bold">{criticalCount}</strong>{' '}
            <span className="text-slate-500">CRITICAL</span>
          </span>
        </div>

        <span className="text-[#243441]">|</span>

        {/* Satellite Context (Neutral 0/57) */}
        <button
          id="status-satellite-context"
          onClick={() =>
            onSelectSatelliteFilter(activeSatelliteFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')
          }
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            activeSatelliteFilter === 'AVAILABLE'
              ? 'bg-[#131F29] text-[#35C6E8] border border-[#304351]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#101A23]'
          }`}
          title="Sentinel-2 multispectral context (0 verified / 57 pending)"
        >
          <Satellite className="w-3 h-3 text-[#94A3B8]" />
          <span>
            <strong className="text-slate-300 font-bold">{satelliteCount}/{totalSources}</strong>{' '}
            <span className="text-slate-400">SATELLITE CONTEXT</span>
          </span>
        </button>
      </div>

      {/* Right: Operational Status + Export Catalog */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>GEOSPATIAL INGESTION ACTIVE</span>
        </div>

        <div className="h-3 w-px bg-[#243441] hidden lg:block" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => exportHotspotsCatalogPDF(hotspots)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#131F29] border border-transparent hover:border-[#243441] text-slate-400 hover:text-[#35C6E8] transition-colors text-[10px] cursor-pointer"
            title="Download Incident Catalog PDF"
          >
            <Download className="w-2.5 h-2.5 text-[#35C6E8]" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => exportHotspotsCatalogXLSX(hotspots)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#131F29] border border-transparent hover:border-[#243441] text-slate-400 hover:text-emerald-300 transition-colors text-[10px] cursor-pointer"
            title="Export Excel XLSX Spreadsheet"
          >
            <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-400" />
            <span className="hidden sm:inline">XLSX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
