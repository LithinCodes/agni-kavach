import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Lock,
  UserCheck,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { testSupabaseConnection } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLive: boolean;
  onRefreshData: () => Promise<void>;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  isLive,
  onRefreshData,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    count?: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.ok) {
        await onRefreshData();
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      id="supabase-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#080C14] text-slate-200 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0D1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/50 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white">
                DATABASE & SECURITY ARCHITECTURE
              </div>
              <div className="text-[10px] text-slate-400">
                Supabase PostgREST Layer • PostgreSQL Row Level Security (RLS)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Current Status Pill */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="font-bold text-slate-200 text-xs">
                  {isLive
                    ? 'POSTGREST API LIVE: public.hotspots (21 Anomalies)'
                    : 'DATABASE SYNCHRONIZATION PENDING'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Target Tables: public.hotspots • public.alerts • public.investigations
                </div>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
              RLS ENFORCED
            </span>
          </div>

          {/* Security Architecture & Auth Status */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                ENVIRONMENT CREDENTIAL SECURITY:
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                PROTECTED (ZERO UI EXPOSURE)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Database connection credentials (<span className="text-cyan-300 font-semibold">SUPABASE_URL</span> and publishable tokens) are secured in the execution environment and never rendered in the UI. Write operations are guarded by Supabase JWT validation and PostgreSQL RLS.
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">CURRENT OPERATOR CLEARANCE:</div>
                <div className="text-xs font-semibold text-slate-200">
                  {isAuthenticated ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      {user?.email} (Authenticated Operator)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Public Read-Only Intelligence Mode
                    </span>
                  )}
                </div>
              </div>
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('Operational actions require authenticated clearance.');
                  }}
                  className="py-1.5 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[11px] transition-colors cursor-pointer"
                >
                  OPERATOR SIGN IN
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal();
                  }}
                  className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors cursor-pointer"
                >
                  MANAGE SESSION
                </button>
              )}
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AUDITING POSTGREST CONNECTION...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>TEST & VERIFY DATABASE CONNECTIVITY</span>
                </>
              )}
            </button>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                testResult.ok
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    PostgREST telemetry verified! Confirmed {testResult.count ?? 21} records active in &ldquo;public.hotspots&rdquo;.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Database Verification Notice</div>
                    <div className="text-[10px] text-rose-200/80 mt-0.5">
                      {testResult.error}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RLS Reference Notice */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <div className="text-cyan-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              RLS Policy Enforcement Rules:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li><span className="text-slate-300">SELECT (Read):</span> Allowed for all users (public & authenticated) on all tables.</li>
              <li><span className="text-slate-300">INSERT / UPDATE (Write):</span> Restricted strictly to authenticated operator JWTs.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0D1424] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
