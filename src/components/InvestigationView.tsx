import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Satellite,
  Hospital,
  Wind,
  Radio,
  Eye,
  Printer,
  ChevronRight,
  Send,
  AlertTriangle,
  FileCheck2,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { HotspotRecord } from '../types';
import { DossierModal } from './DossierModal';
import { WhyDidYouAlertModal } from './WhyDidYouAlertModal';
import { getSensitiveLocationsForHotspot, getAirQualityContext } from '../services/impactService';
import { exportIncidentDossierPDF, exportIncidentDossierXLSX } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { startInvestigationInSupabase } from '../services/supabase';

interface InvestigationViewProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onOpenAlertModal?: (hotspot: HotspotRecord) => void;
  onUpdateHotspot?: (updated: HotspotRecord) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  hotspots,
  selectedHotspot: propSelectedHotspot,
  onSelectHotspot,
  onOpenAlertModal,
  onUpdateHotspot,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [isSavingInvestigation, setIsSavingInvestigation] = useState(false);
  const [investigationFeedback, setInvestigationFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const currentHotspot = useMemo(() => {
    if (propSelectedHotspot) return propSelectedHotspot;
    const high = hotspots.find((h) => h.priority_category === 'HIGH');
    return high || hotspots[0] || null;
  }, [propSelectedHotspot, hotspots]);

  // Investigation form state
  const [investigatorNotes, setInvestigatorNotes] = useState(
    'Thermal recurrence observed over multiple NOAA-21 nighttime overpasses (01:30 local). Cluster geometry matches stationary high-temperature source. No declared industrial outage logged.'
  );
  const [findingsText, setFindingsText] = useState(
    'Consistent with continuous kiln / blast-furnace or industrial flare operations. Requires local ground sensor verification and stack emission audit.'
  );
  const [confidenceRating, setConfidenceRating] = useState<'HIGH' | 'MODERATE' | 'LOW'>('HIGH');
  const [recommendedAction, setRecommendedAction] = useState(
    'Deploy mobile SPCB air-monitoring van & dispatch local Fire Officer for perimeter inspection.'
  );

  // Evidence verification checklist
  const [evidenceChecklist, setEvidenceChecklist] = useState<{ [key: string]: boolean }>({
    firms: true,
    sentinel: true,
    sensitive: true,
    weather: true,
    air: false,
    citizen: true,
  });

  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isWhyAlertOpen, setIsWhyAlertOpen] = useState(false);

  if (!currentHotspot) {
    return <div className="p-8 text-center text-slate-400 font-mono">No incident selected.</div>;
  }

  const sensitiveLocations = getSensitiveLocationsForHotspot(currentHotspot);
  const airQuality = getAirQualityContext(currentHotspot);

  return (
    <div
      id="investigation-view"
      className="flex-1 flex flex-col min-h-0 bg-[#080C14] text-slate-200 overflow-y-auto font-mono text-xs select-none"
    >
      {/* Top Action Bar */}
      <div className="h-14 shrink-0 bg-[#0D1424] border-b border-slate-800 px-4 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">INVESTIGATE:</span>
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWhyAlertOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/50 text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>WHY ALERT?</span>
          </button>

          {onOpenAlertModal && (
            <button
              onClick={() => onOpenAlertModal(currentHotspot)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 text-xs font-bold transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>RAISE ALERT</span>
            </button>
          )}

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => exportIncidentDossierPDF(currentHotspot, investigatorNotes, recommendedAction)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
              title="Download full incident dossier as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PDF</span>
            </button>

            <button
              onClick={() => exportIncidentDossierXLSX(currentHotspot)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
              title="Download telemetry and receptors in Excel XLSX format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>DOWNLOAD XLSX</span>
            </button>

            <button
              onClick={() => setIsDossierOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              title="Preview dossier modal"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>PREVIEW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-4 max-w-7xl mx-auto w-full space-y-4">
        {/* Title Header */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/60 via-[#0D1424] to-slate-950 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                ANALYTICAL INVESTIGATION WORKBENCH
              </div>
              <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white tracking-wider">
                INCIDENT DOSSIER BUILDER: {currentHotspot.source_id}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Multi-source evidence synthesis, confidence rating, and formal agency directive generation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">ANOMALY VERIFICATION RATING:</div>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">{confidenceRating} VERIFICATION</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* COLUMN 1 & 2: INVESTIGATION NOTES & EVIDENCE */}
          <div className="lg:col-span-2 space-y-4">
            {/* Field Notes & Analytical Findings */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-4">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                INVESTIGATIVE NOTES & FIELD OBSERVATIONS
              </span>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    ANALYTICAL LOG & SATELLITE INTERPRETATION:
                  </label>
                  <textarea
                    rows={4}
                    value={investigatorNotes}
                    onChange={(e) => setInvestigatorNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    PRIMARY FINDINGS / PHYSICAL CAUSE HYPOTHESIS:
                  </label>
                  <textarea
                    rows={3}
                    value={findingsText}
                    onChange={(e) => setFindingsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      ANOMALY VERIFICATION RATING:
                    </label>
                    <select
                      value={confidenceRating}
                      onChange={(e) => setConfidenceRating(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="HIGH">HIGH (Multi-pass VIIRS + Ground Corroboration)</option>
                      <option value="MODERATE">MODERATE (Satellite Radiometry Only)</option>
                      <option value="LOW">LOW (Single Orbital Pass / Cloud Obscuration)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      RECOMMENDED AGENCY ACTION:
                    </label>
                    <input
                      type="text"
                      value={recommendedAction}
                      onChange={(e) => setRecommendedAction(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Checklist Verification Matrix */}
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                CROSS-SOURCE EVIDENCE VERIFICATION CHECKLIST
              </span>

              <div className="space-y-2">
                {[
                  {
                    id: 'firms',
                    icon: Flame,
                    label: 'NASA FIRMS VIIRS NOAA-21 NRT Telemetry',
                    detail: `${currentHotspot.detections} cluster pixels • 5-day analytical window • Persistence ${currentHotspot.persistence}%`,
                  },
                  {
                    id: 'sentinel',
                    icon: Satellite,
                    label: 'Sentinel-2 Level-2A Spectral Index Baseline',
                    detail: currentHotspot.satellite_available
                      ? `Archival Scene (${currentHotspot.satellite_scene_date || 'Pre-event pass'}) • Built-surface context: ${currentHotspot.built_surface_context}`
                      : 'No archival optical scene available for this coordinate',
                  },
                  {
                    id: 'sensitive',
                    icon: Hospital,
                    label: 'OpenStreetMap Sensitive Receptor Proximity',
                    detail: `${sensitiveLocations.length} sensitive locations detected within 15 km perimeter`,
                  },
                  {
                    id: 'weather',
                    icon: Wind,
                    label: 'Atmospheric Dispersion Scenario (Vayu-Drishti)',
                    detail: 'Mathematical downwind corridor simulated for 8.8 km tactical radius',
                  },
                  {
                    id: 'air',
                    icon: Radio,
                    label: 'In-Situ Regional CAAQMS Air Quality Data',
                    detail: airQuality?.hasLiveSensorNearby
                      ? `Regional sensor: ${airQuality.stationName} (${airQuality.distanceKm} km away)`
                      : 'No live ground air-monitoring sensor available within range',
                  },
                  {
                    id: 'citizen',
                    icon: Eye,
                    label: 'Citizen Ground Observation Reports',
                    detail: 'Field corroboration reports received from surrounding community',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      evidenceChecklist[item.id]
                        ? 'bg-slate-900/90 border-cyan-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <item.icon className={`w-4 h-4 mt-0.5 ${evidenceChecklist[item.id] ? 'text-cyan-400' : 'text-slate-600'}`} />
                      <div>
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.detail}</div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={evidenceChecklist[item.id]}
                      onChange={(e) =>
                        setEvidenceChecklist({
                          ...evidenceChecklist,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="accent-cyan-500 w-4 h-4 rounded ml-4 shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: SUMMARY DOSSIER SNAPSHOT */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase text-xs block border-b border-slate-800 pb-2">
                DOSSIER QUICK PROFILE
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Incident ID:</span>
                  <span className="text-cyan-300 font-bold font-mono">{currentHotspot.source_id}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Priority Category:</span>
                  <span className="text-rose-300 font-bold">{currentHotspot.priority_category}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Calculated Score:</span>
                  <span className="text-white font-bold font-mono">{currentHotspot.priority_score.toFixed(2)}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Nearest City:</span>
                  <span className="text-slate-200">{currentHotspot.nearest_city}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Distance:</span>
                  <span className="text-cyan-300 font-mono">{currentHotspot.distance_to_city_km} km</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Active Days:</span>
                  <span className="text-amber-300 font-mono">{currentHotspot.active_days} of 5</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                {/* Supabase Field Investigation Action (Protected) */}
                <div className="p-2.5 rounded-lg bg-[#080C14] border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">SUPABASE INVESTIGATION:</span>
                    <span className="text-cyan-300 font-mono font-bold">
                      {currentHotspot.investigation_status || 'UNREVIEWED'}
                    </span>
                  </div>
                  <button
                    id="btn-initiate-investigation-supabase"
                    disabled={isSavingInvestigation}
                    onClick={async () => {
                      if (!isAuthenticated) {
                        openAuthModal(
                          'Operational clearance required: Please sign in as an operator to initiate and persist field investigations in Supabase.'
                        );
                        return;
                      }
                      setIsSavingInvestigation(true);
                      setInvestigationFeedback(null);
                      try {
                        const res = await startInvestigationInSupabase(currentHotspot);
                        if (res.success) {
                          const updated: HotspotRecord = {
                            ...currentHotspot,
                            investigation_status: 'UNDER_INVESTIGATION',
                          };
                          onUpdateHotspot?.(updated);
                          setInvestigationFeedback({
                            type: 'success',
                            text: `Investigation for ${currentHotspot.source_id} successfully recorded in public.investigations.`,
                          });
                        } else {
                          setInvestigationFeedback({
                            type: 'error',
                            text: res.error || 'Failed to persist investigation to Supabase.',
                          });
                        }
                      } catch (err: any) {
                        setInvestigationFeedback({
                          type: 'error',
                          text: err?.message || 'Network error communicating with Supabase.',
                        });
                      } finally {
                        setIsSavingInvestigation(false);
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-xs font-mono transition-all shadow-[0_0_10px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingInvestigation ? (
                      <span className="flex items-center gap-1.5 text-black">
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        PERSISTING TO SUPABASE...
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-black" />
                        <span>INITIATE FIELD INVESTIGATION (SUPABASE)</span>
                      </>
                    )}
                  </button>

                  {investigationFeedback && (
                    <div
                      className={`p-2 rounded text-[10px] leading-tight ${
                        investigationFeedback.type === 'success'
                          ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {investigationFeedback.text}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => exportIncidentDossierPDF(currentHotspot, investigatorNotes, recommendedAction)}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD DOSSIER (PDF)</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => exportIncidentDossierXLSX(currentHotspot)}
                    className="py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>EXPORT XLSX</span>
                  </button>
                  <button
                    onClick={() => setIsDossierOpen(true)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PREVIEW</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scientific Transparency Notice */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono leading-relaxed space-y-1">
              <div className="text-cyan-400 font-bold uppercase">CHAIN OF CUSTODY NOTICE:</div>
              <p>
                All evidence compilations must comply with DDMA standard operating procedures. Satellite telemetry alone serves as an early-warning screening tool; forensic environmental confirmation requires certified ground sampling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DossierModal
        hotspot={currentHotspot}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        investigationNotes={investigatorNotes}
        recommendedAction={recommendedAction}
      />

      <WhyDidYouAlertModal
        hotspot={currentHotspot}
        isOpen={isWhyAlertOpen}
        onClose={() => setIsWhyAlertOpen(false)}
      />
    </div>
  );
};
