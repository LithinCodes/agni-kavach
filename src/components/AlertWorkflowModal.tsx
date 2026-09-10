import React, { useState, useEffect } from 'react';
import { HotspotRecord } from '../types';
import { raiseAlertInSupabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Send,
  X,
  ShieldAlert,
  Building,
  Flame,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Info,
  ExternalLink,
  Lock,
  UserCheck,
} from 'lucide-react';

interface AlertWorkflowModalProps {
  hotspot: HotspotRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHotspot?: (updated: HotspotRecord) => void;
  onViewActiveAlert?: (hotspot: HotspotRecord) => void;
}

export const AlertWorkflowModal: React.FC<AlertWorkflowModalProps> = ({
  hotspot,
  isOpen,
  onClose,
  onUpdateHotspot,
  onViewActiveAlert,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [selectedAuthorities, setSelectedAuthorities] = useState<{ [key: string]: boolean }>({
    fire: true,
    spcb: true,
    ddma: true,
    forest: false,
  });
  const [alertSeverity, setAlertSeverity] = useState<
    'PRIORITY 1 - TACTICAL' | 'PRIORITY 2 - ADVISORY' | 'PRIORITY 3 - MONITOR'
  >('PRIORITY 1 - TACTICAL');
  const [customBrief, setCustomBrief] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isDuplicateActive, setIsDuplicateActive] = useState(false);
  const [persistedAlert, setPersistedAlert] = useState<{
    source: string;
    severity: string;
    status: string;
    timestamp: string;
  } | null>(null);

  // Reset local form states whenever opened with a new or existing hotspot
  useEffect(() => {
    if (isOpen && hotspot) {
      const raw = String(hotspot.alert_status || '').toUpperCase();
      const alreadyActive =
        raw === 'ALERT_RAISED' || raw === 'ALERT RAISED' || raw.includes('RAISE');
      setIsDuplicateActive(alreadyActive);
      setDispatchError(null);
      setIsDispatching(false);
      if (!alreadyActive) {
        setStage(1);
        setPersistedAlert(null);
      }
    }
  }, [isOpen, hotspot]);

  if (!isOpen || !hotspot) return null;

  const handleReset = () => {
    setStage(1);
    setDispatchError(null);
    setIsDispatching(false);
    setIsDuplicateActive(false);
    onClose();
  };

  const isAlreadyActiveInHotspot = Boolean(
    hotspot &&
      (hotspot.alert_status === 'ALERT_RAISED' ||
        hotspot.alert_status === 'Alert Raised' ||
        String(hotspot.alert_status || '').toUpperCase().includes('RAISE'))
  );
  const showAlreadyActive = isAlreadyActiveInHotspot || isDuplicateActive;

  const authorities = [
    { id: 'fire', name: 'State Fire & Emergency Response Services (FES)', icon: Flame, contact: 'Control Room 101' },
    { id: 'spcb', name: 'State Pollution Control Board (SPCB) Regional Cell', icon: Building, contact: 'Air Quality Desk' },
    { id: 'ddma', name: 'District Disaster Management Authority (DDMA)', icon: ShieldAlert, contact: 'Emergency Operations Center' },
    { id: 'forest', name: 'Divisional Forest Officer / Range Office', icon: Eye, contact: 'Ranger Wireless Net' },
  ];

  const generatedMessagePreview = `[AGNI KAVACH OPERATIONAL ALERT RECORD]
INCIDENT ID: ${hotspot.source_id}
COORDINATES: ${hotspot.latitude.toFixed(4)}°N, ${hotspot.longitude.toFixed(4)}°E
JURISDICTION: ${hotspot.nearest_city} (${hotspot.distance_to_city_km.toFixed(1)} km)
SEVERITY: ${alertSeverity}
PRIORITY SCORE: ${hotspot.priority_score.toFixed(2)} (${hotspot.priority_category})
SATELLITE TELEMETRY: NASA FIRMS VIIRS NOAA-21 NRT
PERSISTENCE: ${hotspot.persistence.toFixed(1)}% (${hotspot.active_days}/5 days detected)
ACTIVE DETECTIONS: ${hotspot.detections} cluster pixels
OPERATOR DIRECTIVE: ${customBrief || 'Immediate ground physical verification and downwind sensitive receptor safeguarding required.'}`;

  // Execute Supabase Persistence via reused service
  const handleConfirmDispatch = async () => {
    if (isDispatching || !hotspot) return;

    if (!isAuthenticated) {
      openAuthModal('Operational clearance required: Please sign in as an operator to dispatch and persist operational alerts in Supabase.');
      return;
    }

    // Check duplicate prior to write
    if (showAlreadyActive) {
      setIsDuplicateActive(true);
      return;
    }

    setIsDispatching(true);
    setDispatchError(null);

    try {
      const res = await raiseAlertInSupabase(hotspot, {
        severity: alertSeverity,
        message: generatedMessagePreview,
        title: `Operational Alert Record: ${hotspot.source_id} (${alertSeverity})`,
      });

      if (res.success) {
        const updated: HotspotRecord = {
          ...hotspot,
          alert_status: 'ALERT_RAISED',
        };
        // Update local hotspot state in application
        onUpdateHotspot?.(updated);

        setPersistedAlert({
          source: hotspot.source_id,
          severity: alertSeverity,
          status: 'ALERT_RAISED',
          timestamp: res.data?.created_at
            ? new Date(res.data.created_at).toLocaleString()
            : new Date().toLocaleString(),
        });
        setStage(3);
      } else if (res.alreadyActive) {
        const updated: HotspotRecord = {
          ...hotspot,
          alert_status: 'ALERT_RAISED',
        };
        onUpdateHotspot?.(updated);
        setIsDuplicateActive(true);
      } else {
        setDispatchError(
          res.error || 'ALERT PERSISTENCE FAILED: Supabase database rejected record write.'
        );
      }
    } catch (err: any) {
      setDispatchError(
        err?.message || 'ALERT PERSISTENCE FAILED: Network error connecting to Supabase instance.'
      );
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div
      id="alert-workflow-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={handleReset}
    >
      <div
        className="w-full max-w-xl bg-[#080C14] border border-rose-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 p-4 border-b border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-900/80 border border-rose-400/50 flex items-center justify-center text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] text-base font-bold text-white tracking-wider">
                  ALERT WORKFLOW — DISPATCH SIMULATION
                </span>
                {!showAlreadyActive && stage !== 3 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/50 text-[9px] font-bold">
                    STAGE {stage} OF 2
                  </span>
                )}
                {stage === 3 && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[9px] font-bold">
                    PERSISTED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Hotspot: <strong className="text-slate-200">{hotspot.source_id}</strong> • Priority Score {hotspot.priority_score.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isDispatching}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CASE B: ALERT ALREADY ACTIVE STATE (DUPLICATE PREVENTION) */}
        {showAlreadyActive ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-['Chakra_Petch'] text-lg font-bold text-amber-300 tracking-wider">
                ALERT ALREADY ACTIVE
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                An operational alert has already been raised and persisted to Supabase for{' '}
                <strong className="text-slate-200 font-bold">{hotspot.source_id}</strong>. Duplicate alert creation is prevented.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-amber-500/30 text-left max-w-md mx-auto space-y-1.5 font-mono text-[11px]">
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">
                ACTIVE ALERT RECORD DETAILS:
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">SOURCE:</span>
                <span className="text-slate-200 font-bold">{hotspot.source_id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">SEVERITY:</span>
                <span className="text-rose-400 font-bold">{hotspot.priority_category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">ALERT STATUS:</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  ALERT_RAISED
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">STORAGE:</span>
                <span className="text-cyan-300">public.alerts & public.hotspots</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (onViewActiveAlert) {
                    onViewActiveAlert(hotspot);
                  } else {
                    handleReset();
                  }
                }}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>VIEW ACTIVE ALERT</span>
              </button>

              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STAGE 1: ASSESSMENT SUMMARY & INTENT */}
            {stage === 1 && (
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-slate-300 leading-relaxed text-[11px]">
                  <strong className="text-rose-300 block">STAGE 1: DEFINE DISPATCH SIMULATION & SEVERITY</strong>
                  <p className="mt-1">
                    Configure the tactical advisory payload before proceeding to explicit confirmation. Authorizing this workflow creates a durable operational record in Supabase.
                  </p>
                </div>

                {/* Authority selection */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-2">
                    TARGET AGENCIES & RESPONDER AUTHORITIES (SIMULATED):
                  </label>
                  <div className="space-y-2">
                    {authorities.map((auth) => (
                      <label
                        key={auth.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          selectedAuthorities[auth.id]
                            ? 'bg-rose-950/30 border-rose-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <auth.icon className="w-4 h-4 text-rose-400" />
                          <div>
                            <div className="font-bold text-[11px]">{auth.name}</div>
                            <div className="text-[9px] text-slate-400">{auth.contact}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedAuthorities[auth.id]}
                          onChange={(e) =>
                            setSelectedAuthorities({
                              ...selectedAuthorities,
                              [auth.id]: e.target.checked,
                            })
                          }
                          className="accent-rose-500 w-4 h-4 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Severity Level */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                    ESCALATION SEVERITY LEVEL:
                  </label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="PRIORITY 1 - TACTICAL">PRIORITY 1 - TACTICAL (Immediate Ground Mobilization)</option>
                    <option value="PRIORITY 2 - ADVISORY">PRIORITY 2 - ADVISORY (Inter-Agency Watch & Standby)</option>
                    <option value="PRIORITY 3 - MONITOR">PRIORITY 3 - MONITOR (Satellite Continuity Observation)</option>
                  </select>
                </div>

                {/* Custom Brief Textarea */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                    OPERATIONAL DIRECTIVE / BRIEFING NOTES:
                  </label>
                  <textarea
                    rows={2}
                    value={customBrief}
                    onChange={(e) => setCustomBrief(e.target.value)}
                    placeholder="Add field dispatch instructions or staging notes..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  >
                    CANCEL
                  </button>

                  <button
                    onClick={() => setStage(2)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-1.5"
                  >
                    <span>PROCEED TO STAGE 2 CONFIRMATION</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: EXPLICIT CONFIRMATION DIALOG */}
            {stage === 2 && (
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 leading-relaxed text-xs flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300 block">STAGE 2: FINAL OPERATIONAL CONFIRMATION</strong>
                    Please inspect the generated payload before authorizing operational alert record persistence.
                  </div>
                </div>

                {/* Message Preview */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                    <span>TRANSMISSION MESSAGE PAYLOAD PREVIEW:</span>
                    <span className="text-cyan-400">OPERATIONAL ALERT RECORD</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {generatedMessagePreview}
                  </pre>
                </div>

                {/* Environment Notice */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">DISPATCH SIMULATION ENVIRONMENT: </strong>
                    In prototype demonstration mode, multi-agency communication is simulated. Authorizing this workflow will persist an official alert record to <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">public.alerts</code> and update <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">public.hotspots.alert_status</code> to <strong className="text-rose-400">ALERT_RAISED</strong>.
                  </div>
                </div>

                {/* Operator Clearance Status */}
                {isAuthenticated ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>
                        OPERATOR CLEARANCE: <strong className="text-white">{user?.email}</strong>
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 font-bold">
                      WRITE AUTHORIZED
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px]">
                        <strong>PUBLIC MODE:</strong> Sign in as an operator to authorize and persist live alerts.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openAuthModal('Sign in as an authorized operator to dispatch this alert.')
                      }
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors"
                    >
                      OPERATOR SIGN IN
                    </button>
                  </div>
                )}

                {/* Error Banner on Failure */}
                {dispatchError && (
                  <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-300 font-['Chakra_Petch'] text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ALERT PERSISTENCE FAILED
                    </div>
                    <div className="text-[11px] font-mono text-rose-200 break-words">{dispatchError}</div>
                    <div className="text-[10px] text-rose-400 mt-1">
                      The alert record was NOT written to the database. State has not been marked as dispatched.
                    </div>
                  </div>
                )}

                {/* Confirmation Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => setStage(1)}
                    disabled={isDispatching}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors disabled:opacity-50"
                  >
                    ← BACK TO STAGE 1
                  </button>

                  <button
                    onClick={handleConfirmDispatch}
                    disabled={isDispatching}
                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDispatching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>DISPATCHING ALERT...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>CONFIRM & DISPATCH ESCALATION</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: SUCCESS / DISPATCH PERSISTENCE STATE */}
            {stage === 3 && (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wider">
                    ALERT PERSISTED
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Operational alert record registered in Supabase <code className="text-slate-200">public.alerts</code> and status marked as <code className="text-rose-400 font-bold">ALERT_RAISED</code>.
                  </p>
                </div>

                {/* Prominent 4-Field Display */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-left max-w-md mx-auto space-y-2 font-mono text-xs">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-1">
                    PERSISTENCE CONFIRMATION RECEIPT:
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">SOURCE:</span>
                    <span className="text-white font-bold font-['Chakra_Petch'] text-sm">
                      {persistedAlert?.source || hotspot.source_id}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">SEVERITY:</span>
                    <span className="text-rose-400 font-bold">
                      {persistedAlert?.severity || alertSeverity}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">ALERT STATUS:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {persistedAlert?.status || 'ALERT_RAISED'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">TIMESTAMP:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {persistedAlert?.timestamp || new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Dispatch Simulation Log */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 max-w-md mx-auto text-left space-y-1">
                  <div className="text-cyan-300 font-bold uppercase">DISPATCH SIMULATION LOG:</div>
                  <div>• Simulated Agencies: Fire & Rescue, SPCB, DDMA</div>
                  <div>• Operational Alert Status: <strong className="text-emerald-400">PERSISTED TO SUPABASE</strong></div>
                  <div>• Telemetry: NASA FIRMS VIIRS NOAA-21 NRT</div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (onViewActiveAlert) {
                        onViewActiveAlert(hotspot);
                      } else {
                        handleReset();
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>VIEW ACTIVE ALERT</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  >
                    CLOSE DISPATCH WINDOW
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
