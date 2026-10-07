import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  PhoneCall,
  Home,
  Wind,
  Info,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Radio,
} from 'lucide-react';

interface CitizenSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'WITHIN' | 'NEAR' | 'OUTSIDE';
  incidentId: string;
  cityName: string;
  distanceKm: number;
}

export const CitizenSafetyModal: React.FC<CitizenSafetyModalProps> = ({
  isOpen,
  onClose,
  status,
  incidentId,
  cityName,
  distanceKm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="citizen-safety-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#080C14] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            status === 'WITHIN'
              ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border-amber-500/40'
              : status === 'NEAR'
              ? 'bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-950 border-blue-500/40'
              : 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                status === 'WITHIN'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : status === 'NEAR'
                  ? 'bg-blue-950/80 text-blue-300 border-blue-400/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-400/50'
              }`}
            >
              {status === 'WITHIN' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : status === 'NEAR' ? (
                <Eye className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
                AM I SAFE? • CITIZEN SAFETY GUIDANCE
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Incident Context: {incidentId} ({cityName} Region • {distanceKm} km from test location)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-200">
          {/* Status Assessment Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              status === 'WITHIN'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                : status === 'NEAR'
                ? 'bg-blue-950/20 border-blue-500/40 text-blue-100'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
            }`}
          >
            <div className="mt-0.5">
              {status === 'WITHIN' && <AlertOctagon className="w-5 h-5 text-amber-400" />}
              {status === 'NEAR' && <Info className="w-5 h-5 text-blue-400" />}
              {status === 'OUTSIDE' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">
                {status === 'WITHIN'
                  ? 'LOCATION INSIDE MODELED DOWNWIND REFERENCE ZONE'
                  : status === 'NEAR'
                  ? 'LOCATION NEAR BOUNDARY OF MODELED DOWNWIND REFERENCE ZONE'
                  : 'LOCATION OUTSIDE MODELED DOWNWIND REFERENCE ZONE'}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {status === 'WITHIN'
                  ? 'Your location is inside the modeled downwind reference zone. This is a decision-support simulation based on meteorological conditions and modeled dispersion geometry. It is not a measurement of atmospheric toxicity. Please follow official guidance from district emergency authorities.'
                  : status === 'NEAR'
                  ? 'Your location is near the boundary of the modeled downwind reference zone. This is a decision-support simulation based on meteorological conditions and modeled dispersion geometry. It is not a measurement of atmospheric toxicity.'
                  : 'Your location is outside the modeled downwind reference zone. This is a decision-support simulation based on meteorological conditions and modeled dispersion geometry. It is not a measurement of atmospheric toxicity.'}
              </p>
            </div>
          </div>

          {/* Scientific Transparency Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold block mb-0.5">IMPORTANT NOTICE — MODELED DISPERSION:</span>
            This assessment is a decision-support simulation based on meteorological conditions and modeled dispersion geometry. It is NOT a measurement of atmospheric toxicity, and does not assert confirmed chemical identity or measured pollutant concentration. Follow directives from district emergency authorities and official public broadcasts.
          </div>

          {/* Safe Actions Checklist */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              RECOMMENDED CITIZEN ACTIONS
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 flex items-start gap-3">
                <Home className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Move Indoors & Seal Openings</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    If visible smoke, soot, or acrid odor is present, remain indoors and close windows, doors, and external ventilation fans.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 flex items-start gap-3">
                <Wind className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Avoid Travel Toward Incident Perimeter</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Do not approach or travel downwind of the thermal hotspot coordinates. Keep access corridors clear for emergency vehicles.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 flex items-start gap-3">
                <Radio className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Follow Official Broadcasts</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Listen to District Disaster Management Authority (DDMA), Police, and State Fire Service advisories.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1424] border border-slate-800 flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Emergency Contacts</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    For life-safety emergencies or medical evacuation: National Emergency Helpline <strong className="text-rose-300 font-mono">112</strong> • Fire Response <strong className="text-rose-300 font-mono">101</strong> • Ambulance <strong className="text-rose-300 font-mono">108</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D1424] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            AGNI KAVACH Citizen Protection Module • SIH26162
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            I UNDERSTAND • CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
