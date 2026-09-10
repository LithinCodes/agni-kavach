import React, { useState, useEffect, useCallback } from 'react';
import { Database, AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { TopNav } from './components/TopNav';
import { CommandStrip } from './components/CommandStrip';
import { MapContainer } from './components/MapContainer';
import { LeftTriagePanel } from './components/LeftTriagePanel';
import { IncidentDrawer } from './components/IncidentDrawer';
import { FirmsTimeline } from './components/FirmsTimeline';
import { AnalyticsView } from './components/AnalyticsView';
import { HumanImpactView } from './components/HumanImpactView';
import { ResponseModeView } from './components/ResponseModeView';
import { InvestigationView } from './components/InvestigationView';
import { AlertsView } from './components/AlertsView';
import { MissionReplayModal } from './components/MissionReplayModal';
import { IncidentDossierModal } from './components/IncidentDossierModal';
import { AlertWorkflowModal } from './components/AlertWorkflowModal';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { AuthModal } from './components/AuthModal';
import { AboutModal } from './components/AboutModal';
import { FeatureDirectoryModal } from './components/FeatureDirectoryModal';
import { BootSequence } from './components/BootSequence';
import { useAuth } from './context/AuthContext';

import {
  HotspotRecord,
  FilterState,
  MapLayerState,
  DemoScenarioId,
  PriorityCategory,
  AlertStatus,
  NavigationTab,
} from './types';
import {
  fetchHotspots,
  fetchHotspotBySourceId,
  updateHotspotAlert,
  updateHotspotInvestigation,
} from './services/supabase';

export default function App() {
  const { isAuthenticated, openAuthModal } = useAuth();

  // Boot Sequence
  const [hasBooted, setHasBooted] = useState<boolean>(() => {
    return sessionStorage.getItem('agni_booted') === 'true';
  });

  // Hotspots Data Layer - Real Supabase Database public.hotspots
  const [hotspots, setHotspots] = useState<HotspotRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotRecord | null>(null);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(false);

  // Active View Tab ('map' | 'analytics' | 'impact' | 'response' | 'investigations' | 'alerts')
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');

  // UI Panels
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    priority: 'ALL',
    satellite: 'ALL',
    minPriorityScore: 0,
    minThermalRisk: 0,
    minDetections: 1,
    minNightActivity: 0,
    environment: 'ALL',
    searchQuery: '',
  });

  // Geospatial Layers
  const [layers, setLayers] = useState<MapLayerState>({
    thermalSources: true,
    priorityHeatmap: true,
    satelliteContext: true,
    builtEnvContext: true,
    investigationSources: true,
  });

  // FIRMS 5-Day Timeline
  const [activeDayIndex, setActiveDayIndex] = useState<number>(4); // default: full 5-day window
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(true);

  // Demo Scenario State
  const [activeScenario, setActiveScenario] = useState<DemoScenarioId>('LIVE');

  // Modals
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isMissionReplayOpen, setIsMissionReplayOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isFeatureDirectoryOpen, setIsFeatureDirectoryOpen] = useState<boolean>(false);
  const [dossierHotspot, setDossierHotspot] = useState<HotspotRecord | null>(null);
  const [isAlertWorkflowOpen, setIsAlertWorkflowOpen] = useState<boolean>(false);
  const [alertWorkflowHotspot, setAlertWorkflowHotspot] = useState<HotspotRecord | null>(null);

  // Load Data on Mount from public.hotspots
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const result = await fetchHotspots();
      if (result.error || !result.isLive || !result.data || result.data.length === 0) {
        setHotspots([]);
        setIsSupabaseLive(false);
        setDbError(
          result.error ||
            'No records found in public.hotspots table. Verification failed.'
        );
        setRecordCount(0);
      } else {
        setHotspots(result.data);
        setIsSupabaseLive(true);
        setDbError(null);
        setRecordCount(result.count || result.data.length);
      }
    } catch (err: any) {
      setHotspots([]);
      setIsSupabaseLive(false);
      setDbError(
        err?.message || 'Network exception connecting to Supabase database.'
      );
      setRecordCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Timeline Playback
  useEffect(() => {
    if (!isTimelinePlaying) return;
    const interval = setInterval(() => {
      setActiveDayIndex((prev) => {
        if (prev >= 4) {
          setIsTimelinePlaying(false);
          return 4;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isTimelinePlaying]);

  // Handle Demo Scenarios
  const handleSelectScenario = (scenario: DemoScenarioId) => {
    setActiveScenario(scenario);
    setActiveTab('map');

    if (scenario === 'LIVE') {
      setSelectedHotspot(null);
      setFilters((prev) => ({ ...prev, priority: 'ALL', satellite: 'ALL' }));
      return;
    }

    let targetId = 'AGNI-001';
    if (scenario === 'HIGH_PRIORITY_INVESTIGATION') targetId = 'AGNI-002';
    if (scenario === 'BUILT_ENVIRONMENT_CANDIDATE') targetId = 'AGNI-003';
    if (scenario === 'NATURAL_VEGETATION_CONTEXT') targetId = 'AGNI-014';

    const target = hotspots.find((h) => h.source_id === targetId);
    if (target) {
      setSelectedHotspot(target);
    }
  };

  // Toggle Map Layers
  const handleToggleLayer = (layerKey: keyof MapLayerState) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      priority: 'ALL',
      satellite: 'ALL',
      minPriorityScore: 0,
      minThermalRisk: 0,
      minDetections: 1,
      minNightActivity: 0,
      environment: 'ALL',
      searchQuery: '',
    });
    setActiveScenario('LIVE');
  };

  // Select Hotspot and synchronize with live database record
  const handleSelectHotspot = useCallback(async (hotspot: HotspotRecord | null) => {
    if (!hotspot) {
      setSelectedHotspot(null);
      setIsDrawerCollapsed(false);
      return;
    }
    // Set immediate state from database records and ensure drawer is open
    setSelectedHotspot(hotspot);
    setIsDrawerCollapsed(false);

    // Fetch single record directly from public.hotspots to verify freshest state
    try {
      const fresh = await fetchHotspotBySourceId(hotspot.source_id);
      if (fresh) {
        setSelectedHotspot(fresh);
        setHotspots((prev) =>
          prev.map((h) => (h.source_id === fresh.source_id ? fresh : h))
        );
      }
    } catch {
      // Retain currently selected live record
    }
  }, []);

  // Update Single Hotspot locally and in state
  const handleUpdateHotspot = (updated: HotspotRecord) => {
    setHotspots((prev) =>
      prev.map((h) => (h.source_id === updated.source_id ? updated : h))
    );
    if (selectedHotspot?.source_id === updated.source_id) {
      setSelectedHotspot(updated);
    }
  };

  // Quick Alert Update
  const handleUpdateAlert = async (sourceId: string, status: AlertStatus) => {
    if (!isAuthenticated) {
      openAuthModal(
        'Operational clearance required: Please sign in as an operator to update alert records in Supabase.'
      );
      return;
    }
    await updateHotspotAlert(sourceId, status);
    setHotspots((prev) =>
      prev.map((h) => (h.source_id === sourceId ? { ...h, alert_status: status } : h))
    );
  };

  // Compute Alert Count
  const alertCount = hotspots.filter(
    (h) => h.priority_category === 'HIGH' || h.alert_status === 'Alert Raised'
  ).length;

  return (
    <div className="flex flex-col h-full h-screen h-[100dvh] w-full bg-[#050811] text-slate-100 overflow-hidden select-none font-mono">
      {/* Boot Sequence on first visit */}
      {!hasBooted && (
        <BootSequence
          onComplete={() => {
            sessionStorage.setItem('agni_booted', 'true');
            setHasBooted(true);
          }}
        />
      )}

      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSupabaseLive={isSupabaseLive}
        recordCount={recordCount}
        dbError={dbError}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onOpenMissionReplay={() => setIsMissionReplayOpen(true)}
        alertCount={alertCount}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen((prev) => !prev)}
        onOpenFeatureDirectory={() => setIsFeatureDirectoryOpen(true)}
      />

      {/* Loading State */}
      {isLoading && hotspots.length === 0 && !dbError && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#080C14] text-slate-300 p-6">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-cyan-500/40 border-t-cyan-400 animate-spin" />
            <Database className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-base font-bold font-['Chakra_Petch'] tracking-wider text-cyan-300">
            CONNECTING TO SUPABASE DATABASE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Querying public.hotspots table...
          </p>
          <span className="text-[11px] font-mono text-slate-500 mt-2">
            Synchronizing 21 live thermal anomalies • NASA FIRMS + Sentinel-2
          </span>
        </div>
      )}

      {/* Connection Error State (Strict Live Data Only Policy) */}
      {dbError && hotspots.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#080C14] text-slate-200 p-6 overflow-y-auto">
          <div className="max-w-xl w-full bg-[#0D1424] border border-rose-500/40 rounded-xl p-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-['Chakra_Petch'] text-rose-400 tracking-wider">
                  {activeTab === 'analytics'
                    ? 'ANALYTICS DATA UNAVAILABLE — SUPABASE CONNECTION ERROR'
                    : 'SUPABASE DATABASE CONNECTION ERROR'}
                </h2>
                <div className="text-[11px] font-mono text-slate-400">
                  Target: <span className="text-slate-200 font-bold">public.hotspots</span> • Security Policy: Strict Live Data Only
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Agni Kavach failed to fetch live records from your Supabase database table <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">public.hotspots</code>. Per the operational mandate, fallback and mock data are strictly disabled.
            </p>

            <div className="bg-black/60 border border-slate-800 rounded-lg p-3.5 mb-5 font-mono text-xs">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                Database Error Diagnostics:
              </div>
              <div className="text-rose-300 font-mono break-words">
                {dbError}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>RETRY DATABASE QUERY</span>
              </button>

              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>CONFIGURE CREDENTIALS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {hotspots.length > 0 && activeTab === 'map' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {/* Real-time Dynamic Command Strip */}
          <CommandStrip
            hotspots={hotspots}
            activePriorityFilter={filters.priority}
            onSelectPriorityFilter={(p) =>
              setFilters((prev) => ({ ...prev, priority: p }))
            }
            activeSatelliteFilter={filters.satellite}
            onSelectSatelliteFilter={(s) =>
              setFilters((prev) => ({ ...prev, satellite: s }))
            }
          />

          {/* Map + Side Panels Row */}
          <div className="flex-1 min-h-0 flex relative overflow-hidden">
            {/* Left Triage Feed */}
            <LeftTriagePanel
              hotspots={hotspots}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={handleSelectHotspot}
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              isOpen={isLeftPanelOpen}
              onToggleOpen={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            />

            {/* Primary Hero Map Canvas */}
            <main className="flex-1 min-w-0 relative h-full overflow-hidden">
              <MapContainer
                hotspots={hotspots}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={handleSelectHotspot}
                layers={layers}
                onToggleLayer={handleToggleLayer}
                timelineDateFilter={
                  isTimelinePlaying || activeDayIndex < 4
                    ? activeDayIndex + 1
                    : null
                }
                isDrawerOpen={Boolean(selectedHotspot) && !isDrawerCollapsed}
              />

              {/* Floating FIRMS 5-Day Timeline */}
              <FirmsTimeline
                hotspots={hotspots}
                activeDayIndex={activeDayIndex}
                onChangeDayIndex={(idx) => {
                  setActiveDayIndex(idx);
                  setIsTimelinePlaying(false);
                }}
                isPlaying={isTimelinePlaying}
                onTogglePlay={() => setIsTimelinePlaying(!isTimelinePlaying)}
                onReset={() => {
                  setActiveDayIndex(0);
                  setIsTimelinePlaying(false);
                }}
                isDrawerOpen={Boolean(selectedHotspot) && !isDrawerCollapsed}
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                onOpen={() => setIsTimelineOpen(true)}
              />
            </main>

            {/* Right Incident Inspection Drawer */}
            {selectedHotspot && (
              <IncidentDrawer
                hotspot={selectedHotspot}
                onClose={() => {
                  setSelectedHotspot(null);
                  setIsDrawerCollapsed(false);
                }}
                onUpdateHotspot={handleUpdateHotspot}
                onOpenDossier={(h) => setDossierHotspot(h)}
                isCollapsed={isDrawerCollapsed}
                onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenAlertModal={(h) => {
                  setAlertWorkflowHotspot(h);
                  setIsAlertWorkflowOpen(true);
                }}
              />
            )}
          </div>
        </div>
      )}

      {hotspots.length > 0 && activeTab === 'analytics' && (
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          <AnalyticsView
            hotspots={hotspots}
            isLoading={isLoading}
            dbError={dbError}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            onRefetch={loadData}
            onNavigateToMap={() => setActiveTab('map')}
          />
          {selectedHotspot && (
            <IncidentDrawer
              hotspot={selectedHotspot}
              onClose={() => {
                setSelectedHotspot(null);
                setIsDrawerCollapsed(false);
              }}
              onUpdateHotspot={handleUpdateHotspot}
              onOpenDossier={(h) => setDossierHotspot(h)}
              isCollapsed={isDrawerCollapsed}
              onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenAlertModal={(h) => {
                setAlertWorkflowHotspot(h);
                setIsAlertWorkflowOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Human Impact View: VAYU-DRISHTI, Am I Safe?, Sensitive Locations, Air Quality */}
      {hotspots.length > 0 && activeTab === 'impact' && (
        <HumanImpactView
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={handleSelectHotspot}
          onNavigateToResponse={(h) => {
            setSelectedHotspot(h);
            setActiveTab('response');
          }}
          onStartInvestigation={(h) => {
            setSelectedHotspot(h);
            setActiveTab('investigations');
          }}
          onRaiseAlert={(h) => {
            setAlertWorkflowHotspot(h);
            setIsAlertWorkflowOpen(true);
          }}
        />
      )}

      {/* Response Mode View: First-Responder 60-Second Run-Card, Safe Route, Checklist */}
      {hotspots.length > 0 && activeTab === 'response' && (
        <ResponseModeView
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={handleSelectHotspot}
          onOpenDossier={(h) => setDossierHotspot(h)}
          onStartInvestigation={(h) => {
            setSelectedHotspot(h);
            setActiveTab('investigations');
          }}
          onRaiseAlert={(h) => {
            setAlertWorkflowHotspot(h);
            setIsAlertWorkflowOpen(true);
          }}
        />
      )}

      {hotspots.length > 0 && activeTab === 'investigations' && (
        <InvestigationView
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={handleSelectHotspot}
          onOpenAlertModal={(h) => {
            setAlertWorkflowHotspot(h);
            setIsAlertWorkflowOpen(true);
          }}
          onUpdateHotspot={handleUpdateHotspot}
        />
      )}

      {hotspots.length > 0 && activeTab === 'alerts' && (
        <AlertsView
          hotspots={hotspots}
          onSelectHotspot={handleSelectHotspot}
          onNavigateToMap={() => setActiveTab('map')}
          onUpdateAlert={handleUpdateAlert}
        />
      )}

      {/* Modals */}
      {/* 1. Supabase Configuration & Telemetry Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isLive={isSupabaseLive}
        onRefreshData={loadData}
      />

      {/* Operator Authentication & Session Management Modal */}
      <AuthModal />

      {/* 2. Mission Replay Modal */}
      {isMissionReplayOpen && (
        <MissionReplayModal
          isOpen={isMissionReplayOpen}
          onClose={() => setIsMissionReplayOpen(false)}
          sampleRecord={
            hotspots.find((h) => h.source_id === 'AGNI-001') ||
            hotspots[0] ||
            null
          }
          onSelectAndInvestigate={(h) => {
            setSelectedHotspot(h);
            setActiveTab('map');
          }}
        />
      )}

      {/* 3. Incident Dossier Modal */}
      <IncidentDossierModal
        hotspot={dossierHotspot}
        onClose={() => setDossierHotspot(null)}
      />

      {/* 4. Two-Stage Alert Escalation Workflow Modal */}
      <AlertWorkflowModal
        hotspot={alertWorkflowHotspot || selectedHotspot || hotspots[0] || null}
        isOpen={isAlertWorkflowOpen}
        onClose={() => setIsAlertWorkflowOpen(false)}
        onUpdateHotspot={handleUpdateHotspot}
        onViewActiveAlert={(h) => {
          setSelectedHotspot(h);
          setActiveTab('alerts');
          setIsAlertWorkflowOpen(false);
        }}
      />

      {/* 5. About & Specifications Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* 6. Agni Kavach Feature Directory & Guide Modal */}
      <FeatureDirectoryModal
        isOpen={isFeatureDirectoryOpen}
        onClose={() => setIsFeatureDirectoryOpen(false)}
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsFeatureDirectoryOpen(false);
        }}
        onOpenReplay={() => {
          setIsFeatureDirectoryOpen(false);
          setIsMissionReplayOpen(true);
        }}
        onOpenDossier={() => {
          setIsFeatureDirectoryOpen(false);
          setDossierHotspot(selectedHotspot || hotspots[0] || null);
        }}
      />
    </div>
  );
}
