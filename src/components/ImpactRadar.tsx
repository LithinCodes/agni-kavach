import React, { useState } from 'react';
import { HotspotRecord } from '../types';
import { ShieldAlert, Info, Flame, Clock, Radio, Sparkles, MapPin } from 'lucide-react';

interface ImpactRadarProps {
  hotspot: HotspotRecord;
}

export const ImpactRadar: React.FC<ImpactRadarProps> = ({ hotspot }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Normalized factors (0 to 1 scale)
  const factors = [
    {
      id: 'persistence',
      name: 'PERSISTENCE',
      label: 'Temporal Persistence',
      rawScore: hotspot.persistence_contribution ?? 0,
      valueText: `${hotspot.persistence}% (${hotspot.active_days}/5 days)`,
      norm: Math.min(1, Math.max(0.1, (hotspot.persistence_contribution ?? 0) / 25)),
      icon: Clock,
      color: '#06B6D4', // cyan
      meaning: 'High satellite revisit persistence across multiple independent satellite orbits.',
    },
    {
      id: 'thermal',
      name: 'THERMAL',
      label: 'Thermal Intensity',
      rawScore: hotspot.thermal_contribution ?? 0,
      valueText: `Mean Sensor FRP ${hotspot.mean_frp} (Peak ${hotspot.max_frp})`,
      norm: Math.min(1, Math.max(0.1, (hotspot.thermal_contribution ?? 0) / 25)),
      icon: Flame,
      color: '#F59E0B', // amber
      meaning: 'Sensor-derived thermal emission and cluster radiative output index.',
    },
    {
      id: 'detection',
      name: 'DETECTION ACTIVITY',
      label: 'Detection Volume',
      rawScore: hotspot.detection_contribution ?? 0,
      valueText: `${hotspot.detections} satellite detection pixels`,
      norm: Math.min(1, Math.max(0.1, (hotspot.detection_contribution ?? 0) / 18)),
      icon: Radio,
      color: '#3B82F6', // blue
      meaning: 'Total aggregated 375m pixel detections identified inside this DBSCAN cluster.',
    },
    {
      id: 'night',
      name: 'NIGHT ACTIVITY',
      label: 'Nighttime Ratio',
      rawScore: hotspot.night_contribution ?? 0,
      valueText: `${((hotspot.night_ratio ?? 0) * 100).toFixed(1)}% night passes`,
      norm: Math.min(1, Math.max(0.1, (hotspot.night_contribution ?? 0) / 15)),
      icon: Sparkles,
      color: '#A855F7', // purple
      meaning: 'Fraction of detections occurring during nocturnal VIIRS overpasses (01:30 local).',
    },
    {
      id: 'geographic',
      name: 'GEOGRAPHIC CONTEXT',
      label: 'Geographic Context',
      rawScore: hotspot.geographic_contribution ?? 0,
      valueText: `${hotspot.distance_to_city_km} km to ${hotspot.nearest_city}`,
      norm: Math.min(1, Math.max(0.1, (hotspot.geographic_contribution ?? 0) / 15)),
      icon: MapPin,
      color: '#10B981', // emerald
      meaning: 'Proximity to urban population centers and built environment clusters.',
    },
  ];

  // SVG Geometry calculations for 5-pointed radar
  const size = 260;
  const center = size / 2;
  const radius = 88;
  const numPoints = factors.length;

  const getCoordinates = (index: number, value: number) => {
    // 0 is top (-90 degrees)
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const r = radius * value;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Polygon string
  const polygonPoints = factors
    .map((f, i) => {
      const { x, y } = getCoordinates(i, f.norm);
      return `${x},${y}`;
    })
    .join(' ');

  const activeFactor = hoveredIndex !== null ? factors[hoveredIndex] : null;

  return (
    <div
      id="visual-impact-radar"
      className="p-4 rounded-xl bg-[#0D1424]/90 border border-slate-800 flex flex-col font-mono text-xs"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-slate-200">
            5-AXIS IMPACT RADAR
          </span>
        </div>
        <span className="text-[10px] text-slate-500">Incident {hotspot.source_id}</span>
      </div>

      <div className="relative flex items-center justify-center my-1">
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Concentric grid rings */}
          {[0.25, 0.5, 0.75, 1.0].map((ringLevel) => {
            const ringPoints = factors
              .map((_, i) => {
                const { x, y } = getCoordinates(i, ringLevel);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <polygon
                key={`ring-${ringLevel}`}
                points={ringPoints}
                fill="none"
                stroke="#1E293B"
                strokeWidth="1"
                strokeDasharray={ringLevel === 1 ? 'none' : '2 2'}
              />
            );
          })}

          {/* Radial axis spokes */}
          {factors.map((f, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={`spoke-${f.id}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#1E293B"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled radar polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(6, 182, 212, 0.25)"
            stroke="#06B6D4"
            strokeWidth="2"
            className="transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          />

          {/* Data Points on vertices */}
          {factors.map((f, i) => {
            const { x, y } = getCoordinates(i, f.norm);
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={`vertex-${f.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={f.color}
                  stroke="#080C14"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {factors.map((f, i) => {
            const { x, y } = getCoordinates(i, 1.18);
            const isHovered = hoveredIndex === i;
            return (
              <text
                key={`label-${f.id}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isHovered ? '#38BDF8' : '#94A3B8'}
                fontSize="9"
                fontFamily="monospace"
                fontWeight={isHovered ? 'bold' : 'normal'}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {f.name}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Interactive Detail Box */}
      <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 min-h-[64px] flex flex-col justify-center">
        {activeFactor ? (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <div className="flex items-center gap-1.5 font-bold" style={{ color: activeFactor.color }}>
                <activeFactor.icon className="w-3.5 h-3.5" />
                <span>{activeFactor.label}</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold">
                +{activeFactor.rawScore.toFixed(2)} pts
              </span>
            </div>
            <div className="text-[10px] text-slate-300">{activeFactor.valueText}</div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{activeFactor.meaning}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Hover over any radar vertex or label to inspect normalized factor contribution.</span>
          </div>
        )}
      </div>
    </div>
  );
};
