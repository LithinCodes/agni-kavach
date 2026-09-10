import React, { useRef, useState } from 'react';
import { HotspotRecord } from '../types';
import {
  X,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Radio,
  MapPin,
  Building,
  Hospital,
  FileCheck2,
  Calendar,
  Satellite,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { getSensitiveLocationsForHotspot, getPopulationImpactContext } from '../services/impactService';
import { exportIncidentDossierPDF, exportIncidentDossierXLSX } from '../services/exportService';

interface DossierModalProps {
  hotspot: HotspotRecord | null;
  isOpen: boolean;
  onClose: () => void;
  investigationNotes?: string;
  recommendedAction?: string;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  hotspot,
  isOpen,
  onClose,
  investigationNotes = 'Incident logged for physical ground verification and air-monitoring deployment.',
  recommendedAction = 'Dispatch quick-response ground survey team with multi-gas detector.',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'xlsx' | null>(null);

  if (!isOpen || !hotspot) return null;

  const sensitiveLocs = getSensitiveLocationsForHotspot(hotspot);
  const popContext = getPopulationImpactContext(hotspot, 8.5);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setDownloadingFormat('pdf');
    try {
      exportIncidentDossierPDF(hotspot, investigationNotes, recommendedAction);
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
      id="dossier-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Header (Non-printing) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <span className="font-mono font-bold text-sm">
              AGNI KAVACH • OFFICIAL INCIDENT DOSSIER EXPORT
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingFormat === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50"
              title="Download formal incident dossier in PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'pdf' ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}</span>
            </button>

            <button
              onClick={handleDownloadXlsx}
              disabled={downloadingFormat === 'xlsx'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-bold text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer disabled:opacity-50"
              title="Download incident data in Excel (XLSX) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>{downloadingFormat === 'xlsx' ? 'SAVING XLSX...' : 'DOWNLOAD XLSX'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              title="Print document preview"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 sm:p-12 space-y-6 text-xs text-slate-800 bg-white">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                GOVERNMENT OF INDIA • SMART INDIA HACKATHON 2024 (SIH26162)
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 mt-1">
                AGNI KAVACH: INDUSTRIAL THERMAL INCIDENT DOSSIER
              </h1>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                Multi-Sensor Space-Ground Thermal Intelligence System
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="inline-block px-2.5 py-1 bg-rose-600 text-white font-bold rounded text-xs">
                {hotspot.priority_category} PRIORITY ALERT
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Generated: {new Date().toUTCString()}
              </div>
            </div>
          </div>

          {/* Incident Identification Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">INCIDENT ID:</span>
              <strong className="text-sm text-slate-900">{hotspot.source_id}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">PRIORITY SCORE:</span>
              <strong className="text-sm text-rose-600">{hotspot.priority_score.toFixed(2)} / 100</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">COORDINATES:</span>
              <strong className="text-xs text-slate-900">
                {hotspot.latitude.toFixed(4)}°N, {hotspot.longitude.toFixed(4)}°E
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">JURISDICTION:</span>
              <strong className="text-xs text-slate-900">
                {hotspot.nearest_city} ({hotspot.distance_to_city_km} km)
              </strong>
            </div>
          </div>

          {/* Telemetry Summary */}
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              1. SATELLITE RADIOMETRIC & TEMPORAL TELEMETRY
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PRIMARY SENSOR:</span>
                <span className="font-bold text-slate-800">NASA FIRMS VIIRS NOAA-21 NRT</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PERSISTENCE:</span>
                <span className="font-bold text-slate-800">
                  {hotspot.persistence}% ({hotspot.active_days}/5 days)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">TOTAL DETECTIONS:</span>
                <span className="font-bold text-slate-800">{hotspot.detections} 375m pixels</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">NIGHT RATIO:</span>
                <span className="font-bold text-slate-800">
                  {((hotspot.night_ratio ?? 0) * 100).toFixed(1)}% nocturnal passes
                </span>
              </div>
            </div>
          </div>

          {/* Vayu-Drishti Modeled Hazard Dispersion Context */}
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              2. VAYU-DRISHTI MODELED HAZARD DISPERSION CONTEXT
            </h2>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2 text-slate-800">
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-600 block">TACTICAL PLUME REACH:</span>
                  <strong>~8.8 km downwind</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 block">EST. POPULATION IN ZONE:</span>
                  <strong>~{popContext.estimatedPopulationInCorridor.toLocaleString()} persons</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 block">MODEL CLASSIFICATION:</span>
                  <strong className="text-amber-800">USER-DEFINED SIMULATION</strong>
                </div>
              </div>
              <div className="text-[10px] text-amber-900 italic">
                * Note: Mathematical atmospheric dispersion corridor based on thermal coordinates. Chemical identity remains unknown until verified by ground sensor or hazmat crew.
              </div>
            </div>
          </div>

          {/* Sensitive Infrastructure */}
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              3. SENSITIVE LOCATIONS WITHIN TACTICAL RADIUS
            </h2>
            <div className="space-y-1.5">
              {sensitiveLocs.slice(0, 5).map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-bold text-slate-900">{loc.name}</span>
                  <span className="font-mono text-slate-600">
                    {loc.type.toUpperCase()} • {loc.distanceKm} km
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation Findings & Operational Directives */}
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              4. INVESTIGATION FINDINGS & RECOMMENDED DIRECTIVES
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">
                  INVESTIGATOR NOTES:
                </span>
                <p className="mt-1 text-slate-800">{investigationNotes}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">
                  RECOMMENDED ACTION:
                </span>
                <p className="mt-1 font-semibold text-slate-900">{recommendedAction}</p>
              </div>
            </div>
          </div>

          {/* Chain of Custody & Sign-Off Section */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">
                INCIDENT COMMANDER / DISPATCH OFFICER:
              </span>
              <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Name / Designation</span>
                <span>Date & Time</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">
                DISTRICT DISASTER MANAGEMENT DESK:
              </span>
              <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Official Signature / Stamp</span>
                <span>Dispatch Status</span>
              </div>
            </div>
          </div>

          {/* Scientific Qualifier Footer */}
          <div className="pt-4 border-t border-slate-300 text-[9px] text-slate-500 font-mono leading-tight">
            DISCLOSURE: Generated by Agni Kavach v2.4 Multi-Sensor Thermal Intelligence Engine. Telemetry derived exclusively from NASA FIRMS VIIRS NOAA-21 NRT. Fire Radiative Power (FRP) is a proxy for thermal intensity, not physical thermal energy (MW). Ground physical verification is required before initiating containment or hazardous material response.
          </div>
        </div>
      </div>
    </div>
  );
};
