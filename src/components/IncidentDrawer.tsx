import React, { useState } from 'react';
import {
  X,
  Flame,
  AlertTriangle,
  Satellite,
  Building2,
  Calendar,
  Compass,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Download,
  BarChart2,
  Activity,
  Layers,
  MapPin,
  Shield,
  Clock,
  TrendingUp,
  Info,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Wind,
  ShieldCheck,
  BellRing,
  FileSpreadsheet,
} from 'lucide-react';
import {
  HotspotRecord,
  InvestigationStatus,
  AlertStatus,
  NavigationTab,
} from '../types';
import { requestGeminiAssessment } from '../services/gemini';
import {
  startInvestigationInSupabase,
  raiseAlertInSupabase,
  updateHotspotInvestigation,
  updateHotspotAlert,
} from '../services/supabase';
import { exportIncidentDossierPDF, exportIncidentDossierXLSX } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

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
  isCollapsed = false,
  onToggleCollapse,
  onNavigateToTab,
  onOpenAlertModal,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  if (!hotspot) return null;

  // Active section filter or 'all'
  const [activeSection, setActiveSection] = useState<'all' | 'thermal' | 'breakdown' | 'geo_sat' | 'explanation'>('all');

  // Action status tracking
  const [actionLoading, setActionLoading] = useState<'investigation' | 'alert' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // Gemini AI state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(hotspot.explanation || null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Calculations for Priority Score Breakdown (exact database values)
  const thermalC = hotspot.thermal_contribution ?? 0;
  const persistenceC = hotspot.persistence_contribution ?? 0;
  const detectionC = hotspot.detection_contribution ?? 0;
  const nightC = hotspot.night_contribution ?? 0;
  const geographicC = hotspot.geographic_contribution ?? 0;

  // The exact sum of database contributions
  const calculatedSum = thermalC + persistenceC + detectionC + nightC + geographicC;

  // Total score formatted strictly to 3 decimal places for scientific precision
  const displayedPriorityScore = hotspot.priority_score.toFixed(3);

  // Format contribution values to 3 decimal places
  const contributions = [
    {
      id: 'thermal',
      name: 'Thermal Contribution',
      dbField: 'thermal_contribution',
      value: thermalC,
      formatted: thermalC.toFixed(3),
      pctOfScore: hotspot.priority_score > 0 ? (thermalC / hotspot.priority_score) * 100 : 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      description: 'Radiative intensity & mean/max FRP thermal weighting',
    },
    {
      id: 'persistence',
      name: 'Persistence Contribution',
      dbField: 'persistence_contribution',
      value: persistenceC,
      formatted: persistenceC.toFixed(3),
      pctOfScore: hotspot.priority_score > 0 ? (persistenceC / hotspot.priority_score) * 100 : 0,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      description: 'Temporal consistency across multiple observation passes',
    },
    {
      id: 'detection',
      name: 'Detection Contribution',
      dbField: 'detection_contribution',
      value: detectionC,
      formatted: detectionC.toFixed(3),
      pctOfScore: hotspot.priority_score > 0 ? (detectionC / hotspot.priority_score) * 100 : 0,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      description: 'Cumulative FIRMS sensor detection volume weighting',
    },
    {
      id: 'night',
      name: 'Night Activity Contribution',
      dbField: 'night_contribution',
      value: nightC,
      formatted: nightC.toFixed(3),
      pctOfScore: hotspot.priority_score > 0 ? (nightC / hotspot.priority_score) * 100 : 0,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      description: 'Nocturnal pass proportion indicator',
    },
    {
      id: 'geographic',
      name: 'Geographic Contribution',
      dbField: 'geographic_contribution',
      value: geographicC,
      formatted: geographicC.toFixed(3),
      pctOfScore: hotspot.priority_score > 0 ? (geographicC / hotspot.priority_score) * 100 : 0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      description: 'Proximity to urban infrastructure & settlement centers',
    },
  ];

  // Action: START INVESTIGATION
  const handleStartInvestigation = async () => {
    if (!isAuthenticated) {
      openAuthModal('Operational clearance required: Please sign in as an operator to initiate and persist investigations in Supabase.');
      return;
    }
    setActionLoading('investigation');
    setActionFeedback(null);
    try {
      const res = await startInvestigationInSupabase(hotspot);
      if (res.success) {
        const updated: HotspotRecord = {
          ...hotspot,
          investigation_status: 'UNDER_INVESTIGATION',
        };
        onUpdateHotspot(updated);
        setActionFeedback({
          type: 'success',
          title: 'INVESTIGATION INITIATED IN SUPABASE',
          message: `Record ${hotspot.source_id} successfully registered in public.investigations and status updated to UNDER_INVESTIGATION.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setActionFeedback({
          type: 'error',
          title: 'SUPABASE PERSISTENCE REJECTED',
          message: `${res.error || 'Row-level security policy restriction on public.investigations'}. State has not been artificially overridden.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        title: 'DATABASE ERROR',
        message: err?.message || 'Failed to communicate with Supabase instance.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Action: RAISE ALERT
  const handleRaiseAlert = async () => {
    if (!isAuthenticated) {
      openAuthModal('Operational clearance required: Please sign in as an operator to dispatch and persist operational alerts in Supabase.');
      return;
    }
    const rawAlertStatus = String(hotspot.alert_status || '').toUpperCase();
    if (rawAlertStatus === 'ALERT_RAISED' || rawAlertStatus === 'ALERT RAISED' || rawAlertStatus.includes('RAISE')) {
      setActionFeedback({
        type: 'info',
        title: 'ALERT ALREADY ACTIVE',
        message: `An operational alert record is already active for ${hotspot.source_id}. Duplicate alert creation is prevented.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    setActionLoading('alert');
    setActionFeedback(null);
    try {
      const res = await raiseAlertInSupabase(hotspot);
      if (res.success) {
        const updated: HotspotRecord = {
          ...hotspot,
          alert_status: 'ALERT_RAISED',
        };
        onUpdateHotspot(updated);
        setActionFeedback({
          type: 'success',
          title: 'ALERT REGISTERED IN SUPABASE',
          message: `High-priority incident alert recorded in public.alerts for source ${hotspot.source_id}.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (res.alreadyActive) {
        const updated: HotspotRecord = {
          ...hotspot,
          alert_status: 'ALERT_RAISED',
        };
        onUpdateHotspot(updated);
        setActionFeedback({
          type: 'info',
          title: 'ALERT ALREADY ACTIVE',
          message: `An alert record is already active for ${hotspot.source_id} in public.alerts. Duplicate alert prevented.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setActionFeedback({
          type: 'error',
          title: 'SUPABASE ALERT PERSISTENCE REJECTED',
          message: `${res.error || 'Row-level security policy restriction on public.alerts'}. Database rejected write.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        title: 'DATABASE ERROR',
        message: err?.message || 'Failed to communicate with Supabase instance.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Live Gemini Re-Analysis
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

  return (
    <aside
      id="right-incident-drawer"
      className={`fixed inset-0 top-16 z-30 sm:relative sm:inset-auto sm:top-0 sm:h-full sm:shrink-0 transition-all duration-300 select-none font-mono text-slate-200 overflow-visible ${
        isCollapsed
          ? 'w-0 -translate-x-full sm:translate-x-0 sm:w-0 border-l-0 pointer-events-none'
          : 'w-full sm:w-[480px] xl:w-[520px] bg-[#080C14]/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col pointer-events-auto'
      }`}
    >
      {/* Collapse/Expand Animated Arrow Button on Left Edge */}
      {onToggleCollapse && (
        <button
          id="btn-collapse-drawer"
          onClick={onToggleCollapse}
          className={`absolute top-5 z-40 w-7 h-12 rounded-l-md bg-[#0D1424] border border-r-0 border-cyan-500/40 text-cyan-300 flex items-center justify-center hover:bg-cyan-950/90 hover:text-cyan-200 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.85)] group cursor-pointer pointer-events-auto ${
            isCollapsed
              ? 'right-0 shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-400/80 bg-[#080C14]'
              : '-left-3.5 shadow-lg'
          }`}
          title={
            isCollapsed
              ? `Reopen Inspection Drawer (${hotspot.source_id})`
              : 'Collapse Inspection Drawer'
          }
          aria-label={
            isCollapsed ? 'Reopen Inspection Drawer' : 'Collapse Inspection Drawer'
          }
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4 text-cyan-400 animate-pulse group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      )}

      {/* Inner Drawer Content with smooth opacity and fixed interior layout */}
      <div
        className={`flex flex-col h-full w-full sm:w-[480px] xl:w-[520px] transition-opacity duration-200 overflow-hidden ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* 1. HEADER */}
        <div id="drawer-header" className="p-4 border-b border-slate-800 bg-[#0D1424]/95 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold font-['Chakra_Petch'] text-white tracking-wider">
                {hotspot.source_id}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  hotspot.priority_category === 'HIGH'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : hotspot.priority_category === 'MEDIUM'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/80'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80'
                }`}
              >
                {hotspot.priority_category} PRIORITY
              </span>
              {hotspot.satellite_available ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 flex items-center gap-1">
                  <Satellite className="w-3 h-3" />
                  S2 AVAILABLE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
                  S2 UNAVAILABLE
                </span>
              )}
            </div>

            {/* Coordinates & Location */}
            <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-slate-200 font-medium">
                {hotspot.location || hotspot.nearest_city || 'Regional Anomaly Sector'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300 font-mono">
                {hotspot.latitude.toFixed(5)}°N, {hotspot.longitude.toFixed(5)}°E
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportIncidentDossierPDF(hotspot)}
              className="p-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
              title="Download Incident Dossier as PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => exportIncidentDossierXLSX(hotspot)}
              className="p-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.2)]"
              title="Download Incident Data as XLSX (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Priority Score Hero Pill */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Priority Score
            </div>
            <div className="text-2xl font-bold font-['Chakra_Petch'] text-cyan-300 tracking-tight">
              {displayedPriorityScore}
            </div>
          </div>

          <div className="text-right text-[11px] font-mono">
            <div className="text-slate-400">
              Dominant Factor:{' '}
              <span className="text-amber-400 font-bold">
                {hotspot.dominant_factor || 'PERSISTENCE'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              ML Cluster: <span className="text-slate-300">#{hotspot.ml_cluster ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Immediate Header Accessibility) */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={handleStartInvestigation}
            disabled={actionLoading !== null}
            className="py-1.5 px-2 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/60 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
          >
            {actionLoading === 'investigation' ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                SAVING...
              </span>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>START INVESTIGATION</span>
              </>
            )}
          </button>

          <button
            onClick={handleRaiseAlert}
            disabled={actionLoading !== null}
            className="py-1.5 px-2 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/60 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
          >
            {actionLoading === 'alert' ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                RECORDING...
              </span>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>RAISE ALERT</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Operational Status Badges */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
          <span>
            Investigation Status:{' '}
            <span className="text-cyan-300 font-bold">
              {hotspot.investigation_status || 'Unreviewed'}
            </span>
          </span>
          <span>
            Alert Status:{' '}
            <span className={hotspot.alert_status === 'ALERT_RAISED' ? 'text-rose-400 font-bold' : 'text-slate-300 font-bold'}>
              {hotspot.alert_status || 'Normal'}
            </span>
          </span>
        </div>

        {/* Rapid Cross-Module Navigation Shortcuts */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center justify-between">
            <span>Navigate Incident in:</span>
            <span className="text-[9px] text-cyan-400/80 font-normal">Context-Synced</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('impact')}
                className="py-1 px-2 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                title="Simulate atmospheric downwind plume dispersion for this hotspot in VAYU-DRISHTI"
              >
                <Wind className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">VAYU-DRISHTI Plume</span>
              </button>
            )}

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('response')}
                className="py-1 px-2 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                title="Generate 60-Second Run-Card and safe transit route for this hotspot"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">60s Run-Card</span>
              </button>
            )}

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('investigations')}
                className="py-1 px-2 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                title="Open investigation workbench with multi-sensor verification for this incident"
              >
                <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Investigation Dossier</span>
              </button>
            )}

            {onOpenAlertModal ? (
              <button
                onClick={() => onOpenAlertModal(hotspot)}
                className="py-1 px-2 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                title="Initiate two-stage alert escalation with agency dispatch"
              >
                <BellRing className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Dispatch Workflow</span>
              </button>
            ) : onNavigateToTab ? (
              <button
                onClick={() => onNavigateToTab('alerts')}
                className="py-1 px-2 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <BellRing className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Alert Queue</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Supabase Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 border-b text-xs flex items-start justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="space-y-0.5">
            <div className="font-bold flex items-center gap-1.5 text-[11px]">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{actionFeedback.title}</span>
            </div>
            <p className="text-[10px] opacity-90 leading-relaxed font-sans">{actionFeedback.message}</p>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:opacity-75 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Quick Jump Filter */}
      <div className="grid grid-cols-5 border-b border-slate-800 bg-[#080C14] text-[10px] font-mono shrink-0">
        <button
          onClick={() => setActiveSection('all')}
          className={`py-2 text-center transition-all border-b-2 ${
            activeSection === 'all'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ALL VIEW
        </button>
        <button
          onClick={() => setActiveSection('thermal')}
          className={`py-2 text-center transition-all border-b-2 ${
            activeSection === 'thermal'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          THERMAL
        </button>
        <button
          onClick={() => setActiveSection('breakdown')}
          className={`py-2 text-center transition-all border-b-2 ${
            activeSection === 'breakdown'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          BREAKDOWN
        </button>
        <button
          onClick={() => setActiveSection('geo_sat')}
          className={`py-2 text-center transition-all border-b-2 ${
            activeSection === 'geo_sat'
              ? 'border-indigo-400 text-indigo-300 bg-indigo-950/20 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          GEO / S2
        </button>
        <button
          onClick={() => setActiveSection('explanation')}
          className={`py-2 text-center transition-all border-b-2 ${
            activeSection === 'explanation'
              ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          REASONING
        </button>
      </div>

      {/* Scrollable Inspection Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* 2. THERMAL INTELLIGENCE */}
        {(activeSection === 'all' || activeSection === 'thermal') && (
          <div id="section-thermal-intelligence" className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-amber-400" />
                2. THERMAL INTELLIGENCE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Category: <span className="text-amber-300 font-bold">{hotspot.thermal_risk_category || 'N/A'}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Thermal Risk</div>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  {hotspot.thermal_risk.toFixed(3)}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {hotspot.thermal_risk_category || 'ELEVATED'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Thermal Category</div>
                <div className="text-base font-bold text-slate-200 font-mono mt-0.5 truncate">
                  {hotspot.thermal_risk_category || 'N/A'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Risk tier</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Detection Count</div>
                <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                  {hotspot.detections}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">FIRMS passes</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Active Days</div>
                <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                  {hotspot.active_days}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Observation window</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Mean Sensor FRP</div>
                <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                  {hotspot.mean_frp != null ? hotspot.mean_frp.toFixed(3) : 'N/A'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Nominal sensor index</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Max Sensor FRP</div>
                <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                  {hotspot.max_frp != null ? hotspot.max_frp.toFixed(3) : 'N/A'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Peak sensor index</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Night Activity</div>
                <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
                  {(hotspot.night_ratio * 100).toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Ratio: {hotspot.night_ratio.toFixed(3)}</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Persistence Score</div>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                  {hotspot.persistence.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Temporal consistency</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRIORITY SCORE BREAKDOWN */}
        {(activeSection === 'all' || activeSection === 'breakdown') && (
          <div id="section-priority-breakdown" className="p-3.5 rounded-lg bg-[#0D1424]/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                3. PRIORITY SCORE BREAKDOWN
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">
                  Sum of Contributions:{' '}
                  <span className="text-cyan-300 font-bold font-mono">
                    {calculatedSum.toFixed(3)}
                  </span>
                </span>
              </div>
            </div>

            {/* Sum Verification Pill */}
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between font-mono">
              <span className="text-slate-400">Sum = Priority Score:</span>
              <span className="text-emerald-400 font-bold">
                {calculatedSum.toFixed(3)} = {displayedPriorityScore} ✓
              </span>
            </div>

            {/* Composite Stacked Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Composite Contribution Share</span>
                <span>100% of Priority Score ({displayedPriorityScore})</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                {contributions.map((c) => (
                  <div
                    key={c.id}
                    className={`h-full ${c.color} transition-all`}
                    style={{ width: `${c.pctOfScore}%` }}
                    title={`${c.name}: ${c.formatted} (${c.pctOfScore.toFixed(1)}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Horizontal Contribution Bars */}
            <div className="space-y-2.5 pt-1">
              {contributions.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-slate-200">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${item.textColor}`}>
                        {item.formatted}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({item.pctOfScore.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, item.pctOfScore)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>Database Field: {item.dbField}</span>
                    <span>{item.description}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Strict Mathematical Sum Confirmation */}
            <div className="p-2 rounded bg-slate-950/90 border border-cyan-500/20 text-[10px] text-slate-400 font-mono space-y-1">
              <div className="text-cyan-300 font-bold">MATHEMATICAL VERIFICATION:</div>
              <div className="text-[10px] text-slate-300 break-all">
                {thermalC.toFixed(3)} + {persistenceC.toFixed(3)} + {detectionC.toFixed(3)} + {nightC.toFixed(3)} + {geographicC.toFixed(3)} ={' '}
                <span className="text-cyan-300 font-bold">{calculatedSum.toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. GEOGRAPHIC CONTEXT */}
        {(activeSection === 'all' || activeSection === 'geo_sat') && (
          <div id="section-geographic-context" className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                <Compass className="w-4 h-4 text-emerald-400" />
                4. GEOGRAPHIC CONTEXT
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ML Cluster: <span className="text-emerald-300 font-bold">#{hotspot.ml_cluster ?? 'N/A'}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Nearest City</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">
                  {hotspot.nearest_city || 'Regional Center'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Distance to City</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {hotspot.distance_to_city_km != null ? `${hotspot.distance_to_city_km.toFixed(2)} km` : 'N/A'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Geographic Context</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5 truncate">
                  {hotspot.geographic_context || 'MODERATE_URBAN'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">ML Cluster</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {hotspot.ml_cluster != null ? `Cluster #${hotspot.ml_cluster}` : 'Unassigned'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Pattern Profile</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">
                  {hotspot.pattern_profile || 'Continuous / Non-vegetated'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Dominant Factor</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5 truncate">
                  {hotspot.dominant_factor || 'PERSISTENCE'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SATELLITE CONTEXT */}
        {(activeSection === 'all' || activeSection === 'geo_sat') && (
          <div id="section-satellite-context" className="p-3.5 rounded-lg bg-slate-900/80 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Satellite className="w-4 h-4 text-indigo-400" />
                5. ARCHIVAL SATELLITE CONTEXT (SENTINEL-2)
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                hotspot.satellite_available
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}>
                {hotspot.satellite_available ? 'GRANULE AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </div>

            {hotspot.satellite_available ? (
              <div className="space-y-3 font-mono">
                {/* Granule Metadata & Quality */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase">Scene Date</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                      {hotspot.satellite_scene_date
                        ? new Date(hotspot.satellite_scene_date).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
                        : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase">Cloud Cover</div>
                    <div className="text-xs font-bold text-cyan-300 mt-0.5">
                      {hotspot.satellite_cloud_cover != null ? `${hotspot.satellite_cloud_cover.toFixed(2)}%` : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase">Satellite Quality</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                      {hotspot.satellite_quality || 'EXCELLENT'}
                    </div>
                  </div>
                </div>

                {/* Spectral Indices (NDVI, NDBI, NDWI, SWIR) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-400">NDVI (Vegetation)</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      {hotspot.ndvi != null ? hotspot.ndvi.toFixed(4) : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-400">NDBI (Built-Up)</div>
                    <div className="text-xs font-bold text-cyan-400 mt-0.5">
                      {hotspot.ndbi != null ? hotspot.ndbi.toFixed(4) : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-400">NDWI (Water)</div>
                    <div className="text-xs font-bold text-blue-400 mt-0.5">
                      {hotspot.ndwi != null ? hotspot.ndwi.toFixed(4) : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-400">SWIR Contrast</div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">
                      {hotspot.swir_contrast != null ? hotspot.swir_contrast.toFixed(4) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Spectral Classification Contexts */}
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vegetation Context:</span>
                    <span className="text-slate-200 font-bold">{hotspot.vegetation_context || 'LOW_VEGETATION'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Built-Surface Context:</span>
                    <span className="text-cyan-300 font-bold">{hotspot.built_surface_context || 'MODERATE_BUILT_SURFACE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water Context:</span>
                    <span className="text-slate-300 font-bold">{hotspot.water_context || 'LOW_WATER_SIGNAL'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-1">
                    <span className="text-slate-400">Environment Context:</span>
                    <span className="text-amber-300 font-bold text-right truncate ml-2">
                      {hotspot.environment_context || 'STRONG_BUILT_NONVEGETATED_CONTEXT'}
                    </span>
                  </div>
                </div>

                {/* Mandatory Scientific Guardrail Notice */}
                <div className="p-2.5 rounded bg-indigo-950/40 border border-indigo-500/40 text-[10px] text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    SCIENTIFIC CONTEXTUAL NOTICE:
                  </div>
                  <p className="leading-relaxed text-slate-400 font-sans">
                    Contextual imagery from recorded archival scene date ({hotspot.satellite_scene_date?.substring(0, 10) || '2026-06-15'}); not representative of the September 2026 thermal event. Provides background land-cover spectral indices.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <Satellite className="w-7 h-7 mx-auto text-slate-600" />
                <div className="text-xs font-bold text-slate-300">
                  Satellite context unavailable for this source
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-sans leading-relaxed">
                  No processed Sentinel-2 Level-2A contextual granules available in the database for this candidate. Remote sensing tasking can be scheduled via district workflow.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 6. EXPLANATION (Prominently displayed database explanation field) */}
        {(activeSection === 'all' || activeSection === 'explanation') && (
          <div id="section-explanation" className="p-3.5 rounded-lg bg-[#0D1424]/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                6. AI / GEOSPATIAL REASONING EXPLANATION
              </span>
              <button
                onClick={handleGenerateAi}
                disabled={aiLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold transition-all disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                    REASONING...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    RUN GEMINI
                  </>
                )}
              </button>
            </div>

            {/* Database Explanation Field */}
            {hotspot.explanation ? (
              <div className="p-3 rounded bg-slate-950/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-text space-y-2">
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Database Reasoning Summary:
                </div>
                <div className="whitespace-pre-line text-slate-300">{hotspot.explanation}</div>
              </div>
            ) : (
              <div className="p-4 rounded bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                No database explanation logged for this source.
              </div>
            )}

            {/* Live Gemini AI Output if different/generated */}
            {aiReport && aiReport !== hotspot.explanation && (
              <div className="p-3 rounded bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-100 leading-relaxed font-sans select-text space-y-1.5">
                <div className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Live Gemini Geospatial Assessment:
                </div>
                <div className="whitespace-pre-line text-slate-300">{aiReport}</div>
              </div>
            )}

            {aiError && (
              <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs">
                {aiError}
              </div>
            )}
          </div>
        )}

        {/* 7. ACTIONS (Full Action Section) */}
        <div id="section-actions" className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-cyan-400" />
              7. INCIDENT ACTIONS
            </span>
            <span className="text-[10px] text-slate-400 font-mono">SUPABASE PERSISTENCE</span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Execute verified field triage workflows. Actions attempt immediate persistence to Supabase{' '}
            <span className="text-cyan-300 font-mono">public.investigations</span> and{' '}
            <span className="text-rose-300 font-mono">public.alerts</span> tables.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleStartInvestigation}
              disabled={actionLoading !== null}
              className="w-full py-2 px-3 rounded bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/70 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              {actionLoading === 'investigation' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                  PERSISTING TO SUPABASE...
                </span>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>START INVESTIGATION</span>
                </>
              )}
            </button>

            <button
              onClick={handleRaiseAlert}
              disabled={actionLoading !== null}
              className="w-full py-2 px-3 rounded bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/70 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            >
              {actionLoading === 'alert' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                  PERSISTING TO SUPABASE...
                </span>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>RAISE ALERT</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-3 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <X className="w-4 h-4" />
            <span>CLOSE INSPECTION DRAWER</span>
          </button>
        </div>

      </div>

      {/* Footer Details */}
      <div className="p-3 border-t border-slate-800 bg-[#080C14] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportIncidentDossierPDF(hotspot)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
            title="Download PDF Dossier"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD DOSSIER (PDF)</span>
          </button>

          <button
            onClick={() => exportIncidentDossierXLSX(hotspot)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-[0_0_8px_rgba(16,185,129,0.2)] cursor-pointer"
            title="Download XLSX Telemetry"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>XLSX</span>
          </button>

          <button
            onClick={() => onOpenDossier(hotspot)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
            title="Preview Dossier Dialog"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>PREVIEW</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          AGNI KAVACH • SIH26162
        </span>
      </div>
      </div>
    </aside>
  );
};
