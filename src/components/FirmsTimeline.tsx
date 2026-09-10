import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Calendar, Clock, Radio, X } from 'lucide-react';
import { HotspotRecord } from '../types';

interface FirmsTimelineProps {
  hotspots: HotspotRecord[];
  activeDayIndex: number; // 0 to 4 (representing Sep 04 to Sep 08)
  onChangeDayIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  isDrawerOpen?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export const DATES = [
  { label: 'SEP 04', full: 'September 04, 2026', dayNum: 1 },
  { label: 'SEP 05', full: 'September 05, 2026', dayNum: 2 },
  { label: 'SEP 06', full: 'September 06, 2026', dayNum: 3 },
  { label: 'SEP 07', full: 'September 07, 2026', dayNum: 4 },
  { label: 'SEP 08', full: 'September 08, 2026', dayNum: 5 },
];

export const FirmsTimeline: React.FC<FirmsTimelineProps> = ({
  hotspots,
  activeDayIndex,
  onChangeDayIndex,
  isPlaying,
  onTogglePlay,
  onReset,
  isDrawerOpen = false,
  isOpen = true,
  onClose,
  onOpen,
}) => {
  // Compute how many detections are active by the selected day threshold
  const currentThreshold = activeDayIndex + 1;
  const activeSources = (hotspots || []).filter((h) => (h?.active_days ?? 0) >= currentThreshold);
  const totalDetections = activeSources.reduce((acc, h) => acc + (h?.detections ?? 0), 0);

  // If closed by user, show a sleek, compact button to reopen it whenever wanted
  if (!isOpen) {
    return (
      <button
        id="btn-open-firms-timeline"
        onClick={onOpen}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#080C14]/95 backdrop-blur-md border border-cyan-500/40 text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-[#0D1424] shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all font-mono text-xs cursor-pointer group select-none"
        title="Open 5-Day FIRMS Analytical Window"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        <Calendar className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-bold tracking-wider text-cyan-300">
          5-DAY FIRMS WINDOW
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300 font-bold">
          {DATES[activeDayIndex].label}
        </span>
      </button>
    );
  }

  return (
    <div
      id="firms-timeline-dock"
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${
        isDrawerOpen
          ? 'w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[580px] p-2.5 sm:p-3'
          : 'w-[calc(100%-2rem)] sm:w-[680px] max-w-[680px] p-3'
      } bg-[#080C14]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl font-mono text-slate-200 select-none`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Playback Controls & Label */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-timeline-play"
              onClick={onTogglePlay}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black ml-0.5" />
              )}
            </button>
            <button
              id="btn-timeline-reset"
              onClick={onReset}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center hover:text-white hover:border-slate-500 transition-colors"
              title="Reset Timeline"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] text-cyan-400 font-bold uppercase tracking-wider truncate">
                5-DAY FIRMS ANALYTICAL WINDOW
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-bold mt-0.5 truncate">
              {DATES[activeDayIndex].full}
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Stats & Close Control */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
          <div className="text-right">
            <span className="text-slate-500 text-[9px] sm:text-[10px] block whitespace-nowrap">ACTIVE SOURCES</span>
            <span className="text-cyan-300 font-bold text-xs">
              {activeSources.length} / {hotspots.length}
            </span>
          </div>
          <div className="text-right border-l border-slate-800 pl-2 sm:pl-3">
            <span className="text-slate-500 text-[9px] sm:text-[10px] block whitespace-nowrap">AGGREGATE DETECTIONS</span>
            <span className="text-amber-400 font-bold text-xs">{totalDetections}</span>
          </div>

          {/* Explicit Close Button */}
          {onClose && (
            <button
              id="btn-close-timeline"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 ml-1 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/60 hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
              title="Close 5-Day FIRMS Window"
              aria-label="Close 5-Day FIRMS Window"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Track with 5 Dates */}
      <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-5 gap-1 text-center">
          {DATES.map((date, idx) => {
            const isSelected = activeDayIndex === idx;
            const isPassed = activeDayIndex >= idx;
            return (
              <button
                key={date.label}
                onClick={() => onChangeDayIndex(idx)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <span
                  className={`text-[9px] sm:text-[10px] font-bold tracking-tight transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'text-cyan-300'
                      : isPassed
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {date.label}
                </span>

                {/* Stepper Dot */}
                <div className="w-full flex items-center my-1 sm:my-1.5">
                  <div
                    className={`flex-1 h-0.5 ${
                      idx === 0 ? 'opacity-0' : isPassed ? 'bg-cyan-500/80' : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] scale-125'
                        : isPassed
                        ? 'border-cyan-500 bg-cyan-950'
                        : 'border-slate-800 bg-slate-900'
                    }`}
                  />
                  <div
                    className={`flex-1 h-0.5 ${
                      idx === 4 ? 'opacity-0' : activeDayIndex > idx ? 'bg-cyan-500/80' : 'bg-slate-800'
                    }`}
                  />
                </div>

                <span className="text-[8px] sm:text-[9px] text-slate-500 whitespace-nowrap">Day {idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
