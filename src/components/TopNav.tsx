import React from 'react';
import {
  Flame,
  Database,
  Play,
  Bell,
  SlidersHorizontal,
  FileCheck2,
  HelpCircle,
  Wind,
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn,
  Layers,
  Presentation,
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
  onOpenGuidedDemo?: () => void;
  isDemoActive?: boolean;
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
  onOpenFeatureDirectory,
  onOpenGuidedDemo,
  isDemoActive = false,
}) => {
  const { isAuthenticated, user, openAuthModal, signOut } = useAuth();

  const navItems: { id: NavigationTab; label: string; badge?: number }[] = [
    { id: 'map', label: 'MAP' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'impact', label: 'IMPACT' },
    { id: 'response', label: 'RESPONSE' },
    { id: 'investigations', label: 'INVESTIGATIONS' },
    { id: 'alerts', label: 'ALERTS', badge: alertCount },
  ];

  return (
    <header
      id="top-navigation"
      className="h-11 bg-[#071018] border-b border-[#243441] px-3.5 flex items-center justify-between text-[#F1F5F9] select-none shrink-0 z-30 font-mono text-xs"
    >
      {/* Left: Brand + Identity + Nav */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-2 cursor-pointer group"
          title="Agni Kavach Geospatial Command Center"
        >
          <div className="w-6 h-6 rounded bg-[#FF9F1C] flex items-center justify-center text-black font-bold shadow-[0_0_8px_rgba(255,159,28,0.3)]">
            <Flame className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <span className="font-['Chakra_Petch'] font-bold text-sm tracking-wider text-slate-100 group-hover:text-[#FF9F1C] transition-colors">
            AGNI KAVACH
          </span>
          <span className="text-[10px] font-mono text-[#35C6E8] font-bold px-1.5 py-0.5 rounded bg-[#101A23] border border-[#243441] tracking-wider">
            SIH26162
          </span>
        </div>

        {/* Subtle Separator */}
        <div className="h-4 w-px bg-[#243441] hidden sm:block" />

        {/* Primary View Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#131F29] border border-[#304351] text-[#35C6E8] shadow-[0_0_8px_rgba(53,198,232,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#101A23] border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Operational Status + Scenario + Auth */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Scenario Selector */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#101A23] border border-[#243441] text-[11px] text-slate-300">
          <SlidersHorizontal className="w-3 h-3 text-[#FF9F1C]" />
          <select
            id="select-demo-scenario"
            value={activeScenario}
            onChange={(e) => onSelectScenario(e.target.value as DemoScenarioId)}
            className="bg-transparent text-slate-200 text-[11px] focus:outline-none cursor-pointer pr-1"
          >
            <option value="LIVE" className="bg-[#101A23] text-slate-200">
              Operational Baseline (57 Sources)
            </option>
            <option value="PERSISTENT_SOURCE" className="bg-[#101A23] text-slate-200">
              Scenario: Persistent (AGNI-001)
            </option>
            <option value="HIGH_PRIORITY_INVESTIGATION" className="bg-[#101A23] text-slate-200">
              Scenario: High Priority (AGNI-002)
            </option>
            <option value="BUILT_ENVIRONMENT_CANDIDATE" className="bg-[#101A23] text-slate-200">
              Scenario: Built Env (AGNI-003)
            </option>
            <option value="NATURAL_VEGETATION_CONTEXT" className="bg-[#101A23] text-slate-200">
              Scenario: Rural Fringe (AGNI-014)
            </option>
          </select>
        </div>

        {/* Guided Demo Mode Button */}
        {onOpenGuidedDemo && (
          <button
            id="btn-guided-demo"
            onClick={onOpenGuidedDemo}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-bold ${
              isDemoActive
                ? 'bg-[#35C6E8] text-black shadow-[0_0_10px_rgba(53,198,232,0.4)]'
                : 'bg-[#101A23] hover:bg-[#131F29] border border-[#35C6E8]/60 hover:border-[#35C6E8] text-[#35C6E8] shadow-[0_0_8px_rgba(53,198,232,0.15)]'
            }`}
            title="Launch 45-60s Guided Exhibition Demonstration"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="text-[11px] tracking-wider">DEMO MODE</span>
          </button>
        )}

        {/* Mission Replay Button */}
        <button
          id="btn-mission-replay"
          onClick={onOpenMissionReplay}
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-[#101A23] hover:bg-[#131F29] border border-[#243441] hover:border-[#35C6E8]/40 text-[#35C6E8] text-xs transition-colors cursor-pointer"
          title="Pipeline Mission Replay"
        >
          <Play className="w-3 h-3 fill-[#35C6E8]" />
          <span className="text-[11px] font-bold">REPLAY</span>
        </button>

        {/* System Directory / Help */}
        {onOpenFeatureDirectory && (
          <button
            onClick={onOpenFeatureDirectory}
            className="p-1.5 rounded hover:bg-[#101A23] border border-transparent hover:border-[#243441] text-slate-400 hover:text-slate-200 transition-colors"
            title="System Directory"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Supabase Status Indicator */}
        <button
          id="btn-supabase-status"
          onClick={onOpenSupabaseModal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-all border cursor-pointer ${
            isSupabaseLive
              ? 'bg-[#101A23] border-[#243441] text-slate-300 hover:border-[#35C6E8]/40'
              : dbError
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-[#101A23] border-[#243441] text-[#FF9F1C]'
          }`}
          title={
            isSupabaseLive
              ? `Supabase Connected: public.hotspots (${recordCount ?? 57} records)`
              : dbError
              ? `DB Error: ${dbError}`
              : 'Supabase Settings'
          }
        >
          <Database className="w-3 h-3 text-[#35C6E8]" />
          <span className="hidden md:inline font-bold">
            {isSupabaseLive ? `DB LIVE (${recordCount ?? 57})` : dbError ? 'DB ERROR' : 'DATABASE'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSupabaseLive
                ? 'bg-emerald-400'
                : dbError
                ? 'bg-rose-500 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
        </button>

        {/* Operator / Authentication */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <button
              id="btn-operator-auth"
              onClick={() => openAuthModal()}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#101A23] border border-[#304351] text-emerald-300 text-[11px] cursor-pointer hover:bg-[#131F29]"
              title={`Operator Session: ${user?.email}`}
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span className="font-bold">OPERATOR</span>
              {user?.email && (
                <span className="text-[10px] text-slate-400 hidden 2xl:inline max-w-[120px] truncate">
                  ({user.email})
                </span>
              )}
            </button>
            <button
              id="btn-top-signout"
              onClick={async () => {
                await signOut();
              }}
              className="px-2 py-1 rounded bg-[#101A23] hover:bg-rose-950/40 border border-[#243441] hover:border-rose-500/40 text-slate-400 hover:text-rose-200 text-[11px] font-bold transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3 inline sm:mr-1" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#101A23] border border-[#243441] text-slate-400 hidden sm:inline">
              READ-ONLY
            </span>
            <button
              id="btn-top-signin"
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#35C6E8] hover:bg-[#38BDF8] text-black font-bold text-[11px] transition-all cursor-pointer shadow-[0_0_8px_rgba(53,198,232,0.25)]"
              title="Sign In for Operator Access"
            >
              <LogIn className="w-3 h-3 text-black" />
              <span>OPERATOR SIGN IN</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
