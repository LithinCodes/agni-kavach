import React from 'react';
import { Moon, Sparkles, Clock, AlertTriangle, Calendar, Info, ShieldCheck } from 'lucide-react';
import { HotspotRecord } from '../types';

interface DhumraDharmaPanelProps {
  hotspot: HotspotRecord;
}

export const DhumraDharmaPanel: React.FC<DhumraDharmaPanelProps> = ({ hotspot }) => {
  const nightRatio = hotspot.night_ratio ?? 0;
  const nightPct = (nightRatio * 100).toFixed(1);
  const totalDetections = hotspot.detections ?? 0;
  const estimatedNightDetections = Math.round(totalDetections * nightRatio);
  const activeDays = hotspot.active_days ?? 1;

  // Determine Category
  let category: 'LOW NIGHT ACTIVITY' | 'MODERATE NIGHT ACTIVITY' | 'HIGH NIGHT ACTIVITY';
  let badgeStyle = '';
  if (nightRatio >= 0.6) {
    category = 'HIGH NIGHT ACTIVITY';
    badgeStyle = 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
  } else if (nightRatio >= 0.3) {
    category = 'MODERATE NIGHT ACTIVITY';
    badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
  } else {
    category = 'LOW NIGHT ACTIVITY';
    badgeStyle = 'bg-slate-900 text-slate-400 border-slate-700';
  }

  // 5-Day FIRMS observation dates (Sept 4 to Sept 8, 2026)
  const fiveDays = [
    { day: 'Day 1', date: '04 Sep', pass: '01:30 UTC Night', detected: activeDays >= 1, isNight: nightRatio > 0.4 },
    { day: 'Day 2', date: '05 Sep', pass: '13:45 UTC Day', detected: activeDays >= 2, isNight: false },
    { day: 'Day 3', date: '06 Sep', pass: '01:35 UTC Night', detected: activeDays >= 3, isNight: nightRatio > 0.2 },
    { day: 'Day 4', date: '07 Sep', pass: '01:40 UTC Night', detected: activeDays >= 4, isNight: nightRatio > 0.5 },
    { day: 'Day 5', date: '08 Sep', pass: '13:50 UTC Day', detected: activeDays >= 5, isNight: false },
  ];

  return (
    <div
      id="dhumra-dharma-panel"
      className="p-4 rounded-xl bg-[#0D1424]/90 border border-purple-500/30 font-mono text-xs text-slate-200 flex flex-col space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Chakra_Petch'] font-bold text-white text-sm tracking-wider">
                DHUMRA-DHARMA
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                AUDITOR
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Nighttime Thermal Activity Auditor</p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
          {category}
        </span>
      </div>

      {/* Mandatory Analytical Baseline Notice */}
      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>CURRENT ANALYTICAL WINDOW: <strong className="text-slate-200 font-bold">5 DAYS</strong> (NASA FIRMS VIIRS NOAA-21 NRT)</span>
        </div>
        <span className="text-purple-400 font-bold">VIIRS 01:30 NRT Orbit</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">NIGHT DETECTIONS</div>
          <div className="text-base font-bold text-purple-300 font-['Chakra_Petch'] mt-0.5">
            ~{estimatedNightDetections} <span className="text-[10px] font-normal text-slate-500">/ {totalDetections}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">NIGHT RATIO</div>
          <div className="text-base font-bold text-cyan-300 font-['Chakra_Petch'] mt-0.5">
            {nightPct}%
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">ACTIVE DAYS</div>
          <div className="text-base font-bold text-amber-300 font-['Chakra_Petch'] mt-0.5">
            {activeDays} <span className="text-[10px] font-normal text-slate-500">/ 5 days</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">PERSISTENCE</div>
          <div className="text-base font-bold text-emerald-300 font-['Chakra_Petch'] mt-0.5">
            {hotspot.persistence}%
          </div>
        </div>
      </div>

      {/* 5-Day Nocturnal Thermal Heatmap Timeline */}
      <div>
        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center justify-between">
          <span>5-DAY PASS REPEATABILITY MATRIX</span>
          <span className="text-slate-500 text-[9px]">04–08 September 2026</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {fiveDays.map((d, i) => (
            <div
              key={`day-${i}`}
              className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                d.detected
                  ? d.isNight
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-600 opacity-60'
              }`}
            >
              <span className="text-[10px] font-bold text-white">{d.date}</span>
              <span className="text-[8px] text-slate-400 mt-0.5">{d.day}</span>
              <div className="my-1">
                {d.isNight ? (
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span className="text-[8px] font-mono leading-tight">
                {d.detected ? (d.isNight ? 'NIGHT' : 'DAY') : 'QUIET'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[9px] text-slate-400 flex items-start gap-2 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-300">SCIENTIFIC QUALIFIER:</strong> Repeated nocturnal detection provides an analytical signal of high thermal permanence (such as continuous smelter, kiln, or flare stack emissions). This is an observational metric and does not constitute proof of illegal industrial activity.
        </span>
      </div>
    </div>
  );
};
