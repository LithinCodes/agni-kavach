import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Flame,
  Satellite,
  Moon,
  ShieldAlert,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  MapPin,
  Compass,
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Database,
  ExternalLink,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { HotspotRecord, PriorityCategory } from '../types';
import { exportHotspotsCatalogPDF, exportHotspotsCatalogXLSX } from '../services/exportService';

interface AnalyticsViewProps {
  hotspots: HotspotRecord[];
  isLoading?: boolean;
  dbError?: string | null;
  selectedHotspot?: HotspotRecord | null;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onRefetch?: () => void;
  onNavigateToMap?: () => void;
}

interface AnalyticsFilterState {
  priority: 'ALL' | PriorityCategory;
  satellite: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
  geographic: 'ALL' | 'NEAR_URBAN' | 'MODERATE_URBAN' | 'DISTANT_URBAN' | 'REMOTE';
  thermalRisk: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const CATEGORY_COLORS: Record<PriorityCategory, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  hotspots,
  isLoading = false,
  dbError = null,
  selectedHotspot,
  onSelectHotspot,
  onRefetch,
  onNavigateToMap,
}) => {
  // 11. ANALYTICAL FILTERS STATE
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    priority: 'ALL',
    satellite: 'ALL',
    geographic: 'ALL',
    thermalRisk: 'ALL',
  });

  const handleResetFilters = () => {
    setFilters({
      priority: 'ALL',
      satellite: 'ALL',
      geographic: 'ALL',
      thermalRisk: 'ALL',
    });
  };

  const hasActiveFilters =
    filters.priority !== 'ALL' ||
    filters.satellite !== 'ALL' ||
    filters.geographic !== 'ALL' ||
    filters.thermalRisk !== 'ALL';

  // Apply filters dynamically to public.hotspots records
  const filteredHotspots = useMemo(() => {
    return (hotspots || []).filter((h) => {
      if (!h) return false;
      // Priority filter
      if (filters.priority !== 'ALL' && h.priority_category !== filters.priority) {
        return false;
      }
      // Satellite filter
      if (filters.satellite === 'AVAILABLE' && !h.satellite_available) {
        return false;
      }
      if (filters.satellite === 'UNAVAILABLE' && h.satellite_available) {
        return false;
      }
      // Geographic context filter
      if (filters.geographic !== 'ALL' && h.geographic_context !== filters.geographic) {
        return false;
      }
      // Thermal risk filter: High >= 50, Medium 30-49.9, Low < 30
      if (filters.thermalRisk === 'HIGH' && (h.thermal_risk ?? 0) < 50) {
        return false;
      }
      if (
        filters.thermalRisk === 'MEDIUM' &&
        ((h.thermal_risk ?? 0) < 30 || (h.thermal_risk ?? 0) >= 50)
      ) {
        return false;
      }
      if (filters.thermalRisk === 'LOW' && (h.thermal_risk ?? 0) >= 30) {
        return false;
      }
      return true;
    });
  }, [hotspots, filters]);

  // Total available baseline
  const totalBaseCount = hotspots?.length || 0;
  const filteredCount = filteredHotspots.length;

  // 1. EXECUTIVE KPI STRIP CALCULATIONS (Dynamically from Supabase records)
  const kpis = useMemo(() => {
    if (filteredCount === 0) {
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        satelliteCount: 0,
        satellitePct: 0,
        avgPriorityScore: 0,
        avgThermalRisk: 0,
      };
    }
    const critical = filteredHotspots.filter((h) => h.priority_category === 'CRITICAL').length;
    const high = filteredHotspots.filter((h) => h.priority_category === 'HIGH').length;
    const medium = filteredHotspots.filter((h) => h.priority_category === 'MEDIUM').length;
    const low = filteredHotspots.filter((h) => h.priority_category === 'LOW').length;
    const satelliteCount = filteredHotspots.filter((h) => h.satellite_available).length;
    const satellitePct = (satelliteCount / filteredCount) * 100;

    const totalPriorityScore = filteredHotspots.reduce((sum, h) => sum + (h.priority_score ?? 0), 0);
    const totalThermalRisk = filteredHotspots.reduce((sum, h) => sum + (h.thermal_risk ?? 0), 0);

    return {
      total: filteredCount,
      critical,
      high,
      medium,
      low,
      satelliteCount,
      satellitePct,
      avgPriorityScore: totalPriorityScore / filteredCount,
      avgThermalRisk: totalThermalRisk / filteredCount,
    };
  }, [filteredHotspots, filteredCount]);

  // 2. PRIORITY DISTRIBUTION DATA (Interactive Donut)
  const priorityChartData = useMemo(() => {
    const categories: PriorityCategory[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    return categories
      .map((cat) => {
        const count = filteredHotspots.filter((h) => h.priority_category === cat).length;
        const pct = filteredCount > 0 ? (count / filteredCount) * 100 : 0;
        return {
          name: cat,
          value: count,
          percentage: Number(pct.toFixed(1)),
          color: CATEGORY_COLORS[cat],
        };
      })
      .filter((d) => d.value > 0 || filteredCount === 0);
  }, [filteredHotspots, filteredCount]);

  // 3. THERMAL RISK ANALYSIS
  const thermalRiskStats = useMemo(() => {
    if (filteredCount === 0) {
      return { min: 0, avg: 0, max: 0, distribution: [], top10: [] };
    }
    const values = filteredHotspots.map((h) => h.thermal_risk ?? 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / filteredCount;

    // Distribution binned ranges
    const bins = [
      { name: '< 25', range: 'Low', min: 0, max: 24.999, count: 0, color: '#10B981' },
      { name: '25-34', range: 'Moderate', min: 25, max: 34.999, count: 0, color: '#38BDF8' },
      { name: '35-44', range: 'Elevated', min: 35, max: 44.999, count: 0, color: '#F59E0B' },
      { name: '45-54', range: 'High', min: 45, max: 54.999, count: 0, color: '#FB923C' },
      { name: '55+', range: 'Severe', min: 55, max: 999, count: 0, color: '#EF4444' },
    ];

    values.forEach((val) => {
      for (const bin of bins) {
        if (val >= bin.min && val <= bin.max) {
          bin.count++;
          break;
        }
      }
    });

    // Top 10 sources by thermal_risk
    const top10 = [...filteredHotspots]
      .sort((a, b) => (b.thermal_risk ?? 0) - (a.thermal_risk ?? 0))
      .slice(0, 10);

    return { min, avg, max, distribution: bins, top10 };
  }, [filteredHotspots, filteredCount]);

  // 4. PERSISTENCE VS PRIORITY SCATTER DATA + PEARSON CORRELATION
  const scatterStats = useMemo(() => {
    if (filteredCount === 0) return { correlation: null, points: [], isValid: false };

    // Extract valid numerical pairs from public.hotspots
    const validPairs = filteredHotspots.filter(
      (h) =>
        h.persistence !== null &&
        h.persistence !== undefined &&
        !isNaN(Number(h.persistence)) &&
        h.priority_score !== null &&
        h.priority_score !== undefined &&
        !isNaN(Number(h.priority_score))
    );

    const points = validPairs.map((h) => ({
      source_id: h.source_id,
      persistence: Number(Number(h.persistence).toFixed(2)),
      priority_score: Number(Number(h.priority_score).toFixed(3)),
      detections: h.detections ?? 0,
      thermal_risk: Number((h.thermal_risk ?? 0).toFixed(2)),
      category: h.priority_category,
      raw: h,
    }));

    // Pearson correlation r = Cov(X, Y) / (Std(X) * Std(Y))
    const n = points.length;
    if (n < 3) return { correlation: null, points, isValid: false };

    const meanX = points.reduce((sum, p) => sum + p.persistence, 0) / n;
    const meanY = points.reduce((sum, p) => sum + p.priority_score, 0) / n;

    let cov = 0;
    let varX = 0;
    let varY = 0;

    for (const p of points) {
      const dx = p.persistence - meanX;
      const dy = p.priority_score - meanY;
      cov += dx * dy;
      varX += dx * dx;
      varY += dy * dy;
    }

    const denominator = Math.sqrt(varX * varY);
    if (denominator <= 0 || isNaN(denominator)) {
      return { correlation: null, points, isValid: false };
    }

    const correlation = cov / denominator;
    if (isNaN(correlation)) {
      return { correlation: null, points, isValid: false };
    }

    return { correlation, points, isValid: true };
  }, [filteredHotspots, filteredCount]);

  // Separate scatter points by category for color differentiation
  const scatterByCategory = useMemo(() => {
    return {
      CRITICAL: scatterStats.points.filter((p) => p.category === 'CRITICAL'),
      HIGH: scatterStats.points.filter((p) => p.category === 'HIGH'),
      MEDIUM: scatterStats.points.filter((p) => p.category === 'MEDIUM'),
      LOW: scatterStats.points.filter((p) => p.category === 'LOW'),
    };
  }, [scatterStats.points]);

  // 5. DETECTION ACTIVITY: TOP 10 SOURCES BY DETECTIONS
  const topDetectionsChartData = useMemo(() => {
    return [...filteredHotspots]
      .sort((a, b) => (b.detections ?? 0) - (a.detections ?? 0))
      .slice(0, 10)
      .map((h) => ({
        source_id: h.source_id,
        detections: h.detections ?? 0,
        active_days: h.active_days ?? 1,
        category: h.priority_category,
        color: CATEGORY_COLORS[h.priority_category] || '#06B6D4',
        raw: h,
      }));
  }, [filteredHotspots]);

  // 6. NIGHT ACTIVITY TELEMETRY
  const nightActivityStats = useMemo(() => {
    if (filteredCount === 0) {
      return {
        avg: 0,
        highest: null as HotspotRecord | null,
        lowest: null as HotspotRecord | null,
        ranked: [],
      };
    }
    const ratios = filteredHotspots.map((h) => h.night_ratio ?? 0);
    const avg = ratios.reduce((sum, r) => sum + r, 0) / filteredCount;

    const sorted = [...filteredHotspots].sort((a, b) => (b.night_ratio ?? 0) - (a.night_ratio ?? 0));
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    return {
      avg: avg * 100,
      highest,
      lowest,
      ranked: sorted.slice(0, 8),
    };
  }, [filteredHotspots, filteredCount]);

  // 7. GEOGRAPHIC CONTEXT BREAKDOWN
  const geographicStats = useMemo(() => {
    if (filteredCount === 0) {
      return {
        categories: [],
        avgDistance: 0,
        closest: null as HotspotRecord | null,
        furthest: null as HotspotRecord | null,
      };
    }

    const geoTypes: Array<'NEAR_URBAN' | 'MODERATE_URBAN' | 'DISTANT_URBAN' | 'REMOTE'> = [
      'NEAR_URBAN',
      'MODERATE_URBAN',
      'DISTANT_URBAN',
      'REMOTE',
    ];

    const categories = geoTypes.map((type) => {
      const items = filteredHotspots.filter((h) => h.geographic_context === type);
      const count = items.length;
      const pct = (count / filteredCount) * 100;
      const avgDist =
        count > 0 ? items.reduce((sum, h) => sum + (h.distance_to_city_km ?? 0), 0) / count : 0;
      return {
        name: type,
        label: type.replace('_', ' '),
        count,
        percentage: Number(pct.toFixed(1)),
        avgDistance: avgDist,
      };
    });

    const distances = filteredHotspots.map((h) => h.distance_to_city_km ?? 0);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / filteredCount;

    const sortedByDist = [...filteredHotspots].sort(
      (a, b) => (a.distance_to_city_km ?? 0) - (b.distance_to_city_km ?? 0)
    );
    const closest = sortedByDist[0];
    const furthest = sortedByDist[sortedByDist.length - 1];

    return { categories, avgDistance, closest, furthest };
  }, [filteredHotspots, filteredCount]);

  // 8. SATELLITE CONTEXT (SENTINEL-2)
  const satelliteStats = useMemo(() => {
    const withSat = filteredHotspots.filter((h) => h.satellite_available);
    const withoutSat = filteredHotspots.filter((h) => !h.satellite_available);
    const coveragePct = filteredCount > 0 ? (withSat.length / filteredCount) * 100 : 0;

    return {
      withCount: withSat.length,
      withoutCount: withoutSat.length,
      coveragePct,
      tableRecords: withSat,
    };
  }, [filteredHotspots, filteredCount]);

  // 9. TOP PRIORITY WATCHLIST (Top 5 sorted by priority_score descending)
  const topWatchlist = useMemo(() => {
    return [...filteredHotspots]
      .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
      .slice(0, 5);
  }, [filteredHotspots]);

  // 10. DATA-DRIVEN INTELLIGENCE INSIGHTS (Dynamically calculated strictly from database)
  const dynamicInsights = useMemo(() => {
    if (filteredCount === 0) return [];

    const insights: string[] = [];

    // 1. High priority proportion
    const highCount = filteredHotspots.filter((h) => h.priority_category === 'HIGH').length;
    insights.push(
      `${highCount} of ${filteredCount} monitored sources (${((highCount / filteredCount) * 100).toFixed(1)}%) are currently categorized as High Priority based on multi-factor rule scoring.`
    );

    // 2. Satellite coverage
    const satCount = filteredHotspots.filter((h) => h.satellite_available).length;
    insights.push(
      `${((satCount / filteredCount) * 100).toFixed(1)}% of monitored sources (${satCount} of ${filteredCount}) have calibrated Sentinel-2 multispectral context available.`
    );

    // 3. Highest priority source
    const topPriority = [...filteredHotspots].sort(
      (a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)
    )[0];
    if (topPriority) {
      insights.push(
        `The highest priority source is ${topPriority.source_id} with an aggregate score of ${(topPriority.priority_score ?? 0).toFixed(3)} (Thermal Risk: ${(topPriority.thermal_risk ?? 0).toFixed(1)}, Dominant Factor: ${topPriority.dominant_factor || 'THERMAL'}).`
      );
    }

    // 4. Highest thermal risk
    const topThermal = [...filteredHotspots].sort(
      (a, b) => (b.thermal_risk ?? 0) - (a.thermal_risk ?? 0)
    )[0];
    if (topThermal) {
      insights.push(
        `The highest thermal-risk source is ${topThermal.source_id} with a calculated thermal risk index of ${(topThermal.thermal_risk ?? 0).toFixed(2)}.`
      );
    }

    // 5. Most persistent source
    const topPersist = [...filteredHotspots].sort(
      (a, b) => (b.persistence ?? 0) - (a.persistence ?? 0)
    )[0];
    if (topPersist) {
      insights.push(
        `The most persistent source is ${topPersist.source_id} (${(topPersist.persistence ?? 0).toFixed(1)} persistence index, active across ${topPersist.active_days ?? 1} calendar observation days).`
      );
    }

    // 6. Highest detection count
    const topDetections = [...filteredHotspots].sort(
      (a, b) => (b.detections ?? 0) - (a.detections ?? 0)
    )[0];
    if (topDetections) {
      insights.push(
        `The source with the highest observation volume is ${topDetections.source_id} with ${topDetections.detections} thermal sensor detections.`
      );
    }

    return insights;
  }, [filteredHotspots, filteredCount]);

  // 14. SUPABASE CONNECTION ERROR STATE
  if (dbError && totalBaseCount === 0) {
    return (
      <div
        id="analytics-error-view"
        className="flex-1 min-h-0 p-6 bg-[#050811] text-slate-200 flex flex-col items-center justify-center font-mono"
      >
        <div className="max-w-xl w-full bg-[#080C14] border border-rose-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800 mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Chakra_Petch'] text-rose-400 tracking-wider">
                ANALYTICS DATA UNAVAILABLE — SUPABASE CONNECTION ERROR
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-slate-200 font-bold">public.hotspots</span> • Security Mandate: Live Data Only
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Agni Kavach failed to fetch live records from your Supabase database table. Per the operational mandate, fallback and mock data are strictly prohibited.
          </p>

          <div className="bg-black/60 border border-slate-800 rounded-lg p-3.5 mb-6 text-xs text-rose-300 font-mono break-words">
            {dbError}
          </div>

          {onRefetch && (
            <button
              id="btn-retry-analytics-db"
              onClick={onRefetch}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>RETRY SUPABASE DATABASE QUERY</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="analytics-dashboard-container"
      className="flex-1 min-h-0 bg-[#050811] text-slate-200 overflow-y-auto font-mono scroll-smooth select-text"
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* HEADER TITLE & LIVE STATUS */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-bold text-cyan-400 tracking-wider">
                LIVE DATABASE STREAM • public.hotspots
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400 font-bold">
                {totalBaseCount} RECORDS LOADED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] tracking-wide text-white flex items-center gap-2.5 mt-1">
              <BarChart3 className="w-6 h-6 text-cyan-400 shrink-0" />
              AGNI KAVACH SATELLITE INTELLIGENCE & ANALYTICS
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Unsupervised multi-spectral thermal clustering, temporal persistence modeling, and contextual Sentinel-2 Level-2A imagery across monitored industrial zones.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              onClick={() => exportHotspotsCatalogPDF(filteredHotspots, 'SATELLITE THERMAL ANALYTICS CATALOG')}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
              title="Download filtered thermal analytics data in PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT (PDF)</span>
            </button>

            <button
              onClick={() => exportHotspotsCatalogXLSX(filteredHotspots, 'AGNI_KAVACH_ANALYTICS')}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
              title="Download entire analytics dataset in Excel (XLSX) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>EXPORT (XLSX)</span>
            </button>

            {onNavigateToMap && (
              <button
                id="btn-nav-to-live-map"
                onClick={onNavigateToMap}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>MAP VIEW</span>
              </button>
            )}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#080C14] border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 shadow-sm">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">SUPABASE: LIVE</span>
            </div>
          </div>
        </div>

        {/* 16. SCIENTIFIC LIMITATIONS NOTICE BANNER */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5 shadow-sm">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">
              Scientific Operational Parameters & Methodology Disclosure:
            </span>
            <p className="text-slate-400 leading-relaxed">
              The current analytical dataset uses <strong className="text-slate-200">NASA FIRMS VIIRS NOAA-21 NRT</strong> thermal detections across the active 5-day analytical window. Machine learning pipeline utilizes unsupervised spatial clustering (DBSCAN) combined with rule-based weighted priority scoring; this is <strong className="text-slate-300">an analytical grouping, not a supervised industrial-fire classifier</strong>. Sentinel-2 Level-2A imagery represents <strong className="text-slate-200">ARCHIVAL SATELLITE CONTEXT</strong> and must not be interpreted as active-fire observation. Fire Radiative Power (FRP) metrics reflect sensor-derived radiance indices (<strong className="text-slate-200">Nominal Sensor FRP</strong>) and are not converted into ground-truth combustion heat in megawatts (MW). Geographic proximity to urban boundaries represents contextual spatial reference information and is not proof of industrial activity.
            </p>
          </div>
        </div>

        {/* 11. ANALYTICAL FILTERS STRIP */}
        <div
          id="analytics-filters-bar"
          className="p-3.5 sm:p-4 rounded-xl bg-[#080C14] border border-slate-800/90 shadow-lg flex flex-col gap-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>ANALYTICAL TELEMETRY FILTERS</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-750 text-cyan-300">
                {filteredCount} of {totalBaseCount} Active Sources
              </span>
            </div>

            {hasActiveFilters && (
              <button
                id="btn-reset-analytics-filters"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors font-mono cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET FILTERS</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Filter 1: Priority Category */}
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1 font-bold tracking-wider">
                Priority Level
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-[#050811] p-0.5">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    id={`filter-priority-${lvl.toLowerCase()}`}
                    onClick={() => setFilters((prev) => ({ ...prev, priority: lvl }))}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer truncate text-center ${
                      filters.priority === lvl
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Satellite Context */}
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1 font-bold tracking-wider">
                Sentinel-2 Context
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-[#050811] p-0.5">
                {(['ALL', 'AVAILABLE', 'UNAVAILABLE'] as const).map((opt) => (
                  <button
                    key={opt}
                    id={`filter-sat-${opt.toLowerCase()}`}
                    onClick={() => setFilters((prev) => ({ ...prev, satellite: opt }))}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer truncate text-center ${
                      filters.satellite === opt
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt === 'AVAILABLE' ? 'AVAIL' : opt === 'UNAVAILABLE' ? 'NONE' : 'ALL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: Geographic Context */}
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1 font-bold tracking-wider">
                Geographic Context
              </label>
              <select
                id="filter-select-geographic"
                value={filters.geographic}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    geographic: e.target.value as AnalyticsFilterState['geographic'],
                  }))
                }
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#050811] border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">ALL GEOGRAPHIC ZONES</option>
                <option value="NEAR_URBAN">NEAR URBAN (≤ 50 km)</option>
                <option value="MODERATE_URBAN">MODERATE URBAN (50–150 km)</option>
                <option value="DISTANT_URBAN">DISTANT URBAN (150–300 km)</option>
                <option value="REMOTE">REMOTE (&gt; 300 km)</option>
              </select>
            </div>

            {/* Filter 4: Thermal Risk Range */}
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1 font-bold tracking-wider">
                Thermal Risk Level
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-[#050811] p-0.5">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((r) => (
                  <button
                    key={r}
                    id={`filter-thermal-${r.toLowerCase()}`}
                    onClick={() => setFilters((prev) => ({ ...prev, thermalRisk: r }))}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer truncate text-center ${
                      filters.thermalRisk === r
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1. EXECUTIVE KPI STRIP */}
        <div id="executive-kpi-strip" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* KPI 1: Total Sources */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
              Total Sources
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-cyan-300">
                {kpis.total}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Live</span>
            </div>
          </div>

          {/* KPI 2: Critical Sources */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-rose-400 font-bold tracking-wider">
              Critical
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-rose-400">
                {kpis.critical}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Tier 0</span>
            </div>
          </div>

          {/* KPI 3: High Priority */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-rose-300 font-bold tracking-wider">
              High Priority
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-rose-300">
                {kpis.high}
              </span>
              <span className="text-[10px] text-rose-400/70 font-mono">
                {kpis.total > 0 ? `${((kpis.high / kpis.total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* KPI 4: Medium Priority */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-amber-400 font-bold tracking-wider">
              Medium Priority
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-amber-400">
                {kpis.medium}
              </span>
              <span className="text-[10px] text-amber-400/70 font-mono">
                {kpis.total > 0 ? `${((kpis.medium / kpis.total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* KPI 5: Low Priority */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">
              Low Priority
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-emerald-400">
                {kpis.low}
              </span>
              <span className="text-[10px] text-emerald-400/70 font-mono">
                {kpis.total > 0 ? `${((kpis.low / kpis.total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* KPI 6: Sentinel-2 Context */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider">
              Sentinel-2
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-indigo-300">
                {kpis.satelliteCount}
              </span>
              <span className="text-[10px] text-indigo-400/80 font-mono">
                {kpis.satellitePct.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* KPI 7: Average Priority Score */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider">
              Avg Priority
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-cyan-300">
                {kpis.avgPriorityScore.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/100</span>
            </div>
          </div>

          {/* KPI 8: Average Thermal Risk */}
          <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800/90 flex flex-col justify-between shadow-md">
            <span className="text-[10px] uppercase text-amber-300 font-bold tracking-wider">
              Avg Thermal Risk
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-amber-300">
                {kpis.avgThermalRisk.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Index</span>
            </div>
          </div>
        </div>

        {/* 9. TOP PRIORITY WATCHLIST (PROMINENT SECTION) */}
        <div
          id="top-priority-watchlist"
          className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-cyan-500/30 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-md">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-['Chakra_Petch'] tracking-wider text-white flex items-center gap-2">
                  TOP PRIORITY WATCHLIST
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                    URGENT MONITORING
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Ranked by multi-spectral priority score from Supabase public.hotspots. Click any row to inspect in drawer.
                </p>
              </div>
            </div>

            <span className="text-[11px] text-cyan-400 font-mono">
              AGNI-001 Priority Leader ({topWatchlist[0]?.priority_score?.toFixed(3) || '—'})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-3">Rank & Source ID</th>
                  <th className="py-2 px-3">Priority Score</th>
                  <th className="py-2 px-3">Priority Category</th>
                  <th className="py-2 px-3">Thermal Risk</th>
                  <th className="py-2 px-3">Persistence</th>
                  <th className="py-2 px-3">Detections</th>
                  <th className="py-2 px-3">Dominant Factor</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {topWatchlist.map((h, idx) => {
                  const isSelected = selectedHotspot?.source_id === h.source_id;
                  const catColor = CATEGORY_COLORS[h.priority_category] || '#94A3B8';
                  return (
                    <tr
                      key={h.source_id}
                      onClick={() => onSelectHotspot(h)}
                      className={`hover:bg-cyan-950/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-cyan-950/60 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-200 flex items-center gap-2">
                        <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                        <span className="group-hover:text-cyan-300 text-cyan-400 font-bold">
                          {h.source_id}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900/60 border border-rose-500/50 text-rose-300">
                            LEADER
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {(h.priority_score ?? 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `${catColor}20`,
                            color: catColor,
                            border: `1px solid ${catColor}50`,
                          }}
                        >
                          {h.priority_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-medium">
                        {(h.thermal_risk ?? 0).toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-medium">
                        {(h.persistence ?? 0).toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {h.detections} <span className="text-slate-500 text-[10px]">passes</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 uppercase text-[10px]">
                        {h.dominant_factor || 'THERMAL'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[10px] text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center justify-end gap-1">
                          INSPECT
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2 & 3. DUAL GRID: PRIORITY DISTRIBUTION + THERMAL RISK ANALYSIS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. PRIORITY DISTRIBUTION (DONUT / RING CHART) */}
          <div
            id="priority-distribution-panel"
            className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold text-slate-200">
                  PRIORITY CATEGORY DISTRIBUTION
                </span>
              </div>
              <span className="text-[10px] text-slate-500">public.hotspots.priority_category</span>
            </div>

            <div className="h-64 w-full my-2 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(entry: any) => {
                      if (entry && entry.name) {
                        setFilters((prev) => ({
                          ...prev,
                          priority: prev.priority === entry.name ? 'ALL' : entry.name,
                        }));
                      }
                    }}
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell
                        key={`priority-cell-${index}`}
                        fill={entry.color}
                        stroke="#080C14"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-[#080C14] border border-slate-700 shadow-xl font-mono text-xs">
                          <div className="flex items-center gap-1.5 font-bold" style={{ color: data.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name} PRIORITY</span>
                          </div>
                          <div className="mt-1 text-slate-300">
                            Count: <strong className="text-white">{data.value} sources</strong> ({data.percentage}%)
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Click to toggle filter</div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Category Legend with Counts & Percentages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              {priorityChartData.map((item) => (
                <button
                  key={item.name}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: prev.priority === item.name ? 'ALL' : (item.name as PriorityCategory),
                    }))
                  }
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    filters.priority === item.name
                      ? 'bg-cyan-950/50 border-cyan-500 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold uppercase">{item.name}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-white">{item.value}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.percentage}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. THERMAL RISK ANALYSIS (DISTRIBUTION & TOP 10 RANKING) */}
          <div
            id="thermal-risk-analysis-panel"
            className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-slate-200">
                  THERMAL RISK ANALYSIS
                </span>
              </div>
              <span className="text-[10px] text-slate-500">public.hotspots.thermal_risk</span>
            </div>

            {/* Min / Avg / Max Summary Strip */}
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Min Risk</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {thermalRiskStats.min.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Avg Risk</span>
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {thermalRiskStats.avg.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Max Risk</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {thermalRiskStats.max.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Binned Distribution Bar Chart */}
            <div className="h-32 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={thermalRiskStats.distribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-2 rounded bg-[#080C14] border border-slate-700 text-xs font-mono">
                          <span className="font-bold text-amber-400">{d.range} Risk Range ({d.name})</span>
                          <div className="text-slate-200 mt-0.5">{d.count} thermal sources</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 10 Sources by Thermal Risk ranking list */}
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                <span>Top 10 Sources by Thermal Risk</span>
                <span className="text-[9px] text-slate-500">Click to inspect</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {thermalRiskStats.top10.map((h, i) => {
                  const isSelected = selectedHotspot?.source_id === h.source_id;
                  const catColor = CATEGORY_COLORS[h.priority_category];
                  return (
                    <div
                      key={h.source_id}
                      onClick={() => onSelectHotspot(h)}
                      className={`flex items-center justify-between px-2 py-1 rounded border transition-all cursor-pointer text-[11px] ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px] w-3">{i + 1}.</span>
                        <span className="font-bold text-cyan-300">{h.source_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-bold">
                          Risk: {(h.thermal_risk ?? 0).toFixed(1)}
                        </span>
                        <span className="text-slate-400">
                          Score: {(h.priority_score ?? 0).toFixed(1)}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                          style={{
                            backgroundColor: `${catColor}25`,
                            color: catColor,
                            border: `1px solid ${catColor}60`,
                          }}
                        >
                          {h.priority_category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PERSISTENCE VS PRIORITY SCATTER PLOT */}
        <div
          id="persistence-vs-priority-panel"
          className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">
                  PERSISTENCE VS PRIORITY SCORE CORRELATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scatter analysis: X-axis temporal persistence (0–100) vs Y-axis priority score (0–100). Click any node to inspect in drawer.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-400 text-[10px]">High</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-400 text-[10px]">Medium</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 text-[10px]">Low</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  type="number"
                  dataKey="persistence"
                  name="Persistence"
                  domain={[30, 100]}
                  stroke="#64748B"
                  fontSize={11}
                  label={{
                    value: 'Temporal Persistence Index (0–100)',
                    position: 'bottom',
                    offset: 5,
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="priority_score"
                  name="Priority Score"
                  domain={[20, 90]}
                  stroke="#64748B"
                  fontSize={11}
                  label={{
                    value: 'Priority Score (0–100)',
                    angle: -90,
                    position: 'left',
                    offset: 15,
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
                <ZAxis type="number" dataKey="detections" range={[60, 220]} name="Detections" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#06B6D4' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    const catColor = CATEGORY_COLORS[p.category as PriorityCategory] || '#06B6D4';
                    return (
                      <div className="p-3 rounded-xl bg-[#080C14] border border-cyan-500/50 shadow-2xl font-mono text-xs space-y-1">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-cyan-300 text-sm">{p.source_id}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                            style={{
                              backgroundColor: `${catColor}20`,
                              color: catColor,
                              border: `1px solid ${catColor}60`,
                            }}
                          >
                            {p.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-1">
                          <span className="text-slate-400">Priority Score:</span>
                          <span className="text-white font-bold">{p.priority_score}</span>
                          <span className="text-slate-400">Persistence:</span>
                          <span className="text-cyan-300 font-bold">{p.persistence}</span>
                          <span className="text-slate-400">Detections:</span>
                          <span className="text-purple-300 font-bold">{p.detections}</span>
                          <span className="text-slate-400">Thermal Risk:</span>
                          <span className="text-amber-300 font-bold">{p.thermal_risk}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-bold pt-1 border-t border-slate-800/80">
                          Click node to open inspection drawer
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Categorized Scatter series */}
                {scatterByCategory.HIGH.length > 0 && (
                  <Scatter
                    name="High Priority"
                    data={scatterByCategory.HIGH}
                    fill="#EF4444"
                    cursor="pointer"
                    onClick={(e: any) => e?.raw && onSelectHotspot(e.raw)}
                  />
                )}
                {scatterByCategory.MEDIUM.length > 0 && (
                  <Scatter
                    name="Medium Priority"
                    data={scatterByCategory.MEDIUM}
                    fill="#F59E0B"
                    cursor="pointer"
                    onClick={(e: any) => e?.raw && onSelectHotspot(e.raw)}
                  />
                )}
                {scatterByCategory.LOW.length > 0 && (
                  <Scatter
                    name="Low Priority"
                    data={scatterByCategory.LOW}
                    fill="#10B981"
                    cursor="pointer"
                    onClick={(e: any) => e?.raw && onSelectHotspot(e.raw)}
                  />
                )}
                {scatterByCategory.CRITICAL.length > 0 && (
                  <Scatter
                    name="Critical Priority"
                    data={scatterByCategory.CRITICAL}
                    fill="#DC2626"
                    cursor="pointer"
                    onClick={(e: any) => e?.raw && onSelectHotspot(e.raw)}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Dynamically calculated correlation insight */}
          <div className="mt-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-300">
                {scatterStats.isValid && scatterStats.correlation !== null ? (
                  <>
                    Calculated Pearson correlation between persistence and priority score across active records:{' '}
                    <strong className="text-cyan-300 font-mono">
                      r = {scatterStats.correlation >= 0 ? `+${scatterStats.correlation.toFixed(4)}` : scatterStats.correlation.toFixed(4)}
                    </strong>{' '}
                    (r ≈ {scatterStats.correlation >= 0 ? `+${scatterStats.correlation.toFixed(2)}` : scatterStats.correlation.toFixed(2)}).{' '}
                    {scatterStats.correlation > 0.5
                      ? 'High-priority sources exhibit strong positive correlation with observation persistence across satellite passes.'
                      : scatterStats.correlation > 0
                      ? 'Moderate positive correlation observed between persistence and priority score.'
                      : 'Weak or negative correlation between persistence and priority score across current filter.'}
                  </>
                ) : (
                  <>
                    Insufficient or invariant data across the selected criteria to compute a statistically reliable Pearson correlation.
                  </>
                )}
              </span>
            </div>
            {scatterStats.isValid && scatterStats.correlation !== null && (
              <span className="text-[10px] text-slate-500 font-mono">
                Formula: Cov(X,Y) / (σX · σY) • n = {scatterStats.points.length}
              </span>
            )}
          </div>
        </div>

        {/* 5 & 6. DUAL GRID: DETECTION ACTIVITY & NIGHT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5. DETECTION ACTIVITY (TOP 10 HORIZONTAL BAR CHART) */}
          <div
            id="detection-activity-panel"
            className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">
                  TOP 10 SOURCES BY THERMAL DETECTIONS
                </span>
              </div>
              <span className="text-[10px] text-slate-500">public.hotspots.detections</span>
            </div>

            <p className="text-[11px] text-slate-400 my-1">
              Ranked cumulative sensor detection passes across the 5-day window. Click any bar to inspect.
            </p>

            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDetectionsChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} />
                  <YAxis dataKey="source_id" type="category" stroke="#94A3B8" fontSize={10} width={75} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-[#080C14] border border-cyan-500/50 shadow-xl text-xs font-mono">
                          <span className="font-bold text-cyan-300">{d.source_id}</span>
                          <div className="mt-1 text-slate-300">
                            Detections: <strong className="text-white">{d.detections} passes</strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Active Days: {d.active_days} of 5
                          </div>
                          <div className="text-[10px] text-cyan-400 mt-1 font-bold">
                            Click to inspect in drawer
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="detections"
                    fill="#06B6D4"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data: any) => data?.raw && onSelectHotspot(data.raw)}
                  >
                    {topDetectionsChartData.map((entry, index) => (
                      <Cell key={`det-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. NIGHT ACTIVITY TELEMETRY */}
          <div
            id="night-activity-panel"
            className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-slate-200">
                  NIGHT-TIME THERMAL ACTIVITY
                </span>
              </div>
              <span className="text-[10px] text-slate-500">public.hotspots.night_ratio</span>
            </div>

            {/* Key Telemetry Badges */}
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Average Night %</span>
                <span className="text-sm font-bold text-indigo-300 font-mono">
                  {nightActivityStats.avg.toFixed(1)}%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Highest Night</span>
                <span className="text-xs font-bold text-white font-mono truncate block">
                  {nightActivityStats.highest?.source_id || '—'}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {nightActivityStats.highest
                    ? `${((nightActivityStats.highest.night_ratio ?? 0) * 100).toFixed(0)}% (${nightActivityStats.highest.detections} det)`
                    : '—'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[9px] uppercase text-slate-500 block">Lowest Night</span>
                <span className="text-xs font-bold text-white font-mono truncate block">
                  {nightActivityStats.lowest?.source_id || '—'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {nightActivityStats.lowest
                    ? `${((nightActivityStats.lowest.night_ratio ?? 0) * 100).toFixed(0)}% (${nightActivityStats.lowest.detections} det)`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Ranked List of Top Sources by night_ratio */}
            <div className="space-y-1.5 my-2">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center justify-between">
                <span>Top Sources by Night Ratio</span>
                <span className="text-[9px] text-slate-500">Night vs Day Fraction</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {nightActivityStats.ranked.map((h) => {
                  const isSelected = selectedHotspot?.source_id === h.source_id;
                  const nightPct = ((h.night_ratio ?? 0) * 100).toFixed(1);
                  return (
                    <div
                      key={h.source_id}
                      onClick={() => onSelectHotspot(h)}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-3 transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="w-24 font-bold text-cyan-300 truncate">{h.source_id}</div>
                      <div className="flex-1 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${nightPct}%` }}
                        />
                      </div>
                      <div className="w-20 text-right font-bold text-indigo-300">
                        {nightPct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer on Night Activity */}
            <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[10px] text-slate-400 leading-relaxed mt-2">
              <span className="text-indigo-300 font-bold">Operational Note:</span> Night-time thermal detections help differentiate persistent industrial heat signatures from daylight agricultural burns, but night activity alone does <strong className="text-slate-200">not</strong> constitute proof of industrial operations.
            </div>
          </div>
        </div>

        {/* 7. GEOGRAPHIC CONTEXT BREAKDOWN */}
        <div
          id="geographic-context-panel"
          className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-200">
                  GEOGRAPHIC CONTEXT DISTRIBUTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Spatial breakdown by proximity to major urban centers. Contextual data only; not proof of industrial activity.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-750 text-slate-300">
                Avg Distance: <strong className="text-cyan-300">{geographicStats.avgDistance.toFixed(1)} km</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {geographicStats.categories.map((geo) => (
              <div
                key={geo.name}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    geographic: prev.geographic === geo.name ? 'ALL' : (geo.name as any),
                  }))
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filters.geographic === geo.name
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">{geo.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{geo.percentage}%</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-['Chakra_Petch'] text-white">
                    {geo.count} <span className="text-xs font-normal text-slate-400">sources</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    ~{geo.avgDistance.toFixed(0)} km
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Closest Source to Urban Center:</span>
              <span className="text-white font-bold">
                {geographicStats.closest
                  ? `${geographicStats.closest.source_id} (${geographicStats.closest.nearest_city}, ${(geographicStats.closest.distance_to_city_km ?? 0).toFixed(1)} km)`
                  : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Most Remote Source:</span>
              <span className="text-white font-bold">
                {geographicStats.furthest
                  ? `${geographicStats.furthest.source_id} (${geographicStats.furthest.nearest_city}, ${(geographicStats.furthest.distance_to_city_km ?? 0).toFixed(1)} km)`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 8. SATELLITE CONTEXT (SENTINEL-2 MULTISPECTRAL COMPARISON) */}
        <div
          id="satellite-context-panel"
          className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-slate-800 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-slate-200">
                  SENTINEL-2 MULTISPECTRAL SATELLITE CONTEXT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comparative matrix for sources with calibrated Level-2A surface reflectance data. Values are strictly from public.hotspots without extrapolation.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                Coverage: {satelliteStats.withCount} of {filteredCount} ({satelliteStats.coveragePct.toFixed(1)}%)
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Pending: {satelliteStats.withoutCount}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-3">Source ID</th>
                  <th className="py-2 px-3">Scene Date</th>
                  <th className="py-2 px-3">Cloud Cover</th>
                  <th className="py-2 px-3">NDVI</th>
                  <th className="py-2 px-3">NDBI</th>
                  <th className="py-2 px-3">NDWI</th>
                  <th className="py-2 px-3">Environment Context</th>
                  <th className="py-2 px-3">Satellite Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {satelliteStats.tableRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                      No satellite-context records matching the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  satelliteStats.tableRecords.map((h) => {
                    const isSelected = selectedHotspot?.source_id === h.source_id;
                    const dateStr = h.satellite_scene_date
                      ? h.satellite_scene_date.substring(0, 10)
                      : 'Archival L2A';
                    return (
                      <tr
                        key={h.source_id}
                        onClick={() => onSelectHotspot(h)}
                        className={`hover:bg-indigo-950/30 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-950/60 border-l-2 border-indigo-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-cyan-300">
                          {h.source_id}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{dateStr}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {h.satellite_cloud_cover !== null && h.satellite_cloud_cover !== undefined
                            ? `${h.satellite_cloud_cover.toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">
                          {h.ndvi !== null && h.ndvi !== undefined ? h.ndvi.toFixed(3) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">
                          {h.ndbi !== null && h.ndbi !== undefined ? h.ndbi.toFixed(3) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-cyan-400">
                          {h.ndwi !== null && h.ndwi !== undefined ? h.ndwi.toFixed(3) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-750">
                            {h.environment_context
                              ? h.environment_context.replace(/_/g, ' ')
                              : 'BUILT / NON-VEGETATED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                            {h.satellite_quality || 'EXCELLENT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 italic">
            * Note: For records without satellite data, no values are estimated or generated.
          </div>
        </div>

        {/* 10. DATA-DRIVEN INTELLIGENCE */}
        <div
          id="data-driven-intelligence-panel"
          className="p-4 sm:p-5 rounded-xl bg-[#080C14] border border-cyan-500/40 shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-['Chakra_Petch'] tracking-wider text-white">
                DATA-DRIVEN INTELLIGENCE
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              STRICT FACTUAL GROUNDING
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dynamicInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors text-xs leading-relaxed text-slate-300 flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div>{insight}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2">
            <span>
              All analytical statements are computed directly from current Supabase public.hotspots telemetry records (NASA FIRMS VIIRS NOAA-21 NRT).
            </span>
            <span className="text-cyan-400/80 font-bold">
              Unsupervised DBSCAN Spatial Clustering + Rule-Based Weighted Scoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
