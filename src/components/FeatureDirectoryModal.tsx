import React from 'react';
import {
  X,
  Map,
  BarChart3,
  Wind,
  ShieldCheck,
  FileCheck2,
  Bell,
  Compass,
  Radar,
  Moon,
  Hospital,
  Route,
  ClipboardList,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface FeatureDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenReplay?: () => void;
  onOpenDossier?: () => void;
}

export const FeatureDirectoryModal: React.FC<FeatureDirectoryModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  onOpenReplay,
  onOpenDossier,
}) => {
  if (!isOpen) return null;

  const modules: {
    id: NavigationTab;
    title: string;
    badge: string;
    badgeColor: string;
    icon: React.ReactNode;
    subtitle: string;
    description: string;
    features: string[];
    actionLabel: string;
  }[] = [
    {
      id: 'map',
      title: 'LIVE MAP & TIMELINE',
      badge: 'CORE SENSORS',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Map className="w-5 h-5 text-cyan-400" />,
      subtitle: 'Spaceborne VIIRS NOAA-21 NRT Thermal Layer',
      description:
        'Interactive geospatial map displaying active heat anomalies across the 5-day FIRMS analytical window. Features satellite overlays, cluster density heatmaps, and slide-out telemetry drawer.',
      features: [
        '5-Day FIRMS temporal window scrubber & day selector',
        'Satellite imagery overlays (ESRI World Imagery / Dark Canvas)',
        'Detailed telemetry drawer with priority score breakdowns',
        'Direct links into Impact Dispersion & Response Run-Cards',
      ],
      actionLabel: 'Launch Map View',
    },
    {
      id: 'impact',
      title: 'HUMAN IMPACT (VAYU-DRISHTI)',
      badge: 'NEW SIMULATION',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Wind className="w-5 h-5 text-amber-400" />,
      subtitle: 'Atmospheric Dispersion & Citizen Safety Evaluator',
      description:
        'Interactive downwind smoke and gas hazard modeling using live or simulated wind vectors. Includes the public "Am I Safe?" assessment tool and sensitive facility mapping.',
      features: [
        'VAYU-DRISHTI interactive wind direction compass & dispersion cone',
        '"Am I Safe?" citizen proximity checker (click any point on the map)',
        'Sensitive receptor mapping: hospitals, schools & wards within 15 km',
        'Regional CAAQMS air quality telemetry (PM2.5, PM10, AQI context)',
      ],
      actionLabel: 'Open Human Impact & VAYU-DRISHTI',
    },
    {
      id: 'response',
      title: 'RESPONSE MODE & RUN-CARD',
      badge: 'FIRST-RESPONDER',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      subtitle: '60-Second Tactical Incident Run-Card',
      description:
        'Built for emergency command centers and field teams. Summarizes critical incident telemetry in seconds, with mandatory life-safety cautions and safe upwind transit routing.',
      features: [
        '60-Second high-contrast incident run-card with telemetry stats',
        'Mandatory life-safety notice ("HAZARD MATERIAL UNKNOWN")',
        'Safe response transit routing (contrasting highway vs. safe detour)',
        'Actionable 6-step emergency response tactical checklist',
      ],
      actionLabel: 'Open Response Run-Card',
    },
    {
      id: 'analytics',
      title: 'GEOSPATIAL ANALYTICS & RADAR',
      badge: 'AI INTELLIGENCE',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <BarChart3 className="w-5 h-5 text-indigo-400" />,
      subtitle: '5-Axis Impact Radar & Nocturnal Audit',
      description:
        'Deep statistical analytics on thermal radiative power (FRP), anomaly persistence, temporal distribution, and spaceborne observation frequency.',
      features: [
        '5-Axis Interactive Visual Impact Radar with point contributions',
        'Dhumra-Dharma Nighttime Flare Auditor (VIIRS 01:30 pass audit)',
        'FRP energy distribution & temporal anomaly charts',
        'Priority category breakdowns (High, Moderate, Low)',
      ],
      actionLabel: 'Open Analytics & Radar',
    },
    {
      id: 'investigations',
      title: 'INVESTIGATION WORKBENCH',
      badge: 'DDMA DOSSIER',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <FileCheck2 className="w-5 h-5 text-cyan-400" />,
      subtitle: 'Multi-Sensor Evidence Formulation & Dossier Export',
      description:
        'Comprehensive workbench for intelligence analysts to corroborate satellite detections with optical indices, draft findings, and produce print-ready disaster management dossiers.',
      features: [
        'Multi-sensor evidence verification matrix (FIRMS, Sentinel-2, CAAQMS)',
        'Hypothesis formulation and analytical log note recorder',
        'Print-ready DDMA Incident Dossier generator with sign-off blocks',
        '"Why Did You Alert?" transparent mathematical formula explainer',
      ],
      actionLabel: 'Open Investigation Workbench',
    },
    {
      id: 'alerts',
      title: 'ALERTS & ESCALATION QUEUE',
      badge: 'OPERATIONAL',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <Bell className="w-5 h-5 text-rose-400" />,
      subtitle: 'Two-Stage Multi-Agency Dispatch Workflow',
      description:
        'Operational incident queue and structured alert dispatch system for Fire & Emergency Services, State Pollution Control Board, DDMA, and Forest Departments.',
      features: [
        'Operational queue of high-priority & escalated thermal incidents',
        'Two-Stage Alert Escalation Workflow with agency selection',
        'Custom dispatch priority assignment (Routine, Urgent, Flash Emergency)',
        'Full Supabase database persistence for cross-agency audit trail',
      ],
      actionLabel: 'Open Alerts Queue',
    },
  ];

  return (
    <div
      id="feature-directory-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-mono select-none"
    >
      <div className="w-full max-w-5xl bg-[#080C14] text-slate-200 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Chakra_Petch'] text-white">
                  AGNI KAVACH FEATURE DIRECTORY
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  NAVIGATION GUIDE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick-access index to all 6 operational thermal intelligence modules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => {
              const isCurrent = activeTab === mod.id;
              return (
                <div
                  key={mod.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all group ${
                    isCurrent
                      ? 'bg-cyan-950/20 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#080C14] border border-slate-800">
                          {mod.icon}
                        </div>
                        <span className="text-xs font-bold font-['Chakra_Petch'] text-white">
                          {mod.title}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${mod.badgeColor}`}
                      >
                        {mod.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-300">
                      {mod.subtitle}
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {mod.description}
                    </p>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Key Capabilities:
                      </div>
                      <ul className="space-y-1 text-[10px] text-slate-300">
                        {mod.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800">
                    <button
                      onClick={() => {
                        onNavigate(mod.id);
                        onClose();
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      <span>{isCurrent ? 'Current Active View' : mod.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick shortcuts strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0D1424] via-slate-900 to-[#0D1424] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                Need an automated guided walkthrough? Run the full spaceborne pipeline replay.
              </span>
            </div>
            {onOpenReplay && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReplay();
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <span>LAUNCH MISSION REPLAY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0D1424] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>You can switch between any of these tabs anytime using the top navigation bar.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
