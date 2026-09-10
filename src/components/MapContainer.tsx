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
} from 'lucide-react';
import { HotspotRecord, MapLayerState, PriorityCategory } from '../types';

interface MapContainerProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  layers: MapLayerState;
  onToggleLayer: (layerKey: keyof MapLayerState) => void;
  timelineDateFilter?: number | null; // e.g. active day threshold 1-4
  isDrawerOpen?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  layers,
  onToggleLayer,
  timelineDateFilter,
  isDrawerOpen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const satelliteContextLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const builtEnvLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Helper to attach keyless basemap (OpenStreetMap Dark Canvas or Esri World Imagery)
  const applyBasemap = (map: L.Map, mode: 'dark' | 'satellite') => {
    // Ensure existing basemap layer is completely removed before adding the new one
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (mode === 'dark') {
      // 100% Genuinely Keyless, unwatermarked OpenStreetMap tiles with high-contrast dark GIS filter
      const darkTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | NASA FIRMS | ESA Sentinel-2',
        className: 'map-tiles-dark',
      });
      darkTiles.addTo(map);
      tileLayerRef.current = darkTiles;
    } else {
      // High-resolution satellite imagery
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

    // Mount initial dark basemap
    applyBasemap(map, 'dark');

    // Add zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    satelliteContextLayerGroupRef.current = L.layerGroup().addTo(map);
    builtEnvLayerGroupRef.current = L.layerGroup().addTo(map);

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

  // Update Markers and Overlays based on state & filters
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    const markersGroup = markersLayerGroupRef.current;
    const heatmapGroup = heatmapLayerGroupRef.current;
    const satelliteGroup = satelliteContextLayerGroupRef.current;
    const builtEnvGroup = builtEnvLayerGroupRef.current;

    markersGroup.clearLayers();
    if (heatmapGroup) heatmapGroup.clearLayers();
    if (satelliteGroup) satelliteGroup.clearLayers();
    if (builtEnvGroup) builtEnvGroup.clearLayers();

    // Filter by timeline day if timeline playback active
    const visibleHotspots = hotspots.filter((h) => {
      if (timelineDateFilter !== undefined && timelineDateFilter !== null) {
        return h.active_days >= timelineDateFilter;
      }
      return true;
    });

    visibleHotspots.forEach((hotspot) => {
      const isSelected = selectedHotspot?.source_id === hotspot.source_id;

      // Color scheme based on priority
      let primaryColor = '#10B981'; // LOW (cyan-green)
      let glowColor = 'rgba(16, 185, 129, 0.4)';
      let pulseRing = false;
      let markerDiameter = Math.max(14, Math.min(32, Math.round(hotspot.priority_score / 2.8)));

      if (hotspot.priority_category === 'HIGH') {
        primaryColor = '#EF4444'; // Red-Orange
        glowColor = 'rgba(239, 68, 68, 0.6)';
        pulseRing = true;
        markerDiameter = Math.max(22, Math.min(36, Math.round(hotspot.priority_score / 2.3)));
      } else if (hotspot.priority_category === 'MEDIUM') {
        primaryColor = '#F59E0B'; // Amber
        glowColor = 'rgba(245, 158, 11, 0.5)';
        markerDiameter = Math.max(18, Math.min(28, Math.round(hotspot.priority_score / 2.5)));
      }

      // 1. Thermal Priority Source Markers
      if (layers.thermalSources) {
        const customHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${markerDiameter}px; height: ${markerDiameter}px;">
            ${
              pulseRing
                ? `<div class="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping"></div>
                   <div class="absolute -inset-1 rounded-full border border-rose-500/60 animate-pulse"></div>`
                : ''
            }
            ${
              isSelected
                ? `<div class="absolute -inset-3 rounded-full border-2 border-cyan-400 animate-spin" style="border-style: dashed;"></div>`
                : ''
            }
            <div
              class="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-[9px] text-white shadow-lg transition-transform hover:scale-125"
              style="
                background: radial-gradient(circle, ${primaryColor} 40%, #000 100%);
                border: 2px solid ${isSelected ? '#00F0FF' : primaryColor};
                box-shadow: 0 0 14px ${glowColor};
              "
            >
              ${hotspot.priority_category === 'HIGH' ? '!' : ''}
            </div>
            ${
              hotspot.alert_status === 'Alert Raised'
                ? `<div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border border-white"></div>`
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

        // Compact tooltip matching requirement: AGNI-001 | HIGH | Score 76.37
        const tooltipHtml = `
          <div class="bg-[#080C14] border border-cyan-500/50 p-2 rounded text-slate-200 font-mono shadow-xl text-xs min-w-[160px]">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
              <span class="font-bold text-white tracking-wider">${hotspot.source_id}</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hotspot.priority_category === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                  : hotspot.priority_category === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
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

      // 2. Priority Heatmap Circles (concentric heat risk radii)
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

      // 3. Sentinel-2 Satellite Context Layer (Coverage footprint)
      if (layers.satelliteContext && satelliteGroup && hotspot.satellite_available) {
        const satCircle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: 8000, // Sentinel-2 ~8km contextual radius
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
  }, [hotspots, selectedHotspot, layers, timelineDateFilter, onSelectHotspot]);

  // Pan to selected hotspot smoothly if triggered from elsewhere
  useEffect(() => {
    if (!selectedHotspot || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedHotspot.latitude, selectedHotspot.longitude],
      Math.max(mapInstanceRef.current.getZoom(), 9),
      { duration: 1.0 }
    );
  }, [selectedHotspot]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || hotspots.length === 0) return;
    const bounds = L.latLngBounds(hotspots.map((h) => [h.latitude, h.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div id="agni-map-wrapper" className="relative w-full h-full bg-[#050811] overflow-hidden">
      {/* Leaflet Map DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Basemap Switcher & Coordinates HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-[#080C14]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl text-xs font-mono">
          <button
            id="btn-basemap-dark"
            onClick={() => setBasemap('dark')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              basemap === 'dark'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DARK MATTER
          </button>
          <button
            id="btn-basemap-sat"
            onClick={() => setBasemap('satellite')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              basemap === 'satellite'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SATELLITE
          </button>
        </div>

        {/* Selected target HUD if selected */}
        {selectedHotspot && (
          <div className="bg-[#080C14]/90 backdrop-blur-md p-2 rounded-lg border border-cyan-500/30 text-[11px] font-mono shadow-xl max-w-xs animate-in fade-in">
            <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800/80 pb-1">
              <span>TARGET LOCKED: {selectedHotspot.source_id}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-slate-300 mt-1 flex justify-between">
              <span>COORDINATES:</span>
              <span className="text-slate-400">
                {selectedHotspot.latitude.toFixed(4)}°N, {selectedHotspot.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="text-slate-300 flex justify-between">
              <span>PRIORITY:</span>
              <span className="text-rose-400 font-bold">
                {selectedHotspot.priority_score.toFixed(2)} ({selectedHotspot.priority_category})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Layer Control Dock (Glassmorphism) */}
      <div className="absolute top-4 right-14 z-20">
        <div className="bg-[#080C14]/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl overflow-hidden font-mono text-xs w-64">
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 cursor-pointer bg-[#0D1424]/60 text-slate-300"
            onClick={() => setShowLayerPanel(!showLayerPanel)}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold tracking-wider text-[11px]">GEOSPATIAL LAYERS</span>
            </div>
            <Eye className="w-3 h-3 text-slate-400" />
          </div>

          {showLayerPanel && (
            <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
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

              {/* Layer: Priority Heatmap */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thermal Risk Radii</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.priorityHeatmap}
                  onChange={() => onToggleLayer('priorityHeatmap')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
              </label>

              {/* Layer: Satellite Context */}
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

              {/* Layer: Built Environment Context */}
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
          )}
        </div>
      </div>

      {/* Map Control Buttons: Reset Bounds & Orientation */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleResetBounds}
          className="w-8 h-8 rounded bg-[#080C14]/90 backdrop-blur-md border border-slate-700 text-slate-300 flex items-center justify-center hover:text-cyan-300 hover:border-cyan-500 shadow-xl transition-all"
          title="Fit All Monitored Sources"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.setView([20.9, 83.5], 6)}
          className="w-8 h-8 rounded bg-[#080C14]/90 backdrop-blur-md border border-slate-700 text-slate-300 flex items-center justify-center hover:text-cyan-300 hover:border-cyan-500 shadow-xl transition-all"
          title="Recenter Regional Sector"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend (Bottom Left - positioned above timeline dock) */}
      <div className="absolute bottom-24 left-4 z-20">
        <div className="bg-[#080C14]/90 backdrop-blur-md border border-slate-800 rounded-lg p-2 shadow-2xl text-[11px] font-mono text-slate-300 max-w-xs">
          <div
            className="flex items-center justify-between cursor-pointer text-slate-400 font-bold mb-1"
            onClick={() => setShowLegend(!showLegend)}
          >
            <span className="text-[10px] uppercase tracking-wider text-cyan-400">MAP LEGEND</span>
            <Info className="w-3 h-3 text-slate-500" />
          </div>
          {showLegend && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                <span>HIGH PRIORITY (Score ≥ 65.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span>MEDIUM PRIORITY (Score 45.0 - 64.9)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span>LOW PRIORITY (Score &lt; 45.0)</span>
              </div>
              <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded border border-indigo-400 bg-indigo-900/40" />
                  Sentinel-2
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded border border-cyan-400 bg-cyan-900/40" />
                  Built Surface
                </span>
              </div>
            </div>
          )}
        </div>
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
