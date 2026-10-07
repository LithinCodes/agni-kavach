import React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react';
import { FilterState, HotspotRecord, PriorityCategory } from '../types';

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
  isOpen,
  onToggleOpen,
}) => {
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

  const getPriorityBadge = (category: PriorityCategory | string) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-red-950/70 text-red-300 border-red-700/70';
      case 'HIGH':
        return 'bg-red-950/60 text-red-400 border-red-500/60';
      case 'MEDIUM':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/60';
      case 'LOW':
      default:
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/60';
    }
  };

  const getScoreColor = (category: PriorityCategory | string) => {
    if (category === 'CRITICAL') return 'text-red-500';
    if (category === 'HIGH') return 'text-red-400';
    if (category === 'MEDIUM') return 'text-amber-400';
    if (category === 'LOW') return 'text-emerald-400';
    return 'text-slate-400';
  };

  if (!isOpen) {
    return (
      <div
        id="collapsed-triage-strip"
        className="w-10 bg-[#071018] border-r border-[#243441] flex flex-col items-center py-3 gap-3 shrink-0 z-20 select-none"
      >
        <button
          onClick={onToggleOpen}
          className="w-7 h-8 rounded bg-[#101A23] border border-[#243441] hover:border-[#35C6E8]/60 text-[#35C6E8] flex items-center justify-center transition-colors cursor-pointer shadow-md"
          title="Expand Live Sources Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-1 mt-2">
          <Flame className="w-4 h-4 text-[#FF9F1C]" />
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {filteredHotspots.length}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-mono text-slate-500 tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase">
            LIVE SOURCES
          </span>
        </div>
      </div>
    );
  }

  return (
    <aside
      id="left-triage-panel"
      className="w-[310px] max-w-[330px] bg-[#0A1118] border-r border-[#243441] flex flex-col h-full shrink-0 z-20 select-none overflow-hidden"
    >
      {/* 1. Header: LIVE SOURCES + Count + Collapse */}
      <div className="p-3 border-b border-[#243441] bg-[#0D151D] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF9F1C]" />
          <span className="font-['Chakra_Petch'] font-bold text-xs text-slate-100 tracking-wider">
            LIVE SOURCES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101A23] text-[#35C6E8] border border-[#243441] font-bold">
            {filteredHotspots.length}
          </span>
        </div>

        <button
          onClick={onToggleOpen}
          className="w-6 h-6 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Search Box */}
      <div className="p-2.5 pb-1.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            placeholder="Search AGNI-001 or city..."
            className="w-full pl-8 pr-7 py-1.5 rounded bg-[#101A23] border border-[#243441] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#35C6E8]/70 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filters: Segmented Tabs (ALL | HIGH | MEDIUM | LOW) */}
      <div className="px-2.5 pb-2 shrink-0">
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded bg-[#101A23] border border-[#243441] text-[10px] font-mono font-bold">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((pri) => {
            const isActive = filters.priority === pri;
            return (
              <button
                key={pri}
                onClick={() => onFilterChange({ ...filters, priority: pri })}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  isActive
                    ? pri === 'HIGH'
                      ? 'bg-red-950/70 text-red-400 border border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : pri === 'MEDIUM'
                      ? 'bg-amber-950/70 text-amber-400 border border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : pri === 'LOW'
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-[#17232D] text-[#35C6E8] border border-[#35C6E8]/60 shadow-[0_0_8px_rgba(53,198,232,0.2)]'
                    : pri === 'HIGH'
                    ? 'text-red-400/70 hover:text-red-300 hover:bg-[#131F29]/60'
                    : pri === 'MEDIUM'
                    ? 'text-amber-400/70 hover:text-amber-300 hover:bg-[#131F29]/60'
                    : pri === 'LOW'
                    ? 'text-emerald-400/70 hover:text-emerald-300 hover:bg-[#131F29]/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131F29]/60'
                }`}
              >
                {pri}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Vertical List of Hotspot Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 focus:outline-none">
        {filteredHotspots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No hotspots match current filters.
          </div>
        ) : (
          filteredHotspots.map((item) => {
            const isSelected = selectedHotspot?.source_id === item.source_id;
            return (
              <div
                key={item.source_id}
                id={`hotspot-card-${item.source_id}`}
                onClick={() => onSelectHotspot(item)}
                className={`p-2.5 rounded-lg transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-[#131F29] border-2 border-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.25)] text-white'
                    : 'bg-[#101A23] hover:bg-[#131F29] border border-[#243441] hover:border-[#304351]'
                }`}
              >
                {/* Header: AGNI-001 | HIGH | 90.70 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Small priority indicator dot */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.priority_category === 'HIGH'
                          ? 'bg-[#EF4444] shadow-[0_0_5px_#EF4444]'
                          : item.priority_category === 'MEDIUM'
                          ? 'bg-[#F59E0B] shadow-[0_0_5px_#F59E0B]'
                          : item.priority_category === 'CRITICAL'
                          ? 'bg-[#B91C1C] shadow-[0_0_5px_#B91C1C]'
                          : 'bg-[#10B981] shadow-[0_0_5px_#10B981]'
                      }`}
                    />
                    <span className="font-mono font-bold text-xs text-slate-100 tracking-wide">
                      {item.source_id}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getPriorityBadge(
                        item.priority_category
                      )}`}
                    >
                      {item.priority_category}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${getScoreColor(
                      item.priority_category
                    )}`}
                  >
                    {item.priority_score.toFixed(2)}
                  </span>
                </div>

                {/* Nearest City / Sector */}
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  {item.nearest_city || item.location || 'Regional Sector'}
                </div>

                {/* Detections & Active Days */}
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {item.detections} detections &middot; {item.active_days}/4 active days
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
