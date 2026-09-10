import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Sparkles,
  Info,
  Layers,
  Flame,
  Clock,
  Radio,
  MapPin,
  Compass,
} from 'lucide-react';
import { HotspotRecord } from '../types';

interface WhyDidYouAlertModalProps {
  hotspot: HotspotRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToResponseMode?: (hotspot: HotspotRecord) => void;
}

export const WhyDidYouAlertModal: React.FC<WhyDidYouAlertModalProps> = ({
  hotspot,
  isOpen,
  onClose,
  onGoToResponseMode,
}) => {
  if (!isOpen || !hotspot) return null;

  const score = Number((hotspot.priority_score ?? 0).toFixed(3));
  const persistenceScore = Number((hotspot.persistence_contribution ?? 0).toFixed(2));
  const thermalScore = Number((hotspot.thermal_contribution ?? 0).toFixed(2));
  const detectionScore = Number((hotspot.detection_contribution ?? 0).toFixed(2));
  const nightScore = Number((hotspot.night_contribution ?? 0).toFixed(2));
  const geoScore = Number((hotspot.geographic_contribution ?? 0).toFixed(2));

  // Compute percentages
  const totalContrib =
    persistenceScore + thermalScore + detectionScore + nightScore + geoScore || 1;

  const pPct = ((persistenceScore / totalContrib) * 100).toFixed(1);
  const tPct = ((thermalScore / totalContrib) * 100).toFixed(1);
  const dPct = ((detectionScore / totalContrib) * 100).toFixed(1);
  const nPct = ((nightScore / totalContrib) * 100).toFixed(1);
  const gPct = ((geoScore / totalContrib) * 100).toFixed(1);

  const getPriorityBadge = (cat: string) => {
    switch (cat) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      id="why-did-you-alert-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#080C14] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                  WHY DID YOU ALERT?
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getPriorityBadge(
                    hotspot.priority_category
                  )}`}
                >
                  {hotspot.priority_category} PRIORITY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Multi-Criteria Weighted Prioritization Explainability • Incident {hotspot.source_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 text-xs font-mono">
          {/* Top Score Summary Banner */}
          <div className="p-4 rounded-lg bg-[#0D1424] border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                AGGREGATE PRIORITY SCORE
              </div>
              <div className="text-3xl font-bold font-['Chakra_Petch'] text-cyan-300 mt-0.5 flex items-baseline gap-2">
                <span>{score.toFixed(3)}</span>
                <span className="text-xs font-normal text-slate-500">/ 100 max</span>
              </div>
            </div>

            <div className="flex items-center gap-6 border-l border-slate-800 pl-6">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">DOMINANT FACTOR</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {hotspot.dominant_factor || 'PERSISTENCE'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">ML PATTERN CLUSTER</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  Cluster #{hotspot.ml_cluster ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Scientific Disclaimer (Mandatory) */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5 text-amber-200 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold tracking-wide uppercase text-[10px] block text-amber-300">
                SCIENTIFIC EXPLAINABILITY DISCLOSURE
              </span>
              <p className="mt-0.5 leading-relaxed text-slate-300">
                THIS IS A PRIORITIZATION SCORE, NOT A CONFIRMED INDUSTRIAL-FIRE CLASSIFICATION. The score guides triage and field verification order based on satellite observation persistence, nocturnal repetition, and spatial proximity.
              </p>
            </div>
          </div>

          {/* Horizontal Contribution Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                SCORE CONTRIBUTION BREAKDOWN
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Formula: w₁·P + w₂·TR + w₃·D + w₄·NA + w₅·GC
              </span>
            </div>

            <div className="space-y-3 bg-[#0D1424] p-4 rounded-lg border border-slate-800">
              {/* Persistence */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300 font-semibold">TEMPORAL PERSISTENCE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-300 font-bold">+{persistenceScore} pts</span>
                    <span className="text-[10px] text-slate-500 font-mono">({pPct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (persistenceScore / 30) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Detected across {hotspot.active_days} of 5 analytical days ({hotspot.persistence}% persistence index).
                </div>
              </div>

              {/* Thermal Risk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300 font-semibold">THERMAL RISK INDEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-300 font-bold">+{thermalScore} pts</span>
                    <span className="text-[10px] text-slate-500 font-mono">({tPct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (thermalScore / 30) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Derived from mean nominal Sensor FRP ({hotspot.mean_frp}) and peak cluster radiance index ({hotspot.max_frp}).
                </div>
              </div>

              {/* Detection Activity */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-slate-300 font-semibold">DETECTION VOLUME</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-300 font-bold">+{detectionScore} pts</span>
                    <span className="text-[10px] text-slate-500 font-mono">({dPct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (detectionScore / 20) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {hotspot.detections} individual satellite detection pixels clustered by DBSCAN.
                </div>
              </div>

              {/* Night Activity */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-300 font-semibold">NOCTURNAL / NIGHT RATIO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-300 font-bold">+{nightScore} pts</span>
                    <span className="text-[10px] text-slate-500 font-mono">({nPct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (nightScore / 15) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {((hotspot.night_ratio ?? 0) * 100).toFixed(1)}% of all passes occurred during night overpasses (VIIRS 01:30 local time).
                </div>
              </div>

              {/* Geographic Context */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 font-semibold">GEOGRAPHIC CONTEXT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-300 font-bold">+{geoScore} pts</span>
                    <span className="text-[10px] text-slate-500 font-mono">({gPct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (geoScore / 15) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {hotspot.geographic_context} • {hotspot.distance_to_city_km} km to {hotspot.nearest_city}.
                </div>
              </div>
            </div>
          </div>

          {/* Rationale Text */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed text-xs">
            <span className="text-cyan-400 font-bold block mb-1">SYSTEM ANALYTICAL SUMMARY:</span>
            {hotspot.explanation ||
              `Incident ${hotspot.source_id} is prioritized with a score of ${score} due to high temporal recurrence (${hotspot.persistence}% persistence across ${hotspot.active_days} days) and notable nocturnal activity. Verification against ground conditions is advised.`}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D1424] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Source: Supabase public.hotspots • NASA FIRMS VIIRS NOAA-21 NRT
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium transition-colors"
            >
              CLOSE
            </button>
            {onGoToResponseMode && (
              <button
                onClick={() => {
                  onClose();
                  onGoToResponseMode(hotspot);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                OPEN 60-SECOND RUN-CARD →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
