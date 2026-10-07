import React from 'react';
import {
  Play,
  Pause,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
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
  // Mission Replay Props
  isReplayActive?: boolean;
  replayStage?: number; // 1 to 6
  onSelectReplayStage?: (stage: number) => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  replaySpeed?: number;
  onToggleSpeed?: () => void;
  onExitReplay?: () => void;
  onStartReplay?: () => void;
}

export const DATES = [
  { label: '03 OCT', countText: '546', display: '03 OCT — 546', full: '03 OCT 2026 — 546 Observations' },
  { label: '04 OCT', countText: '592', display: '04 OCT — 592', full: '04 OCT 2026 — 592 Observations' },
  { label: '05 OCT', countText: '657', display: '05 OCT — 657', full: '05 OCT 2026 — 657 Observations' },
  { label: '06 OCT', countText: '901', display: '06 OCT — 901', full: '06 OCT 2026 — 901 Observations' },
  { label: '07 OCT', countText: 'DATA PENDING', display: '07 OCT — DATA PENDING', full: '07 OCT 2026 — DATA PENDING (0 Observations Currently Available)' },
];

export const REPLAY_STAGES = [
  { stage: 1, label: '03 OCT (546)', full: '03 OCT — 546 Cumulative Observations' },
  { stage: 2, label: '04 OCT (1,138)', full: '04 OCT — 1,138 Cumulative Observations (+592)' },
  { stage: 3, label: '05 OCT (1,795)', full: '05 OCT — 1,795 Cumulative Observations (+657)' },
  { stage: 4, label: '06 OCT (2,696)', full: '06 OCT — 2,696 Cumulative Observations (+901)' },
  { stage: 5, label: '07 OCT (2,696)', full: '07 OCT — 2,696 / NO NEW OBSERVATIONS (DATA PENDING)' },
  { stage: 6, label: 'FINAL (57)', full: 'Final Priority Intelligence Funnel (57 Persistent Candidates)' },
];

export const FirmsTimeline: React.FC<FirmsTimelineProps> = ({
  hotspots,
  activeDayIndex,
  onChangeDayIndex,
  isPlaying,
  onTogglePlay,
  onReset,
  isReplayActive = false,
  replayStage = 1,
  onSelectReplayStage,
  onStepBack,
  onStepForward,
  replaySpeed = 1,
  onToggleSpeed,
  onExitReplay,
  onStartReplay,
}) => {
  return (
    <div
      id="firms-timeline-bottom-dock"
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg bg-[#0A1118]/95 backdrop-blur-md border border-[#243441] shadow-2xl font-mono text-xs select-none text-slate-300 pointer-events-auto max-w-[95vw] overflow-x-auto"
    >
      {/* Title / Mode Indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isReplayActive ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[#35C6E8] animate-ping" />
            <span className="font-bold text-[11px] text-[#35C6E8] uppercase tracking-wide">
              MISSION REPLAY
            </span>
          </>
        ) : (
          <>
            <Calendar className="w-3.5 h-3.5 text-[#35C6E8]" />
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wide hidden sm:inline">
              FIRMS OCTOBER TIMELINE
            </span>
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wide sm:hidden">
              TIMELINE
            </span>
          </>
        )}
      </div>

      <span className="text-[#243441]">|</span>

      {/* Date Selectors: Stage Buttons when Replay is active, or Day Index when normal */}
      <div className="flex items-center gap-1 shrink-0">
        {isReplayActive ? (
          REPLAY_STAGES.map((s) => {
            const isActive = replayStage === s.stage;
            const isCompleted = replayStage > s.stage;
            return (
              <button
                key={s.stage}
                onClick={() => onSelectReplayStage && onSelectReplayStage(s.stage)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#35C6E8] text-black shadow-[0_0_10px_rgba(53,198,232,0.5)]'
                    : isCompleted
                    ? 'bg-[#101A23] text-[#35C6E8]/80 hover:bg-[#131F29] border border-[#243441]'
                    : 'hover:bg-[#101A23] text-slate-500 hover:text-slate-300'
                }`}
                title={s.full}
              >
                {s.label}
              </button>
            );
          })
        ) : (
          DATES.map((d, idx) => {
            const isActive = activeDayIndex === idx;
            return (
              <button
                key={d.label}
                onClick={() => onChangeDayIndex(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#35C6E8] text-black shadow-[0_0_8px_rgba(53,198,232,0.4)]'
                    : idx === 4
                    ? 'hover:bg-[#101A23] text-[#FFB020]/90 border border-[#FF9F1C]/30 bg-[#FF9F1C]/5'
                    : 'hover:bg-[#101A23] text-slate-300 hover:text-white border border-transparent'
                }`}
                title={d.full}
              >
                <span>{d.label}</span>
                <span className={isActive ? 'text-black/80 text-[9px]' : idx === 4 ? 'text-[#FFB020] text-[9px]' : 'text-slate-500 text-[9px]'}>
                  ({d.countText})
                </span>
              </button>
            );
          })
        )}
      </div>

      <span className="text-slate-700">|</span>

      {/* Replay Controls vs Standard Day Play Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {isReplayActive ? (
          <>
            {/* Step Back */}
            <button
              onClick={onStepBack}
              disabled={replayStage <= 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Step Back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause / Replay */}
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-[#FF9F1C] text-black shadow-[0_0_8px_rgba(255,159,28,0.5)]'
                  : replayStage === 6
                  ? 'bg-[#35C6E8] hover:bg-[#38BDF8] text-black shadow-[0_0_8px_rgba(53,198,232,0.5)]'
                  : 'bg-[#101A23] hover:bg-[#131F29] text-[#35C6E8] border border-[#243441]'
              }`}
              title={
                replayStage === 6 && !isPlaying
                  ? 'Replay Mission from Beginning'
                  : isPlaying
                  ? 'Pause Replay'
                  : 'Resume Replay'
              }
            >
              {replayStage === 6 && !isPlaying ? (
                <>
                  <RotateCcw className="w-3 h-3" />
                  <span>REPLAY</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Step Forward */}
            <button
              onClick={onStepForward}
              disabled={replayStage >= 6}
              className="p-1 rounded hover:bg-[#101A23] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Step Forward"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Speed Toggle: 0.5x | 1x | 2x */}
            <button
              onClick={onToggleSpeed}
              className="px-1.5 py-0.5 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
              title="Cycle Speed (0.5× / 1× / 2×)"
            >
              {replaySpeed}×
            </button>

            {/* Exit Replay Button */}
            <button
              onClick={onExitReplay}
              className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Exit Mission Replay"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {/* Play Mission Button */}
            <button
              onClick={onStartReplay || onTogglePlay}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#35C6E8] hover:bg-[#38BDF8] text-black shadow-[0_0_10px_rgba(53,198,232,0.4)] transition-all cursor-pointer"
              title="Start Interactive 5-Day Mission Replay"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>PLAY MISSION</span>
            </button>

            <button
              onClick={onReset}
              className="p-1 rounded hover:bg-[#101A23] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Reset Day Index"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
