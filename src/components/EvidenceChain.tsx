import React, { useState } from 'react';
import {
  Flame,
  Radio,
  Clock,
  ShieldAlert,
  MapPin,
  Satellite,
  ChevronDown,
  ChevronUp,
  Database,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { HotspotRecord } from '../types';

interface EvidenceChainProps {
  hotspot: HotspotRecord;
  compact?: boolean;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({
  hotspot,
  compact = false,
}) => {
  const [showProvenance, setShowProvenance] = useState<boolean>(false);
  const [showWhyPrioritized, setShowWhyPrioritized] = useState<boolean>(true);
  const [showKMeansTransparency, setShowKMeansTransparency] = useState<boolean>(false);

  const thermalC = hotspot.thermal_contribution ?? 0;
  const persistenceC = hotspot.persistence_contribution ?? 0;
  const detectionC = hotspot.detection_contribution ?? 0;
  const nightC = hotspot.night_contribution ?? 0;
  const geographicC = hotspot.geographic_contribution ?? 0;
  const calculatedSum = thermalC + persistenceC + detectionC + nightC + geographicC;

  return (
    <div className="space-y-2.5 font-mono text-xs select-none">
      {/* ============================================================ */}
      {/* 1. EVIDENCE CHAIN FLOW (8 PRECISE AUDITED STAGES)           */}
      {/* ============================================================ */}
      <div className="p-3 rounded-xl bg-[#0A1118] border border-[#243441] shadow-lg space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#243441]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#35C6E8] animate-pulse" />
            <span className="font-bold text-[11px] text-[#35C6E8] uppercase tracking-wider font-['Chakra_Petch']">
              EVIDENCE CHAIN
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#101A23] text-[#35C6E8] border border-[#243441] font-bold">
            SCIENTIFIC AUDIT
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-snug">
          Deterministic progression from NASA FIRMS telemetry to prioritized ground verification target.
        </p>

        {/* 8 Connected Vertical Pipeline Stages */}
        <div className="space-y-1 pt-1">
          {/* Stage 1: NASA FIRMS OBSERVATIONS */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-slate-400 bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">01</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  1. NASA FIRMS OBSERVATIONS
                </div>
                <div className="text-[8px] text-slate-400 truncate">VIIRS_NOAA21_NRT (03–06 OCT)</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-white font-['Chakra_Petch']">2,696</div>
              <div className="text-[8px] text-slate-400 uppercase">TOTAL OBS</div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 2: SPATIAL CLUSTERING */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#35C6E8] bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">02</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  2. SPATIAL CLUSTERING
                </div>
                <div className="text-[8px] text-slate-400 truncate">DBSCAN Spatial Grouping (1.2km)</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-[#35C6E8] font-['Chakra_Petch']">1,274</div>
              <div className="text-[8px] text-slate-400 uppercase">THERMAL CLUSTERS</div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 3: PERSISTENCE FILTER */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#FF9F1C] bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">03</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  3. PERSISTENCE FILTER
                </div>
                <div className="text-[8px] text-slate-400 truncate">4 Observed Days (770 retained obs)</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-[#FFB020] font-['Chakra_Petch']">57 CANDIDATES</div>
              <div className="text-[8px] text-slate-400 uppercase">770 OBS</div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 4: THERMAL RISK */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#FF9F1C] bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">04</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  4. THERMAL RISK
                </div>
                <div className="text-[8px] text-slate-400 truncate">{hotspot.source_id} Radiative Intensity</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-[#FF9F1C] font-['Chakra_Petch']">
                {(hotspot.thermal_risk ?? 0).toFixed(2)}
              </div>
              <div className="text-[8px] text-[#FFB020] uppercase">
                {hotspot.thermal_risk_category || (hotspot.thermal_risk >= 70 ? 'HIGH' : 'ELEVATED')}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-slate-600">↓</span>
          </div>

          {/* Stage 5: PRIORITY ENGINE */}
          <div className="p-2 rounded bg-[#101A23] border border-[#35C6E8]/40 flex items-center justify-between gap-2 shadow-[0_0_8px_rgba(53,198,232,0.15)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#35C6E8] bg-[#071018] px-1 py-0.5 rounded border border-[#35C6E8]/50 shrink-0">05</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-[#38BDF8] uppercase truncate">
                  5. PRIORITY ENGINE
                </div>
                <div className="text-[8px] text-[#35C6E8]/80 truncate">{hotspot.source_id} Priority Score</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-[12px] font-bold font-['Chakra_Petch'] ${
                hotspot.priority_category === 'HIGH'
                  ? 'text-[#EF4444]'
                  : hotspot.priority_category === 'MEDIUM'
                  ? 'text-[#F59E0B]'
                  : hotspot.priority_category === 'LOW'
                  ? 'text-[#10B981]'
                  : 'text-[#B91C1C]'
              }`}>
                {hotspot.priority_score.toFixed(2)}
              </div>
              <div className="text-[8px] font-bold uppercase text-slate-300">
                {hotspot.priority_category} PRIORITY
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 6: GEOGRAPHIC CONTEXT */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-slate-400 bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">06</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  6. GEOGRAPHIC CONTEXT
                </div>
                <div className="text-[8px] text-slate-400 truncate">{hotspot.geographic_context}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-white truncate max-w-[120px]">
                {hotspot.nearest_city || 'Regional Center'}
              </div>
              <div className="text-[8px] text-slate-400 uppercase">
                {(hotspot.distance_to_city_km ?? 0).toFixed(1)} KM
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 7: SATELLITE VERIFICATION */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#35C6E8] bg-[#071018] px-1 py-0.5 rounded border border-[#243441] shrink-0">07</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  7. SATELLITE VERIFICATION
                </div>
                <div className="text-[8px] text-slate-400 truncate">0 / 57 verified Sentinel-2 context</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-[#FFB020]">TASKING PENDING</div>
              <div className="text-[8px] text-slate-500 uppercase">0/57 VERIFIED</div>
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <span className="text-[9px] text-[#243441]">↓</span>
          </div>

          {/* Stage 8: FIELD VERIFICATION */}
          <div className="p-2 rounded bg-[#101A23] border border-[#FF9F1C]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold text-[#FF9F1C] bg-[#071018] px-1 py-0.5 rounded border border-[#FF9F1C]/40 shrink-0">08</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-200 uppercase truncate">
                  8. FIELD VERIFICATION
                </div>
                <div className="text-[8px] text-slate-400 truncate">Triage & Ground Protocol</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-[#FFB020]">
                {hotspot.investigation_status === 'Under Investigation'
                  ? 'UNDER INVESTIGATION'
                  : 'INVESTIGATION REQUIRED'}
              </div>
              <div className="text-[8px] text-slate-500 uppercase">ACTION REQUIRED</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SATELLITE EVIDENCE STATE (HONEST UNAVAILABILITY)          */}
      {/* ============================================================ */}
      <div className="p-3 rounded-xl bg-[#0A1118] border border-[#243441] text-[10px] space-y-2">
        <div className="flex items-center justify-between border-b border-[#243441] pb-1">
          <div className="flex items-center gap-1.5 text-[#38BDF8] font-bold uppercase tracking-wider">
            <Satellite className="w-3.5 h-3.5 text-[#35C6E8]" />
            <span>SATELLITE EVIDENCE</span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-[#101A23] text-slate-400 border border-[#243441] font-bold text-[9px]">
            NOT AVAILABLE
          </span>
        </div>

        <div className="bg-[#101A23] rounded p-2 border border-[#243441] space-y-1.5 text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase text-[9px]">VERIFICATION STATE:</span>
            <span className="text-[#FFB020] font-bold">TASKING PENDING</span>
          </div>
          <p className="text-[9px] text-slate-300 leading-relaxed">
            No verified archival Sentinel-2 context is currently associated with this candidate.
          </p>
          <p className="text-[9px] text-slate-400 leading-relaxed border-t border-[#243441] pt-1 italic">
            Satellite imagery is a subsequent verification layer and is not used here as confirmed evidence of industrial activity.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. K-MEANS SCIENTIFIC TRANSPARENCY (ACCORDION)              */}
      {/* ============================================================ */}
      <div className="p-3 rounded-xl bg-[#0A1118] border border-[#243441] space-y-2">
        <button
          onClick={() => setShowKMeansTransparency(!showKMeansTransparency)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-[#35C6E8]" />
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider font-['Chakra_Petch']">
              K-MEANS TRANSPARENCY (K=4)
            </span>
          </div>
          {showKMeansTransparency ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showKMeansTransparency && (
          <div className="pt-1.5 border-t border-[#243441] space-y-2 text-[9px] text-slate-400 leading-tight">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">MATHEMATICAL SILHOUETTE</span>
                <span className="text-emerald-400 font-bold text-xs font-mono">K=2 | 0.4637</span>
                <span className="text-[8px] text-slate-500 block mt-0.5">Highest mathematical separation</span>
              </div>
              <div className="p-2 rounded bg-[#101A23] border border-[#35C6E8]/40">
                <span className="text-[#38BDF8] block uppercase">OPERATIONAL PARTITION</span>
                <span className="text-[#38BDF8] font-bold text-xs font-mono">K=4 | 0.3195</span>
                <span className="text-[8px] text-slate-500 block mt-0.5">Retained for source triage</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#101A23] border border-[#243441] text-slate-300 leading-relaxed">
              <span className="text-[#35C6E8] font-bold block mb-0.5">INTERPRETATION:</span>
              "K=2 produced the highest mathematical separation. K=4 was retained as an operational behavioral partition because it provides more interpretable source archetypes for investigation triage."
            </div>

            <div className="p-2 rounded bg-[#101A23] border border-[#243441] space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[8px] tracking-wider text-[#FFB020]">
                DOMAIN-INTERPRETED ARCHETYPES (NOT DIRECT ML OUTPUTS):
              </div>
              <div className="text-[8px] text-slate-300 space-y-0.5">
                <div className={hotspot.ml_cluster === 0 ? 'text-[#38BDF8] font-bold' : ''}>
                  • K=0: Nocturnal Stationary Metallurgical Furnace Source {hotspot.ml_cluster === 0 ? '← (THIS SOURCE)' : ''}
                </div>
                <div className={hotspot.ml_cluster === 1 ? 'text-[#38BDF8] font-bold' : ''}>
                  • K=1: Heavy Smelter & Flaring Industrial Cluster {hotspot.ml_cluster === 1 ? '← (THIS SOURCE)' : ''}
                </div>
                <div className={hotspot.ml_cluster === 2 ? 'text-[#38BDF8] font-bold' : ''}>
                  • K=2: Continuous Thermal Power Basin Emitter {hotspot.ml_cluster === 2 ? '← (THIS SOURCE)' : ''}
                </div>
                <div className={hotspot.ml_cluster === 3 ? 'text-[#38BDF8] font-bold' : ''}>
                  • K=3: Regional Ore Beneficiation & Pellet Kiln Facility {hotspot.ml_cluster === 3 ? '← (THIS SOURCE)' : ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. WHY PRIORITIZED (EXACT CONTRIBUTION BREAKDOWN)            */}
      {/* ============================================================ */}
      <div className="p-3 rounded-xl bg-[#0A1118] border border-[#243441] space-y-2">
        <button
          onClick={() => setShowWhyPrioritized(!showWhyPrioritized)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF9F1C]" />
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider font-['Chakra_Petch']">
              WHY PRIORITIZED ({hotspot.source_id})
            </span>
          </div>
          {showWhyPrioritized ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showWhyPrioritized && (
          <div className="space-y-1.5 pt-1 text-[10px]">
            <p className="text-[9px] text-slate-400 leading-tight">
              Direct mathematical breakdown of the 5 weighted components contributing to {hotspot.source_id}'s priority score:
            </p>

            <div className="bg-[#101A23] border border-[#243441] rounded p-2 space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span>1. Thermal Intensity (w=0.40):</span>
                <span className="text-slate-200 font-mono font-bold">{thermalC.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>2. Persistence (w=0.25):</span>
                <span className="text-slate-200 font-mono font-bold">{persistenceC.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>3. Detection Frequency (w=0.15):</span>
                <span className="text-slate-200 font-mono font-bold">{detectionC.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>4. Nocturnal Pattern (w=0.10):</span>
                <span className="text-slate-200 font-mono font-bold">{nightC.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>5. Geographic Proximity (w=0.10):</span>
                <span className="text-slate-200 font-mono font-bold">{geographicC.toFixed(2)} pts</span>
              </div>

              <div className="pt-1 mt-1 border-t border-[#243441] flex justify-between items-center font-bold">
                <span className="text-[#38BDF8] uppercase">TOTAL PRIORITY SCORE:</span>
                <span className="text-white text-xs font-mono font-['Chakra_Petch']">
                  {hotspot.priority_score.toFixed(2)} / 100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. DATA PROVENANCE (AUDITED EXPANDABLE SECTION)             */}
      {/* ============================================================ */}
      <div className="p-3 rounded-xl bg-[#0A1118] border border-[#243441] space-y-2">
        <button
          onClick={() => setShowProvenance(!showProvenance)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#35C6E8]" />
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider font-['Chakra_Petch']">
              DATA PROVENANCE
            </span>
          </div>
          {showProvenance ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showProvenance && (
          <div className="pt-1.5 border-t border-[#243441] space-y-1.5 text-[9px] text-slate-400 leading-tight">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">THERMAL SOURCE</span>
                <span className="text-slate-200 font-bold">NASA FIRMS</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">SENSOR</span>
                <span className="text-slate-200 font-bold">VIIRS NOAA-21</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">PRODUCT</span>
                <span className="text-slate-200 font-bold">VIIRS_NOAA21_NRT</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">OBSERVATION WINDOW</span>
                <span className="text-slate-200 font-bold">03–07 OCT 2026</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">CURRENT OBSERVED DATA</span>
                <span className="text-slate-200 font-bold">03–06 OCT 2026</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">OBSERVATIONS</span>
                <span className="text-[#35C6E8] font-bold">2,696</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">PERSISTENT CANDIDATES</span>
                <span className="text-[#FFB020] font-bold">57</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">SATELLITE CONTEXT</span>
                <span className="text-slate-400 font-bold">0 / 57 VERIFIED (PENDING)</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">GEOGRAPHIC CONTEXT</span>
                <span className="text-slate-200 font-bold">Static reference dataset</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441]">
                <span className="text-slate-500 block uppercase">ML METHOD</span>
                <span className="text-[#35C6E8] font-bold">Unsupervised K-Means (K=4)</span>
              </div>
              <div className="p-1.5 rounded bg-[#101A23] border border-[#243441] col-span-2">
                <span className="text-slate-500 block uppercase">PRIORITY METHOD</span>
                <span className="text-slate-200 font-bold">Weighted analytical scoring</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#101A23] border border-[#243441] space-y-1">
              <span className="text-slate-300 font-bold block uppercase">SCIENTIFIC MANDATE:</span>
              <p>
                AGNI KAVACH DOES NOT CONFIRM AN INDUSTRIAL FIRE. It isolates persistent thermal anomalies requiring field investigation. Proximity to industrial corridors is contextual and does not constitute facility confirmation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
