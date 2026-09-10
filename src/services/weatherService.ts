import { MeteorologicalContext } from '../types';

/**
 * 16-point cardinal compass labels for standard meteorological bearings.
 * Meteorological wind direction represents the direction FROM which wind blows.
 */
export function getWindCompass(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Convert meteorological "FROM" wind direction to physical "TO" downwind heading.
 * e.g. Wind from 270° (West) blows TOWARDS 90° (East).
 */
export function getDownwindHeading(windDirectionDeg: number): number {
  return ((windDirectionDeg + 180) % 360 + 360) % 360;
}

/**
 * Get human-readable downwind cardinal compass label.
 */
export function getDownwindCompass(windDirectionDeg: number): string {
  return getWindCompass(getDownwindHeading(windDirectionDeg));
}

// Client-side cache: 10 minutes (5–15 min window specified in requirements)
interface CachedWeatherEntry {
  data: MeteorologicalContext;
  fetchedAt: number;
}

const weatherCache = new Map<string, CachedWeatherEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate standardized cache key for coordinate pairs (3 decimal precision ~110m)
 */
function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

/**
 * Fetch near-current meteorological context via secure backend proxy.
 * Implements client-side caching to prevent unnecessary API traffic.
 */
export async function fetchMeteorologicalContext(
  latitude: number,
  longitude: number,
  forceRefresh: boolean = false
): Promise<MeteorologicalContext> {
  const key = getCacheKey(latitude, longitude);

  // Return cached entry if fresh and not explicitly forced
  if (!forceRefresh) {
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        available: false,
        source: 'Open-Meteo',
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        windSpeedKmh: 0,
        windDirectionDeg: 0,
        windDirectionLabel: 'N/A',
        temperatureC: 0,
        relativeHumidity: 0,
        precipitationMm: 0,
        cloudCoverPct: 0,
        windGustKmh: 0,
        error: errData.error || `Weather server returned status ${res.status}`,
      };
    }

    const data: MeteorologicalContext = await res.json();

    if (data.available) {
      weatherCache.set(key, {
        data,
        fetchedAt: Date.now(),
      });
    }

    return data;
  } catch (err: any) {
    return {
      available: false,
      source: 'Open-Meteo',
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      windSpeedKmh: 0,
      windDirectionDeg: 0,
      windDirectionLabel: 'N/A',
      temperatureC: 0,
      relativeHumidity: 0,
      precipitationMm: 0,
      cloudCoverPct: 0,
      windGustKmh: 0,
      error: err?.message || 'Network failure connecting to meteorological proxy',
    };
  }
}

/**
 * Clear the local in-memory meteorological cache
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
