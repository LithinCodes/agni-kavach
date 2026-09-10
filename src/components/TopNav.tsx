import React from 'react';
import {
  ShieldAlert,
  Flame,
  Activity,
  Satellite,
  Database,
  Play,
  Bell,
  User,
  SlidersHorizontal,
  BarChart3,
  Map as MapIcon,
  FileCheck2,
  HelpCircle,
  Calendar,
  Wind,
  ShieldCheck,
  Compass,
  Lock,
  Unlock,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { DemoScenarioId, NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isSupabaseLive: boolean;
  recordCount?: number;
  dbError?: string | null;
  onOpenSupabaseModal: () => void;
  activeScenario: DemoScenarioId;
  onSelectScenario: (scenario: DemoScenarioId) => void;
  onOpenMissionReplay: () => void;
  alertCount: number;
  onOpenAbout: () => void;
  isTimelineOpen?: boolean;
  onToggleTimeline?: () => void;
  onOpenFeatureDirectory?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isSupabaseLive,
  recordCount,
  dbError,
  onOpenSupabaseModal,
  activeScenario,
  onSelectScenario,
  onOpenMissionReplay,
  alertCount,
  onOpenAbout,
  isTimelineOpen = true,
  onToggleTimeline,
  onOpenFeatureDirectory,
}) => {
  const { isAuthenticated, user, openAuthModal, signOut } = useAuth();
  const tabs: {
    id: NavigationTab;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    activeStyle: string;
    badge?: string;
  }[] = [
    {
      id: 'map',
      label: 'LIVE MAP',
      sublabel: 'FIRMS',
      icon: <MapIcon className="w-3.5 h-3.5" />,
      activeStyle:
        'bg-cyan-500/25 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    },
    {
      id: 'analytics',
      label: 'ANALYTICS',
      sublabel: 'RADAR',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      activeStyle:
        'bg-indigo-500/25 text-indigo-300 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)]',
    },
    {
      id: 'impact',
      label: 'HUMAN IMPACT',
      sublabel: 'VAYU-DRISHTI',
      icon: <Wind className="w-3.5 h-3.5 text-amber-400" />,
      activeStyle:
        'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      badge: 'PLUME',
    },
    {
      id: 'response',
      label: 'RESPONSE MODE',
      sublabel: 'RUN-CARD',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      activeStyle:
        'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      badge: '60-SEC',
    },
    {
      id: 'investigations',
      label: 'INVESTIGATIONS',
      sublabel: 'DOSSIER',
      icon: <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />,
      activeStyle:
        'bg-cyan-500/25 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    },
    {
      id: 'alerts',
      label: 'ALERTS',
      sublabel: 'DISPATCH',
      icon: <Bell className="w-3.5 h-3.5 text-rose-400" />,
      activeStyle:
        'bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    },
  ];

  return (
    <div className="flex flex-col shrink-0 z-30 sticky top-0 font-mono select-none">
      {/* Top Header Bar */}
      <header
        id="agni-top-nav"
        className="h-14 sm:h-16 w-full bg-[#080C14]/95 backdrop-blur-md border-b border-cyan-500/20 px-3 sm:px-4 flex items-center justify-between gap-2 text-slate-200"
      >
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-950 via-slate-900 to-amber-950 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 absolute animate-pulse" />
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-['Chakra_Petch'] text-base sm:text-lg font-bold tracking-wider text-white leading-tight">
                AGNI KAVACH
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 tracking-wider shrink-0">
                SIH26162
              </span>
            </div>
            <div className="hidden xs:flex text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-tight items-center gap-1.5 sm:gap-2 mt-0.5">
              <span>THERMAL INTELLIGENCE</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-medium">FIRMS | SENTINEL-2</span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Visible on 2xl) */}
        <nav className="hidden 2xl:flex items-center gap-1 bg-[#0D1424]/90 p-1 rounded-lg border border-slate-800 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? tab.activeStyle
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[8px] font-bold px-1 rounded bg-black/40 text-amber-300 border border-amber-500/30">
                  {tab.badge}
                </span>
              )}
              {tab.id === 'alerts' && alertCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse ml-0.5">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Feature Directory / Navigate Guide Button */}
          {onOpenFeatureDirectory && (
            <button
              id="btn-feature-directory"
              onClick={onOpenFeatureDirectory}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-950/90 to-amber-950/80 border border-cyan-500/60 text-cyan-200 text-xs font-mono font-bold hover:border-cyan-300 hover:text-white transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] group cursor-pointer"
              title="Open Feature Directory & Navigation Guide"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">EXPLORE FEATURES</span>
              <span className="sm:hidden">GUIDE</span>
            </button>
          )}

          {/* Toggle 5-Day FIRMS Window button */}
          {activeTab === 'map' && onToggleTimeline && (
            <button
              id="btn-nav-toggle-timeline"
              onClick={onToggleTimeline}
              className={`hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all cursor-pointer ${
                isTimelineOpen
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={isTimelineOpen ? 'Close 5-Day FIRMS Window' : 'Open 5-Day FIRMS Window'}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold hidden lg:inline">5-DAY FIRMS</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTimelineOpen ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </button>
          )}

          {/* Mission Replay button */}
          <button
            id="btn-mission-replay"
            onClick={onOpenMissionReplay}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Interactive Intelligence Pipeline Mission Replay"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span className="hidden xl:inline">MISSION REPLAY</span>
          </button>

          {/* Demo Scenario Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0D1424] px-2 py-1 rounded-md border border-slate-800 text-xs font-mono">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <select
              id="select-demo-scenario"
              value={activeScenario}
              onChange={(e) => onSelectScenario(e.target.value as DemoScenarioId)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="LIVE" className="bg-slate-900 text-slate-200">
                Operational (All 21)
              </option>
              <option value="PERSISTENT_SOURCE" className="bg-slate-900 text-slate-200">
                Scenario: Persistent (AGNI-001)
              </option>
              <option value="HIGH_PRIORITY_INVESTIGATION" className="bg-slate-900 text-slate-200">
                Scenario: High Priority (AGNI-002)
              </option>
              <option value="BUILT_ENVIRONMENT_CANDIDATE" className="bg-slate-900 text-slate-200">
                Scenario: Built Env (AGNI-003)
              </option>
              <option value="NATURAL_VEGETATION_CONTEXT" className="bg-slate-900 text-slate-200">
                Scenario: Vegetation (AGNI-014)
              </option>
            </select>
          </div>

          {/* Supabase Connection Pill */}
          <button
            id="btn-supabase-status"
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border ${
              isSupabaseLive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : dbError
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/40'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
            }`}
            title={
              isSupabaseLive
                ? `Connected to Supabase table public.hotspots (${recordCount ?? 21} records loaded)`
                : dbError
                ? `Supabase connection error: ${dbError}`
                : 'Supabase Database Configuration'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isSupabaseLive
                ? `SUPABASE LIVE (${recordCount ?? 21})`
                : dbError
                ? 'DB ERROR'
                : 'SUPABASE'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseLive
                  ? 'bg-emerald-400 animate-pulse'
                  : dbError
                  ? 'bg-rose-500 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Authentication & Clearance Controls */}
          {isAuthenticated ? (
            /* Authenticated: OPERATOR / OPERATIONAL ACCESS + Compact Email + SIGN OUT */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                id="btn-operator-auth"
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-900/40 transition-all cursor-pointer text-xs font-mono"
                title={`Authenticated Operator: ${user?.email} • Operational Access Enabled. Click to view clearance details.`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[10px] sm:text-xs text-emerald-200 tracking-wider">
                      OPERATOR
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 hidden md:inline font-bold">
                      OPERATIONAL ACCESS
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </div>
                  {user?.email && (
                    <span className="text-[9px] text-slate-400 max-w-[110px] sm:max-w-[150px] truncate">
                      {user.email}
                    </span>
                  )}
                </div>
              </button>

              <button
                id="btn-top-signout"
                onClick={async () => {
                  await signOut();
                }}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md bg-slate-900/90 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 text-xs font-mono transition-all cursor-pointer"
                title="Sign out of operator session and return to Read-Only mode"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400 shrink-0" />
                <span className="hidden sm:inline font-bold">SIGN OUT</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated: READ-ONLY indicator + OPERATOR ACCESS / SIGN IN button */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                id="badge-access-mode"
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded bg-slate-900/90 border border-slate-700/80 text-slate-400 text-xs font-mono"
                title="Application is currently in Public Read-Only Mode. Alerts and Investigations require operator sign in."
              >
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-bold tracking-wider text-slate-300">READ-ONLY</span>
              </div>

              <button
                id="btn-operator-auth"
                onClick={() =>
                  openAuthModal(
                    'Sign in as an authorized operator to dispatch alerts and record investigations.'
                  )
                }
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all border border-cyan-500/60 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:border-cyan-400 cursor-pointer"
                title="Sign in as an authorized operator to receive operational write access."
              >
                <Unlock className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="hidden md:inline">OPERATOR ACCESS / SIGN IN</span>
                <span className="md:hidden">SIGN IN</span>
              </button>
            </div>
          )}

          {/* About & Specs */}
          <button
            id="btn-about-modal"
            onClick={onOpenAbout}
            className="p-1.5 rounded hover:bg-slate-800/80 text-slate-400 hover:text-cyan-300 transition-colors"
            title="System Architecture & Scientific Specifications"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Universal Secondary Navigation Bar: Always visible on all screens (mobile, tablet, laptop, desktop) */}
      <div
        id="agni-sub-nav"
        className="w-full bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-inner"
      >
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto py-0.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline mr-1">
            MODULE:
          </span>
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subnav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono font-medium transition-all shrink-0 cursor-pointer border whitespace-nowrap ${
                  isCurrent
                    ? tab.activeStyle
                    : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                <span className="font-semibold">{tab.label}</span>
                {tab.sublabel && (
                  <span className="hidden md:inline text-[9px] text-slate-500 opacity-80">
                    ({tab.sublabel})
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[8px] font-bold px-1 rounded bg-black/50 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
                {tab.id === 'alerts' && alertCount > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse ml-0.5">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feature Directory Quick Jump on Sub-Nav */}
        {onOpenFeatureDirectory && (
          <button
            onClick={onOpenFeatureDirectory}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors shrink-0 whitespace-nowrap ml-auto"
            title="Browse full feature index"
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span className="hidden xs:inline">VIEW ALL FEATURES</span>
          </button>
        )}
      </div>
    </div>
  );
};
