import React from 'react';
import { X, ShieldAlert, Flame, Satellite, Info, CheckCircle2, Award } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="about-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none"
    >
      <div className="w-full max-w-2xl bg-[#080C14] text-slate-200 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span className="font-bold font-['Chakra_Petch'] text-white">
              AGNI KAVACH • SIH26162 INTELLIGENCE SPECIFICATION
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div>
            <h2 className="text-base font-bold font-['Chakra_Petch'] text-white">
              Geospatial Industrial Fire & Persistent Thermal Source Intelligence System
            </h2>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              Agni Kavach is an operational thermal intelligence platform designed to prioritize, analyze, and contextualize high-temperature stationary anomalies across complex industrial sectors using multi-sensor spaceborne observation.
            </p>
          </div>

          {/* Mathematical Formulation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Agni Kavach Priority Formula:
            </div>
            <div className="bg-[#080C14] p-2.5 rounded border border-slate-800 font-mono text-[11px] text-amber-300">
              Score = 0.30 × Thermal_Risk + 0.25 × Persistence + 0.20 × Normalized_Detections + 0.15 × Night_Ratio + 0.10 × Geo_Proximity
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Every score is strictly bounded between 0 and 100. High-priority candidates (≥65) require multi-sensor investigation or satellite inspection tasking.
            </p>
          </div>

          {/* Data Sources */}
          <div className="space-y-2">
            <div className="text-slate-300 font-bold text-[11px]">Integrated Spaceborne Sensors:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 font-bold block">NASA FIRMS</span>
                <span className="text-slate-400">VIIRS (375m) & MODIS (1km) thermal infrared active fire and brightness temperature detections.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-indigo-400 font-bold block">Copernicus Sentinel-2</span>
                <span className="text-slate-400">MSI Level-2A optical and shortwave infrared (SWIR) bands for NDVI, NDBI, and NDWI indices.</span>
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[10px] space-y-1">
            <span className="font-bold block uppercase">Scientific Caution:</span>
            <p>
              Agni Kavach provides evidence-based prioritization and contextual intelligence. Thermal detections and unsupervised ML clusters indicate recurring high-temperature processes (furnaces, kilns, flaring, or active heat zones) and must not be cited as confirmed industrial disasters without field verification or dedicated optical assessment.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#0D1424] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};
