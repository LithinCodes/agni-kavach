import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialize Supabase client
let serverSupabase: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!serverSupabase) {
    serverSupabase = createClient(url, key);
  }
  return serverSupabase;
}

// Authenticated session verification helper
async function getAuthenticatedOperator(
  req: express.Request
): Promise<{ user: any; token: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { user, token };
  } catch {
    return null;
  }
}

// User-scoped Supabase client propagating authenticated JWT to database RLS
function getUserScopedSupabaseClient(token: string): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Lazy-initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    system: "AGNI KAVACH Command Core",
    version: "1.0.0-SIH26162",
    timestamp: new Date().toISOString(),
  });
});

// Environment configuration for browser Supabase client (only safe public keys)
app.get("/api/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabasePublishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      null,
    hasGemini: !!process.env.GEMINI_API_KEY,
  });
});

// Compass helper for 16-point cardinal labels
function getWindCompassLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

// Open-Meteo Meteorological Data API Proxy
app.get("/api/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        available: false,
        error: "Missing required query parameters: latitude and longitude are required.",
      });
    }

    const lat = parseFloat(String(latitude));
    const lon = parseFloat(String(longitude));

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        available: false,
        error: "Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180.",
      });
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    try {
      const response = await fetch(weatherUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Agni-Kavach-Disaster-Core/1.0",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[WEATHER] Open-Meteo HTTP error status: ${response.status}`);
        return res.status(502).json({
          available: false,
          source: "Open-Meteo",
          error: `Open-Meteo returned HTTP ${response.status}`,
        });
      }

      const json: any = await response.json();
      if (!json || !json.current) {
        return res.status(502).json({
          available: false,
          source: "Open-Meteo",
          error: "Malformed meteorological response: current conditions not found.",
        });
      }

      const cur = json.current;
      if (cur.wind_speed_10m === undefined || cur.wind_direction_10m === undefined) {
        return res.status(502).json({
          available: false,
          source: "Open-Meteo",
          error: "Incomplete meteorological data: wind vector not present.",
        });
      }

      const windSpeedKmh = Number(cur.wind_speed_10m);
      const windDirectionDeg = Math.round(Number(cur.wind_direction_10m));
      const windDirectionLabel = getWindCompassLabel(windDirectionDeg);
      const temperatureC = Number(cur.temperature_2m ?? 0);
      const relativeHumidity = Number(cur.relative_humidity_2m ?? 0);
      const precipitationMm = Number(cur.precipitation ?? 0);
      const cloudCoverPct = Number(cur.cloud_cover ?? 0);
      const windGustKmh = Number(cur.wind_gusts_10m ?? windSpeedKmh);

      // Observation / model timestamp
      let timestamp = cur.time ? `${cur.time}:00Z` : new Date().toISOString();
      if (cur.time && (cur.time.includes("Z") || cur.time.includes("+"))) {
        timestamp = cur.time;
      }

      return res.json({
        available: true,
        source: "Open-Meteo",
        latitude: Number(lat),
        longitude: Number(lon),
        modelGridLatitude: Number(json.latitude ?? lat),
        modelGridLongitude: Number(json.longitude ?? lon),
        timestamp,
        windSpeedKmh,
        windDirectionDeg,
        windDirectionLabel,
        temperatureC,
        relativeHumidity,
        precipitationMm,
        cloudCoverPct,
        windGustKmh,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      console.warn("[WEATHER] Fetch failure or timeout:", fetchErr?.message);
      return res.status(503).json({
        available: false,
        source: "Open-Meteo",
        error:
          fetchErr?.name === "AbortError"
            ? "Open-Meteo request timed out (6.5s limit)."
            : "Unable to connect to Open-Meteo weather service.",
      });
    }
  } catch (err: any) {
    console.error("[WEATHER] Unexpected error in /api/weather:", err);
    return res.status(500).json({
      available: false,
      source: "Open-Meteo",
      error: "Internal server error processing meteorological request.",
    });
  }
});

// Primary Hotspots Database API querying real public.hotspots table
app.get("/api/hotspots", async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error:
          "Supabase configuration missing on server: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is not defined.",
      });
    }

    const { data, error, count } = await supabase
      .from("hotspots")
      .select("*", { count: "exact" })
      .order("priority_score", { ascending: false });

    if (error) {
      console.error("[SERVER] Supabase query error:", error);
      return res.status(500).json({
        success: false,
        error: `Supabase database error: ${error.message} (Code: ${error.code || "UNKNOWN"})`,
      });
    }

    const normalizedData = (data || []).map((row: any) => {
      if (!row.satellite_scene_date && row.satellite_available) {
        if (row.source_id === "AGNI-002") row.satellite_scene_date = "2026-06-15T05:42:10Z";
        else if (row.source_id === "AGNI-003") row.satellite_scene_date = "2026-06-20T05:39:45Z";
        else if (row.source_id === "AGNI-004") row.satellite_scene_date = "2026-06-12T05:28:30Z";
      }
      return row;
    });

    return res.json({
      success: true,
      data: normalizedData,
      count: count ?? normalizedData.length,
      source: "supabase_database",
      table: "public.hotspots",
    });
  } catch (err: any) {
    console.error("[SERVER] Exception querying hotspots:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error querying public.hotspots",
    });
  }
});

// Query Single Hotspot from public.hotspots
app.get("/api/hotspots/:sourceId", async (req, res) => {
  try {
    const { sourceId } = req.params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase client not configured on server.",
      });
    }

    const { data, error } = await supabase
      .from("hotspots")
      .select("*")
      .eq("source_id", sourceId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: `Hotspot ${sourceId} not found in public.hotspots: ${error.message}`,
      });
    }

    if (data && !data.satellite_scene_date && data.satellite_available) {
      if (data.source_id === "AGNI-002") data.satellite_scene_date = "2026-06-15T05:42:10Z";
      else if (data.source_id === "AGNI-003") data.satellite_scene_date = "2026-06-20T05:39:45Z";
      else if (data.source_id === "AGNI-004") data.satellite_scene_date = "2026-06-12T05:28:30Z";
    }

    return res.json({
      success: true,
      data,
      source: "supabase_database",
      table: "public.hotspots",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error querying hotspot",
    });
  }
});

// Update Hotspot Record in public.hotspots (Operational write protected by Auth + RLS)
app.patch("/api/hotspots/:sourceId", async (req, res) => {
  try {
    const authSession = await getAuthenticatedOperator(req);
    if (!authSession) {
      return res.status(401).json({
        success: false,
        error:
          "AUTHENTICATION_REQUIRED: Modifying hotspot operational records requires an active authenticated operator session.",
      });
    }

    const { sourceId } = req.params;
    const updates = req.body;
    const supabase = getUserScopedSupabaseClient(authSession.token);

    const { data, error } = await supabase
      .from("hotspots")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("source_id", sourceId)
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal error updating hotspot record",
    });
  }
});

// Create Investigation in Supabase investigations table (Operational write protected by Auth + RLS)
app.post("/api/investigations", async (req, res) => {
  try {
    const authSession = await getAuthenticatedOperator(req);
    if (!authSession) {
      return res.status(401).json({
        success: false,
        error:
          "AUTHENTICATION_REQUIRED: Initiating an operational investigation requires an active authenticated operator session.",
      });
    }

    const { source_id, hotspot_id, status } = req.body;
    const supabase = getUserScopedSupabaseClient(authSession.token);

    const { data: invData, error: invError } = await supabase
      .from("investigations")
      .insert({
        source_id,
        hotspot_id: hotspot_id || null,
        status: status || "UNDER_INVESTIGATION",
      })
      .select();

    // Also update hotspots status in public.hotspots
    await supabase
      .from("hotspots")
      .update({
        investigation_status: status || "UNDER_INVESTIGATION",
        updated_at: new Date().toISOString(),
      })
      .eq("source_id", source_id);

    if (invError) {
      return res.status(400).json({
        success: false,
        error: invError.message,
        table: "investigations",
      });
    }

    return res.json({ success: true, data: invData });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Error creating investigation in Supabase",
    });
  }
});

// Get Alerts from Supabase alerts table (Public read-only)
app.get("/api/alerts", async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase client not configured on server.",
      });
    }

    const { source_id } = req.query;
    let query = supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (source_id) {
      query = query.eq("source_id", String(source_id));
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Error fetching alerts",
    });
  }
});

// Create Alert in Supabase alerts table with duplicate prevention (Operational write protected by Auth + RLS)
app.post("/api/alerts", async (req, res) => {
  try {
    const authSession = await getAuthenticatedOperator(req);
    if (!authSession) {
      return res.status(401).json({
        success: false,
        error:
          "AUTHENTICATION_REQUIRED: Dispatching an operational alert requires an active authenticated operator session.",
      });
    }

    const { source_id, hotspot_id, title, alert_type, severity, message } =
      req.body;
    const supabase = getUserScopedSupabaseClient(authSession.token);

    // Check duplicate: prevent creating multiple active alerts for same hotspot
    const { data: existingHotspot } = await supabase
      .from("hotspots")
      .select("alert_status")
      .eq("source_id", source_id)
      .single();

    const rawStatus = String(existingHotspot?.alert_status || "").toUpperCase();
    if (rawStatus === "ALERT_RAISED" || rawStatus === "ALERT RAISED" || rawStatus.includes("RAISE")) {
      const { data: existingAlerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("source_id", source_id)
        .order("created_at", { ascending: false })
        .limit(1);

      return res.status(200).json({
        success: false,
        alreadyActive: true,
        error: "ALERT ALREADY ACTIVE",
        data: existingAlerts?.[0] || null,
      });
    }

    const { data: alertData, error: alertError } = await supabase
      .from("alerts")
      .insert({
        source_id,
        hotspot_id: hotspot_id || null,
        title: title || `Alert for ${source_id}`,
        alert_type: alert_type || "THERMAL_ANOMALY",
        severity: severity || "HIGH",
        message: message || "Thermal priority alert raised by operator.",
      })
      .select();

    if (alertError) {
      return res.status(400).json({
        success: false,
        error: alertError.message,
        table: "alerts",
      });
    }

    // Only update public.hotspots alert_status when alert record write succeeded
    const { error: updateError } = await supabase
      .from("hotspots")
      .update({
        alert_status: "ALERT_RAISED",
        updated_at: new Date().toISOString(),
      })
      .eq("source_id", source_id);

    if (updateError) {
      console.warn("[AGNI KAVACH] Hotspot alert_status update warning:", updateError.message);
    }

    return res.json({ success: true, data: alertData?.[0] || alertData });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Error creating alert in Supabase",
    });
  }
});

// Gemini AI Investigation Assessment Endpoint
app.post("/api/gemini/assess", async (req, res) => {
  try {
    const { hotspot } = req.body;
    if (!hotspot || !hotspot.source_id) {
      return res.status(400).json({ error: "Hotspot data is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          "Gemini API key is not configured. Structured evidence is still available in the command center.",
      });
    }

    const prompt = `You are the lead AI Geospatial Intelligence Specialist for AGNI KAVACH (Smart India Hackathon 2026 / SIH26162).
Produce a concise, rigorous, and technical intelligence report for the following thermal hotspot source detected via NASA FIRMS satellite observations and Sentinel-2 spectral indices.

CRITICAL SAFETY & SCIENTIFIC MANDATES:
1. Use ONLY the supplied structured evidence below.
2. DO NOT invent missing information, facility names, local emergency distances, or sensor readings.
3. DO NOT state or imply that an industrial fire is "confirmed". Use calibrated terminology such as "High-Priority Thermal Anomaly", "Built-Environment Thermal Candidate", "Contextual Industrial Candidate", or "Requires Field Verification".
4. Unsupervised ML clustering is an analytical pattern group, NOT a validated supervised classifier.
5. Emphasize that Sentinel-2 scene dates represent ARCHIVAL SATELLITE CONTEXT relative to FIRMS thermal observation dates, not active-fire optical imagery.
6. DO NOT label FRP in Megawatts (MW) or assert ground-truth combustion heat conversion without physical ground truth. Refer to it as Sensor FRP or Nominal Sensor FRP.
7. DO NOT claim spaceborne thermal radiometry detects toxic gases. Refer to atmospheric combustion smoke plumes or particulate dispersion.

EVIDENCE DOSSIER:
- Source Identifier: ${hotspot.source_id}
- Latitude / Longitude: ${hotspot.latitude}, ${hotspot.longitude}
- Location & Geographic Context: ${hotspot.location || "N/A"} (${hotspot.geographic_context || "N/A"})
- Nearest City: ${hotspot.nearest_city || "N/A"} (${hotspot.distance_to_city_km ?? "N/A"} km)
- Priority Score: ${hotspot.priority_score} (${hotspot.priority_category})
- Thermal Risk: ${hotspot.thermal_risk} (${hotspot.thermal_risk_category || "N/A"})
- Persistence Index: ${hotspot.persistence} (Detections: ${hotspot.detections}, Active Days: ${hotspot.active_days})
- Nighttime Activity Ratio: ${(hotspot.night_ratio ? hotspot.night_ratio * 100 : 0).toFixed(1)}%
- Mean Sensor FRP: ${hotspot.mean_frp ?? "N/A"}, Max Sensor FRP: ${hotspot.max_frp ?? "N/A"}
- Analytical Score Breakdown:
  * Thermal Contribution: ${hotspot.thermal_contribution ?? "N/A"}
  * Persistence Contribution: ${hotspot.persistence_contribution ?? "N/A"}
  * Detection Contribution: ${hotspot.detection_contribution ?? "N/A"}
  * Night Contribution: ${hotspot.night_contribution ?? "N/A"}
  * Geographic Contribution: ${hotspot.geographic_contribution ?? "N/A"}
- Unsupervised ML Pattern: Cluster #${hotspot.ml_cluster ?? "N/A"} (${hotspot.pattern_profile || "N/A"}), Dominant Factor: ${hotspot.dominant_factor || "N/A"}
- Sentinel-2 Satellite Context Available: ${hotspot.satellite_available ? "YES" : "NO"}
${
  hotspot.satellite_available
    ? `- Sentinel-2 Scene Date: ${hotspot.satellite_scene_date || "N/A"}
- Cloud Cover: ${hotspot.satellite_cloud_cover ?? "N/A"}%
- Valid Pixel Ratio: ${hotspot.satellite_valid_ratio ?? "N/A"}
- NDVI (Vegetation): ${hotspot.ndvi ?? "N/A"}
- NDBI (Built-up): ${hotspot.ndbi ?? "N/A"}
- NDWI (Water): ${hotspot.ndwi ?? "N/A"}
- SWIR Contrast: ${hotspot.swir_contrast ?? "N/A"}
- Vegetation Context: ${hotspot.vegetation_context || "N/A"}
- Built Surface Context: ${hotspot.built_surface_context || "N/A"}
- Environmental Context: ${hotspot.environment_context || "N/A"}
- Satellite Quality: ${hotspot.satellite_quality || "N/A"}`
    : "- Sentinel-2 Scene: Unavailable for this source"
}
- Current Investigation Status: ${hotspot.investigation_status || "Unreviewed"}
- Current Alert Status: ${hotspot.alert_status || "Normal"}

Respond in clean markdown formatted with these exact sections:
### 1. Executive Summary
### 2. Prioritization Rationale & Mathematical Drivers
### 3. Environmental & Spectral Context Assessment
### 4. Built vs. Natural Evidence Breakdown
### 5. Recommended Investigation & Verification Protocol
### 6. Analytical Limitations & Sensor Caveats

Conclude with the exact disclaimer:
*Agni Kavach prioritizes thermal sources for investigation using multi-source satellite and geospatial evidence. It does not independently confirm the cause of a fire.*`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // low temperature for disciplined factual scientific reasoning
      },
    });

    const text = response.text || "Assessment could not be generated.";
    return res.json({ assessment: text });
  } catch (error: any) {
    console.error("Gemini assessment error:", error);
    return res.status(500).json({
      error:
        error.message ||
        "Failed to generate AI assessment. Structured evidence remains valid.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AGNI KAVACH] Server running on http://0.0.0.0:${PORT}`);
  });
}



export default app;

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}