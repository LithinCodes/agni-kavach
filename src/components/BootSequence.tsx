import React, { useEffect, useState } from 'react';
import { Flame, ShieldAlert, Radio, Satellite, Check } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const bootSteps = [
    'CONNECTING NASA FIRMS VIIRS/MODIS SATELLITE FEED...',
    'INGESTING SEPTEMBER 2026 THERMAL ANOMALY TELEMETRY...',
    'CALIBRATING DBSCAN SPATIAL CLUSTERING MATRICES...',
    'SYNCING SENTINEL-2 MULTISPECTRAL LEVEL-2A CONTEXT...',
    'RUNNING UNSUPERVISED ML BEHAVIORAL PROFILING...',
    'AGNI KAVACH OPERATIONAL PROTOCOL ONLINE.',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= bootSteps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete, bootSteps.length]);

  return (
    <div
      id="boot-sequence"
      className="fixed inset-0 z-50 bg-[#050811] text-cyan-400 font-mono flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Animated Radar Shield Emblem */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping" />
          <div className="absolute -inset-4 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
            <ShieldAlert className="w-8 h-8 text-cyan-400 absolute" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold font-['Chakra_Petch'] text-white tracking-widest">
            AGNI KAVACH
          </h1>
          <div className="text-xs text-cyan-300/80 tracking-wider mt-0.5">
            AI GEOSPATIAL THERMAL INTELLIGENCE PLATFORM • SIH26162
          </div>
        </div>

        {/* Progress Checklist */}
        <div className="bg-[#080C14] border border-cyan-500/30 rounded-xl p-4 text-left space-y-2 text-xs">
          {bootSteps.map((s, idx) => (
            <div
              key={s}
              className={`flex items-center gap-2 transition-opacity duration-200 ${
                idx <= step ? 'opacity-100 text-slate-200' : 'opacity-20 text-slate-600'
              }`}
            >
              {idx < step ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : idx === step ? (
                <span className="w-3.5 h-3.5 rounded-full border border-cyan-400 border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className="truncate text-[11px]">{s}</span>
            </div>
          ))}
        </div>

        {/* Quick Skip Button */}
        <button
          onClick={onComplete}
          className="text-xs text-slate-500 hover:text-cyan-300 font-mono tracking-wider transition-colors"
        >
          [ PRESS TO SKIP INITIALIZATION ]
        </button>
      </div>
    </div>
  );
};
