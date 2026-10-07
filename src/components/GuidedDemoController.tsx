import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  Send,
  Sliders,
  Flame,
  Activity,
  Layers,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { HotspotRecord } from '../types';

export interface GuidedDemoControllerProps {
  isActive: boolean;
  onClose: () => void;
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord | null) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onOpenAlertModal?: (hotspot: HotspotRecord) => void;
}

export const GuidedDemoController: React.FC<GuidedDemoControllerProps> = ({
  isActive,
  onClose,
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  currentStep,
  onStepChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onOpenAlertModal,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Dynamically determine the authoritative highest-priority candidate from current dataset
  const highestCandidate = useMemo(() => {
    if (!hotspots || hotspots.length === 0) return null;
    return [...hotspots].sort((a, b) => b.priority_score - a.priority_score)[0];
  }, [hotspots]);

  // Use selected hotspot if user picked one, otherwise use top candidate dynamically
  const activeCandidate = selectedHotspot || highestCandidate;

  // Dynamic distribution counts from the active October dataset
  const highCount = useMemo(() => hotspots.filter((h) => h.priority_category === 'HIGH').length, [hotspots]);
  const medCount = useMemo(() => hotspots.filter((h) => h.priority_category === 'MEDIUM').length, [hotspots]);
  const lowCount = useMemo(() => hotspots.filter((h) => h.priority_category === 'LOW').length, [hotspots]);
  const critCount = useMemo(() => hotspots.filter((h) => (h as any).priority_category === 'CRITICAL').length, [hotspots]);

  // Construct dynamic step definitions without hardcoded candidate metrics
  const steps = useMemo(() => [
    {
      step: 0,
      shortId: 'INTRO',
      title: 'AGNI KAVACH',
      badge: 'DEMO INTRO',
      metric: '2,696',
      metricSecondary: undefined,
      metricLabel: 'NASA FIRMS OBSERVATIONS',
      subtext: 'VIIRS NOAA-21 NRT • 03–06 OCT 2026 OBSERVED DATA',
      details: '07 OCT reference date • Satellite-assisted thermal anomaly intelligence baseline across India.',
    },
    {
      step: 1,
      shortId: '01 OBSERVE',
      title: '01 — OBSERVE',
      badge: 'RAW SATELLITE LAYER',
      metric: '2,696',
      metricSecondary: undefined,
      metricLabel: 'SPACEBORNE THERMAL OBSERVATIONS',
      subtext: 'NASA FIRMS VIIRS NOAA-21 NRT observations form the initial thermal observation layer.',
      details: 'Unfiltered 375m I-band radiometer detections across the subcontinent downlinked from polar orbit.',
    },
    {
      step: 2,
      shortId: '02 CLUSTER',
      title: '02 — CLUSTER',
      badge: 'SPATIAL GROUPING',
      metric: '1,274',
      metricSecondary: undefined,
      metricLabel: 'THERMAL CLUSTERS',
      subtext: 'Spatially grouped thermal observations reduce the raw observation field into discrete thermal activity patterns.',
      details: 'DBSCAN 1.2km spatial proximity grouping isolates discrete active fire clusters.',
    },
    {
      step: 3,
      shortId: '03 PERSIST',
      title: '03 — PERSIST',
      badge: 'MULTI-DAY FILTER',
      metric: `${hotspots.length}`,
      metricSecondary: '770 RETAINED OBS',
      metricLabel: 'PERSISTENT CANDIDATES',
      subtext: 'Candidates recurring across all four observed days — 03 to 06 October — are retained for prioritization.',
      details: 'Ephemeral burns filtered out. 100% active-day continuity (4/4 observed days) ensures zero false-alarm panic.',
    },
    {
      step: 4,
      shortId: '04 PRIORITIZE',
      title: '04 — PRIORITIZE',
      badge: 'MULTI-ATTRIBUTE RANKING',
      metric: `${highCount} HIGH`,
      metricSecondary: `${medCount} MED • ${lowCount} LOW • ${critCount} CRIT`,
      metricLabel: 'PRIORITY CATEGORIZATION',
      subtext: 'Multi-attribute priority scoring categorizes the 57 persistent candidates by spatial continuity, thermal risk, and geographic context.',
      details: 'HIGH = Red (#EF4444) • MEDIUM = Amber (#F59E0B) • LOW = Green (#10B981) • Instant visual clarity.',
    },
    {
      step: 5,
      shortId: '05 INVESTIGATE',
      title: '05 — INVESTIGATE',
      badge: 'EVIDENCE CHAIN AUDIT',
      metric: activeCandidate ? activeCandidate.source_id : 'CANDIDATE',
      metricSecondary: activeCandidate
        ? `SCORE ${activeCandidate.priority_score.toFixed(2)} • SENSOR FRP ${activeCandidate.max_frp.toFixed(2)}`
        : undefined,
      metricLabel: activeCandidate ? `${activeCandidate.priority_category} PRIORITY CANDIDATE` : 'HIGH PRIORITY CANDIDATE',
      subtext: activeCandidate
        ? `Auditable 8-stage Evidence Chain for ${activeCandidate.source_id} (${activeCandidate.location}), Sentinel-2 honest unavailability status, and atmospheric dispersion model.`
        : 'Auditable 8-stage Evidence Chain, Sentinel-2 honest unavailability status, and atmospheric dispersion model.',
      details: activeCandidate
        ? `Telemetry Provenance: ${activeCandidate.detections} detections across ${activeCandidate.active_days}/4 observed days (${activeCandidate.persistence.toFixed(1)}% persistence). Lat: ${activeCandidate.latitude.toFixed(4)}, Lon: ${activeCandidate.longitude.toFixed(4)}.`
        : 'Transparent telemetry provenance prevents hallucinated optical overlays.',
    },
    {
      step: 6,
      shortId: '06 ACT',
      title: '06 — ACT / DISPATCH',
      badge: 'OPERATIONAL RESOLUTION',
      metric: '2-STAGE ESCALATION',
      metricSecondary: 'VERIFIED MULTI-SPECTRAL TELEMETRY',
      metricLabel: 'TACTICAL DISPATCH WORKFLOW',
      subtext: 'Advisory to Tactical Alert escalation with first-responder 60-second run-card.',
      details: 'Zero false-alarm panic: field dispatch authorized only with complete multi-spectral provenance.',
    },
  ], [hotspots.length, highCount, medCount, lowCount, critCount, activeCandidate]);

  if (!isActive) return null;

  const currentStepData = steps.find((s) => s.step === currentStep) || steps[0];
  const totalSteps = steps.length;

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handleRestart = () => {
    onStepChange(0);
  };

  return (
    <aside
      id="guided-demo-hud"
      aria-label="Guided Demonstration Controller HUD"
      className="absolute top-13 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-xl font-mono select-none pointer-events-auto transition-all duration-300"
    >
      <div className="bg-[#0A1118]/95 backdrop-blur-md border border-[#35C6E8]/70 rounded-xl shadow-[0_0_24px_rgba(53,198,232,0.25)] overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-[#071018] px-3.5 py-2 border-b border-[#243441] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#35C6E8] animate-ping" />
            <span className="font-['Chakra_Petch'] font-bold text-sm text-white tracking-wider flex items-center gap-1.5">
              <Presentation className="w-3.5 h-3.5 text-[#35C6E8]" />
              GUIDED DEMO MODE
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#101A23] border border-[#243441] text-[#35C6E8] font-bold">
              STEP {currentStep}/{totalSteps - 1}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Speed Toggle */}
            <button
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
                onChangeSpeed(nextSpeed);
              }}
              className="px-2 py-0.5 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
              title="Toggle playback speed"
            >
              {playbackSpeed}× SPEED
            </button>

            {/* Minimize Toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? 'Expand HUD' : 'Collapse HUD'}
            >
              <Sliders className="w-3 h-3" />
            </button>

            {/* Exit Demo Button */}
            <button
              onClick={onClose}
              className="p-1 rounded bg-[#101A23] hover:bg-rose-950/40 border border-[#243441] hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Exit Demo Mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progression Pills */}
        <div className="bg-[#0D151D] px-2.5 py-1.5 border-b border-[#243441] flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {steps.map((step) => {
            const isCurrent = step.step === currentStep;
            const isPast = step.step < currentStep;
            return (
              <button
                key={step.step}
                onClick={() => onStepChange(step.step)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#35C6E8] text-black shadow-[0_0_8px_rgba(53,198,232,0.4)]'
                    : isPast
                    ? 'bg-[#101A23] text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#101A23] text-slate-400 border border-[#243441] hover:text-slate-200'
                }`}
              >
                {step.shortId}
              </button>
            );
          })}
        </div>

        {/* Main Content Body (Can be collapsed) */}
        {!isMinimized && (
          <div className="p-3.5 space-y-3 bg-[#0A1118]">
            {/* Step Header & Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#35C6E8] bg-[#101A23] border border-[#243441] px-2 py-0.5 rounded">
                  {currentStepData.badge}
                </span>
                <h3 className="font-['Chakra_Petch'] font-bold text-base sm:text-lg text-white mt-1">
                  {currentStepData.title}
                </h3>
              </div>

              {/* Primary Audited Metric Callout */}
              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#FF9F1C]">
                  {currentStepData.metric}
                </div>
                {currentStepData.metricSecondary && (
                  <div className="text-[10px] font-mono text-[#35C6E8] font-bold">
                    {currentStepData.metricSecondary}
                  </div>
                )}
                <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                  {currentStepData.metricLabel}
                </div>
              </div>
            </div>

            {/* Supporting Text & Scientific Explanation */}
            <div className="p-2.5 rounded-lg bg-[#101A23] border border-[#243441] text-xs text-slate-200 leading-relaxed">
              <p className="font-semibold text-slate-100">{currentStepData.subtext}</p>
              <p className="text-[11px] text-slate-400 mt-1">{currentStepData.details}</p>
            </div>

            {/* Special Callouts for Specific Steps */}
            {currentStep === 4 && (
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs pt-1">
                <div className="p-1.5 rounded bg-red-950/40 border border-[#EF4444] text-[#EF4444]">
                  <div className="font-bold">{highCount}</div>
                  <div className="text-[8px] uppercase">HIGH</div>
                </div>
                <div className="p-1.5 rounded bg-amber-950/40 border border-[#F59E0B] text-[#F59E0B]">
                  <div className="font-bold">{medCount}</div>
                  <div className="text-[8px] uppercase">MEDIUM</div>
                </div>
                <div className="p-1.5 rounded bg-emerald-950/40 border border-[#10B981] text-[#10B981]">
                  <div className="font-bold">{lowCount}</div>
                  <div className="text-[8px] uppercase">LOW</div>
                </div>
                <div className="p-1.5 rounded bg-[#101A23] border border-[#243441] text-slate-500">
                  <div className="font-bold">{critCount}</div>
                  <div className="text-[8px] uppercase">CRITICAL</div>
                </div>
              </div>
            )}

            {/* Step 5: Fully Dynamic Analytical Metrics from Current Dataset */}
            {currentStep === 5 && activeCandidate && (
              <div className="p-2.5 rounded bg-[#101A23] border border-[#35C6E8]/40 space-y-2 text-xs">
                {/* Header identifying the dynamically selected candidate */}
                <div className="flex items-center justify-between border-b border-[#243441] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
                    <span className="font-bold text-white tracking-wide">{activeCandidate.source_id}</span>
                    <span className="text-[11px] text-slate-300 font-mono">({activeCandidate.location})</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/60">
                    {activeCandidate.priority_category} PRIORITY
                  </span>
                </div>

                {/* Grid of Dynamic Analytical Values */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
                  <div className="p-1.5 rounded bg-[#0A1118] border border-[#243441]">
                    <div className="text-slate-400 text-[9px]">PRIORITY SCORE</div>
                    <div className="font-bold text-[#FF9F1C] text-xs">{activeCandidate.priority_score.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#0A1118] border border-[#243441]">
                    <div className="text-slate-400 text-[9px]">THERMAL RISK</div>
                    <div className="font-bold text-[#FF9F1C] text-xs">{activeCandidate.thermal_risk.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#0A1118] border border-[#243441]">
                    <div className="text-slate-400 text-[9px]">MAX SENSOR FRP</div>
                    <div className="font-bold text-white text-xs">{activeCandidate.max_frp.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#0A1118] border border-[#243441]">
                    <div className="text-slate-400 text-[9px]">MEAN SENSOR FRP</div>
                    <div className="font-bold text-white text-xs">{activeCandidate.mean_frp.toFixed(2)}</div>
                  </div>
                </div>

                {/* Secondary Telemetry Provenance Row */}
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <div className="p-1 rounded bg-[#0A1118] border border-[#243441]">
                    <span className="text-slate-400">DETECTIONS: </span>
                    <span className="font-bold text-slate-200">{activeCandidate.detections} ({activeCandidate.active_days}/4 days)</span>
                  </div>
                  <div className="p-1 rounded bg-[#0A1118] border border-[#243441]">
                    <span className="text-slate-400">PERSISTENCE: </span>
                    <span className="font-bold text-slate-200">{activeCandidate.persistence.toFixed(1)}%</span>
                  </div>
                  <div className="p-1 rounded bg-[#0A1118] border border-[#243441]">
                    <span className="text-slate-400">NIGHT RATIO: </span>
                    <span className="font-bold text-slate-200">{((activeCandidate.night_ratio ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Spatial Context Row */}
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono bg-[#0A1118] px-2 py-1 rounded border border-[#243441]">
                  <span>COORDINATES: {activeCandidate.latitude.toFixed(4)}, {activeCandidate.longitude.toFixed(4)}</span>
                  <span>NEAREST: {activeCandidate.nearest_city} ({activeCandidate.distance_to_city_km.toFixed(1)} km)</span>
                </div>
              </div>
            )}

            {/* Step 6: Operational Dispatch Action */}
            {currentStep === 6 && onOpenAlertModal && activeCandidate && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Tactical alert escalation for <strong className="text-slate-200">{activeCandidate.source_id}</strong>
                </span>
                <button
                  onClick={() => onOpenAlertModal(activeCandidate)}
                  className="px-2.5 py-1 rounded bg-[#EF4444] hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>PREVIEW ALERT DISPATCH</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Playback Navigation Bar */}
        <div className="bg-[#071018] px-3.5 py-2 border-t border-[#243441] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Restart Demo from Intro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-2.5 py-1 rounded bg-[#101A23] hover:bg-[#131F29] disabled:opacity-40 border border-[#243441] text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>
          </div>

          {/* Central Play/Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#FF9F1C] text-black shadow-[0_0_12px_rgba(255,159,28,0.4)]'
                : 'bg-[#35C6E8] text-black shadow-[0_0_12px_rgba(53,198,232,0.4)] hover:bg-[#38BDF8]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span>PAUSE DEMO</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>AUTO-PLAY (45s)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNext}
              disabled={currentStep === totalSteps - 1}
              className="px-2.5 py-1 rounded bg-[#101A23] hover:bg-[#131F29] disabled:opacity-40 border border-[#243441] text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
