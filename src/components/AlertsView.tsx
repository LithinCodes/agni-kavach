import React from 'react';
import {
  Bell,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Flame,
  Radio,
  MapPin,
} from 'lucide-react';
import { HotspotRecord, AlertStatus } from '../types';

interface AlertsViewProps {
  hotspots: HotspotRecord[];
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onNavigateToMap: () => void;
  onUpdateAlert: (sourceId: string, status: AlertStatus) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  hotspots,
  onSelectHotspot,
  onNavigateToMap,
  onUpdateAlert,
}) => {
  // Hotspots that are either High Priority OR have Alert Raised / Acknowledged
  const alertHotspots = hotspots.filter(
    (h) =>
      h.priority_category === 'HIGH' ||
      h.alert_status === 'Alert Raised' ||
      h.alert_status === 'Acknowledged'
  );

  return (
    <div
      id="alerts-dashboard"
      className="flex-1 min-h-0 p-6 bg-[#050811] text-slate-200 space-y-6 font-mono overflow-y-auto"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h1 className="text-2xl font-bold font-['Chakra_Petch'] text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-500 animate-pulse" />
            OPERATIONAL ALERT DISPATCH QUEUE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emergency notifications & escalated high-priority thermal anomaly alerts.
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>{alertHotspots.length} CRITICAL / ACTIVE INCIDENTS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {alertHotspots.map((item) => (
          <div
            key={item.source_id}
            className="p-4 rounded-xl bg-[#080C14] border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-['Chakra_Petch']">
                  {item.source_id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500">
                  PRIORITY {item.priority_score.toFixed(1)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.alert_status === 'Alert Raised'
                      ? 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse'
                      : item.alert_status === 'Acknowledged'
                      ? 'bg-amber-950 text-amber-300 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.alert_status || 'Normal'}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.location || 'Regional Sector'}</span>
                <span className="text-slate-600">•</span>
                <span>{item.nearest_city || 'City Center'} ({item.distance_to_city_km?.toFixed(1) || '0'} km)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Persistence: <span className="text-cyan-300 font-bold">{item.persistence.toFixed(1)}%</span> • Thermal Risk: <span className="text-amber-400 font-bold">{item.thermal_risk.toFixed(1)}</span> • Detections: <span className="text-slate-200 font-bold">{item.detections}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {item.alert_status !== 'Acknowledged' && (
                <button
                  onClick={() => onUpdateAlert(item.source_id, 'Acknowledged')}
                  className="px-3 py-1.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900 text-xs transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {item.alert_status !== 'Resolved' && (
                <button
                  onClick={() => onUpdateAlert(item.source_id, 'Resolved')}
                  className="px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 text-xs transition-colors"
                >
                  Resolve
                </button>
              )}
              <button
                onClick={() => {
                  onSelectHotspot(item);
                  onNavigateToMap();
                }}
                className="px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-xs transition-colors flex items-center gap-1"
              >
                <span>View on Map</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
