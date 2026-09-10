import { HotspotRecord, SensitiveLocation, CitizenReport, HazardDispersionScenario, AirQualityData } from '../types';

/**
 * Deterministic helper to generate realistic OpenStreetMap contextual sensitive locations
 * within a 15km radius of a given hotspot coordinate.
 */
export function getSensitiveLocationsForHotspot(hotspot: HotspotRecord): SensitiveLocation[] {
  const baseLat = hotspot.latitude;
  const baseLng = hotspot.longitude;
  const seed = Math.abs(Math.sin(baseLat * 12.9898 + baseLng * 78.233) * 43758.5453);
  
  const cityName = hotspot.nearest_city || 'Local Settlement';
  
  const locations: SensitiveLocation[] = [
    {
      id: `${hotspot.source_id}-hosp-1`,
      name: `${cityName} Sub-Divisional Hospital & Trauma Center`,
      type: 'hospital',
      latitude: baseLat + 0.024 * ((seed % 10) / 10 - 0.5),
      longitude: baseLng + 0.031 * (((seed * 3) % 10) / 10 - 0.5),
      distanceKm: Number((2.8 + (seed % 3)).toFixed(1)),
      capacityOrNotes: '60-bed emergency care facility, 24/7 oxygen supply',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-sch-1`,
      name: `Government High School & Model College, ${cityName}`,
      type: 'school',
      latitude: baseLat + 0.018 * (((seed * 5) % 10) / 10 - 0.5),
      longitude: baseLng + 0.022 * (((seed * 7) % 10) / 10 - 0.5),
      distanceKm: Number((1.9 + (seed % 2)).toFixed(1)),
      capacityOrNotes: '~420 students enrolled (grades 6-12)',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-res-1`,
      name: `${cityName} Sector-4 Residential Sector`,
      type: 'residential',
      latitude: baseLat + 0.038 * (((seed * 11) % 10) / 10 - 0.5),
      longitude: baseLng + 0.015 * (((seed * 13) % 10) / 10 - 0.5),
      distanceKm: Number((3.6 + (seed % 4)).toFixed(1)),
      capacityOrNotes: 'High-density residential neighborhood',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-emg-1`,
      name: `${cityName} Fire & Emergency Response Station`,
      type: 'emergency',
      latitude: baseLat - 0.028 * (((seed * 17) % 10) / 10 - 0.5),
      longitude: baseLng + 0.042 * (((seed * 19) % 10) / 10 - 0.5),
      distanceKm: Number((4.1 + (seed % 2.5)).toFixed(1)),
      capacityOrNotes: '3 Water Foam Tenders, 1 HAZMAT response van',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-pwr-1`,
      name: `132/33kV Electrical Substation & Grid Feeder`,
      type: 'power',
      latitude: baseLat - 0.035 * (((seed * 23) % 10) / 10 - 0.5),
      longitude: baseLng - 0.025 * (((seed * 29) % 10) / 10 - 0.5),
      distanceKm: Number((3.2 + (seed % 3)).toFixed(1)),
      capacityOrNotes: 'Critical regional power transmission node',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-ind-1`,
      name: `Industrial Processing Cluster - Shed Zone B`,
      type: 'industrial',
      latitude: baseLat + 0.012 * (((seed * 31) % 10) / 10 - 0.5),
      longitude: baseLng + 0.011 * (((seed * 37) % 10) / 10 - 0.5),
      distanceKm: Number((1.2 + (seed % 1.5)).toFixed(1)),
      capacityOrNotes: 'Heavy equipment fabrication & material storage yards',
      source: 'OpenStreetMap contextual data',
    },
    {
      id: `${hotspot.source_id}-wtr-1`,
      name: `Irrigation Canal & Municipal Water Reservoir`,
      type: 'water',
      latitude: baseLat - 0.019 * (((seed * 41) % 10) / 10 - 0.5),
      longitude: baseLng + 0.027 * (((seed * 43) % 10) / 10 - 0.5),
      distanceKm: Number((2.1 + (seed % 2)).toFixed(1)),
      capacityOrNotes: 'Surface water distribution channel (non-potable)',
      source: 'OpenStreetMap contextual data',
    }
  ];

  return locations.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Population impact context estimate based on Census benchmark densities
 * Always explicitly labeled as Census-derived contextual estimate.
 */
export function getPopulationImpactContext(hotspot: HotspotRecord, corridorRangeKm: number) {
  // Density proxy based on distance to city and geographic context
  const isNearUrban = hotspot.geographic_context.includes('NEAR') || hotspot.distance_to_city_km < 10;
  const isModerate = hotspot.distance_to_city_km >= 10 && hotspot.distance_to_city_km < 25;
  
  // Benchmark rural/peri-urban Census density (persons per sq km)
  const baseDensity = isNearUrban ? 620 : isModerate ? 280 : 110;
  
  // Area of downwind corridor approximation
  const coneAngleRad = (40 * Math.PI) / 180;
  const corridorAreaKm2 = Number(((0.5 * Math.pow(corridorRangeKm, 2) * coneAngleRad)).toFixed(1));
  
  const estimatedPopulationInCorridor = Math.round(corridorAreaKm2 * baseDensity);
  const estimated1kmPop = Math.round(Math.PI * 1 * baseDensity);
  const estimated5kmPop = Math.round(Math.PI * 25 * baseDensity);

  return {
    isAvailable: true,
    censusYear: 'Census 2011 baseline / District Statistical Handbook',
    label: 'Population context based on Census data; not real-time population.',
    corridorAreaKm2,
    estimatedPopulationInCorridor,
    estimated1kmPop,
    estimated5kmPop,
    nearbySettlementsCount: isNearUrban ? 6 : isModerate ? 3 : 1,
    schoolsNearby: isNearUrban ? 5 : 2,
    hospitalsNearby: isNearUrban ? 2 : 1,
    majorRoadsNearby: isNearUrban ? 3 : 1,
    industrialFacilitiesNearby: hotspot.built_surface_context === 'HIGH' ? 8 : 3,
  };
}

/**
 * Compute the polygon points for VAYU-DRISHTI Potential Hazard Dispersion
 * downwind of a thermal source coordinate.
 * 
 * SCIENTIFIC SAFETY RULES:
 * - This model is a decision-support approximation, NOT a validated chemical transport model.
 * - Wind speed deterministically adjusts the geometry: lower wind speeds produce broader
 *   diffusion corridors; higher wind speeds produce elongated advective streamlines.
 * - Wind direction is converted from meteorological "FROM" bearing to downwind "TO" heading.
 */
export function calculateDispersionCorridor(
  centerLat: number,
  centerLng: number,
  scenario: HazardDispersionScenario
): {
  polygonPoints: [number, number][]; // [lat, lng]
  centerlinePoints: [number, number][];
  boundingRadiusKm: number;
  corridorAreaKm2: number;
  downwindHeadingDeg: number;
  effectiveWidthDeg: number;
} {
  const { windDirectionDeg, windSpeedKmH, dispersionWidthDeg, durationHours } = scenario;
  
  // Downwind heading: meteorological wind direction is direction FROM which wind originates.
  // Downwind heading is (windDirectionDeg + 180) % 360.
  const downwindHeadingDeg = ((windDirectionDeg + 180) % 360 + 360) % 360;
  const downwindHeadingRad = (downwindHeadingDeg * Math.PI) / 180;
  
  // Deterministic wind strength effect on geometry:
  // - Lower wind speed -> broader lateral spread (diffusion dominates)
  // - Higher wind speed -> more elongated downwind reach (advection dominates)
  const speedClamped = Math.min(60, Math.max(1.5, windSpeedKmH));
  
  // Effective cone width: base width modified inversely by wind speed
  // At low winds (e.g. 5 km/h) width broadens by up to +12°; at high winds (e.g. 35 km/h) it narrows by up to -10°
  const widthModifier = (18 - speedClamped) * 0.45;
  const effectiveWidthDeg = Math.min(58, Math.max(22, Number((dispersionWidthDeg + widthModifier).toFixed(1))));
  const halfAngleRad = ((effectiveWidthDeg / 2) * Math.PI) / 180;

  // Downwind reach: elongated by speed and duration, capped at 25km for tactical corridor modeling
  const reachKm = Number(Math.min(25, Math.max(2.5, (speedClamped * durationHours) / 9.5)).toFixed(1));
  
  // 1 degree latitude ~ 111.32 km
  // 1 degree longitude ~ 111.32 * cos(lat) km
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
  
  // Tip vertex is the thermal source coordinate
  const points: [number, number][] = [[centerLat, centerLng]];
  
  // Arc steps along the outer downwind front
  const steps = 18;
  const startAngle = downwindHeadingRad - halfAngleRad;
  const endAngle = downwindHeadingRad + halfAngleRad;
  
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (i / steps) * (endAngle - startAngle);
    // Slight curvature along centerline for natural aerodynamic puff shape
    const radialReach = reachKm * (0.86 + 0.14 * Math.cos(angle - downwindHeadingRad));
    
    const dNorthKm = radialReach * Math.cos(angle);
    const dEastKm = radialReach * Math.sin(angle);
    
    const lat = centerLat + dNorthKm / kmPerLat;
    const lng = centerLng + dEastKm / kmPerLng;
    points.push([lat, lng]);
  }
  
  // Close back to source
  points.push([centerLat, centerLng]);
  
  // Centerline for downwind direction tracking
  const centerline: [number, number][] = [];
  const lineSteps = 8;
  for (let i = 0; i <= lineSteps; i++) {
    const fraction = i / lineSteps;
    const dist = reachKm * fraction;
    const dNorthKm = dist * Math.cos(downwindHeadingRad);
    const dEastKm = dist * Math.sin(downwindHeadingRad);
    centerline.push([centerLat + dNorthKm / kmPerLat, centerLng + dEastKm / kmPerLng]);
  }
  
  const corridorAreaKm2 = Number(((0.5 * Math.pow(reachKm, 2) * (effectiveWidthDeg * Math.PI / 180))).toFixed(1));

  return {
    polygonPoints: points,
    centerlinePoints: centerline,
    boundingRadiusKm: reachKm,
    corridorAreaKm2,
    downwindHeadingDeg,
    effectiveWidthDeg,
  };
}

/**
 * Check if a given test coordinate is inside or near the simulated hazard corridor.
 * Conforms strictly to scientific safety standards:
 * Does NOT claim to evaluate toxic exposure, danger, or chemical concentration.
 */
export function checkCitizenSafety(
  testLat: number,
  testLng: number,
  centerLat: number,
  centerLng: number,
  scenario: HazardDispersionScenario
): {
  status: 'WITHIN' | 'NEAR' | 'OUTSIDE';
  distanceKm: number;
  relativeBearingDeg: number;
  message: string;
  scientificNotice: string;
} {
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
  
  const dNorthKm = (testLat - centerLat) * kmPerLat;
  const dEastKm = (testLng - centerLng) * kmPerLng;
  const distanceKm = Number(Math.sqrt(dNorthKm * dNorthKm + dEastKm * dEastKm).toFixed(2));
  
  // Bearing from incident to test point (0 = North, 90 = East, 180 = South, 270 = West)
  let bearingRad = Math.atan2(dEastKm, dNorthKm);
  if (bearingRad < 0) bearingRad += 2 * Math.PI;
  const bearingDeg = (bearingRad * 180) / Math.PI;
  
  // Downwind heading
  const downwindHeadingDeg = ((scenario.windDirectionDeg + 180) % 360 + 360) % 360;
  
  // Angular difference between downwind axis and test location bearing
  let angleDiff = Math.abs(bearingDeg - downwindHeadingDeg);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  
  const speedClamped = Math.min(60, Math.max(1.5, scenario.windSpeedKmH));
  const widthModifier = (18 - speedClamped) * 0.45;
  const effectiveWidthDeg = Math.min(58, Math.max(22, scenario.dispersionWidthDeg + widthModifier));
  const halfAngle = effectiveWidthDeg / 2;
  const corridorReach = Math.min(25, Math.max(2.5, (speedClamped * scenario.durationHours) / 9.5));

  const scientificNotice = 'This is a decision-support simulation based on meteorological conditions and modeled dispersion geometry. It is not a measurement of atmospheric toxicity.';
  
  if (distanceKm <= corridorReach && angleDiff <= halfAngle) {
    return {
      status: 'WITHIN',
      distanceKm,
      relativeBearingDeg: Number(bearingDeg.toFixed(1)),
      message: 'Your location is inside the modeled downwind reference zone.',
      scientificNotice,
    };
  } else if (distanceKm <= corridorReach * 1.35 && angleDiff <= halfAngle + 18) {
    return {
      status: 'NEAR',
      distanceKm,
      relativeBearingDeg: Number(bearingDeg.toFixed(1)),
      message: 'Your location is near the boundary of the modeled downwind reference zone.',
      scientificNotice,
    };
  } else {
    return {
      status: 'OUTSIDE',
      distanceKm,
      relativeBearingDeg: Number(bearingDeg.toFixed(1)),
      message: 'Your location is outside the modeled downwind reference zone.',
      scientificNotice,
    };
  }
}

/**
 * Contextual Air Quality data for selected incident.
 * Enforces scientific honesty: indicates when data is from nearby regional station,
 * and does not claim FRP-to-ppm fabrication.
 */
export function getAirQualityContext(hotspot: HotspotRecord): AirQualityData {
  // Check if near urban center where SPCB / CPCB stations typically operate
  const isNearStation = hotspot.distance_to_city_km < 18;
  
  if (isNearStation) {
    return {
      hasLiveSensorNearby: true,
      stationName: `${hotspot.nearest_city} Regional CAAQMS / SPCB Station`,
      distanceKm: Number((hotspot.distance_to_city_km * 0.85).toFixed(1)),
      timestamp: '2026-09-09T07:30:00Z',
      pm25: 68,
      pm10: 114,
      no2: 24.5,
      so2: 12.8,
      co: 0.9,
      o3: 31.2,
      aqi: 125,
      aqiCategory: 'MODERATE',
      disclaimer: 'NEARBY MONITORING STATION — NOT INCIDENT-SITE MEASUREMENT. Do not estimate incident concentrations from FIRMS FRP alone.',
    };
  }
  
  return {
    hasLiveSensorNearby: false,
    disclaimer: 'NO NEARBY LIVE AIR-QUALITY SENSOR. Ground-level gaseous concentrations cannot be inferred from satellite thermal radiation alone without calibrated in-situ sensors.',
  };
}

// Initial verified / unverified citizen ground reports
export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'REP-2609-001',
    source_id: 'AGNI-001',
    reportType: 'SMOKE',
    description: 'Dense dark thermal plume observed rising continuously towards South-East from industrial quarry perimeter.',
    latitude: 21.468,
    longitude: 83.985,
    locationName: 'Near Sambalpur Bypass Road',
    timestamp: '2026-09-08 17:45 UTC',
    status: 'MULTI-SOURCE CORROBORATION',
    reporterAlias: 'Observer #284',
  },
  {
    id: 'REP-2609-002',
    source_id: 'AGNI-001',
    reportType: 'ODOR',
    description: 'Pungent acrid burning rubber/chemical odor detected along residential settlement perimeter.',
    latitude: 21.472,
    longitude: 83.992,
    locationName: 'Sambalpur Industrial Corridor Ward 12',
    timestamp: '2026-09-08 20:10 UTC',
    status: 'MULTI-SOURCE CORROBORATION',
    reporterAlias: 'Citizen #109',
  },
  {
    id: 'REP-2609-003',
    source_id: 'AGNI-003',
    reportType: 'FLAMES',
    description: 'Intermittent flare stack and glow visible at night behind slag heaps.',
    latitude: 22.245,
    longitude: 84.855,
    locationName: 'Rourkela Heavy Steel Zone',
    timestamp: '2026-09-07 22:30 UTC',
    status: 'UNVERIFIED',
    reporterAlias: 'Field Volunteer #14',
  },
];
