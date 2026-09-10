import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Download,
  Flame,
  ShieldAlert,
  Satellite,
  Building2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { HotspotRecord } from '../types';
import { exportIncidentDossierPDF, exportIncidentDossierXLSX } from '../services/exportService';

interface IncidentDossierModalProps {
  hotspot: HotspotRecord | null;
  onClose: () => void;
}

export const IncidentDossierModal: React.FC<IncidentDossierModalProps> = ({
  hotspot,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'xlsx' | null>(null);

  if (!hotspot) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(hotspot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setDownloadingFormat('pdf');
    try {
      exportIncidentDossierPDF(hotspot);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1500);
    }
  };

  const handleDownloadXlsx = () => {
    setDownloadingFormat('xlsx');
    try {
      exportIncidentDossierXLSX(hotspot);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1500);
    }
  };

  return (
    <div
      id="incident-dossier-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#080C14] text-slate-200 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold font-['Chakra_Petch'] text-white">
              INCIDENT DOSSIER: {hotspot.source_id}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingFormat === 'pdf'}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50"
              title="Download official incident dossier in PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'pdf' ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}</span>
            </button>

            <button
              onClick={handleDownloadXlsx}
              disabled={downloadingFormat === 'xlsx'}
              className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer disabled:opacity-50"
              title="Download incident telemetry and receptor data in Excel (XLSX) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>{downloadingFormat === 'xlsx' ? 'SAVING XLSX...' : 'DOWNLOAD XLSX'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print document preview"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 space-y-6 select-text print:p-0 print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-cyan-500 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <div className="text-xs font-bold tracking-widest text-cyan-400">
                AGNI KAVACH GEOSPATIAL INTELLIGENCE
              </div>
              <h1 className="text-2xl font-bold font-['Chakra_Petch'] text-white mt-1">
                TACTICAL THERMAL INCIDENT DOSSIER
              </h1>
              <div className="text-xs text-slate-400">
                SIH26162 TECHNICAL ASSESSMENT & REMOTE SENSING VERIFICATION
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-400">
                GENERATED: {new Date().toISOString().split('T')[0]}
              </div>
              <div className="font-bold text-cyan-300">
                TARGET ID: {hotspot.source_id}
              </div>
            </div>
          </div>

          {/* Core Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-500">PRIORITY SCORE</div>
              <div className="text-2xl font-bold font-['Chakra_Petch'] text-cyan-300">
                {hotspot.priority_score.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-rose-400">
                {hotspot.priority_category} PRIORITY
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">COORDINATES</div>
              <div className="text-xs font-bold text-slate-200 mt-1">
                {hotspot.latitude.toFixed(5)}°N
              </div>
              <div className="text-xs font-bold text-slate-200">
                {hotspot.longitude.toFixed(5)}°E
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">GEOGRAPHIC SECTOR</div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                {hotspot.location || 'Regional Sector'}
              </div>
              <div className="text-[10px] text-slate-400">
                {hotspot.distance_to_city_km?.toFixed(1) || '0'} km from {hotspot.nearest_city || 'City'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">OPERATIONAL STATUS</div>
              <div className="text-xs font-bold text-amber-400 mt-1">
                {hotspot.investigation_status || 'Unreviewed'}
              </div>
              <div className="text-[10px] text-slate-400">
                Alert: {hotspot.alert_status || 'Normal'}
              </div>
            </div>
          </div>

          {/* Mathematical Score Deconstruction */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              1. Mathematical Score Deconstruction
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Thermal Risk (30%)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {hotspot.thermal_contribution?.toFixed(2) || 'N/A'} pts
                </div>
                <div className="text-[9px] text-slate-500">Raw: {hotspot.thermal_risk.toFixed(1)}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Persistence (25%)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {hotspot.persistence_contribution?.toFixed(2) || 'N/A'} pts
                </div>
                <div className="text-[9px] text-slate-500">Raw: {hotspot.persistence.toFixed(1)}%</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Detections (20%)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {hotspot.detection_contribution?.toFixed(2) || 'N/A'} pts
                </div>
                <div className="text-[9px] text-slate-500">{hotspot.detections} VIIRS obs</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Night Ratio (15%)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {hotspot.night_contribution?.toFixed(2) || 'N/A'} pts
                </div>
                <div className="text-[9px] text-slate-500">{(hotspot.night_ratio * 100).toFixed(0)}% nocturnal</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Spatial Dist (10%)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {hotspot.geographic_contribution?.toFixed(2) || 'N/A'} pts
                </div>
                <div className="text-[9px] text-slate-500">{hotspot.distance_to_city_km?.toFixed(1) || '0'} km</div>
              </div>
            </div>
          </div>

          {/* Machine Learning Pattern Profile */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
              2. Analytical Behavioral Profile
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">ML Behavioral Archetype:</span>
                <span className="font-bold text-slate-200">
                  Cluster #{hotspot.ml_cluster} ({hotspot.pattern_profile})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dominant Factor:</span>
                <span className="text-amber-300 font-bold">{hotspot.dominant_factor}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 italic">
                * Unsupervised pattern grouping / analytical cluster, not a supervised fire classification.
              </div>
            </div>
          </div>

          {/* Sentinel-2 Multispectral Context */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
              3. Copernicus Sentinel-2 Multispectral Context
            </h3>
            {hotspot.satellite_available ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">NDVI (Vegetation)</span>
                    <span className="font-bold text-emerald-400">{hotspot.ndvi?.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">NDBI (Built-up)</span>
                    <span className="font-bold text-cyan-300">{hotspot.ndbi?.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">NDWI (Water)</span>
                    <span className="font-bold text-blue-400">{hotspot.ndwi?.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SWIR Contrast</span>
                    <span className="font-bold text-amber-400">{hotspot.swir_contrast?.toFixed(4)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between text-[11px]">
                  <span className="text-slate-400">Contextual Interpretation:</span>
                  <span className="text-cyan-300 font-bold">{hotspot.built_surface_context}</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Acquired: {hotspot.satellite_scene_date} | Cloud: {hotspot.satellite_cloud_cover?.toFixed(1)}% | Quality: {hotspot.satellite_quality}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                Sentinel-2 contextual scene unavailable for this source. Tasking pending.
              </div>
            )}
          </div>

          {/* Gemini AI Assessment if exists */}
          {hotspot.explanation && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                4. Multi-Sensor Evidence Synthesis (Gemini AI)
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs leading-relaxed text-slate-300 whitespace-pre-line font-sans">
                {hotspot.explanation}
              </div>
            </div>
          )}

          {/* Scientific Disclaimer Footer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 text-[10px] text-slate-400 space-y-1">
            <div className="font-bold text-amber-400 uppercase">
              Official Geospatial & Scientific Disclaimer:
            </div>
            <p>
              Agni Kavach operates on structured satellite telemetry provided by NASA FIRMS (VIIRS/MODIS) and ESA Copernicus Sentinel-2. Persistent thermal anomalies indicate stationary, recurring high-temperature industrial or flaring processes. This analytical system calculates priority scores for inspection and does not provide an autonomous confirmation of uncontained industrial disaster without field ground-truth or high-resolution spatial tasking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
