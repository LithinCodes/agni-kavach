export type PriorityCategory = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

export type InvestigationStatus =
  | 'Unreviewed'
  | 'Under Investigation'
  | 'Escalated'
  | 'Resolved';

export type AlertStatus =
  | 'Normal'
  | 'Alert Raised'
  | 'Acknowledged'
  | 'Resolved'
  | 'ALERT_RAISED';

export type ContextAssessment =
  | 'BUILT-ENVIRONMENT CANDIDATE'
  | 'VEGETATION / NATURAL CONTEXT'
  | 'MIXED CONTEXT'
  | 'REQUIRES INVESTIGATION';

export interface HotspotRecord {
  id: number;
  source_id: string;
  thermal_cluster?: number;
  latitude: number;
  longitude: number;
  location: string;
  detections: number;
  active_days: number;
  mean_frp: number;
  max_frp: number;
  night_ratio: number;
  thermal_risk: number;
  thermal_risk_category?: string;
  persistence: number;
  priority_score: number;
  priority_category: PriorityCategory;
  nearest_city: string;
  distance_to_city_km: number;
  geographic_context: string;
  ml_cluster: number;
  pattern_profile: string;
  dominant_factor: string;
  thermal_contribution: number;
  persistence_contribution: number;
  detection_contribution: number;
  night_contribution: number;
  geographic_contribution: number;
  satellite_available: boolean;
  satellite_scene_date?: string | null;
  satellite_cloud_cover?: number | null;
  satellite_valid_ratio?: number | null;
  ndvi?: number | null;
  ndbi?: number | null;
  ndwi?: number | null;
  swir_contrast?: number | null;
  vegetation_context?: string | null;
  built_surface_context?: string | null;
  water_context?: string | null;
  environment_context?: string | null;
  satellite_quality?: string | null;
  thermal_data_source?: string;
  satellite_data_source?: string;
  explanation?: string;
  investigation_status?: InvestigationStatus;
  alert_status?: AlertStatus;
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  priority: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  satellite: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
  minPriorityScore: number;
  minThermalRisk: number;
  minDetections: number;
  minNightActivity: number;
  environment: 'ALL' | 'BUILT' | 'VEGETATION' | 'WATER' | 'MIXED';
  searchQuery: string;
}

export interface MapLayerState {
  thermalSources: boolean;
  priorityHeatmap?: boolean;
  satelliteContext: boolean;
  builtEnvContext: boolean;
  investigationSources: boolean;
  adminBoundaries?: boolean;
  windContext?: boolean;
  industrialBoundaries?: boolean;
  waterContext?: boolean;
  vegetationContext?: boolean;
  populationContext?: boolean;
  sensitiveLocations?: boolean;
  vayuDrishtiOverlay?: boolean;
}

export type DemoScenarioId =
  | 'LIVE'
  | 'PERSISTENT_SOURCE'
  | 'HIGH_PRIORITY_INVESTIGATION'
  | 'BUILT_ENVIRONMENT_CANDIDATE'
  | 'NATURAL_VEGETATION_CONTEXT';

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  description: string;
  targetSourceId?: string;
  isSimulated: boolean;
}

export interface SupabaseConfigState {
  url: string;
  publishableKey: string;
  isConnected: boolean;
  isConnecting: boolean;
  error?: string | null;
  mode: 'supabase_live' | 'analytical_baseline';
}

export type NavigationTab =
  | 'map'
  | 'analytics'
  | 'impact'
  | 'response'
  | 'investigations'
  | 'alerts'
  | 'replay';

export interface SensitiveLocation {
  id: string;
  name: string;
  type: 'hospital' | 'school' | 'clinic' | 'residential' | 'emergency' | 'industrial' | 'power' | 'water';
  latitude: number;
  longitude: number;
  distanceKm: number;
  capacityOrNotes?: string;
  source: 'OpenStreetMap contextual data';
}

export interface CitizenReport {
  id: string;
  source_id?: string;
  reportType: 'SMOKE' | 'FLAMES' | 'ODOR' | 'EXPLOSION / LOUD SOUND' | 'EVACUATION' | 'ROAD BLOCKAGE' | 'OTHER';
  description?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  timestamp: string;
  status: 'UNVERIFIED' | 'MULTI-SOURCE CORROBORATION' | 'REVIEWED';
  reporterAlias?: string;
}

export interface MeteorologicalContext {
  available: boolean;
  source: 'Open-Meteo';
  latitude: number;
  longitude: number;
  modelGridLatitude?: number;
  modelGridLongitude?: number;
  timestamp: string;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  temperatureC: number;
  relativeHumidity: number;
  precipitationMm: number;
  cloudCoverPct: number;
  windGustKmh: number;
  error?: string;
}

export type WeatherMode = 'LIVE_METEOROLOGY' | 'SCENARIO_MODE';
export type WeatherStatus = 'LOADING' | 'SUCCESS' | 'FAILURE' | 'SCENARIO_FALLBACK';

export interface HazardDispersionScenario {
  windDirectionDeg: number; // Meteorological direction FROM which wind blows (0 = North, 90 = East, etc.)
  windSpeedKmH: number;
  dispersionWidthDeg: number;
  durationHours: number;
  severityScenario: 'MILD' | 'MODERATE' | 'SEVERE';
  corridorRangeKm: number;
  modelStatus: string;
  weatherMode?: WeatherMode;
  meteorologicalContext?: MeteorologicalContext | null;
}

export interface AirQualityData {
  hasLiveSensorNearby: boolean;
  stationName?: string;
  distanceKm?: number;
  timestamp?: string;
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  aqi?: number;
  aqiCategory?: string;
  disclaimer: string;
}

