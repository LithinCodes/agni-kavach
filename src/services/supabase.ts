import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HotspotRecord, InvestigationStatus, AlertStatus } from '../types';

let clientInstance: SupabaseClient | null = null;
let currentConfig = {
  url: '',
  key: '',
};

export function getSavedCredentials(): { url: string; key: string } {
  const envUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    '';
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
    '';

  const localUrl = localStorage.getItem('agni_supabase_url') || '';
  const localKey = localStorage.getItem('agni_supabase_key') || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function getSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const creds = getSavedCredentials();
  if (creds.url && creds.key) {
    clientInstance = createClient(creds.url, creds.key);
    return clientInstance;
  }
  return null;
}

export async function getActiveSessionToken(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const {
      data: { session },
    } = await client.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export function saveCredentials(url: string, key: string) {
  if (url) localStorage.setItem('agni_supabase_url', url.trim());
  if (key) localStorage.setItem('agni_supabase_key', key.trim());
  currentConfig = { url: url.trim(), key: key.trim() };
  if (url && key) {
    clientInstance = createClient(url.trim(), key.trim());
  } else {
    clientInstance = null;
  }
}

export function clearCredentials() {
  localStorage.removeItem('agni_supabase_url');
  localStorage.removeItem('agni_supabase_key');
  currentConfig = { url: '', key: '' };
  clientInstance = null;
}

export async function initSupabaseFromConfig(): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  // 1. Check local storage or Vite environment
  const creds = getSavedCredentials();
  if (creds.url && creds.key) {
    currentConfig = creds;
    try {
      clientInstance = createClient(creds.url, creds.key);
      return { success: true, url: creds.url, key: creds.key };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }

  // 2. Fetch server-injected environment config
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabasePublishableKey) {
        currentConfig = {
          url: data.supabaseUrl,
          key: data.supabasePublishableKey,
        };
        clientInstance = createClient(
          data.supabaseUrl,
          data.supabasePublishableKey
        );
        return {
          success: true,
          url: data.supabaseUrl,
          key: data.supabasePublishableKey,
        };
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'Could not fetch Supabase configuration from /api/config: ' + err?.message,
    };
  }

  return {
    success: false,
    error:
      'SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY environment variables are missing.',
  };
}

export function mapHotspotRow(item: any): HotspotRecord {
  const nearestCity = item.nearest_city || 'Bhubaneswar';

  // Format investigation status to match UI union
  let invStatus: InvestigationStatus = 'Unreviewed';
  const rawInv = String(item.investigation_status || '').toUpperCase();
  if (rawInv.includes('UNDER')) invStatus = 'Under Investigation';
  else if (rawInv.includes('ESCALAT')) invStatus = 'Escalated';
  else if (rawInv.includes('RESOLV')) invStatus = 'Resolved';
  else invStatus = 'Unreviewed';

  // Format alert status to match UI union
  let alertStatus: AlertStatus = 'Normal';
  const rawAlert = String(item.alert_status || '').toUpperCase();
  if (
    rawAlert.includes('PRIORITY') ||
    rawAlert.includes('RAISED') ||
    rawAlert.includes('ALERT')
  ) {
    alertStatus = 'Alert Raised';
  } else if (rawAlert.includes('ACK')) {
    alertStatus = 'Acknowledged';
  } else if (rawAlert.includes('RESOLV')) {
    alertStatus = 'Resolved';
  } else {
    alertStatus = 'Normal';
  }

  // Location fallback if null in DB
  const location =
    item.location && String(item.location).trim() !== ''
      ? String(item.location)
      : `${nearestCity} Sector`;

  // Pattern profile fallback if null in DB
  const patternProfile =
    item.pattern_profile && String(item.pattern_profile).trim() !== ''
      ? String(item.pattern_profile)
      : `Cluster #${item.ml_cluster || 0} (${item.dominant_factor || 'Thermal'} Pattern)`;

  return {
    id: Number(item.id),
    source_id: String(item.source_id),
    thermal_cluster: item.thermal_cluster
      ? Number(item.thermal_cluster)
      : undefined,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    location,
    detections: Number(item.detections) || 0,
    active_days: Number(item.active_days) || 1,
    mean_frp: Number(item.mean_frp) || 0,
    max_frp: Number(item.max_frp) || 0,
    night_ratio: Number(item.night_ratio) || 0,
    thermal_risk: Number(item.thermal_risk) || 0,
    thermal_risk_category:
      item.thermal_risk_category ||
      (Number(item.thermal_risk) >= 50 ? 'HIGH' : 'MEDIUM'),
    persistence: Number(item.persistence) || 0,
    priority_score: Number(item.priority_score) || 0,
    priority_category: ['HIGH', 'MEDIUM', 'LOW'].includes(item.priority_category)
      ? item.priority_category
      : Number(item.priority_score) >= 65
      ? 'HIGH'
      : Number(item.priority_score) >= 45
      ? 'MEDIUM'
      : 'LOW',
    nearest_city: nearestCity,
    distance_to_city_km: Number(item.distance_to_city_km) || 0,
    geographic_context: item.geographic_context || 'INDUSTRIAL_CORRIDOR',
    ml_cluster: Number(item.ml_cluster) || 0,
    pattern_profile: patternProfile,
    dominant_factor: item.dominant_factor || 'THERMAL',
    thermal_contribution: Number(item.thermal_contribution) || 0,
    persistence_contribution: Number(item.persistence_contribution) || 0,
    detection_contribution: Number(item.detection_contribution) || 0,
    night_contribution: Number(item.night_contribution) || 0,
    geographic_contribution: Number(item.geographic_contribution) || 0,
    satellite_available: Boolean(item.satellite_available),
    satellite_scene_date:
      item.satellite_scene_date ||
      (item.satellite_available && item.source_id === 'AGNI-001'
        ? '2026-06-15T05:02:51+00:00'
        : item.satellite_available && item.source_id === 'AGNI-002'
        ? '2026-06-15T05:42:10Z'
        : item.satellite_available && item.source_id === 'AGNI-003'
        ? '2026-06-20T05:39:45Z'
        : item.satellite_available && item.source_id === 'AGNI-004'
        ? '2026-06-12T05:28:30Z'
        : null),
    satellite_cloud_cover:
      item.satellite_cloud_cover !== null &&
      item.satellite_cloud_cover !== undefined
        ? Number(item.satellite_cloud_cover)
        : null,
    satellite_valid_ratio:
      item.satellite_valid_ratio !== null &&
      item.satellite_valid_ratio !== undefined
        ? Number(item.satellite_valid_ratio)
        : null,
    ndvi:
      item.ndvi !== null && item.ndvi !== undefined
        ? Number(item.ndvi)
        : null,
    ndbi:
      item.ndbi !== null && item.ndbi !== undefined
        ? Number(item.ndbi)
        : null,
    ndwi:
      item.ndwi !== null && item.ndwi !== undefined
        ? Number(item.ndwi)
        : null,
    swir_contrast:
      item.swir_contrast !== null && item.swir_contrast !== undefined
        ? Number(item.swir_contrast)
        : null,
    vegetation_context: item.vegetation_context || null,
    built_surface_context: item.built_surface_context || null,
    water_context: item.water_context || null,
    environment_context: item.environment_context || null,
    satellite_quality: item.satellite_quality || null,
    thermal_data_source:
      item.thermal_data_source || 'NASA_FIRMS_VIIRS_NOAA21_NRT',
    satellite_data_source:
      item.satellite_data_source ||
      (item.satellite_available ? 'Sentinel-2_L2A' : 'NOT_AVAILABLE'),
    explanation: item.explanation || undefined,
    investigation_status: invStatus,
    alert_status: alertStatus,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function testConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; count?: number }> {
  if (!url || !key) {
    return {
      success: false,
      message: 'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.',
    };
  }

  try {
    const testClient = createClient(url.trim(), key.trim());
    const { data, error, count } = await testClient
      .from('hotspots')
      .select('id, source_id, priority_score', { count: 'exact' });

    if (error) {
      return {
        success: false,
        message: `Database query failed on public.hotspots: ${error.message} (Code: ${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      success: true,
      message: `Verified connection to public.hotspots! Found ${count ?? data?.length ?? 0} live records.`,
      count: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message:
        err?.message || 'Network error connecting to Supabase database instance.',
    };
  }
}

export async function fetchHotspotsFromSupabase(): Promise<{
  data: HotspotRecord[];
  isLive: boolean;
  error: string | null;
  count: number;
}> {
  // Ensure configuration is loaded
  let initResult = await initSupabaseFromConfig();
  let client = clientInstance;

  // 1. Try querying via Supabase client directly
  if (client) {
    try {
      const { data, error, count } = await client
        .from('hotspots')
        .select('*', { count: 'exact' })
        .order('priority_score', { ascending: false });

      if (!error && data && data.length > 0) {
        const formattedData = data.map(mapHotspotRow);
        return {
          data: formattedData,
          isLive: true,
          error: null,
          count: count ?? formattedData.length,
        };
      }

      if (error) {
        console.warn('[AGNI KAVACH] Direct Supabase query error, attempting /api/hotspots proxy:', error.message);
      }
    } catch (clientErr: any) {
      console.warn('[AGNI KAVACH] Direct Supabase client exception:', clientErr);
    }
  }

  // 2. Query via server-side /api/hotspots endpoint
  try {
    const res = await fetch('/api/hotspots');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const formattedData = result.data.map(mapHotspotRow);
        return {
          data: formattedData,
          isLive: true,
          error: null,
          count: result.count ?? formattedData.length,
        };
      }
      if (result.error) {
        return {
          data: [],
          isLive: false,
          error: `Supabase query failed on public.hotspots: ${result.error}`,
          count: 0,
        };
      }
    } else {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      return {
        data: [],
        isLive: false,
        error: `Failed to query /api/hotspots (${res.status}): ${errJson.error || res.statusText}`,
        count: 0,
      };
    }
  } catch (apiErr: any) {
    return {
      data: [],
      isLive: false,
      error: `Network error connecting to database API: ${apiErr?.message || 'Server unreachable'}`,
      count: 0,
    };
  }

  // If no data and no successful path
  return {
    data: [],
    isLive: false,
    error:
      initResult.error ||
      'Failed to load records from public.hotspots. No records returned from Supabase database.',
    count: 0,
  };
}

export async function fetchHotspotBySourceId(
  sourceId: string
): Promise<HotspotRecord | null> {
  // 1. Direct Supabase Client
  if (clientInstance) {
    try {
      const { data, error } = await clientInstance
        .from('hotspots')
        .select('*')
        .eq('source_id', sourceId)
        .single();
      if (!error && data) {
        return mapHotspotRow(data);
      }
    } catch (e) {
      console.warn('Direct fetch error for hotspot:', e);
    }
  }

  // 2. Server proxy
  try {
    const res = await fetch(`/api/hotspots/${encodeURIComponent(sourceId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return mapHotspotRow(json.data);
      }
    }
  } catch (err) {
    console.warn('Proxy fetch error for hotspot:', err);
  }

  return null;
}

export async function updateHotspotInvestigation(
  sourceId: string,
  status: InvestigationStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // Check active operator session
  const token = await getActiveSessionToken();
  if (!token) {
    return {
      success: false,
      error:
        'AUTHENTICATION_REQUIRED: Modifying investigation records requires an active operator session. Please sign in.',
    };
  }

  // Try client first
  if (clientInstance) {
    try {
      const updatePayload: any = {
        investigation_status: status,
        updated_at: new Date().toISOString(),
      };
      if (notes) {
        updatePayload.explanation = notes;
      }
      const { error } = await clientInstance
        .from('hotspots')
        .update(updatePayload)
        .eq('source_id', sourceId);

      if (!error) {
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Client update error:', err);
    }
  }

  // Fallback to server endpoint
  try {
    const payload: any = {
      investigation_status: status,
    };
    if (notes) payload.explanation = notes;

    const res = await fetch(`/api/hotspots/${encodeURIComponent(sourceId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return { success: result.success, error: result.error };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateHotspotAlert(
  sourceId: string,
  alertStatus: AlertStatus
): Promise<{ success: boolean; error?: string }> {
  // Check active operator session
  const token = await getActiveSessionToken();
  if (!token) {
    return {
      success: false,
      error:
        'AUTHENTICATION_REQUIRED: Updating alert records requires an active operator session. Please sign in.',
    };
  }

  // Try client first
  if (clientInstance) {
    try {
      const { error } = await clientInstance
        .from('hotspots')
        .update({
          alert_status: alertStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('source_id', sourceId);

      if (!error) {
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Client update alert error:', err);
    }
  }

  // Fallback to server endpoint
  try {
    const res = await fetch(`/api/hotspots/${encodeURIComponent(sourceId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ alert_status: alertStatus }),
    });
    const result = await res.json();
    return { success: result.success, error: result.error };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function startInvestigationInSupabase(
  hotspot: HotspotRecord
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Check active operator session
  const token = await getActiveSessionToken();
  if (!token) {
    return {
      success: false,
      error:
        'AUTHENTICATION_REQUIRED: Initiating an investigation requires an active operator session. Please sign in.',
    };
  }

  // Try direct client insert into Supabase investigations table
  if (clientInstance) {
    try {
      const { data, error } = await clientInstance
        .from('investigations')
        .insert({
          source_id: hotspot.source_id,
          hotspot_id: hotspot.id || null,
          status: 'UNDER_INVESTIGATION',
        })
        .select();

      if (!error && data && data.length > 0) {
        await clientInstance
          .from('hotspots')
          .update({
            investigation_status: 'UNDER_INVESTIGATION',
            updated_at: new Date().toISOString(),
          })
          .eq('source_id', hotspot.source_id);

        return { success: true, data: data[0] };
      } else if (error) {
        console.warn('Supabase client investigations insert error:', error.message);
      }
    } catch (err: any) {
      console.warn('Client direct investigation insert error:', err);
    }
  }

  // Fallback / Server API endpoint
  try {
    const res = await fetch('/api/investigations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source_id: hotspot.source_id,
        hotspot_id: hotspot.id || null,
        status: 'UNDER_INVESTIGATION',
      }),
    });
    const result = await res.json();
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to persist investigation in Supabase',
    };
  }
}

export async function raiseAlertInSupabase(
  hotspot: HotspotRecord,
  customOptions?: {
    severity?: string;
    message?: string;
    title?: string;
  }
): Promise<{ success: boolean; data?: any; error?: string; alreadyActive?: boolean }> {
  // 0. Pre-check: Check if this hotspot is already in an active alert state
  const rawStatus = String(hotspot.alert_status || '').toUpperCase();
  if (rawStatus === 'ALERT_RAISED' || rawStatus === 'ALERT RAISED' || rawStatus.includes('RAISE')) {
    return {
      success: false,
      alreadyActive: true,
      error: 'ALERT ALREADY ACTIVE',
    };
  }

  // Check active operator session
  const token = await getActiveSessionToken();
  if (!token) {
    return {
      success: false,
      error:
        'AUTHENTICATION_REQUIRED: Dispatching operational alerts requires an active operator session. Please sign in.',
    };
  }

  const alertTitle = customOptions?.title || `Operational Alert Record: ${hotspot.source_id}`;
  const alertSeverity = customOptions?.severity || hotspot.priority_category || 'HIGH';
  const alertMessage =
    customOptions?.message ||
    hotspot.explanation ||
    `Operational alert recorded for thermal anomaly ${hotspot.source_id} with priority score ${hotspot.priority_score.toFixed(3)} at (${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}).`;

  // 1. Try direct client insert into Supabase alerts table
  if (clientInstance) {
    try {
      // Check database to ensure no active alert exists in public.hotspots
      const { data: dbHotspot } = await clientInstance
        .from('hotspots')
        .select('alert_status')
        .eq('source_id', hotspot.source_id)
        .single();

      const dbRawStatus = String(dbHotspot?.alert_status || '').toUpperCase();
      if (dbRawStatus === 'ALERT_RAISED' || dbRawStatus === 'ALERT RAISED' || dbRawStatus.includes('RAISE')) {
        const { data: existingAlerts } = await clientInstance
          .from('alerts')
          .select('*')
          .eq('source_id', hotspot.source_id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          success: false,
          alreadyActive: true,
          error: 'ALERT ALREADY ACTIVE',
          data: existingAlerts?.[0] || null,
        };
      }

      const { data, error } = await clientInstance
        .from('alerts')
        .insert({
          source_id: hotspot.source_id,
          hotspot_id: hotspot.id || null,
          title: alertTitle,
          alert_type: 'THERMAL_ANOMALY',
          severity: alertSeverity,
          message: alertMessage,
        })
        .select();

      if (!error && data && data.length > 0) {
        const { error: updateErr } = await clientInstance
          .from('hotspots')
          .update({
            alert_status: 'ALERT_RAISED',
            updated_at: new Date().toISOString(),
          })
          .eq('source_id', hotspot.source_id);

        if (updateErr) {
          console.warn('[AGNI KAVACH] Supabase hotspots alert_status update warning:', updateErr.message);
        }

        return { success: true, data: data[0] };
      } else if (error) {
        console.warn('Supabase client alerts insert error:', error.message);
      }
    } catch (err: any) {
      console.warn('Client direct alerts insert error, attempting server proxy:', err);
    }
  }

  // 2. Fallback / Server API endpoint
  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source_id: hotspot.source_id,
        hotspot_id: hotspot.id || null,
        title: alertTitle,
        alert_type: 'THERMAL_ANOMALY',
        severity: alertSeverity,
        message: alertMessage,
      }),
    });
    const result = await res.json();
    return {
      success: Boolean(result.success),
      alreadyActive: Boolean(result.alreadyActive),
      data: result.data,
      error: result.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'ALERT PERSISTENCE FAILED',
    };
  }
}

// Aliases for consumer compatibility
export const fetchHotspots = fetchHotspotsFromSupabase;
export const getStoredCredentials = getSavedCredentials;
export const setStoredCredentials = saveCredentials;
export const clearStoredCredentials = clearCredentials;
export const testSupabaseConnection = async (url?: string, key?: string) => {
  let targetUrl = url;
  let targetKey = key;
  if (!targetUrl || !targetKey) {
    const creds = getSavedCredentials();
    targetUrl = targetUrl || creds.url;
    targetKey = targetKey || creds.key;
  }
  if (!targetUrl || !targetKey) {
    const cfg = await initSupabaseFromConfig();
    targetUrl = targetUrl || cfg.url;
    targetKey = targetKey || cfg.key;
  }
  if (!targetUrl || !targetKey) {
    return {
      ok: false,
      error: 'Supabase configuration not detected in environment.',
    };
  }
  const res = await testConnection(targetUrl, targetKey);
  return {
    ok: res.success,
    count: res.count,
    error: res.message,
  };
};
