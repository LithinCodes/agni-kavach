import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Eye,
  Flame,
  Radio,
  Satellite,
  Building2,
  AlertOctagon,
  Maximize2,
  Compass,
  MapPin,
  Info,
  X,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { HotspotRecord, MapLayerState, PriorityCategory } from '../types';
import { FIRMS_OBSERVATIONS, FIRMS_STATS } from '../data/firmsDataset';

interface MapContainerProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  layers: MapLayerState;
  onToggleLayer: (layerKey: keyof MapLayerState) => void;
  timelineDateFilter?: number | null; // e.g. active day threshold 1-4
  isDrawerOpen?: boolean;
  // Mission Replay Props
  isReplayActive?: boolean;
  replayStage?: number; // 1 to 6
  replaySpeed?: number;
  onExitReplay?: () => void;
  onRestartReplay?: () => void;
  // Guided Demo Mode Props
  isDemoActive?: boolean;
  demoStep?: number;
}

const STAGE_METADATA = [
  {
    stage: 1,
    badge: 'STAGE 1 — 03 OCT 2026',
    title: 'RAW THERMAL OBSERVATIONS',
    subtitle: '03 OCT — 546 Observations downlinked from polar orbit.',
    obsCount: '546',
    counter: '546 / 2,696',
    detail: '03 OCT: 546 single-pass VIIRS_NOAA21_NRT 375m I-band radiometer detections across India.',
    extraDetail: 'Initial orbital passes detect single-pass thermal anomalies.',
  },
  {
    stage: 2,
    badge: 'STAGE 2 — 04 OCT 2026',
    title: 'THERMAL ACTIVITY ACCUMULATING',
    subtitle: '04 OCT — 1,138 Cumulative Observations (+592 new passes).',
    obsCount: '1,138',
    counter: '1,138 / 2,696',
    detail: '04 OCT: 592 new observations (1,138 cumulative). Detections accumulate across industrial corridors.',
    extraDetail: 'Day 1 & Day 2 observations combine to reveal recurrent thermal emitters.',
  },
  {
    stage: 3,
    badge: 'STAGE 3 — 05 OCT 2026',
    title: 'SPATIAL PATTERNS EMERGING',
    subtitle: '05 OCT — 1,795 Cumulative Observations (+657 new passes).',
    obsCount: '1,795',
    counter: '1,795 / 2,696',
    detail: '05 OCT: 657 new observations (1,795 cumulative). DBSCAN spatial grouping (1.2km) isolates 1,274 discrete clusters.',
    extraDetail: 'Spatial proximity grouping delineates localized industrial cluster centroids.',
  },
  {
    stage: 4,
    badge: 'STAGE 4 — 06 OCT 2026',
    title: 'PERSISTENT ACTIVITY EMERGING',
    subtitle: '06 OCT — 2,696 Cumulative Observations (+901 new passes).',
    obsCount: '2,696',
    counter: '2,696 / 2,696',
    detail: '06 OCT: 901 new observations (2,696 cumulative). Multi-day temporal recurrence across 4 observed days isolates 57 persistent candidates.',
    extraDetail: '770 observations associated with 57 persistent candidates exhibiting multi-day recurrence across all 4 observed days.',
  },
  {
    stage: 5,
    badge: 'STAGE 5 — 07 OCT 2026',
    title: '07 OCT DATA STATUS',
    subtitle: '07 OCT — 2,696 / NO NEW OBSERVATIONS (DATA PENDING)',
    obsCount: '2,696',
    counter: '2,696 / NO NEW OBSERVATIONS',
    detail: '07 OCT: DATA PENDING (0 observations currently available from VIIRS_NOAA21_NRT). Multi-day continuity evaluated across 4 observed days (03–06 OCT).',
    extraDetail: 'No candidate is described as having five observed days. 100% active-day continuity is established across the 4 observed days (03, 04, 05, 06 OCT).',
  },
  {
    stage: 6,
    badge: 'STAGE 6 — PRIORITY INTELLIGENCE',
    title: 'AGNI KAVACH PRIORITY INTELLIGENCE',
    subtitle: 'Deterministic mathematical fusion & risk prioritization matrix.',
    obsCount: '2,696',
    counter: '57 PERSISTENT CANDIDATES PRIORITIZED',
    detail: 'Audited priority distribution: 4 HIGH • 51 MEDIUM • 2 LOW • 0 CRITICAL',
    extraDetail: 'Operational Behavioral Archetype Partition: K=4 (sil=0.3195; math best K=2, sil=0.4637). Satellite Verification: 0/57 verified, Tasking Pending.',
  },
];

export const MapContainer: React.FC<MapContainerProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  layers,
  onToggleLayer,
  timelineDateFilter,
  isDrawerOpen = false,
  isReplayActive = false,
  replayStage = 1,
  replaySpeed = 1,
  onExitReplay,
  onRestartReplay,
  isDemoActive = false,
  demoStep = 0,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const satelliteContextLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const builtEnvLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const replayLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Active layers counter for compact pill
  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  // Helper to attach keyless basemap (OpenStreetMap Dark Canvas or Esri World Imagery)
  const applyBasemap = (map: L.Map, mode: 'dark' | 'satellite') => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (mode === 'dark') {
      const darkTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | NASA FIRMS | ESA Sentinel-2',
        className: 'map-tiles-dark',
      });
      darkTiles.addTo(map);
      tileLayerRef.current = darkTiles;
    } else {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxNativeZoom: 18,
          maxZoom: 19,
          attribution: '&copy; Esri World Imagery | Copernicus Sentinel-2 | NASA FIRMS',
        }
      );
      satLayer.addTo(map);
      tileLayerRef.current = satLayer;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Eastern / Central India (Odisha / Chhattisgarh / Jharkhand industrial cluster corridor)
    const map = L.map(mapContainerRef.current, {
      center: [20.9, 83.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    applyBasemap(map, 'dark');

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    satelliteContextLayerGroupRef.current = L.layerGroup().addTo(map);
    builtEnvLayerGroupRef.current = L.layerGroup().addTo(map);
    replayLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map viewport resize when panels open/close
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Invalidate map size when drawer state changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timeoutId = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [isDrawerOpen, selectedHotspot]);

  // Switch Basemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    applyBasemap(mapInstanceRef.current, basemap);
  }, [basemap]);

  // Render Operational Layers vs Replay Layers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const markersGroup = markersLayerGroupRef.current;
    const heatmapGroup = heatmapLayerGroupRef.current;
    const satelliteGroup = satelliteContextLayerGroupRef.current;
    const builtEnvGroup = builtEnvLayerGroupRef.current;
    const replayGroup = replayLayerGroupRef.current;

    if (!markersGroup || !replayGroup) return;

    // IF GUIDED DEMO MODE IS ACTIVE:
    if (isDemoActive) {
      markersGroup.clearLayers();
      if (heatmapGroup) heatmapGroup.clearLayers();
      if (satelliteGroup) satelliteGroup.clearLayers();
      if (builtEnvGroup) builtEnvGroup.clearLayers();
      replayGroup.clearLayers();

      // Demo Step 0: INTRO - Ambient baseline
      if (demoStep === 0) {
        FIRMS_OBSERVATIONS.slice(0, 450).forEach((obs) => {
          const circle = L.circleMarker([obs.latitude, obs.longitude], {
            radius: 2,
            color: '#243441',
            fillColor: '#35C6E8',
            fillOpacity: 0.35,
            weight: 1,
          });
          replayGroup.addLayer(circle);
        });
      }

      // Demo Step 1: 01 — OBSERVE (2,696 NASA FIRMS Spaceborne Thermal Observations in amber)
      if (demoStep === 1) {
        FIRMS_OBSERVATIONS.forEach((obs) => {
          const circle = L.circleMarker([obs.latitude, obs.longitude], {
            radius: obs.frp > 30 ? 4 : 2.5,
            color: '#FF9F1C',
            fillColor: '#FFAA00',
            fillOpacity: 0.8,
            weight: 1,
          });
          const tooltip = `
            <div class="bg-[#080C14] border border-[#FF9F1C]/60 p-1.5 rounded text-slate-200 font-mono text-[10px]">
              <div class="font-bold text-[#FF9F1C]">VIIRS Observation #${obs.id}</div>
              <div class="text-slate-300">${obs.date} • ${obs.time}</div>
              <div class="text-amber-200">Sensor FRP: ${obs.frp}</div>
            </div>
          `;
          circle.bindTooltip(tooltip, { opacity: 0.95 });
          replayGroup.addLayer(circle);
        });
      }

      // Demo Step 2: 02 — CLUSTER (1,274 Clusters in analytical cyan halos)
      if (demoStep === 2) {
        FIRMS_OBSERVATIONS.forEach((obs) => {
          const circle = L.circleMarker([obs.latitude, obs.longitude], {
            radius: 2,
            color: '#304351',
            fillColor: '#64748B',
            fillOpacity: 0.3,
            weight: 0.5,
          });
          replayGroup.addLayer(circle);
        });

        hotspots.forEach((h) => {
          const clusterRing = L.circle([h.latitude, h.longitude], {
            radius: 2200,
            color: '#35C6E8',
            dashArray: '3, 4',
            weight: 1.5,
            opacity: 0.85,
            fillColor: '#35C6E8',
            fillOpacity: 0.12,
          });
          clusterRing.bindTooltip(
            `<div class="font-mono text-[10px] bg-[#0A1118] p-1 border border-[#35C6E8]/60 text-[#35C6E8]">
              Cluster #${h.thermal_cluster || h.id} • 1,274 Spatial Clusters
             </div>`,
            { sticky: true }
          );
          replayGroup.addLayer(clusterRing);
        });
      }

      // Demo Step 3: 03 — PERSIST (57 Persistent Candidates, 770 Retained Observations across 4 observed days)
      if (demoStep === 3) {
        hotspots.forEach((h) => {
          const persistentHalo = L.circle([h.latitude, h.longitude], {
            radius: 3500,
            color: '#FF9F1C',
            dashArray: '4, 4',
            weight: 2,
            opacity: 0.9,
            fillColor: '#FF9F1C',
            fillOpacity: 0.15,
          });
          persistentHalo.bindTooltip(
            `<div class="font-mono text-[10px] bg-[#0A1118] p-1.5 border border-[#FF9F1C] text-amber-200">
              <div class="font-bold text-white">${h.source_id}</div>
              <div>${h.detections} detections • ${h.active_days}/4 active days</div>
              <div class="text-[#FF9F1C] font-bold">100% Continuity Across 03–06 Oct</div>
             </div>`,
            { sticky: true }
          );
          replayGroup.addLayer(persistentHalo);

          const centerMarker = L.circleMarker([h.latitude, h.longitude], {
            radius: 4.5,
            color: '#FFFFFF',
            fillColor: '#FF9F1C',
            fillOpacity: 1,
            weight: 1.5,
          });
          replayGroup.addLayer(centerMarker);
        });
      }

      // Demo Steps 4, 5, 6: PRIORITIZE, INVESTIGATE, ACT (Full priority colors HIGH=RED, MED=AMBER, LOW=GREEN)
      if (demoStep >= 4) {
        hotspots.forEach((hotspot) => {
          const isSelected = selectedHotspot?.source_id === hotspot.source_id;

          let primaryColor = '#10B981'; // LOW (GREEN #10B981)
          let glowColor = 'rgba(16, 185, 129, 0.45)';
          let markerDiameter = Math.max(16, Math.min(28, Math.round(hotspot.priority_score / 2.8)));

          if (hotspot.priority_category === 'CRITICAL') {
            primaryColor = '#B91C1C'; // CRITICAL
            glowColor = 'rgba(185, 28, 28, 0.65)';
            markerDiameter = Math.max(24, Math.min(36, Math.round(hotspot.priority_score / 2.3)));
          } else if (hotspot.priority_category === 'HIGH') {
            primaryColor = '#EF4444'; // HIGH (RED / CORAL #EF4444)
            glowColor = 'rgba(239, 68, 68, 0.6)';
            markerDiameter = Math.max(22, Math.min(34, Math.round(hotspot.priority_score / 2.4)));
          } else if (hotspot.priority_category === 'MEDIUM') {
            primaryColor = '#F59E0B'; // MEDIUM (AMBER #F59E0B)
            glowColor = 'rgba(245, 158, 11, 0.5)';
            markerDiameter = Math.max(18, Math.min(28, Math.round(hotspot.priority_score / 2.6)));
          }

          const isActionAlert = demoStep === 6 && isSelected;

          const customHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${markerDiameter}px; height: ${markerDiameter}px;">
              ${
                isSelected
                  ? `<div class="absolute -inset-2.5 rounded-full border-2 border-[#22D3EE] bg-[#22D3EE]/20 shadow-[0_0_12px_rgba(34,211,238,0.7)] pointer-events-none animate-pulse"></div>
                     <div class="absolute -inset-0.5 rounded-full border border-white/80 pointer-events-none"></div>`
                  : ''
              }
              ${
                isActionAlert
                  ? `<div class="absolute -inset-4 rounded-full border-2 border-[#EF4444] bg-[#EF4444]/20 shadow-[0_0_16px_rgba(239,68,68,0.8)] pointer-events-none animate-ping"></div>`
                  : ''
              }
              <div
                class="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-[9px] text-white shadow-md transition-transform hover:scale-110"
                style="
                  background: radial-gradient(circle, ${primaryColor} 60%, #071018 100%);
                  border: 2px solid ${isSelected ? '#FFFFFF' : primaryColor};
                  box-shadow: 0 0 10px ${glowColor};
                "
              >
                ${hotspot.priority_category === 'HIGH' || hotspot.priority_category === 'CRITICAL' ? '!' : ''}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: customHtml,
            className: 'agni-marker-wrapper',
            iconSize: [markerDiameter, markerDiameter],
            iconAnchor: [markerDiameter / 2, markerDiameter / 2],
          });

          const marker = L.marker([hotspot.latitude, hotspot.longitude], {
            icon: customIcon,
          });

          const tooltipHtml = `
            <div class="bg-[#080C14] border border-cyan-500/50 p-2 rounded text-slate-200 font-mono shadow-xl text-xs min-w-[160px]">
              <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                <span class="font-bold text-white tracking-wider">${hotspot.source_id}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hotspot.priority_category === 'HIGH'
                    ? 'bg-red-950 text-red-400 border border-red-500/60'
                    : hotspot.priority_category === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-400 border border-amber-500/60'
                    : hotspot.priority_category === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-700/70'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/60'
                }">${hotspot.priority_category}</span>
              </div>
              <div class="text-[11px] text-cyan-300 flex justify-between">
                <span>PRIORITY SCORE:</span>
                <span class="font-bold font-mono">${hotspot.priority_score.toFixed(3)}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                ${hotspot.location || hotspot.nearest_city || 'Regional Sector'}
              </div>
              <div class="text-[9px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-900 pt-1 font-mono">
                <span>${hotspot.detections} detections • ${hotspot.active_days}/4 active days</span>
              </div>
            </div>
          `;

          marker.bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -markerDiameter / 2],
            className: 'agni-custom-leaflet-tooltip',
            opacity: 0.98,
          });

          marker.on('click', () => {
            onSelectHotspot(hotspot);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([hotspot.latitude, hotspot.longitude], 10, {
                duration: 1.2,
              });
            }
          });

          replayGroup.addLayer(marker);
        });
      }

      return;
    }

    // IF MISSION REPLAY IS ACTIVE:
    if (isReplayActive) {
      // Clear normal operational layers
      markersGroup.clearLayers();
      if (heatmapGroup) heatmapGroup.clearLayers();
      if (satelliteGroup) satelliteGroup.clearLayers();
      if (builtEnvGroup) builtEnvGroup.clearLayers();
      replayGroup.clearLayers();

      const maxDayIdx = Math.min(4, replayStage - 1);
      const visibleObservations = FIRMS_OBSERVATIONS.filter((o) => o.dayIndex <= maxDayIdx);

      // 1. Render progressive FIRMS observations
      visibleObservations.forEach((obs) => {
        const isNew = obs.dayIndex === maxDayIdx;
        const isStage6 = replayStage === 6;

        const radius = isStage6 ? 2 : isNew ? (obs.isPersistent ? 4.5 : 3.5) : (obs.isPersistent ? 3 : 2.5);
        const color = isStage6
          ? '#64748B'
          : isNew
          ? obs.isPersistent
            ? '#FF4400'
            : '#F97316'
          : obs.isPersistent
          ? '#F97316'
          : '#94A3B8';
        const fillColor = isStage6
          ? '#475569'
          : isNew
          ? obs.isPersistent
            ? '#FFAA00'
            : '#FB923C'
          : obs.isPersistent
          ? '#EA580C'
          : '#64748B';
        const fillOpacity = isStage6 ? 0.22 : isNew ? 0.9 : 0.45;

        const circleMarker = L.circleMarker([obs.latitude, obs.longitude], {
          radius,
          color,
          weight: isNew ? 1.5 : 1,
          fillColor,
          fillOpacity,
        });

        const tooltipText = `
          <div class="bg-[#080C14] border border-cyan-500/40 p-1.5 rounded text-slate-200 font-mono text-[10px]">
            <div class="font-bold text-cyan-300">Observation #${obs.id}</div>
            <div class="text-slate-400">${obs.date} • ${obs.time}</div>
            <div class="text-slate-300">Sensor FRP: ${obs.frp} • Cluster #${obs.clusterId}</div>
            ${
              obs.isPersistent
                ? `<div class="text-amber-400 font-bold mt-0.5">Part of ${obs.sourceId || 'Persistent Candidate'}</div>`
                : ''
            }
          </div>
        `;
        circleMarker.bindTooltip(tooltipText, { opacity: 0.95 });
        replayGroup.addLayer(circleMarker);
      });

      // 2. STAGE 3: Spatial clustering halos
      if (replayStage === 3) {
        hotspots.forEach((h) => {
          const clusterRing = L.circle([h.latitude, h.longitude], {
            radius: 2000,
            color: '#06B6D4',
            dashArray: '3, 4',
            weight: 1.5,
            opacity: 0.8,
            fillColor: '#06B6D4',
            fillOpacity: 0.08,
          });
          replayGroup.addLayer(clusterRing);
        });
      }

      // 3. STAGE 4: Persistent multi-day recurrence halos
      if (replayStage === 4) {
        hotspots
          .filter((h) => h.active_days >= 3)
          .forEach((h) => {
            const persistentRing = L.circle([h.latitude, h.longitude], {
              radius: 3500,
              color: '#F59E0B',
              dashArray: '4, 4',
              weight: 2,
              opacity: 0.9,
              fillColor: '#F59E0B',
              fillOpacity: 0.14,
            });
            persistentRing.bindTooltip(
              `<div class="font-mono text-[10px] bg-black/90 p-1 border border-amber-500/50 text-amber-200">
                Multi-Day Recurrence Detected (${h.active_days} active days)
               </div>`,
              { sticky: true }
            );
            replayGroup.addLayer(persistentRing);
          });
      }

      // 4. STAGE 5: Highlight all 57 persistent candidates identified
      if (replayStage === 5) {
        hotspots.forEach((h) => {
          const candidateCircle = L.circle([h.latitude, h.longitude], {
            radius: 4000,
            color: '#00F0FF',
            dashArray: '3, 3',
            weight: 2,
            opacity: 0.95,
            fillColor: '#00F0FF',
            fillOpacity: 0.18,
          });
          candidateCircle.bindTooltip(
            `<div class="font-mono text-[10px] bg-black/90 p-1.5 border border-cyan-400 text-cyan-200">
              <div class="font-bold text-white">${h.source_id}</div>
              <div>${h.detections} detections • ${h.active_days} active days</div>
              <div class="text-slate-400">Persistence: ${h.persistence.toFixed(1)}%</div>
             </div>`,
            { sticky: true }
          );
          replayGroup.addLayer(candidateCircle);
        });
      }

      // 5. STAGE 6: FINAL INTELLIGENCE — Full priority categorization on the 57 candidates
      if (replayStage === 6) {
        hotspots.forEach((hotspot) => {
          const isSelected = selectedHotspot?.source_id === hotspot.source_id;

          let primaryColor = '#10B981'; // LOW (GREEN #10B981)
          let glowColor = 'rgba(16, 185, 129, 0.45)';
          let markerDiameter = Math.max(16, Math.min(28, Math.round(hotspot.priority_score / 2.8)));

          if (hotspot.priority_category === 'CRITICAL') {
            primaryColor = '#B91C1C'; // CRITICAL (DEEP RED / CRIMSON)
            glowColor = 'rgba(185, 28, 28, 0.65)';
            markerDiameter = Math.max(24, Math.min(36, Math.round(hotspot.priority_score / 2.3)));
          } else if (hotspot.priority_category === 'HIGH') {
            primaryColor = '#EF4444'; // HIGH (RED / CORAL #EF4444)
            glowColor = 'rgba(239, 68, 68, 0.6)';
            markerDiameter = Math.max(22, Math.min(34, Math.round(hotspot.priority_score / 2.4)));
          } else if (hotspot.priority_category === 'MEDIUM') {
            primaryColor = '#F59E0B'; // MEDIUM (AMBER / ORANGE-YELLOW #F59E0B)
            glowColor = 'rgba(245, 158, 11, 0.5)';
            markerDiameter = Math.max(18, Math.min(28, Math.round(hotspot.priority_score / 2.6)));
          }

          const customHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${markerDiameter}px; height: ${markerDiameter}px;">
              ${
                isSelected
                  ? `<div class="absolute -inset-2 rounded-full border-2 border-[#22D3EE] bg-[#22D3EE]/20 shadow-[0_0_12px_rgba(34,211,238,0.7)] pointer-events-none animate-pulse"></div>
                     <div class="absolute -inset-0.5 rounded-full border border-white/80 pointer-events-none"></div>`
                  : ''
              }
              <div
                class="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-[9px] text-white shadow-md transition-transform hover:scale-110"
                style="
                  background: radial-gradient(circle, ${primaryColor} 60%, #071018 100%);
                  border: 2px solid ${isSelected ? '#FFFFFF' : primaryColor};
                  box-shadow: 0 0 10px ${glowColor};
                "
              >
                ${hotspot.priority_category === 'HIGH' || hotspot.priority_category === 'CRITICAL' ? '!' : ''}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: customHtml,
            className: 'agni-marker-wrapper',
            iconSize: [markerDiameter, markerDiameter],
            iconAnchor: [markerDiameter / 2, markerDiameter / 2],
          });

          const marker = L.marker([hotspot.latitude, hotspot.longitude], {
            icon: customIcon,
          });

          const tooltipHtml = `
            <div class="bg-[#080C14] border border-cyan-500/50 p-2 rounded text-slate-200 font-mono shadow-xl text-xs min-w-[160px]">
              <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                <span class="font-bold text-white tracking-wider">${hotspot.source_id}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hotspot.priority_category === 'HIGH'
                    ? 'bg-red-950 text-red-400 border border-red-500/60'
                    : hotspot.priority_category === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-400 border border-amber-500/60'
                    : hotspot.priority_category === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-700/70'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/60'
                }">${hotspot.priority_category}</span>
              </div>
              <div class="text-[11px] text-cyan-300 flex justify-between">
                <span>PRIORITY SCORE:</span>
                <span class="font-bold font-mono">${hotspot.priority_score.toFixed(3)}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                ${hotspot.location || hotspot.nearest_city || 'Regional Sector'}
              </div>
              <div class="text-[9px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-900 pt-1 font-mono">
                <span>${hotspot.detections} detections • ${hotspot.active_days} active days</span>
              </div>
            </div>
          `;

          marker.bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -markerDiameter / 2],
            className: 'agni-custom-leaflet-tooltip',
            opacity: 0.98,
          });

          marker.on('click', () => {
            onSelectHotspot(hotspot);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([hotspot.latitude, hotspot.longitude], 10, {
                duration: 1.2,
              });
            }
          });

          replayGroup.addLayer(marker);
        });
      }

      return;
    }

    // NORMAL OPERATIONAL LAYERS MODE:
    replayGroup.clearLayers();
    markersGroup.clearLayers();
    if (heatmapGroup) heatmapGroup.clearLayers();
    if (satelliteGroup) satelliteGroup.clearLayers();
    if (builtEnvGroup) builtEnvGroup.clearLayers();

    const visibleHotspots = hotspots.filter((h) => {
      if (timelineDateFilter !== undefined && timelineDateFilter !== null) {
        return h.active_days >= timelineDateFilter;
      }
      return true;
    });

    visibleHotspots.forEach((hotspot) => {
      const isSelected = selectedHotspot?.source_id === hotspot.source_id;

      let primaryColor = '#10B981'; // LOW (GREEN #10B981)
      let glowColor = 'rgba(16, 185, 129, 0.45)';
      let markerDiameter = Math.max(16, Math.min(28, Math.round(hotspot.priority_score / 2.8)));

      if (hotspot.priority_category === 'CRITICAL') {
        primaryColor = '#B91C1C'; // CRITICAL (DEEP RED / CRIMSON)
        glowColor = 'rgba(185, 28, 28, 0.65)';
        markerDiameter = Math.max(24, Math.min(36, Math.round(hotspot.priority_score / 2.3)));
      } else if (hotspot.priority_category === 'HIGH') {
        primaryColor = '#EF4444'; // HIGH (RED / CORAL #EF4444)
        glowColor = 'rgba(239, 68, 68, 0.6)';
        markerDiameter = Math.max(22, Math.min(34, Math.round(hotspot.priority_score / 2.4)));
      } else if (hotspot.priority_category === 'MEDIUM') {
        primaryColor = '#F59E0B'; // MEDIUM (AMBER / ORANGE-YELLOW #F59E0B)
        glowColor = 'rgba(245, 158, 11, 0.5)';
        markerDiameter = Math.max(18, Math.min(28, Math.round(hotspot.priority_score / 2.6)));
      }

      // 1. Thermal Priority Source Markers
      if (layers.thermalSources) {
        const customHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${markerDiameter}px; height: ${markerDiameter}px;">
            ${
              isSelected
                ? `<div class="absolute -inset-2.5 rounded-full border-2 border-[#22D3EE] bg-[#22D3EE]/20 shadow-[0_0_12px_rgba(34,211,238,0.7)] pointer-events-none animate-pulse"></div>
                   <div class="absolute -inset-0.5 rounded-full border border-white/80 pointer-events-none"></div>`
                : ''
            }
            <div
              class="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-[9px] text-white shadow-md transition-transform hover:scale-110"
              style="
                background: radial-gradient(circle, ${primaryColor} 60%, #071018 100%);
                border: 2px solid ${isSelected ? '#FFFFFF' : primaryColor};
                box-shadow: 0 0 10px ${glowColor};
              "
            >
              ${hotspot.priority_category === 'HIGH' || hotspot.priority_category === 'CRITICAL' ? '!' : ''}
            </div>
            ${
              hotspot.alert_status === 'Alert Raised'
                ? `<div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-[#0D151D] shadow-[0_0_4px_#EF4444]"></div>`
                : ''
            }
          </div>
        `;

        const customIcon = L.divIcon({
          html: customHtml,
          className: 'agni-marker-wrapper',
          iconSize: [markerDiameter, markerDiameter],
          iconAnchor: [markerDiameter / 2, markerDiameter / 2],
        });

        const marker = L.marker([hotspot.latitude, hotspot.longitude], {
          icon: customIcon,
        });

        const tooltipHtml = `
          <div class="bg-[#080C14] border border-cyan-500/50 p-2 rounded text-slate-200 font-mono shadow-xl text-xs min-w-[160px]">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
              <span class="font-bold text-white tracking-wider">${hotspot.source_id}</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hotspot.priority_category === 'HIGH'
                  ? 'bg-red-950 text-red-400 border border-red-500/60'
                  : hotspot.priority_category === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-400 border border-amber-500/60'
                  : hotspot.priority_category === 'CRITICAL'
                  ? 'bg-red-950 text-red-300 border border-red-700/70'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/60'
              }">${hotspot.priority_category}</span>
            </div>
            <div class="text-[11px] text-cyan-300 flex justify-between">
              <span>PRIORITY SCORE:</span>
              <span class="font-bold font-mono">${hotspot.priority_score.toFixed(3)}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">
              ${hotspot.location || hotspot.nearest_city || 'Regional Sector'}
            </div>
            <div class="text-[9px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-900 pt-1 font-mono">
              <span>${hotspot.detections} detections • ${hotspot.active_days} active days</span>
              <span>Sensor FRP: ${hotspot.mean_frp != null ? hotspot.mean_frp.toFixed(2) : 'N/A'}</span>
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipHtml, {
          direction: 'top',
          offset: [0, -markerDiameter / 2],
          className: 'agni-custom-leaflet-tooltip',
          opacity: 0.98,
        });

        marker.on('click', () => {
          onSelectHotspot(hotspot);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([hotspot.latitude, hotspot.longitude], 10, {
              duration: 1.2,
            });
          }
        });

        markersGroup.addLayer(marker);
      }

      // 2. Priority Heatmap Circles
      if (layers.priorityHeatmap && heatmapGroup) {
        const radiusMeters = (hotspot.thermal_risk || 30) * 120;
        const circle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: radiusMeters,
          color: primaryColor,
          weight: 1,
          opacity: 0.4,
          fillColor: primaryColor,
          fillOpacity: hotspot.priority_category === 'HIGH' ? 0.22 : 0.12,
        });
        heatmapGroup.addLayer(circle);
      }

      // 3. Sentinel-2 Satellite Context Layer
      if (layers.satelliteContext && satelliteGroup && hotspot.satellite_available) {
        const satCircle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: 8000,
          color: '#6366F1',
          dashArray: '4, 6',
          weight: 1.5,
          opacity: 0.7,
          fillColor: '#4338CA',
          fillOpacity: 0.08,
        });
        satCircle.bindTooltip(
          `<div class="font-mono text-[10px] bg-slate-950 p-1 border border-indigo-500/40 text-indigo-200">
            Sentinel-2 MSI Scene • NDVI: ${hotspot.ndvi?.toFixed(3) ?? 'N/A'} • NDBI: ${hotspot.ndbi?.toFixed(3) ?? 'N/A'}
           </div>`,
          { sticky: true }
        );
        satelliteGroup.addLayer(satCircle);
      }

      // 4. Built Environment Context Highlight
      if (
        layers.builtEnvContext &&
        builtEnvGroup &&
        (hotspot.built_surface_context?.includes('BUILT') ||
          (hotspot.ndbi !== null && hotspot.ndbi !== undefined && hotspot.ndbi > 0))
      ) {
        const builtMarker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
          radius: 12,
          color: '#00F0FF',
          weight: 1.5,
          dashArray: '2, 3',
          fillColor: '#0891B2',
          fillOpacity: 0.25,
        });
        builtEnvGroup.addLayer(builtMarker);
      }

      // 5. Investigation Active Sources Highlight
      if (layers.investigationSources && hotspot.investigation_status === 'Under Investigation') {
        const investCircle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: 4000,
          color: '#F59E0B',
          dashArray: '2, 4',
          weight: 2,
          opacity: 0.8,
          fill: false,
        });
        markersGroup.addLayer(investCircle);
      }
    });
  }, [hotspots, selectedHotspot, layers, timelineDateFilter, onSelectHotspot, isReplayActive, replayStage, isDemoActive, demoStep]);

  // Pan to selected hotspot smoothly if triggered from elsewhere
  useEffect(() => {
    if (!selectedHotspot || !mapInstanceRef.current || isReplayActive) return;
    mapInstanceRef.current.flyTo(
      [selectedHotspot.latitude, selectedHotspot.longitude],
      Math.max(mapInstanceRef.current.getZoom(), 9),
      { duration: 1.0 }
    );
  }, [selectedHotspot, isReplayActive]);

  const handleResetBounds = () => {
    if (!mapInstanceRef.current || hotspots.length === 0) return;
    const bounds = L.latLngBounds(hotspots.map((h) => [h.latitude, h.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const currentStageMeta = STAGE_METADATA.find((s) => s.stage === replayStage) || STAGE_METADATA[0];

  return (
    <div id="agni-map-wrapper" className="relative w-full h-full bg-[#050811] overflow-hidden">
      {/* Leaflet Map DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Basemap Switcher & Replay Stage HUD Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[calc(100vw-1.5rem)] sm:max-w-sm pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Compact Basemap Switcher */}
          <div className="flex items-center gap-1 bg-[#080C14]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl text-xs font-mono">
            <button
              id="btn-basemap-dark"
              onClick={() => setBasemap('dark')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                basemap === 'dark'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DARK
            </button>
            <button
              id="btn-basemap-sat"
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                basemap === 'satellite'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SAT
            </button>
          </div>

          {/* Standard Map Legend (shown only when NOT in replay mode and during demo prioritization) */}
          {!isReplayActive && (!isDemoActive || demoStep >= 4) && (
            <div
              id="compact-map-legend"
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0A1118]/95 backdrop-blur-md border border-[#243441] text-[10px] font-mono text-slate-300 shadow-xl select-none"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-[0_0_6px_rgba(239,68,68,0.8)] border border-white/20" />
                <span className="text-slate-200">HIGH</span>
              </span>
              <span className="text-[#243441]">&bull;</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-[0_0_6px_rgba(245,158,11,0.8)] border border-white/20" />
                <span className="text-slate-200">MEDIUM</span>
              </span>
              <span className="text-[#243441]">&bull;</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-[0_0_6px_rgba(16,185,129,0.8)] border border-white/20" />
                <span className="text-slate-200">LOW</span>
              </span>
              <span className="text-[#243441]">&bull;</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-3 h-3 rounded-full border-2 border-[#22D3EE] bg-transparent inline-flex items-center justify-center shadow-[0_0_6px_rgba(34,211,238,0.8)]">
                  <span className="w-1 h-1 rounded-full bg-white" />
                </span>
                <span className="text-[#22D3EE]">SELECTED</span>
              </span>
            </div>
          )}
        </div>

        {/* MISSION REPLAY INTERACTIVE STAGE HUD CARD */}
        {isReplayActive && (
          <div
            id="mission-replay-hud"
            className="w-full bg-[#070A12]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl font-mono text-xs select-none pointer-events-auto space-y-2 animate-in fade-in zoom-in-95"
          >
            {/* Header / Stage Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  {currentStageMeta.badge}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">STAGE {replayStage}/6</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  {replaySpeed}× SPEED
                </span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="text-sm font-bold text-white tracking-wide font-['Chakra_Petch']">
                {currentStageMeta.title}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {currentStageMeta.subtitle}
              </div>
            </div>

            {/* Observation Counter */}
            <div className="bg-black/50 border border-slate-800 rounded px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">
                {replayStage < 6 ? 'Observations Ingested:' : 'Total Telemetry Assessed:'}
              </span>
              <span className="text-cyan-300 font-bold text-xs tracking-wider">
                {currentStageMeta.counter}
              </span>
            </div>

            {/* Scientific Progress Detail */}
            <div className="text-[10px] text-slate-300 bg-cyan-950/25 border border-cyan-500/20 rounded p-1.5 leading-relaxed">
              {currentStageMeta.extraDetail}
            </div>

            {/* Stage 6: Detection-to-Prioritization Funnel */}
            {replayStage === 6 && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider text-center">
                  DETECTION-TO-PRIORITIZATION FUNNEL
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono">
                  <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded">
                    <div className="text-xs font-bold text-white">2,696</div>
                    <div className="text-[8px] text-slate-400 uppercase leading-none mt-0.5">
                      FIRMS OBS
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded">
                    <div className="text-xs font-bold text-cyan-300">1,274</div>
                    <div className="text-[8px] text-slate-400 uppercase leading-none mt-0.5">
                      CLUSTERS
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-amber-500/30 p-1.5 rounded">
                    <div className="text-xs font-bold text-amber-300">57</div>
                    <div className="text-[8px] text-slate-400 uppercase leading-none mt-0.5">
                      PERSISTENT
                    </div>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/50 p-1.5 rounded">
                    <div className="text-xs font-bold text-rose-400">4</div>
                    <div className="text-[8px] text-rose-300 uppercase leading-none mt-0.5">
                      HIGH PRIO
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] bg-black/40 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-400">Priority Categories:</span>
                  <span className="font-bold text-slate-200">
                    <span className="text-emerald-400">2 LOW</span> •{' '}
                    <span className="text-amber-400">51 MED</span> •{' '}
                    <span className="text-rose-400">4 HIGH</span> •{' '}
                    <span className="text-slate-500">0 CRIT</span>
                  </span>
                </div>

                {/* Replay Completion Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>REPLAY COMPLETE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onRestartReplay}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>REPLAY</span>
                    </button>
                    <button
                      onClick={onExitReplay}
                      className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-bold transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                    >
                      EXIT REPLAY
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Layer Control Button & Popover (Top Right) */}
      <div className="absolute top-3 right-12 z-20">
        {!showLayerPanel ? (
          <button
            id="btn-toggle-map-layers"
            onClick={() => setShowLayerPanel(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080C14]/90 backdrop-blur-md border border-slate-800 hover:border-cyan-500/60 text-slate-200 text-xs font-mono shadow-xl transition-all cursor-pointer"
            title="Configure Geospatial Layers"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-[11px] hidden sm:inline">MAP LAYERS</span>
            <span className="text-[10px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {activeLayersCount}
            </span>
          </button>
        ) : (
          <div
            id="map-layers-popover"
            className="w-64 bg-[#080C14]/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl font-mono text-xs text-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>GEOSPATIAL LAYERS</span>
              </div>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 text-[11px]">
              {/* Layer: Thermal Priority Sources */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Thermal Priority Sources</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.thermalSources}
                  onChange={() => onToggleLayer('thermalSources')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Layer: Thermal Risk Radii */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thermal Risk Radii</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.priorityHeatmap ?? true}
                  onChange={() => onToggleLayer('priorityHeatmap')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Layer: Sentinel-2 Context */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <Satellite className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sentinel-2 Context</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.satelliteContext}
                  onChange={() => onToggleLayer('satelliteContext')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Layer: Built-Surface Context */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Built-Surface Context</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.builtEnvContext}
                  onChange={() => onToggleLayer('builtEnvContext')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Layer: Investigation Active */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Investigation Active</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.investigationSources}
                  onChange={() => onToggleLayer('investigationSources')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Disabled unverified external layers with clear scientific disclaimer */}
              <div className="border-t border-slate-800/80 pt-1.5 mt-1 space-y-1">
                <div className="flex items-center justify-between p-1 text-slate-500 text-[10px]">
                  <span>Administrative Boundaries</span>
                  <span className="text-[9px] text-amber-500/80">Data source not connected</span>
                </div>
                <div className="flex items-center justify-between p-1 text-slate-500 text-[10px]">
                  <span>Wind / Atmospheric Vectors</span>
                  <span className="text-[9px] text-amber-500/80">Data source not connected</span>
                </div>
                <div className="flex items-center justify-between p-1 text-slate-500 text-[10px]">
                  <span>Industrial Cadastral Polygons</span>
                  <span className="text-[9px] text-amber-500/80">Data source not connected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Control Buttons: Reset Bounds & Orientation */}
      <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleResetBounds}
          className="w-8 h-8 rounded bg-[#080C14]/90 backdrop-blur-md border border-slate-700 text-slate-300 flex items-center justify-center hover:text-cyan-300 hover:border-cyan-500 shadow-xl transition-all cursor-pointer"
          title="Fit All Monitored Sources"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.setView([20.9, 83.5], 6)}
          className="w-8 h-8 rounded bg-[#080C14]/90 backdrop-blur-md border border-slate-700 text-slate-300 flex items-center justify-center hover:text-cyan-300 hover:border-cyan-500 shadow-xl transition-all cursor-pointer"
          title="Recenter Regional Sector"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Map Attribution Badge (Bottom Right) */}
      <div className="absolute bottom-2 right-3 z-10 pointer-events-none hidden sm:block">
        <div className="bg-[#080C14]/85 backdrop-blur-md border border-slate-800/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 shadow-md">
          {basemap === 'dark' ? 'Basemap: OpenStreetMap Dark Canvas' : 'Basemap: Esri World Imagery'} &bull; NASA FIRMS &bull; ESA Sentinel-2
        </div>
      </div>
    </div>
  );
};
