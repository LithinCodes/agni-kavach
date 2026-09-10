import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  ShieldAlert,
  Flame,
  Wind,
  Compass,
  Layers,
  MapPin,
  Building,
  School,
  Hospital,
  Zap,
  Home,
  Waves,
  Eye,
  FileCheck2,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Radio,
  Send,
  Calendar,
  Satellite,
  ChevronDown,
  Navigation2,
  ChevronRight,
  TrendingUp,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  HotspotRecord,
  SensitiveLocation,
  CitizenReport,
  HazardDispersionScenario,
  MeteorologicalContext,
  WeatherMode,
  WeatherStatus,
} from '../types';
import {
  getSensitiveLocationsForHotspot,
  getPopulationImpactContext,
  calculateDispersionCorridor,
  checkCitizenSafety,
  getAirQualityContext,
  INITIAL_CITIZEN_REPORTS,
} from '../services/impactService';
import {
  fetchMeteorologicalContext,
  getWindCompass,
  getDownwindHeading,
  getDownwindCompass,
} from '../services/weatherService';
import { exportVayuDrishtiPDF, exportVayuDrishtiXLSX } from '../services/exportService';
import { WhyDidYouAlertModal } from './WhyDidYouAlertModal';
import { CitizenSafetyModal } from './CitizenSafetyModal';
import { ImpactRadar } from './ImpactRadar';
import { DhumraDharmaPanel } from './DhumraDharmaPanel';

interface HumanImpactViewProps {
  hotspots: HotspotRecord[];
  selectedHotspot: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onNavigateToResponse?: (hotspot: HotspotRecord) => void;
  onStartInvestigation?: (hotspot: HotspotRecord) => void;
  onRaiseAlert?: (hotspot: HotspotRecord) => void;
}

export const HumanImpactView: React.FC<HumanImpactViewProps> = ({
  hotspots,
  selectedHotspot: propSelectedHotspot,
  onSelectHotspot,
  onNavigateToResponse,
  onStartInvestigation,
  onRaiseAlert,
}) => {
  // Current active hotspot (default to AGNI-001 or first high priority if none selected)
  const currentHotspot = useMemo(() => {
    if (propSelectedHotspot) return propSelectedHotspot;
    const high = hotspots.find((h) => h.priority_category === 'HIGH');
    return high || hotspots[0] || null;
  }, [propSelectedHotspot, hotspots]);

  // VAYU-DRISHTI Simulation Scenario State
  const [dispersionScenario, setDispersionScenario] = useState<HazardDispersionScenario>({
    windDirectionDeg: 315, // Wind from NW blowing SE
    windSpeedKmH: 22,
    dispersionWidthDeg: 38,
    durationHours: 4,
    severityScenario: 'MODERATE',
    corridorRangeKm: 8.8,
    modelStatus: 'LIVE METEOROLOGY (OPEN-METEO)',
    weatherMode: 'LIVE_METEOROLOGY',
  });

  // Meteorological State (Open-Meteo API)
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('LOADING');
  const [weatherData, setWeatherData] = useState<MeteorologicalContext | null>(null);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('LIVE_METEOROLOGY');
  const [weatherFetchError, setWeatherFetchError] = useState<string | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);

  // Fetch real meteorological data whenever the selected hotspot changes
  useEffect(() => {
    if (!currentHotspot) return;

    let isMounted = true;
    const loadWeather = async () => {
      setIsRefreshingWeather(true);
      setWeatherStatus('LOADING');
      setWeatherFetchError(null);

      try {
        const data = await fetchMeteorologicalContext(
          currentHotspot.latitude,
          currentHotspot.longitude
        );

        if (!isMounted) return;

        if (data.available) {
          setWeatherData(data);
          setWeatherStatus('SUCCESS');
          setWeatherMode('LIVE_METEOROLOGY');
          setWeatherFetchError(null);

          // Update dispersionScenario with real wind direction and wind speed
          setDispersionScenario((prev) => ({
            ...prev,
            windDirectionDeg: data.windDirectionDeg,
            windSpeedKmH: data.windSpeedKmh,
            modelStatus: 'LIVE METEOROLOGY (OPEN-METEO)',
            weatherMode: 'LIVE_METEOROLOGY',
            meteorologicalContext: data,
          }));
        } else {
          setWeatherData(data);
          setWeatherStatus('FAILURE');
          setWeatherFetchError(data.error || 'Live meteorological feed unavailable from Open-Meteo.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setWeatherStatus('FAILURE');
        setWeatherFetchError('Failed to retrieve meteorological context.');
      } finally {
        if (isMounted) {
          setIsRefreshingWeather(false);
        }
      }
    };

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [currentHotspot?.source_id, currentHotspot?.latitude, currentHotspot?.longitude]);

  // Explicit user action: refresh meteorological data
  const handleRefreshWeather = async () => {
    if (!currentHotspot) return;
    setIsRefreshingWeather(true);
    setWeatherStatus('LOADING');
    setWeatherFetchError(null);

    try {
      const data = await fetchMeteorologicalContext(
        currentHotspot.latitude,
        currentHotspot.longitude,
        true // force refresh bypassing cache
      );

      if (data.available) {
        setWeatherData(data);
        setWeatherStatus('SUCCESS');
        setWeatherMode('LIVE_METEOROLOGY');
        setWeatherFetchError(null);

        setDispersionScenario((prev) => ({
          ...prev,
          windDirectionDeg: data.windDirectionDeg,
          windSpeedKmH: data.windSpeedKmh,
          modelStatus: 'LIVE METEOROLOGY (OPEN-METEO)',
          weatherMode: 'LIVE_METEOROLOGY',
          meteorologicalContext: data,
        }));
      } else {
        setWeatherData(data);
        setWeatherStatus('FAILURE');
        setWeatherFetchError(data.error || 'Live meteorological feed unavailable from Open-Meteo.');
      }
    } catch (err: any) {
      setWeatherStatus('FAILURE');
      setWeatherFetchError('Meteorological refresh error.');
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  // Switch to Scenario Mode (User defined hypothetical wind)
  const handleSwitchToScenario = () => {
    setWeatherMode('SCENARIO_MODE');
    setWeatherStatus('SCENARIO_FALLBACK');
    setDispersionScenario((prev) => ({
      ...prev,
      modelStatus: 'SCENARIO WIND — NOT LIVE METEOROLOGY',
      weatherMode: 'SCENARIO_MODE',
    }));
  };

  // Switch back to Live Meteorology
  const handleSwitchToLive = () => {
    if (weatherData && weatherData.available) {
      setWeatherMode('LIVE_METEOROLOGY');
      setWeatherStatus('SUCCESS');
      setDispersionScenario((prev) => ({
        ...prev,
        windDirectionDeg: weatherData.windDirectionDeg,
        windSpeedKmH: weatherData.windSpeedKmh,
        modelStatus: 'LIVE METEOROLOGY (OPEN-METEO)',
        weatherMode: 'LIVE_METEOROLOGY',
        meteorologicalContext: weatherData,
      }));
    } else {
      handleRefreshWeather();
    }
  };

  // Layer Toggles
  const [activeLayers, setActiveLayers] = useState({
    firmsSource: true,
    clusterBoundary: true,
    hazardCorridor: true,
    radiusRings: true,
    sensitiveLocations: true,
    populationHeat: true,
    majorRoads: true,
    sentinelFootprint: true,
  });

  // Modals & Panels
  const [isWhyAlertOpen, setIsWhyAlertOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLayerDrawer, setShowLayerDrawer] = useState(true);
  const [activeTab, setActiveTab] = useState<'dispersion' | 'citizen' | 'sensitive' | 'air' | 'evidence'>('dispersion');

  // Citizen safety tester state
  const [userLocationInput, setUserLocationInput] = useState('');
  const [testedLocation, setTestedLocation] = useState<{
    lat: number;
    lng: number;
    status: 'WITHIN' | 'NEAR' | 'OUTSIDE';
    distanceKm: number;
    message: string;
  } | null>(null);

  // Citizen reports state
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [newReportType, setNewReportType] = useState<CitizenReport['reportType']>('SMOKE');
  const [newReportDesc, setNewReportDesc] = useState('');
  const [reportSubmittedAlert, setReportSubmittedAlert] = useState(false);

  // Map DOM refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<{ [key: string]: L.LayerGroup | L.Layer | null }>({});

  // Contextual calculations
  const sensitiveLocations = useMemo(() => {
    return currentHotspot ? getSensitiveLocationsForHotspot(currentHotspot) : [];
  }, [currentHotspot]);

  const populationContext = useMemo(() => {
    return currentHotspot
      ? getPopulationImpactContext(currentHotspot, dispersionScenario.corridorRangeKm)
      : null;
  }, [currentHotspot, dispersionScenario.corridorRangeKm]);

  const airQuality = useMemo(() => {
    return currentHotspot ? getAirQualityContext(currentHotspot) : null;
  }, [currentHotspot]);

  // Derived corridor geometry
  const corridorGeometry = useMemo(() => {
    if (!currentHotspot) return null;
    return calculateDispersionCorridor(
      currentHotspot.latitude,
      currentHotspot.longitude,
      dispersionScenario
    );
  }, [currentHotspot, dispersionScenario]);

  // Default test location initialized downwind of incident
  useEffect(() => {
    if (currentHotspot && !testedLocation) {
      // Default to 4km south-east of incident
      const testLat = currentHotspot.latitude - 0.025;
      const testLng = currentHotspot.longitude + 0.035;
      const result = checkCitizenSafety(
        testLat,
        testLng,
        currentHotspot.latitude,
        currentHotspot.longitude,
        dispersionScenario
      );
      setTestedLocation({
        lat: testLat,
        lng: testLng,
        ...result,
      });
      setUserLocationInput(`${currentHotspot.nearest_city || 'Local Sector'}, 4.2 km SE`);
    }
  }, [currentHotspot]);

  // Initialize and maintain Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentHotspot?.latitude || 21.5, currentHotspot?.longitude || 84.0],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Rock-solid Keyless Dark Canvas tiles with high-contrast filter
      const darkTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'map-tiles-dark',
      });
      darkTiles.addTo(map);

      // Attribution control in corner
      L.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; OpenStreetMap | NASA FIRMS VIIRS NOAA-21 NRT | ESA Sentinel-2')
        .addTo(map);

      // Add Zoom control in top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Click on map to test citizen location
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!currentHotspot) return;
        const res = checkCitizenSafety(
          e.latlng.lat,
          e.latlng.lng,
          currentHotspot.latitude,
          currentHotspot.longitude,
          dispersionScenario
        );
        setTestedLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          ...res,
        });
        setUserLocationInput(`Map Pin: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      });

      mapInstanceRef.current = map;
    }

    // When currentHotspot changes, fly smoothly to it
    if (mapInstanceRef.current && currentHotspot) {
      mapInstanceRef.current.flyTo([currentHotspot.latitude, currentHotspot.longitude], 12, {
        duration: 1.2,
      });
    }
  }, [currentHotspot]);

  // Render Map Layers on Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentHotspot) return;

    // Clear existing dynamic layers
    Object.values(layersGroupRef.current).forEach((layer) => {
      if (layer) map.removeLayer(layer);
    });
    layersGroupRef.current = {};

    const { latitude: lat, longitude: lng } = currentHotspot;

    // 1. Concentric Radius Rings (1 km, 5 km, 10 km)
    if (activeLayers.radiusRings) {
      const ringGroup = L.layerGroup();

      const r1 = L.circle([lat, lng], {
        radius: 1000,
        color: '#06B6D4',
        weight: 1.2,
        dashArray: '4 4',
        fill: false,
        opacity: 0.6,
      }).bindTooltip('1 km Exclusion Radius', { permanent: false, className: 'map-leaflet-tooltip' });

      const r5 = L.circle([lat, lng], {
        radius: 5000,
        color: '#F59E0B',
        weight: 1,
        dashArray: '6 6',
        fill: false,
        opacity: 0.45,
      }).bindTooltip('5 km Tactical Advisory Radius', { permanent: false, className: 'map-leaflet-tooltip' });

      const r10 = L.circle([lat, lng], {
        radius: 10000,
        color: '#64748B',
        weight: 0.8,
        dashArray: '8 8',
        fill: false,
        opacity: 0.35,
      }).bindTooltip('10 km Regional Monitoring Radius', { permanent: false, className: 'map-leaflet-tooltip' });

      ringGroup.addLayer(r1);
      ringGroup.addLayer(r5);
      ringGroup.addLayer(r10);
      ringGroup.addTo(map);
      layersGroupRef.current.radiusRings = ringGroup;
    }

    // 2. VAYU-DRISHTI Hazard Dispersion Corridor Polygon
    if (activeLayers.hazardCorridor && corridorGeometry) {
      const corridorGroup = L.layerGroup();

      const corridorPolygon = L.polygon(corridorGeometry.polygonPoints, {
        color: '#F97316',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#EA580C',
        fillOpacity: 0.28,
      });

      const downwindHeading = ((dispersionScenario.windDirectionDeg + 180) % 360 + 360) % 360;
      const windLabel = getWindCompass(dispersionScenario.windDirectionDeg);
      const downwindLabel = getWindCompass(downwindHeading);
      const isLive = weatherMode === 'LIVE_METEOROLOGY' && weatherData?.available;

      corridorPolygon.bindTooltip(
        `<div>
          <strong style="color: #FDBA74; font-size: 11px;">VAYU-DRISHTI MODELED DISPERSION</strong><br/>
          <span style="color: #7DD3FC; font-size: 10px;">Wind from: ${dispersionScenario.windDirectionDeg}° ${windLabel} @ ${dispersionScenario.windSpeedKmH} km/h</span><br/>
          <span style="color: #FBBF24; font-size: 10px;">Downwind heading: ${downwindHeading}° ${downwindLabel}</span><br/>
          <span style="font-size: 10px; color: #E2E8F0;">Modeled Reach: ~${corridorGeometry.boundingRadiusKm.toFixed(1)} km (${corridorGeometry.corridorAreaKm2} km²)</span><br/>
          <span style="font-size: 9px; color: #94A3B8;">Source: ${isLive ? 'Open-Meteo Meteorological Model' : 'Scenario Assumed Wind'}</span><br/>
          <span style="font-size: 8px; color: #FCA5A5;">Decision-support model • Not a measured toxic plume</span>
        </div>`,
        { sticky: true, className: 'map-leaflet-tooltip' }
      );

      corridorGroup.addLayer(corridorPolygon);

      // Animate directional downwind arrows along centerline
      if (corridorGeometry.centerlinePoints.length > 2) {
        const centerPoly = L.polyline(corridorGeometry.centerlinePoints, {
          color: '#FB923C',
          weight: 2,
          dashArray: '4 8',
          opacity: 0.8,
        });
        corridorGroup.addLayer(centerPoly);
      }

      corridorGroup.addTo(map);
      layersGroupRef.current.hazardCorridor = corridorGroup;
    }

    // 3. Cluster Boundary (DBSCAN 375m radius around hotspot)
    if (activeLayers.clusterBoundary) {
      const clusterCircle = L.circle([lat, lng], {
        radius: 650,
        color: '#EF4444',
        weight: 1.5,
        fillColor: '#DC2626',
        fillOpacity: 0.2,
      }).addTo(map);
      layersGroupRef.current.clusterBoundary = clusterCircle;
    }

    // 4. FIRMS Thermal Hotspot Marker (pulsing SVG icon)
    if (activeLayers.firmsSource) {
      const sourceIcon = L.divIcon({
        className: 'custom-hotspot-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
            <div class="absolute w-10 h-10 rounded-full bg-rose-500/30 animate-ping"></div>
            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.8)] flex items-center justify-center text-white">
              <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2 0 1.9-1.2 3.5-2.7 4.9-1.2 1.1-2.3 2.1-2.3 3.5 0 1.7 1.3 3 3 3s3-1.3 3-3c0-.6.4-1 1-1s1 .4 1 1c0 2.8-2.2 5-5 5s-5-2.2-5-5c0-2.3 1.7-3.9 3.2-5.2C11.3 7.1 12 5.9 12 4c0-.6-.4-1-1-1s-1 .4-1 1c0 .6-.4 1-1 1s-1-.4-1-1c0-2 1.8-3.7 3.5-3.9.2-.1.3-.1.5-.1z"/></svg>
            </div>
          </div>
        `,
      });

      const marker = L.marker([lat, lng], { icon: sourceIcon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family: monospace; font-size: 11px; padding: 4px;">
          <strong style="color: #38BDF8; font-size: 13px;">${currentHotspot.source_id}</strong>
          <span style="background: #881337; color: #FECDD3; padding: 2px 4px; border-radius: 4px; margin-left: 6px; font-weight: bold;">
            ${currentHotspot.priority_category} PRIORITY
          </span>
          <div style="margin-top: 6px; color: #CBD5E1;">
            Priority Score: <b>${currentHotspot.priority_score.toFixed(2)}</b><br/>
            Temporal Persistence: <b>${currentHotspot.persistence}%</b> (${currentHotspot.active_days}/5 days)<br/>
            Sensor: <b>NASA FIRMS VIIRS NOAA-21 NRT</b>
          </div>
        </div>`
      );
      layersGroupRef.current.firmsSource = marker;
    }

    // 5. Sensitive Locations (Hospitals, Schools, Residential, Power)
    if (activeLayers.sensitiveLocations && sensitiveLocations.length > 0) {
      const sensGroup = L.layerGroup();

      sensitiveLocations.forEach((loc) => {
        let iconBg = 'bg-blue-600';
        let iconSvg = '🏥';
        if (loc.type === 'school') {
          iconBg = 'bg-amber-600';
          iconSvg = '🏫';
        } else if (loc.type === 'residential') {
          iconBg = 'bg-indigo-600';
          iconSvg = '🏘️';
        } else if (loc.type === 'power') {
          iconBg = 'bg-yellow-600';
          iconSvg = '⚡';
        } else if (loc.type === 'emergency') {
          iconBg = 'bg-rose-600';
          iconSvg = '🚒';
        } else if (loc.type === 'water') {
          iconBg = 'bg-cyan-600';
          iconSvg = '💧';
        }

        const icon = L.divIcon({
          className: 'sensitive-location-pin',
          html: `
            <div class="w-6 h-6 rounded-md ${iconBg} text-white flex items-center justify-center text-xs shadow-md border border-white/80 cursor-pointer hover:scale-125 transition-transform">
              <span>${iconSvg}</span>
            </div>
          `,
        });

        const sensMarker = L.marker([loc.latitude, loc.longitude], { icon });
        sensMarker.bindPopup(
          `<div style="font-family: monospace; font-size: 11px; padding: 4px; max-width: 220px;">
            <strong style="color: #F8FAFC; font-size: 12px;">${loc.name}</strong><br/>
            <span style="color: #38BDF8; text-transform: uppercase; font-size: 10px;">${loc.type}</span> • 
            <span style="color: #94A3B8;">${loc.distanceKm} km from incident</span>
            <div style="margin-top: 4px; color: #CBD5E1; font-size: 10px;">${loc.capacityOrNotes || ''}</div>
            <div style="margin-top: 6px; font-size: 9px; color: #64748B; border-top: 1px solid #334155; padding-top: 3px;">
              ${loc.source}
            </div>
          </div>`
        );
        sensGroup.addLayer(sensMarker);
      });

      sensGroup.addTo(map);
      layersGroupRef.current.sensitiveLocations = sensGroup;
    }

    // 6. Tested Citizen Location Pin
    if (testedLocation) {
      const pinColor =
        testedLocation.status === 'WITHIN'
          ? '#EF4444'
          : testedLocation.status === 'NEAR'
          ? '#F59E0B'
          : '#10B981';

      const citizenIcon = L.divIcon({
        className: 'citizen-test-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4">
            <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background: ${pinColor}">
              <svg class="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
          </div>
        `,
      });

      const citizenMarker = L.marker([testedLocation.lat, testedLocation.lng], {
        icon: citizenIcon,
      }).addTo(map);

      citizenMarker.bindPopup(
        `<div style="font-family: monospace; font-size: 11px;">
          <strong>Citizen Test Location</strong><br/>
          Status: <b style="color: ${pinColor}">${testedLocation.status}</b><br/>
          Distance to Hotspot: <b>${testedLocation.distanceKm} km</b>
        </div>`
      );

      layersGroupRef.current.testedLocation = citizenMarker;
    }

    // 7. Sentinel-2 Contextual Footprint (if available)
    if (activeLayers.sentinelFootprint && currentHotspot.satellite_available) {
      const satBox = L.rectangle(
        [
          [lat - 0.045, lng - 0.045],
          [lat + 0.045, lng + 0.045],
        ],
        {
          color: '#10B981',
          weight: 1.5,
          dashArray: '3 5',
          fillColor: '#059669',
          fillOpacity: 0.1,
        }
      ).addTo(map);

      satBox.bindTooltip(
        `Sentinel-2 Archival Footprint (${currentHotspot.satellite_scene_date || 'Archival Scene'})`,
        { sticky: true, className: 'map-leaflet-tooltip' }
      );

      layersGroupRef.current.sentinelFootprint = satBox;
    }
  }, [
    currentHotspot,
    dispersionScenario,
    activeLayers,
    corridorGeometry,
    sensitiveLocations,
    testedLocation,
  ]);

  // Center on Incident handler
  const handleCenterOnIncident = () => {
    if (mapInstanceRef.current && currentHotspot) {
      mapInstanceRef.current.flyTo([currentHotspot.latitude, currentHotspot.longitude], 13, {
        duration: 0.8,
      });
    }
  };

  // Reset View handler
  const handleResetView = () => {
    if (mapInstanceRef.current && currentHotspot) {
      mapInstanceRef.current.flyTo([currentHotspot.latitude, currentHotspot.longitude], 11, {
        duration: 0.8,
      });
    }
  };

  // Submit Citizen Report handler
  const handleSubmitCitizenReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotspot) return;

    const newReport: CitizenReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      source_id: currentHotspot.source_id,
      reportType: newReportType,
      description: newReportDesc.trim() || 'Ground observation report near incident zone.',
      latitude: currentHotspot.latitude + (Math.random() - 0.5) * 0.02,
      longitude: currentHotspot.longitude + (Math.random() - 0.5) * 0.02,
      locationName: `${currentHotspot.nearest_city || 'Local Area'} Field Observation`,
      timestamp: 'Just now',
      status: 'UNVERIFIED',
      reporterAlias: 'Citizen Observer',
    };

    setCitizenReports([newReport, ...citizenReports]);
    setNewReportDesc('');
    setReportSubmittedAlert(true);
    setTimeout(() => setReportSubmittedAlert(false), 4000);
  };

  // Helper for compass label
  const getCompassHeadingLabel = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  if (!currentHotspot) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono">
        Loading Human Impact Intelligence data...
      </div>
    );
  }

  return (
    <div
      id="human-impact-view"
      className="flex-1 flex flex-col min-h-0 bg-[#080C14] text-slate-200 overflow-hidden select-none"
    >
      {/* Top Intelligence Action Bar */}
      <div className="h-14 shrink-0 bg-[#0D1424] border-b border-slate-800 px-4 flex items-center justify-between flex-wrap gap-2 z-20">
        {/* Hotspot Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">
              SELECT INCIDENT:
            </span>
            <div className="relative">
              <select
                id="select-impact-hotspot"
                value={currentHotspot.source_id}
                onChange={(e) => {
                  const target = hotspots.find((h) => h.source_id === e.target.value);
                  if (target) onSelectHotspot(target);
                }}
                className="bg-slate-900 text-cyan-300 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                {hotspots.map((h) => (
                  <option key={h.source_id} value={h.source_id} className="bg-slate-900 text-slate-200">
                    {h.source_id} • Score: {h.priority_score.toFixed(1)} ({h.priority_category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold">
              {currentHotspot.priority_category} PRIORITY
            </span>
            <span className="text-slate-400 hidden md:inline">
              Score: <strong className="text-cyan-300">{currentHotspot.priority_score.toFixed(2)}</strong>
            </span>
            <span className="text-slate-500 hidden lg:inline">•</span>
            <span className="text-slate-400 hidden lg:inline">
              {currentHotspot.nearest_city} ({currentHotspot.distance_to_city_km} km)
            </span>
          </div>
        </div>

        {/* Primary Action Buttons: Export Plume Report, Why Alert, Run-Card */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => exportVayuDrishtiPDF(currentHotspot, dispersionScenario, sensitiveLocations, populationContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
            title="Download Atmospheric Plume Dispersion Report in PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PLUME</span>
            <span>(PDF)</span>
          </button>

          <button
            onClick={() => exportVayuDrishtiXLSX(currentHotspot, dispersionScenario, sensitiveLocations, populationContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
            title="Download Plume & Exposed Receptors Data in Excel (XLSX)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">PLUME</span>
            <span>(XLSX)</span>
          </button>

          <button
            id="btn-why-alert"
            onClick={() => setIsWhyAlertOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">WHY DID YOU ALERT?</span>
            <span className="md:hidden">WHY ALERT?</span>
          </button>

          {onNavigateToResponse && (
            <button
              id="btn-go-run-card"
              onClick={() => onNavigateToResponse(currentHotspot)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>RUN-CARD →</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Map + Right Impact Intelligence Panels */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* MAP CONTAINER (Left) */}
        <div className="flex-1 relative flex flex-col min-h-[420px] lg:min-h-0 bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full relative z-0" />

          {/* Map Controls Floating Toolbar (Top Left) */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl">
              <button
                onClick={handleCenterOnIncident}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-cyan-950 text-cyan-300 text-xs font-mono flex items-center gap-1 transition-colors"
                title="Center on Incident"
              >
                <Navigation2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">CENTER</span>
              </button>

              <button
                onClick={handleResetView}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors"
                title="Reset View"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">RESET</span>
              </button>

              <button
                onClick={() => setShowLayerDrawer(!showLayerDrawer)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                  showLayerDrawer
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Layers Panel"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>LAYERS</span>
              </button>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Toggleable Layer Drawer */}
            {showLayerDrawer && (
              <div className="w-64 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-800 shadow-2xl font-mono text-xs space-y-2 text-slate-300 animate-in fade-in duration-150">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span>ACTIVE MAP LAYERS</span>
                  <span className="text-cyan-400 font-normal">8 CONTROLS</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>FIRMS Thermal Source</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.firmsSource}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, firmsSource: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Wind className="w-3 h-3 text-amber-400" />
                      <span>VAYU-DRISHTI Hazard Corridor</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.hazardCorridor}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, hazardCorridor: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Hospital className="w-3 h-3 text-blue-400" />
                      <span>Sensitive Locations (OSM)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.sensitiveLocations}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, sensitiveLocations: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Navigation2 className="w-3 h-3 text-slate-400" />
                      <span>1 / 5 / 10 km Radius Rings</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.radiusRings}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, radiusRings: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-rose-400" />
                      <span>DBSCAN Cluster Perimeter</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.clusterBoundary}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, clusterBoundary: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <Satellite className="w-3 h-3 text-emerald-400" />
                      <span>Sentinel-2 Contextual Footprint</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activeLayers.sentinelFootprint}
                      onChange={(e) =>
                        setActiveLayers({ ...activeLayers, sentinelFootprint: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Map Top-Right Floating Wind Vector Badge */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 font-mono">
            <div className="bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 shadow-2xl text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                  WIND VECTOR
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    weatherMode === 'LIVE_METEOROLOGY' && weatherStatus === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : weatherStatus === 'LOADING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {weatherMode === 'LIVE_METEOROLOGY' && weatherStatus === 'SUCCESS'
                    ? 'LIVE OPEN-METEO'
                    : weatherStatus === 'LOADING'
                    ? 'FETCHING...'
                    : 'SCENARIO WIND'}
                </span>
              </div>

              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>FROM {dispersionScenario.windDirectionDeg}° {getWindCompass(dispersionScenario.windDirectionDeg)}</span>
                <span className="text-amber-400">→</span>
                <span className="text-cyan-300">TOWARDS {((dispersionScenario.windDirectionDeg + 180) % 360)}° {getDownwindCompass(dispersionScenario.windDirectionDeg)}</span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between gap-4">
                <span>Speed: <strong className="text-white">{dispersionScenario.windSpeedKmH} km/h</strong></span>
                <span>Reach: <strong className="text-amber-300">~{corridorGeometry ? corridorGeometry.boundingRadiusKm.toFixed(1) : dispersionScenario.corridorRangeKm.toFixed(1)} km</strong></span>
              </div>
            </div>
          </div>

          {/* Map Bottom Information Strip */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 shadow-xl">
            <span className="flex items-center gap-1 text-cyan-300">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{currentHotspot.latitude.toFixed(4)}° N, {currentHotspot.longitude.toFixed(4)}° E</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Click map to test Citizen Distance & Exposure</span>
          </div>
        </div>

        {/* RIGHT INTELLIGENCE WORKSPACE (Tabs: Vayu-Drishti, Am I Safe?, Sensitive Locs, Air Quality, Evidence) */}
        <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-[#080C14] border-l border-slate-800 flex flex-col min-h-0 overflow-y-auto">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center bg-[#0D1424] border-b border-slate-800 p-1.5 overflow-x-auto gap-1 text-xs font-mono shrink-0">
            <button
              onClick={() => setActiveTab('dispersion')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'dispersion'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              <span>VAYU-DRISHTI</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'citizen'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>AM I SAFE?</span>
            </button>

            <button
              onClick={() => setActiveTab('sensitive')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'sensitive'
                  ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hospital className="w-3.5 h-3.5 text-blue-400" />
              <span>SENSITIVE ({sensitiveLocations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('air')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'air'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>AIR QUALITY</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'evidence'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>EVIDENCE</span>
            </button>
          </div>

          {/* TAB 1: VAYU-DRISHTI HAZARD DISPERSION SIMULATOR */}
          {activeTab === 'dispersion' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              {/* Header card with Mode Status & Switcher */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-['Chakra_Petch'] text-sm font-bold text-white tracking-wider">
                      VAYU-DRISHTI • POTENTIAL HAZARD DISPERSION
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      weatherMode === 'LIVE_METEOROLOGY' && weatherStatus === 'SUCCESS'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : weatherStatus === 'LOADING'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : weatherStatus === 'FAILURE'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {weatherMode === 'LIVE_METEOROLOGY' && weatherStatus === 'SUCCESS'
                      ? 'CURRENT METEOROLOGICAL CONTEXT (OPEN-METEO)'
                      : weatherStatus === 'LOADING'
                      ? 'FETCHING METEOROLOGY...'
                      : weatherStatus === 'FAILURE'
                      ? 'LIVE METEOROLOGY UNAVAILABLE'
                      : 'SCENARIO MODE — ASSUMED WIND'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Downwind Impact Simulation based on Open-Meteo weather-model data and satellite thermal coordinates. Modeled Dispersion approximation for decision support.
                </p>

                {/* Mode Selector Toggle */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleSwitchToLive}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      weatherMode === 'LIVE_METEOROLOGY'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-cyan-400" />
                    <span>LIVE METEOROLOGY</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchToScenario}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      weatherMode === 'SCENARIO_MODE'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Wind className="w-3 h-3 text-amber-400" />
                    <span>SCENARIO MODE</span>
                  </button>
                </div>
              </div>

              {/* SECTION I: METEOROLOGICAL FAILURE ALERT */}
              {weatherStatus === 'FAILURE' && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-2 text-rose-200 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>LIVE METEOROLOGY UNAVAILABLE</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-tight">
                    {weatherFetchError || 'Open-Meteo meteorological feed could not be reached.'}
                  </p>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Agni Kavach will not fabricate wind observations. You can switch to Scenario Mode to test user-defined wind parameters, or retry connecting.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRefreshWeather}
                      className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                      <span>RETRY CONNECTION</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToScenario}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                    >
                      SWITCH TO SCENARIO MODE
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION G: METEOROLOGICAL CONTEXT PANEL */}
              {weatherData && weatherData.available && (
                <div className="p-3.5 rounded-xl bg-[#0D1424] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white uppercase text-[11px]">
                        CURRENT METEOROLOGICAL CONTEXT
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshWeather}
                      disabled={isRefreshingWeather}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
                      title="Fetch latest Open-Meteo observation"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                      <span>REFRESH</span>
                    </button>
                  </div>

                  {/* Weather Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">WIND SPEED</div>
                      <div className="text-sm font-bold text-white font-['Chakra_Petch'] mt-0.5">
                        {weatherData.windSpeedKmh} <span className="text-[9px] font-normal text-slate-400">km/h</span>
                      </div>
                      <div className="text-[8px] text-slate-500">Gusts: {weatherData.windGustKmh} km/h</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">WIND ORIGIN DIRECTION</div>
                      <div className="text-sm font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                        {weatherData.windDirectionDeg}° {weatherData.windDirectionLabel}
                      </div>
                      <div className="text-[8px] text-slate-500">From origin</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">DOWNWIND BEARING</div>
                      <div className="text-sm font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                        {getDownwindHeading(weatherData.windDirectionDeg)}° {getDownwindCompass(weatherData.windDirectionDeg)}
                      </div>
                      <div className="text-[8px] text-slate-500">Plume trajectory</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">TEMPERATURE</div>
                      <div className="text-sm font-bold text-emerald-300 font-['Chakra_Petch'] mt-0.5">
                        {weatherData.temperatureC}°C
                      </div>
                      <div className="text-[8px] text-slate-500">Humidity: {weatherData.relativeHumidity}%</div>
                    </div>
                  </div>

                  {/* Secondary Meteorological Attributes */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      <span>Precipitation: </span>
                      <strong className="text-white">{weatherData.precipitationMm} mm</strong>
                    </div>
                    <div>
                      <span>Cloud Cover: </span>
                      <strong className="text-white">{weatherData.cloudCoverPct}%</strong>
                    </div>
                    <div className="text-right">
                      <span>Source: </span>
                      <strong className="text-cyan-300">Open-Meteo</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>
                      Target Hotspot: {weatherData.latitude.toFixed(4)}°N, {weatherData.longitude.toFixed(4)}°E
                      {weatherData.modelGridLatitude && (
                        <span className="text-slate-600 ml-1">
                          (Grid: {weatherData.modelGridLatitude.toFixed(4)}°N, {weatherData.modelGridLongitude?.toFixed(4)}°E)
                        </span>
                      )}
                    </span>
                    <span>Observed / Timestamp: {weatherData.timestamp}</span>
                  </div>

                  {weatherMode === 'LIVE_METEOROLOGY' && (
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>CURRENT METEOROLOGICAL CONTEXT APPLIED: Open-Meteo weather-model wind speed ({weatherData.windSpeedKmh} km/h) and origin direction ({weatherData.windDirectionDeg}°) actively drive the downwind impact simulation.</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION J: TEMPORAL CONTEXTUAL SEPARATION */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between font-bold text-slate-300 uppercase">
                  <span>TEMPORAL CONTEXT SEPARATION</span>
                  <span className="text-[9px] text-amber-400 font-normal">Analytical Notice</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">NASA FIRMS THERMAL WINDOW</div>
                    <div className="text-white font-bold mt-0.5">4–8 September 2026</div>
                    <div className="text-[8px] text-slate-500">VIIRS & MODIS satellite overpasses</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">METEOROLOGICAL TELEMETRY</div>
                    <div className="text-cyan-300 font-bold mt-0.5">Current Meteorological Context</div>
                    <div className="text-[8px] text-slate-500">{weatherData?.timestamp || 'Near-Current UTC'}</div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight pt-1">
                  NOTICE: Current Meteorological Context wind vectors reflect Open-Meteo weather-model data at the target coordinates and do NOT represent historical weather during the September 4–8 satellite overpasses.
                </p>
              </div>

              {/* Mandatory Scientific Qualifier */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 text-[10px] text-amber-200/90 leading-tight space-y-1">
                <div className="font-bold uppercase tracking-wider text-amber-300">
                  MODELED DISPERSION — NOT A MEASURED TOXIC PLUME
                </div>
                <div>• CHEMICAL IDENTITY: <span className="font-bold text-white">UNKNOWN</span></div>
                <div>• STATUS: <span className="font-bold text-white">POTENTIAL HAZARD DISPERSION SCENARIO</span></div>
                <div className="text-slate-400">
                  Downwind Impact Simulation decision-support tool. This is NOT a chemical transport model and does not assert measured pollutant or toxic gas concentrations. Open-Meteo provides meteorological context, not physical pollutant measurements.
                </div>
              </div>

              {/* Simulation Controls: Wind Direction & Bearing */}
              <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase text-[11px]">
                    WIND DIRECTION & BEARING
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">
                      FROM {dispersionScenario.windDirectionDeg}° ({getWindCompass(dispersionScenario.windDirectionDeg)})
                    </span>
                    <span className="text-amber-400">→</span>
                    <span className="text-amber-300 font-bold">
                      TOWARDS {((dispersionScenario.windDirectionDeg + 180) % 360)}° ({getDownwindCompass(dispersionScenario.windDirectionDeg)})
                    </span>
                  </div>
                </div>

                {/* Interactive Wind Direction Compass Dial + Slider */}
                <div className="flex items-center gap-4 py-1">
                  <div className="relative w-16 h-16 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                    <Compass className="w-6 h-6 text-slate-600" />
                    <div
                      className="absolute w-12 h-1 bg-gradient-to-r from-transparent to-amber-400 rounded transition-transform"
                      style={{ transform: `rotate(${dispersionScenario.windDirectionDeg}deg)` }}
                    />
                    <div className="absolute top-1 text-[8px] text-slate-400 font-bold">N</div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {weatherMode === 'SCENARIO_MODE' ? (
                      <>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          value={dispersionScenario.windDirectionDeg}
                          onChange={(e) =>
                            setDispersionScenario({
                              ...dispersionScenario,
                              windDirectionDeg: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>0° (N)</span>
                          <span>90° (E)</span>
                          <span>180° (S)</span>
                          <span>270° (W)</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        <span className="text-cyan-300 font-bold">LOCKED TO OPEN-METEO TELEMETRY</span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Wind is actively blowing from {dispersionScenario.windDirectionDeg}° towards {((dispersionScenario.windDirectionDeg + 180) % 360)}°. Switch to Scenario Mode to test custom hypothetical directions.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wind Speed Control */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">WIND SPEED:</span>
                    <span className="text-amber-300 font-bold">{dispersionScenario.windSpeedKmH} km/h</span>
                  </div>
                  {weatherMode === 'SCENARIO_MODE' ? (
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={dispersionScenario.windSpeedKmH}
                      onChange={(e) =>
                        setDispersionScenario({
                          ...dispersionScenario,
                          windSpeedKmH: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  ) : (
                    <div className="text-[10px] text-slate-400">
                      Live speed: <strong className="text-white">{dispersionScenario.windSpeedKmH} km/h</strong> (Affects corridor reach & lateral opening angle)
                    </div>
                  )}
                </div>

                {/* Dispersion Width Cone Angle */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">DISPERSION CONE OPENING ANGLE:</span>
                    <span className="text-cyan-300 font-bold">{dispersionScenario.dispersionWidthDeg}°</span>
                  </div>
                  {weatherMode === 'SCENARIO_MODE' && (
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={dispersionScenario.dispersionWidthDeg}
                      onChange={(e) =>
                        setDispersionScenario({
                          ...dispersionScenario,
                          dispersionWidthDeg: Number(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  )}
                  {weatherMode === 'LIVE_METEOROLOGY' && (
                    <div className="text-[9px] text-slate-500">
                      Dynamically calibrated based on live atmospheric wind speed.
                    </div>
                  )}
                </div>

                {/* Simulation Duration Slider */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SIMULATION DURATION:</span>
                    <span className="text-purple-300 font-bold">{dispersionScenario.durationHours} hours</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={dispersionScenario.durationHours}
                    onChange={(e) =>
                      setDispersionScenario({
                        ...dispersionScenario,
                        durationHours: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Modeled Impact Metrics Summary */}
              {corridorGeometry && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">DOWNWIND REACH</div>
                    <div className="text-xl font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                      ~{corridorGeometry.boundingRadiusKm.toFixed(1)} km
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Tactical plume reach</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">MODELED CORRIDOR AREA</div>
                    <div className="text-xl font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                      {corridorGeometry.corridorAreaKm2} km²
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Surface footprint</div>
                  </div>
                </div>
              )}

              {/* Quick Population Context inside Corridor */}
              {populationContext && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold uppercase text-[10px]">
                      ESTIMATED CENSUS BUFFER IN MODELED CORRIDOR
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono">Reference Buffer</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-['Chakra_Petch']">
                    ~{populationContext.estimatedPopulationInCorridor.toLocaleString()} persons
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {populationContext.label} (Census 2011 density benchmark. Population context is static/reference data, not real-time population).
                  </p>
                </div>
              )}

              {/* 5-Axis Visual Impact Radar */}
              <ImpactRadar hotspot={currentHotspot} />

              {/* DHUMRA-DHARMA Nighttime Flare Auditor */}
              <DhumraDharmaPanel hotspot={currentHotspot} />
            </div>
          )}

          {/* TAB 2: "AM I SAFE?" CITIZEN SAFETY MODE */}
          {activeTab === 'citizen' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  <span className="font-['Chakra_Petch'] text-base font-bold text-white tracking-wider">
                    "AM I SAFE?" CITIZEN CHECK
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Check if your residence, workplace, or transit location falls within the modeled potential hazard corridor.
                </p>
              </div>

              {/* Input Area */}
              <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
                <label className="text-slate-300 font-bold text-xs block">
                  ENTER LOCATION OR TAP MAP:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userLocationInput}
                      onChange={(e) => setUserLocationInput(e.target.value)}
                      placeholder="e.g. Sambalpur Sector 4 or tap map..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (currentHotspot) {
                        // Re-evaluate on current hotspot
                        const testLat = currentHotspot.latitude - 0.03;
                        const testLng = currentHotspot.longitude + 0.04;
                        const res = checkCitizenSafety(
                          testLat,
                          testLng,
                          currentHotspot.latitude,
                          currentHotspot.longitude,
                          dispersionScenario
                        );
                        setTestedLocation({ lat: testLat, lng: testLng, ...res });
                        setUserLocationInput(`${currentHotspot.nearest_city} Ward Perimeter`);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shrink-0"
                  >
                    CHECK
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Tip: You can directly click anywhere on the Leaflet map to inspect safety status at that exact geographic coordinate.
                </p>
              </div>

              {/* Safety Evaluation Result Card */}
              {testedLocation && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    testedLocation.status === 'WITHIN'
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : testedLocation.status === 'NEAR'
                      ? 'bg-blue-950/30 border-blue-500/50'
                      : 'bg-emerald-950/30 border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      SAFETY EVALUATION RESULT
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        testedLocation.status === 'WITHIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : testedLocation.status === 'NEAR'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {testedLocation.status === 'WITHIN'
                        ? 'WITHIN MODELED IMPACT AREA'
                        : testedLocation.status === 'NEAR'
                        ? 'NEAR MODELED IMPACT AREA'
                        : 'OUTSIDE MODELED IMPACT AREA'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    {testedLocation.message}
                  </div>

                  <div className="text-xs text-slate-300">
                    Distance to hotspot center: <strong className="text-cyan-300">{testedLocation.distanceKm} km</strong>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsSafetyModalOpen(true)}
                      className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>VIEW SAFE ACTIONS & GUIDELINES</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Citizen Ground Reports Submission */}
              <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase text-xs">
                    SUBMIT CITIZEN GROUND REPORT
                  </span>
                  <span className="text-[10px] text-slate-500">Field Corroboration</span>
                </div>

                {reportSubmittedAlert && (
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Report submitted. Marked as UNVERIFIED pending triage.</span>
                  </div>
                )}

                <form onSubmit={handleSubmitCitizenReport} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">
                      REPORT TYPE:
                    </label>
                    <select
                      value={newReportType}
                      onChange={(e) => setNewReportType(e.target.value as CitizenReport['reportType'])}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="SMOKE">Dense Smoke Plume</option>
                      <option value="FLAMES">Visible Flames / Night Glow</option>
                      <option value="ODOR">Chemical / Acrid Odor</option>
                      <option value="EXPLOSION / LOUD SOUND">Explosion / Loud Sound</option>
                      <option value="EVACUATION">Evacuation Activity</option>
                      <option value="ROAD BLOCKAGE">Road Blockage / Haze</option>
                      <option value="OTHER">Other Ground Observation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">
                      DESCRIPTION (OPTIONAL):
                    </label>
                    <textarea
                      rows={2}
                      value={newReportDesc}
                      onChange={(e) => setNewReportDesc(e.target.value)}
                      placeholder="Describe what you observed from safe distance..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>TRANSMIT GROUND OBSERVATION</span>
                  </button>
                </form>

                {/* Recent Ground Reports Feed */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    COMMUNITY GROUND OBSERVATIONS ({citizenReports.length}):
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {citizenReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">{rep.reportType}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              rep.status === 'MULTI-SOURCE CORROBORATION'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rep.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[10px]">{rep.description}</p>
                        <div className="text-[9px] text-slate-500 flex items-center justify-between">
                          <span>{rep.locationName}</span>
                          <span>{rep.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SENSITIVE LOCATIONS & WHO COULD BE AFFECTED */}
          {activeTab === 'sensitive' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              {/* Population Summary Cards */}
              {populationContext && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                    <div className="text-[9px] text-slate-400 uppercase">1 KM CENSUS BUFFER</div>
                    <div className="text-lg font-bold text-rose-300 font-['Chakra_Petch'] mt-0.5">
                      ~{populationContext.estimated1kmPop.toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-500">Static reference density</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                    <div className="text-[9px] text-slate-400 uppercase">5 KM CENSUS BUFFER</div>
                    <div className="text-lg font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                      ~{populationContext.estimated5kmPop.toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-500">Static reference buffer</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[9px] text-slate-400 uppercase">NEARBY SETTLEMENTS</div>
                    <div className="text-lg font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                      {populationContext.nearbySettlementsCount}
                    </div>
                    <div className="text-[8px] text-slate-500">Populated clusters</div>
                  </div>
                </div>
              )}

              {/* Sensitive Locations Directory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase text-xs">
                    SENSITIVE INFRASTRUCTURE (WITHIN 15 KM):
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    OpenStreetMap contextual data
                  </span>
                </div>

                <div className="space-y-2">
                  {sensitiveLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-sm shrink-0 mt-0.5">
                        {loc.type === 'hospital' && '🏥'}
                        {loc.type === 'school' && '🏫'}
                        {loc.type === 'residential' && '🏘️'}
                        {loc.type === 'power' && '⚡'}
                        {loc.type === 'emergency' && '🚒'}
                        {loc.type === 'industrial' && '🏭'}
                        {loc.type === 'water' && '💧'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate">
                            {loc.name}
                          </span>
                          <span className="font-mono text-cyan-300 text-xs font-bold shrink-0 ml-2">
                            {loc.distanceKm} km
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-400/90 uppercase tracking-wider mt-0.5">
                          {loc.type}
                        </div>
                        {loc.capacityOrNotes && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {loc.capacityOrNotes}
                          </div>
                        )}
                        <div className="text-[8px] text-slate-600 mt-1">
                          Source: {loc.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AIR QUALITY CONTEXT */}
          {activeTab === 'air' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span className="font-['Chakra_Petch'] text-sm font-bold text-white tracking-wider">
                      AIR QUALITY CONTEXT
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                    {airQuality?.hasLiveSensorNearby ? 'STATION DETECTED' : 'SENSOR UNAVAILABLE'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Regional atmospheric telemetry from State Pollution Control Board (SPCB) / CAAQMS monitoring network.
                </p>

                {/* Mandatory Scientific Qualifier */}
                <div className="p-2 rounded bg-black/40 border border-purple-500/30 text-[10px] text-purple-200/90 leading-tight">
                  <span className="font-bold text-purple-300">SCIENTIFIC QUALIFIER: </span>
                  {airQuality?.disclaimer}
                </div>
              </div>

              {airQuality?.hasLiveSensorNearby ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">NEAREST CAAQMS SENSOR</div>
                      <div className="text-xs font-bold text-white mt-0.5">{airQuality.stationName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">DISTANCE</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">{airQuality.distanceKm} km</div>
                    </div>
                  </div>

                  {/* Pollutant Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">PM2.5</div>
                      <div className="text-lg font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.pm25} <span className="text-[9px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">PM10</div>
                      <div className="text-lg font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.pm10} <span className="text-[9px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">NO₂</div>
                      <div className="text-lg font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.no2} <span className="text-[9px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">SO₂</div>
                      <div className="text-lg font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.so2} <span className="text-[9px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">CO</div>
                      <div className="text-lg font-bold text-emerald-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.co} <span className="text-[9px] font-normal text-slate-500">mg/m³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800">
                      <div className="text-[9px] text-slate-400">REGIONAL AQI</div>
                      <div className="text-lg font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
                        {airQuality.aqi}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#0D1424] border border-slate-800 text-center space-y-2">
                  <Radio className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="font-bold text-slate-300">NO NEARBY LIVE AIR-QUALITY SENSOR</div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Ground-level gaseous concentrations cannot be inferred from satellite thermal radiation alone without calibrated in-situ sensors.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EVIDENCE COVERAGE & SENTINEL-2 PANEL */}
          {activeTab === 'evidence' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-1">
                <span className="font-['Chakra_Petch'] text-sm font-bold text-white tracking-wider">
                  MULTI-SOURCE EVIDENCE MATRIX
                </span>
                <p className="text-[11px] text-slate-300">
                  Data provenance and availability across all monitored intelligence channels.
                </p>
              </div>

              {/* Evidence Coverage Checklist */}
              <div className="space-y-2 bg-[#0D1424] p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>NASA FIRMS VIIRS NOAA-21 NRT</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[9px]">
                    AVAILABLE (5-DAY WINDOW)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sentinel-2 Level-2A Archival Imagery</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                      currentHotspot.satellite_available
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {currentHotspot.satellite_available ? 'ARCHIVAL CONTEXT' : 'UNAVAILABLE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Hospital className="w-3.5 h-3.5 text-blue-400" />
                    <span>OpenStreetMap Contextual Facilities</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[9px]">
                    AVAILABLE ({sensitiveLocations.length} DETECTED)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    <span>Population Density Context</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold text-[9px]">
                    LIMITED (CENSUS DERIVED)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span>In-Situ Air Quality Monitoring</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                      airQuality?.hasLiveSensorNearby
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {airQuality?.hasLiveSensorNearby ? 'REGIONAL STATION' : 'UNAVAILABLE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Citizen Ground Reports</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold text-[9px]">
                    AVAILABLE ({citizenReports.length} SUBMITTED)
                  </span>
                </div>
              </div>

              {/* Sentinel-2 Contextual Card */}
              {currentHotspot.satellite_available ? (
                <div className="p-4 rounded-xl bg-[#0D1424] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Satellite className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs">ARCHIVAL SATELLITE CONTEXT (SENTINEL-2)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Scene: {currentHotspot.satellite_scene_date || 'Archival Scene'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">NDVI (VEGETATION)</div>
                      <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                        {currentHotspot.ndvi ?? 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">NDBI (BUILT-UP)</div>
                      <div className="text-base font-bold text-rose-300 font-mono mt-0.5">
                        {currentHotspot.ndbi ?? 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">NDWI (WATER)</div>
                      <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                        {currentHotspot.ndwi ?? 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">SWIR CONTRAST</div>
                      <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                        {currentHotspot.swir_contrast ?? 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Archival Notice:</strong> Sentinel-2 scenes provide pre-incident contextual baselines (e.g. soil vs built surface). They do not depict the dynamic FIRMS thermal event itself.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0D1424] border border-slate-800 text-center text-slate-500 text-xs">
                  ARCHIVAL SATELLITE CONTEXT UNAVAILABLE FOR THIS HOTSPOT
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explainability Modals */}
      <WhyDidYouAlertModal
        hotspot={currentHotspot}
        isOpen={isWhyAlertOpen}
        onClose={() => setIsWhyAlertOpen(false)}
        onGoToResponseMode={onNavigateToResponse}
      />

      <CitizenSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        status={testedLocation?.status || 'OUTSIDE'}
        incidentId={currentHotspot.source_id}
        cityName={currentHotspot.nearest_city || 'Local Area'}
        distanceKm={testedLocation?.distanceKm || 0}
      />
    </div>
  );
};
