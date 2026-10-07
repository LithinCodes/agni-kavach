import React, { useState } from 'react';
import {
  X,
  Flame,
  AlertTriangle,
  Satellite,
  Compass,
  FileText,
  Sparkles,
  Download,
  Activity,
  MapPin,
  Shield,
  Wind,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  HotspotRecord,
  NavigationTab,
} from '../types';
import { requestGeminiAssessment } from '../services/gemini';
import {
  startInvestigationInSupabase,
  raiseAlertInSupabase,
} from '../services/supabase';
import { exportIncidentDossierPDF, exportIncidentDossierXLSX } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { EvidenceChain } from './EvidenceChain';

interface IncidentDrawerProps {
  hotspot: HotspotRecord | null;
  onClose: () => void;
  onUpdateHotspot: (updated: HotspotRecord) => void;
  onOpenDossier: (hotspot: HotspotRecord) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
  onOpenAlertModal?: (hotspot: HotspotRecord) => void;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  hotspot,
  onClose,
  onUpdateHotspot,
  onOpenDossier,
  onNavigateToTab,
  onOpenAlertModal,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  if (!hotspot) return null;

  // Accordion open states for technical sections
  const [expandedSections, setExpandedSections] = useState<{
    thermal: boolean;
    geo_sat: boolean;
    reasoning: boolean;
    status: boolean;
  }>({
    thermal: false,
    geo_sat: false,
    reasoning: false,
    status: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Action status tracking
  const [actionLoading, setActionLoading] = useState<'investigation' | 'alert' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Gemini AI state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(hotspot.explanation || null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Exact math contributions
  const thermalC = hotspot.thermal_contribution ?? 0;
  const persistenceC = hotspot.persistence_contribution ?? 0;
  const detectionC = hotspot.detection_contribution ?? 0;
  const nightC = hotspot.night_contribution ?? 0;
  const geographicC = hotspot.geographic_contribution ?? 0;
  const calculatedSum = thermalC + persistenceC + detectionC + nightC + geographicC;

  // Handlers
  const handleStartInvestigation = async () => {
    if (!isAuthenticated) {
      openAuthModal('Operational clearance required: Please sign in to create and persist investigations.');
      return;
    }

    const rawStatus = String(hotspot.investigation_status || '').toUpperCase();
    if (rawStatus === 'UNDER_INVESTIGATION' || rawStatus === 'UNDER INVESTIGATION' || rawStatus.includes('INVESTIGAT')) {
      setActionFeedback({
        type: 'info',
        message: `Investigation is already active for ${hotspot.source_id}.`,
      });
      return;
    }

    setActionLoading('investigation');
    setActionFeedback(null);
    try {
      const res = await startInvestigationInSupabase(hotspot);
      if (res.success || (res as any).alreadyActive) {
        const updated: HotspotRecord = {
          ...hotspot,
          investigation_status: 'Under Investigation',
        };
        onUpdateHotspot(updated);
        setActionFeedback({
          type: 'success',
          message: `Investigation persisted in public.investigations for ${hotspot.source_id}.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: res.error || 'Database rejected investigation creation.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to start investigation.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRaiseAlert = async () => {
    if (!isAuthenticated) {
      openAuthModal('Operational clearance required: Please sign in to dispatch operational alerts.');
      return;
    }

    if (onOpenAlertModal) {
      onOpenAlertModal(hotspot);
      return;
    }

    const rawAlertStatus = String(hotspot.alert_status || '').toUpperCase();
    if (rawAlertStatus === 'ALERT_RAISED' || rawAlertStatus === 'ALERT RAISED' || rawAlertStatus.includes('RAISE')) {
      setActionFeedback({
        type: 'info',
        message: `Alert record already active for ${hotspot.source_id}.`,
      });
      return;
    }

    setActionLoading('alert');
    setActionFeedback(null);
    try {
      const res = await raiseAlertInSupabase(hotspot);
      if (res.success || (res as any).alreadyActive) {
        const updated: HotspotRecord = {
          ...hotspot,
          alert_status: 'Alert Raised',
        };
        onUpdateHotspot(updated);
        setActionFeedback({
          type: 'success',
          message: `Alert registered in public.alerts for ${hotspot.source_id}.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: res.error || 'Database rejected alert write.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to raise alert.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await requestGeminiAssessment(hotspot);
      if (res.error) {
        setAiError(res.error);
      } else if (res.assessment) {
        setAiReport(res.assessment);
        onUpdateHotspot({ ...hotspot, explanation: res.assessment });
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error executing AI assessment.');
    } finally {
      setAiLoading(false);
    }
  };

  const priorityColor =
    hotspot.priority_category === 'HIGH'
      ? 'text-[#EF4444]'
      : hotspot.priority_category === 'MEDIUM'
      ? 'text-[#F59E0B]'
      : hotspot.priority_category === 'CRITICAL'
      ? 'text-[#B91C1C]'
      : 'text-[#10B981]';

  const priorityBadgeStyle =
    hotspot.priority_category === 'HIGH'
      ? 'bg-red-950/80 text-red-400 border-red-500/60'
      : hotspot.priority_category === 'MEDIUM'
      ? 'bg-amber-950/80 text-amber-400 border-amber-500/60'
      : hotspot.priority_category === 'CRITICAL'
      ? 'bg-red-950/90 text-red-300 border-red-700/80'
      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/60';

  return (
    <div
      id="floating-incident-card"
      className="absolute top-3 right-3 bottom-3 w-[340px] sm:w-[360px] max-w-[calc(100vw-2rem)] z-30 flex flex-col bg-[#0A1118]/95 backdrop-blur-md border border-[#243441] rounded-xl shadow-2xl overflow-hidden font-mono text-xs select-none"
    >
      {/* 1. Header: AGNI-001 | HIGH PRIORITY | 76.37 | Close */}
      <div className="p-3.5 pb-2.5 border-b border-[#243441] bg-[#0D151D] shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 font-mono tracking-wide">
                {hotspot.source_id}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priorityBadgeStyle}`}
              >
                {hotspot.priority_category} PRIORITY
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {hotspot.nearest_city || hotspot.location || 'Regional Sector'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[9px] text-slate-500 uppercase">SCORE</div>
              <div className={`text-base font-bold font-['Chakra_Petch'] ${priorityColor}`}>
                {hotspot.priority_score.toFixed(2)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-6 h-6 ml-1 rounded hover:bg-[#101A23] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Incident Card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Body: Metrics + Actions + Progressive Disclosure */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 focus:outline-none">
        {/* Feedback Alert if any */}
        {actionFeedback && (
          <div
            className={`p-2 rounded text-[11px] border ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                : 'bg-[#101A23] border-[#35C6E8]/50 text-[#38BDF8]'
            }`}
          >
            {actionFeedback.message}
          </div>
        )}

        {/* Four Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* DETECTIONS */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441]">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">DETECTIONS</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5 font-['Chakra_Petch']">
              {hotspot.detections}
            </div>
          </div>

          {/* ACTIVE DAYS */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441]">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">ACTIVE DAYS</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5 font-['Chakra_Petch']">
              {hotspot.active_days} / 4
            </div>
          </div>

          {/* PERSISTENCE */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441]">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">PERSISTENCE</div>
            <div className="text-sm font-bold text-[#35C6E8] mt-0.5 font-['Chakra_Petch']">
              {(hotspot.persistence ?? 0).toFixed(0)}%
            </div>
          </div>

          {/* THERMAL RISK */}
          <div className="p-2 rounded bg-[#101A23] border border-[#243441]">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">THERMAL RISK</div>
            <div className="text-sm font-bold text-[#FF9F1C] mt-0.5 font-['Chakra_Petch']">
              {(hotspot.thermal_risk ?? 0).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Three Primary Actions */}
        <div className="space-y-1.5 pt-1">
          <div className="grid grid-cols-2 gap-1.5">
            {/* INVESTIGATE */}
            <button
              onClick={handleStartInvestigation}
              disabled={actionLoading !== null}
              className="py-2 px-2.5 rounded bg-[#FF9F1C]/15 hover:bg-[#FF9F1C]/25 border border-[#FF9F1C]/40 text-[#FFB020] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading === 'investigation' ? (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border-2 border-[#FFB020] border-t-transparent rounded-full animate-spin" />
                  SAVING...
                </span>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#FF9F1C]" />
                  <span>INVESTIGATE</span>
                </>
              )}
            </button>

            {/* VAYU-DRISHTI */}
            <button
              onClick={() => onNavigateToTab?.('impact')}
              className="py-2 px-2.5 rounded bg-[#35C6E8]/15 hover:bg-[#35C6E8]/25 border border-[#35C6E8]/40 text-[#38BDF8] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Wind className="w-3.5 h-3.5 text-[#35C6E8]" />
              <span>VAYU-DRISHTI</span>
            </button>
          </div>

          {/* RAISE ALERT */}
          <button
            onClick={handleRaiseAlert}
            disabled={actionLoading !== null}
            className="w-full py-2 px-2.5 rounded bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {actionLoading === 'alert' ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                DISPATCHING...
              </span>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>RAISE ALERT</span>
              </>
            )}
          </button>
        </div>

        {/* EVIDENCE CHAIN (PART 2 - COMPACT 8-STAGE AUDIT WORKFLOW) */}
        <EvidenceChain hotspot={hotspot} />

        {/* Progressive Disclosure Accordions */}
        <div className="pt-2 border-t border-[#243441] space-y-1.5">
          {/* 1. THERMAL EVIDENCE */}
          <div className="rounded border border-[#243441] overflow-hidden bg-[#101A23]">
            <button
              onClick={() => toggleSection('thermal')}
              className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-[#131F29] transition-colors cursor-pointer text-left"
            >
              <span className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#FF9F1C]" />
                THERMAL EVIDENCE
              </span>
              {expandedSections.thermal ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {expandedSections.thermal && (
              <div className="p-2.5 pt-1 text-[10px] space-y-1.5 border-t border-slate-800/60 text-slate-400">
                <div className="flex justify-between">
                  <span>Mean Sensor FRP:</span>
                  <span className="text-slate-200 font-bold">{hotspot.mean_frp?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Sensor FRP:</span>
                  <span className="text-rose-400 font-bold">{hotspot.max_frp?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Night Ratio:</span>
                  <span className="text-slate-200">
                    {((hotspot.night_ratio ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="text-slate-300 font-mono">
                    {hotspot.latitude.toFixed(4)}°N, {hotspot.longitude.toFixed(4)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dominant Factor:</span>
                  <span className="text-cyan-300 truncate max-w-[170px]">
                    {hotspot.dominant_factor || 'Persistence & FRP'}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-500 space-y-0.5">
                  <div className="font-bold text-slate-400">PRIORITY CONTRIBUTIONS:</div>
                  <div className="flex justify-between">
                    <span>Thermal Contribution:</span>
                    <span className="text-slate-300 font-mono">{thermalC.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persistence Contribution:</span>
                    <span className="text-slate-300 font-mono">{persistenceC.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detection Contribution:</span>
                    <span className="text-slate-300 font-mono">{detectionC.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Night Contribution:</span>
                    <span className="text-slate-300 font-mono">{nightC.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geographic Contribution:</span>
                    <span className="text-slate-300 font-mono">{geographicC.toFixed(3)}</span>
                  </div>
                  <div className="pt-1 flex justify-between font-bold text-cyan-300 border-t border-slate-800/80">
                    <span>Calculated Sum:</span>
                    <span>{calculatedSum.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. GEO / SATELLITE */}
          <div className="rounded border border-[#243441] overflow-hidden bg-[#101A23]">
            <button
              onClick={() => toggleSection('geo_sat')}
              className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-[#131F29] transition-colors cursor-pointer text-left"
            >
              <span className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                <Satellite className="w-3 h-3 text-[#35C6E8]" />
                GEO / SATELLITE
              </span>
              {expandedSections.geo_sat ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {expandedSections.geo_sat && (
              <div className="p-2.5 pt-1 text-[10px] space-y-1.5 border-t border-slate-800/60 text-slate-400">
                <div className="flex justify-between">
                  <span>Nearest City:</span>
                  <span className="text-slate-200">
                    {hotspot.nearest_city || 'Regional Center'} ({(hotspot.distance_to_city_km ?? 7.4).toFixed(1)} km)
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span>ML Archetype:</span>
                  <div className="text-right">
                    <span className="text-emerald-300 font-bold block">
                      #{hotspot.ml_cluster}: {hotspot.pattern_profile}
                    </span>
                    <span className="text-[8px] text-slate-500 block">
                      Operational Partition (K=4, sil=0.3195; Math Best K=2, sil=0.4637)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Satellite Evidence:</span>
                  <span className="text-indigo-400 font-bold">NOT AVAILABLE</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification State:</span>
                  <span className="text-amber-400 font-bold">TASKING PENDING</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-slate-800 text-[9px] text-slate-300 space-y-1">
                  <p>
                    No verified archival Sentinel-2 context is currently associated with this candidate.
                  </p>
                  <p className="text-slate-500 italic border-t border-slate-900 pt-1">
                    Satellite imagery is a subsequent verification layer and is not used here as confirmed evidence of industrial activity.
                  </p>
                </div>
                <div className="flex justify-between">
                  <span>Geographic Context:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">
                    {hotspot.geographic_context || 'Designated Heavy Industry Zone'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. REASONING */}
          <div className="rounded border border-[#243441] overflow-hidden bg-[#101A23]">
            <button
              onClick={() => toggleSection('reasoning')}
              className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-[#131F29] transition-colors cursor-pointer text-left"
            >
              <span className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#35C6E8]" />
                REASONING
              </span>
              {expandedSections.reasoning ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {expandedSections.reasoning && (
              <div className="p-2.5 pt-1 text-[10px] space-y-2 border-t border-[#243441]">
                <div className="p-2 rounded bg-[#0D151D] border border-[#243441] text-slate-300 leading-relaxed font-sans">
                  <div className="text-[9px] font-mono text-[#35C6E8] font-bold uppercase mb-1">
                    Database Reasoning:
                  </div>
                  {hotspot.explanation || 'Multi-day continuous night thermal signature detected in industrial zone.'}
                </div>

                <button
                  onClick={handleGenerateAi}
                  disabled={aiLoading}
                  className="w-full py-1.5 px-2 rounded bg-[#35C6E8]/20 hover:bg-[#35C6E8]/30 border border-[#35C6E8]/40 text-[#38BDF8] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{aiLoading ? 'GENERATING AI REASONING...' : 'LIVE GEMINI GEOSPATIAL ASSESSMENT'}</span>
                </button>

                {aiError && (
                  <div className="p-2 rounded bg-rose-950/70 border border-rose-500/50 text-rose-300 text-[9px]">
                    {aiError}
                  </div>
                )}

                {aiReport && aiReport !== hotspot.explanation && (
                  <div className="p-2 rounded bg-[#0D151D] border border-[#35C6E8]/40 text-slate-200 leading-relaxed font-sans text-[10px]">
                    <div className="font-mono text-[#35C6E8] font-bold text-[9px] mb-1">
                      Gemini Live Assessment:
                    </div>
                    {aiReport}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. STATUS & EXPORT */}
          <div className="rounded border border-[#243441] overflow-hidden bg-[#101A23]">
            <button
              onClick={() => toggleSection('status')}
              className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-[#131F29] transition-colors cursor-pointer text-left"
            >
              <span className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-400" />
                STATUS & DOSSIER
              </span>
              {expandedSections.status ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {expandedSections.status && (
              <div className="p-2.5 pt-1 text-[10px] space-y-2 border-t border-slate-800/60 text-slate-400">
                <div className="flex justify-between">
                  <span>Investigation:</span>
                  <span className="text-amber-300 font-bold">
                    {hotspot.investigation_status || 'Under Investigation'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Alert Status:</span>
                  <span className="text-rose-400 font-bold">
                    {hotspot.alert_status || 'Alert Raised'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => exportIncidentDossierPDF(hotspot)}
                    className="py-1.5 px-2 rounded bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>PDF DOSSIER</span>
                  </button>
                  <button
                    onClick={() => exportIncidentDossierXLSX(hotspot)}
                    className="py-1.5 px-2 rounded bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    <span>XLSX DATA</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
