import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Radio,
  Clock,
  Moon,
  BrainCircuit,
  ShieldAlert,
  Satellite,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { HotspotRecord } from '../types';

interface MissionReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleRecord?: HotspotRecord | null;
  onSelectAndInvestigate: (hotspot: HotspotRecord) => void;
}

export const MissionReplayModal: React.FC<MissionReplayModalProps> = ({
  isOpen,
  onClose,
  sampleRecord,
  onSelectAndInvestigate,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !autoPlay || !sampleRecord) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 7);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, autoPlay, sampleRecord]);

  if (!isOpen || !sampleRecord) return null;

  const steps = [
    {
      id: 1,
      icon: Flame,
      color: 'text-amber-400',
      title: '1. RAW THERMAL DETECTION INGESTION',
      subtitle: 'NASA FIRMS VIIRS/MODIS (375m / 1km)',
      desc: 'High-temperature thermal anomalies are downlinked from polar-orbiting satellites. Each detection records latitude, longitude, brightness temperature (Kelvin), scan, track, and nominal Sensor FRP (Fire Radiative Power index).',
      metricLabel: 'Sample Raw Detections',
      metricValue: `${sampleRecord.detections ?? 0} VIIRS / MODIS detections`,
      detail: `Acquired across observation period in the ${sampleRecord.location || 'Eastern Industrial'} corridor.`,
    },
    {
      id: 2,
      icon: Radio,
      color: 'text-cyan-400',
      title: '2. SPATIAL CLUSTERING & CENTROID IDENTIFICATION',
      subtitle: 'DBSCAN / Spatial Distance Aggregation',
      desc: 'Individual satellite observation pixels over successive orbital passes are spatially grouped using spatial distance thresholds to establish a unified stationary thermal source centroid.',
      metricLabel: 'Calculated Centroid',
      metricValue: `${sampleRecord.latitude?.toFixed(4) ?? '0.0000'}°N, ${sampleRecord.longitude?.toFixed(4) ?? '0.0000'}°E`,
      detail: `Cluster radius ~1.2 km centered near ${sampleRecord.nearest_city || 'Talcher'}.`,
    },
    {
      id: 3,
      icon: Clock,
      color: 'text-cyan-300',
      title: '3. TEMPORAL PERSISTENCE ANALYSIS',
      subtitle: 'Multi-Day Temporal Recurrence',
      desc: 'Ephemeral biomass or agricultural stubble burning rarely persists across 4+ days at identical coordinates. Continuous industrial thermal operations (smelters, furnaces, flaring) exhibit sustained multi-day recurrence.',
      metricLabel: 'Persistence Index',
      metricValue: `${sampleRecord.persistence?.toFixed(1) ?? '0.0'}% (${sampleRecord.active_days ?? 1} active days)`,
      detail: `Ranked in top decile for multi-day continuity.`,
    },
    {
      id: 4,
      icon: Moon,
      color: 'text-indigo-400',
      title: '4. NOCTURNAL WEIGHTING & THERMAL RADIATIVE RISK',
      subtitle: 'Solar Insolation Decoupling',
      desc: 'Nocturnal satellite passes decouple true combustion or furnace emissions from diurnal solar heating. Detections recorded during 01:30 local time passes receive elevated weight.',
      metricLabel: 'Night Ratio / Thermal Risk',
      metricValue: `${((sampleRecord.night_ratio ?? 0) * 100).toFixed(1)}% Nocturnal | Risk ${sampleRecord.thermal_risk?.toFixed(1) ?? '0.0'}`,
      detail: `Nominal Sensor FRP: ${sampleRecord.mean_frp?.toFixed(1) || '0'} (Peak: ${sampleRecord.max_frp?.toFixed(1) || '0'}).`,
    },
    {
      id: 5,
      icon: BrainCircuit,
      color: 'text-purple-400',
      title: '5. UNSUPERVISED ML PATTERN PROFILING',
      subtitle: 'Analytical Behavioral Archetypes',
      desc: 'Multivariate feature vectors are partitioned into behavioral clusters. Notice: Unsupervised analytical pattern grouping — not a supervised fire classification.',
      metricLabel: 'Machine Learning Archetype',
      metricValue: `Cluster #${sampleRecord.ml_cluster ?? 0}`,
      detail: `Identified as: "${sampleRecord.pattern_profile || 'Thermal Pattern'}". Dominant driver: ${sampleRecord.dominant_factor || 'Thermal'}.`,
    },
    {
      id: 6,
      icon: ShieldAlert,
      color: 'text-rose-400',
      title: '6. AGNI KAVACH PRIORITY SCORING',
      subtitle: 'Deterministic Mathematical Fusion',
      desc: 'Integrates thermal risk, temporal persistence, observation frequency, night ratio, and spatial proximity into a normalized 0-100 priority index.',
      metricLabel: 'Final Priority Score',
      metricValue: `${sampleRecord.priority_score?.toFixed(2) ?? '0.00'} (${sampleRecord.priority_category || 'NORMAL'})`,
      detail: `Mathematical sum: Thermal (${sampleRecord.thermal_contribution?.toFixed(1) ?? '0.0'}) + Persistence (${sampleRecord.persistence_contribution?.toFixed(1) ?? '0.0'}) + Detections (${sampleRecord.detection_contribution?.toFixed(1) ?? '0.0'}) + Night (${sampleRecord.night_contribution?.toFixed(1) ?? '0.0'}) + Geo (${sampleRecord.geographic_contribution?.toFixed(1) ?? '0.0'}).`,
    },
    {
      id: 7,
      icon: Satellite,
      color: 'text-emerald-400',
      title: '7. ARCHIVAL SATELLITE CONTEXT (SENTINEL-2)',
      subtitle: 'Surface Reflectance Spectral Baseline',
      desc: 'Copernicus Sentinel-2 Level-2A imagery provides archival background context to extract spectral indices: Normalized Difference Built-Up Index (NDBI), Vegetation (NDVI), and SWIR surface response (not an active-fire optical image).',
      metricLabel: 'Spectral Grounding',
      metricValue: sampleRecord.satellite_available ? `NDBI: ${sampleRecord.ndbi?.toFixed(3)} | NDVI: ${sampleRecord.ndvi?.toFixed(3)}` : 'Contextual Scene Pending',
      detail: sampleRecord.satellite_available ? `Context: ${sampleRecord.built_surface_context}. Quality: ${sampleRecord.satellite_quality}.` : 'Flagged for tasking.',
    },
  ];

  const current = steps[currentStep] || steps[0];
  const StepIcon = current.icon;

  return (
    <div
      id="mission-replay-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
    >
      <div className="w-full max-w-3xl bg-[#080C14] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white">
                AGNI KAVACH: MISSION PIPELINE REPLAY
              </div>
              <div className="text-[10px] text-cyan-300">
                End-to-End Geospatial Intelligence Architecture Walkthrough
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-1 rounded text-xs border flex items-center gap-1.5 transition-all ${
                autoPlay
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {autoPlay ? <Pause className="w-3 h-3 fill-black" /> : <Play className="w-3 h-3 fill-slate-300" />}
              <span>{autoPlay ? 'PAUSE' : 'AUTO-PLAY'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950 text-center text-[10px]">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentStep(idx);
                setAutoPlay(false);
              }}
              className={`py-2 px-1 border-b-2 transition-all ${
                currentStep === idx
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 font-bold'
                  : idx < currentStep
                  ? 'border-cyan-700 text-slate-400'
                  : 'border-transparent text-slate-600 hover:text-slate-400'
              }`}
            >
              STEP {idx + 1}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6 flex-1">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1424] border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <StepIcon className={`w-7 h-7 ${current.color}`} />
            </div>
            <div>
              <div className="text-[11px] text-cyan-400 font-bold tracking-widest uppercase">
                {current.subtitle}
              </div>
              <h2 className="text-xl font-bold font-['Chakra_Petch'] text-white mt-0.5">
                {current.title}
              </h2>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {current.desc}
          </p>

          {/* Live Telemetry Anchor for this step */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/40 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Grounded on Target: <span className="font-bold text-white">{sampleRecord.source_id}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                LIVE OPERATIONAL RECORD
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pt-1 border-t border-slate-800">
              <span className="text-sm font-bold text-cyan-300 font-['Chakra_Petch']">
                {current.metricLabel}: {current.metricValue}
              </span>
              <span className="text-xs text-slate-400">{current.detail}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-[#0D1424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentStep((prev) => Math.max(0, prev - 1));
                setAutoPlay(false);
              }}
              disabled={currentStep === 0}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>
            <button
              onClick={() => {
                setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
                setAutoPlay(false);
              }}
              disabled={currentStep === steps.length - 1}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <span>NEXT STEP</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onSelectAndInvestigate(sampleRecord);
            }}
            className="px-4 py-1.5 rounded bg-cyan-950 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            OPEN SAMPLE IN TRIAGE DRAWER
          </button>
        </div>
      </div>
    </div>
  );
};
