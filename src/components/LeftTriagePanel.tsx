import React, { useState } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Satellite,
  Moon,
  Building2,
  Trees,
  Sliders,
  MapPin,
  Calendar,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { FilterState, HotspotRecord, PriorityCategory } from '../types';
import { exportHotspotsCatalogPDF, exportHotspotsCatalogXLSX } from '../services/exportService';

interface LeftTriagePanelProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LeftTriagePanel: React.FC<LeftTriagePanelProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  filters,
  onFilterChange,
  onResetFilters,
  isOpen,
  onToggleOpen,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Filter the hotspots
  const filteredHotspots = (hotspots || []).filter((item) => {
    if (!item) return false;
    // Priority filter
    if (filters.priority !== 'ALL' && item.priority_category !== filters.priority) {
      return false;
    }
    // Satellite filter
    if (filters.satellite === 'AVAILABLE' && !item.satellite_available) {
      return false;
    }
    if (filters.satellite === 'UNAVAILABLE' && item.satellite_available) {
      return false;
    }
    // Min Score
    if ((item.priority_score ?? 0) < filters.minPriorityScore) {
      return false;
    }
    // Min Thermal Risk
    if ((item.thermal_risk ?? 0) < filters.minThermalRisk) {
      return false;
    }
    // Min Detections
    if ((item.detections ?? 0) < filters.minDetections) {
      return false;
    }
    // Min Night Activity (night_ratio is 0 to 1)
    if (((item.night_ratio ?? 0) * 100) < filters.minNightActivity) {
      return false;
    }
    // Environment
    if (filters.environment !== 'ALL') {
      const envStr = `${item.environment_context || ''} ${item.built_surface_context || ''} ${item.vegetation_context || ''}`.toUpperCase();
      if (filters.environment === 'BUILT' && !envStr.includes('BUILT')) {
        return false;
      }
      if (filters.environment === 'VEGETATION' && !envStr.includes('VEGETAT') && !envStr.includes('CANOPY')) {
        return false;
      }
      if (filters.environment === 'WATER' && !envStr.includes('WATER') && !envStr.includes('AQUATIC')) {
        return false;
      }
      if (filters.environment === 'MIXED' && !envStr.includes('MIXED')) {
        return false;
      }
    }
    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const matchId = item.source_id.toLowerCase().includes(query);
      const matchCity = item.nearest_city?.toLowerCase().includes(query);
      const matchLoc = item.location?.toLowerCase().includes(query);
      if (!matchId && !matchCity && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  return (
    <aside
      id="left-triage-panel"
      className={`fixed lg:static top-16 bottom-0 left-0 z-20 flex flex-col bg-[#080C14]/95 backdrop-blur-md border-r border-slate-800 transition-all duration-300 select-none ${
        isOpen ? 'w-84 sm:w-96' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-12'
      }`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <button
        onClick={onToggleOpen}
        className="absolute -right-3 top-4 z-30 w-6 h-10 rounded-r-md bg-[#0D1424] border border-l-0 border-cyan-500/40 text-cyan-300 flex items-center justify-center hover:bg-cyan-950/60 transition-colors shadow-lg"
        title={isOpen ? 'Collapse Triage Feed' : 'Expand Triage Feed'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Panel Header */}
          <div className="p-3 border-b border-slate-800/80 bg-[#0D1424]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 tracking-wider">
                  LIVE TRIAGE FEED
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {filteredHotspots.length} / {hotspots.length} SOURCES
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative mt-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) =>
                  onFilterChange({ ...filters, searchQuery: e.target.value })
                }
                placeholder="Search ID (AGNI-001) or City..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#080C14] border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                  className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Priority Filters */}
            <div className="grid grid-cols-4 gap-1 mt-2 font-mono text-[10px]">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onFilterChange({ ...filters, priority: p })}
                  className={`py-1 rounded border transition-all text-center ${
                    filters.priority === p
                      ? p === 'HIGH'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold'
                        : p === 'MEDIUM'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                        : p === 'LOW'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
              >
                <Filter className="w-3 h-3" />
                <span>{showAdvancedFilters ? 'Hide Sliders' : 'Filter Sliders'}</span>
              </button>
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Reset All Filters"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>RESET</span>
              </button>
            </div>

            {/* Expanded Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="mt-2.5 p-2 rounded bg-slate-950/70 border border-slate-800 space-y-2 text-[11px] font-mono text-slate-300 animate-in fade-in">
                {/* Sentinel-2 Context */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Satellite className="w-3 h-3 text-indigo-400" />
                    <span>Sentinel-2 Context:</span>
                  </span>
                  <select
                    value={filters.satellite}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        satellite: e.target.value as any,
                      })
                    }
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[10px]"
                  >
                    <option value="ALL">All (21)</option>
                    <option value="AVAILABLE">Available Only (4)</option>
                    <option value="UNAVAILABLE">Pending (17)</option>
                  </select>
                </div>

                {/* Min Priority Score Slider */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Min Priority Score:</span>
                    <span className="text-cyan-300 font-bold">
                      {filters.minPriorityScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={filters.minPriorityScore}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        minPriorityScore: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Min Thermal Risk Slider */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Min Thermal Risk:</span>
                    <span className="text-amber-300 font-bold">
                      {filters.minThermalRisk}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={70}
                    value={filters.minThermalRisk}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        minThermalRisk: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Min Detections Slider */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Min Detections:</span>
                    <span className="text-slate-200 font-bold">
                      {filters.minDetections}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={filters.minDetections}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        minDetections: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Min Night Activity */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Min Night Ratio:</span>
                    <span className="text-indigo-300 font-bold">
                      {filters.minNightActivity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={filters.minNightActivity}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        minNightActivity: Number(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Triage Feed List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredHotspots.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-slate-500">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
                  <Filter className="w-5 h-5" />
                </div>
                No thermal sources match active filter criteria.
                <div className="mt-3">
                  <button
                    onClick={onResetFilters}
                    className="px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] hover:bg-cyan-900/60"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              filteredHotspots.map((item) => {
                const isSelected = selectedHotspot?.source_id === item.source_id;
                return (
                  <div
                    key={item.source_id}
                    onClick={() => onSelectHotspot(item)}
                    className={`p-3 cursor-pointer transition-all font-mono select-none relative group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {item.source_id}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            item.priority_category === 'HIGH'
                              ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                              : item.priority_category === 'MEDIUM'
                              ? 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                              : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                          }`}
                        >
                          {item.priority_category}
                        </span>
                        {item.satellite_available && (
                          <span
                            className="p-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/50"
                            title="Sentinel-2 Context Available"
                          >
                            <Satellite className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Priority Score Display */}
                      <div className="text-right">
                        <div className="text-base font-bold font-['Chakra_Petch'] text-cyan-300">
                          {item.priority_score.toFixed(3)}
                        </div>
                        <div className="text-[9px] text-slate-500">PRIORITY</div>
                      </div>
                    </div>

                    {/* Location / Nearest City */}
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {item.location || item.nearest_city || 'Regional Sector'}
                      </span>
                    </div>

                    {/* Telemetry Metrics Line */}
                    <div className="grid grid-cols-3 gap-1 mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Thermal: </span>
                        <span className="text-amber-400 font-medium">
                          {item.thermal_risk.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Detects: </span>
                        <span className="text-slate-200 font-medium">
                          {item.detections}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Days: </span>
                        <span className="text-cyan-300 font-medium">
                          {item.active_days}d
                        </span>
                      </div>
                    </div>

                    {/* Investigation & Alert Badges if active */}
                    {(item.alert_status === 'Alert Raised' ||
                      item.investigation_status === 'Under Investigation') && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {item.alert_status === 'Alert Raised' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600/70 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                            ALERT RAISED
                          </span>
                        )}
                        {item.investigation_status === 'Under Investigation' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/70 font-medium">
                            UNDER INVESTIGATION
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Export Footer */}
          <div className="p-2.5 bg-[#0D1424] border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">EXPORT FEED:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => exportHotspotsCatalogPDF(filteredHotspots, 'AGNI_KAVACH_TRIAGE_FEED')}
                className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Download filtered incident feed in PDF format"
              >
                <Download className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => exportHotspotsCatalogXLSX(filteredHotspots, 'AGNI_KAVACH_TRIAGE_FEED')}
                className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Download filtered incident feed in Excel (XLSX) format"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>XLSX</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Sidebar Icon Ribbon */
        <div className="flex flex-col items-center py-4 gap-4 text-slate-400">
          <button
            onClick={onToggleOpen}
            className="p-2 rounded hover:bg-slate-800 text-cyan-400"
            title="Open Live Triage Feed"
          >
            <Flame className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-mono [writing-mode:vertical-lr] tracking-widest text-slate-500">
            TRIAGE FEED
          </span>
        </div>
      )}
    </aside>
  );
};
