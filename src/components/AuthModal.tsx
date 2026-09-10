import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Mail,
  X,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    authModalReason,
    closeAuthModal,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessMessage(null);
    setConfirmationNotice(null);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetFormState();
  };

  const validateInputs = (): boolean => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError('Operator email address is required.');
      return false;
    }

    // RFC-compliant email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid operator email address (e.g. operator@domain.com).');
      return false;
    }

    if (!trimmedPassword) {
      setError('Passcode is required.');
      return false;
    }

    if (mode === 'signup') {
      if (trimmedPassword.length < 6) {
        setError('Passcode requirement: Passcode must be at least 6 characters in length.');
        return false;
      }

      if (!confirmPassword.trim()) {
        setError('Please confirm your passcode.');
        return false;
      }

      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passcode confirmation mismatch: Passcodes do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email.trim(), password.trim());
        if (res.success) {
          setSuccessMessage('Clearance granted: Operational access enabled.');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        } else {
          const rawErr = res.error || '';
          if (rawErr.toLowerCase().includes('invalid login credentials')) {
            setError('Invalid credentials: The email or passcode entered is incorrect. Please verify or create an account.');
          } else if (rawErr.toLowerCase().includes('network') || rawErr.toLowerCase().includes('fetch')) {
            setError('Network error: Unable to connect to Supabase authentication service.');
          } else {
            setError(rawErr || 'Authentication clearance was rejected. Please verify credentials.');
          }
        }
      } else {
        const res = await signUp(email.trim(), password.trim());
        if (res.success) {
          if (res.sessionActive) {
            setSuccessMessage('Clearance granted: Operator account registered and authenticated.');
            setTimeout(() => {
              closeAuthModal();
            }, 800);
          } else {
            setConfirmationNotice(
              res.message ||
                'Operator account registered. If email confirmation is enabled on your Supabase project, a verification email has been dispatched. Once confirmed, sign in to receive operational clearance.'
            );
          }
        } else {
          const rawErr = res.error || '';
          if (rawErr.toLowerCase().includes('already registered') || rawErr.toLowerCase().includes('already exists')) {
            setError('An operator account with this email already exists. Please switch to Sign In.');
          } else if (rawErr.toLowerCase().includes('password')) {
            setError('Passcode requirement: Passcode must be at least 6 characters.');
          } else {
            setError(rawErr || 'Account registration could not be completed.');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setSuccessMessage('Signed out. Application reverted to Public Read-Only Mode.');
      setTimeout(() => {
        closeAuthModal();
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 font-mono select-none"
      onClick={closeAuthModal}
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-[#080C14] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 p-4 border-b border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/90 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
              {isAuthenticated ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white tracking-wide">
                {isAuthenticated ? 'OPERATOR CLEARANCE ACTIVE' : 'TACTICAL OPERATOR ACCESS'}
              </div>
              <div className="text-[10px] text-slate-400">
                Agni Kavach Incident Command • SIH26162
              </div>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Close authentication window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason banner if triggered by a protected write attempt */}
        {authModalReason && (
          <div className="px-4 py-2.5 bg-amber-950/50 border-b border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block">Operational Action Restricted</span>
              <span className="text-slate-300">{authModalReason}</span>
            </div>
          </div>
        )}

        <div className="p-5 space-y-4">
          {isAuthenticated ? (
            /* Authenticated User Active State */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>AUTHENTICATED OPERATOR SESSION</span>
                </div>
                <div className="text-slate-200 text-xs font-mono break-all">
                  Identity: <span className="text-cyan-300 font-semibold">{user?.email}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Clearance ID: <span className="text-slate-300">{user?.id}</span>
                </div>
                <div className="text-[10px] text-emerald-400/90 pt-1 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  OPERATIONAL ACCESS: Alert Dispatches & Investigation Logging Permitted
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                <div className="text-cyan-400 font-bold uppercase text-[10px]">Row-Level Security Enforcement:</div>
                <p>
                  Database writes to <span className="text-cyan-300 font-mono">public.alerts</span> and <span className="text-cyan-300 font-mono">public.investigations</span> are authorized through your Supabase operator session token with PostgreSQL RLS validation.
                </p>
              </div>

              {successMessage && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  id="btn-modal-signout"
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>SIGN OUT TO READ-ONLY</span>
                </button>
                <button
                  id="btn-modal-dismiss"
                  type="button"
                  onClick={closeAuthModal}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated Login / Register Form */
            <>
              {/* Access Mode Explanation */}
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-400">
                  <div className="font-bold text-slate-300">READ-ONLY ACCESS</div>
                  <div>Public intelligence & map</div>
                </div>
                <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  <div className="font-bold text-cyan-200">OPERATIONAL ACCESS</div>
                  <div>Alert dispatch & investigations</div>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  id="tab-auth-signin"
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-cyan-600 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  id="tab-auth-signup"
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-cyan-600 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {/* Email Field */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    OPERATOR EMAIL IDENTIFIER:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="input-operator-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@agnikavach.gov.in"
                      className="w-full bg-[#0D1424] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">
                      OPERATOR PASSCODE:
                    </label>
                    {mode === 'signup' && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        MIN 6 CHARACTERS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="input-operator-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0D1424] border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Sign Up mode only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      CONFIRM PASSCODE:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        id="input-operator-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0D1424] border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                        title={showConfirmPassword ? 'Hide passcode' : 'Show passcode'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div
                    id="auth-error-banner"
                    className="p-2.5 rounded bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-tight">{error}</div>
                  </div>
                )}

                {/* Confirmation Dispatched Notice */}
                {confirmationNotice && (
                  <div
                    id="auth-confirmation-notice"
                    className="p-3 rounded bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2"
                  >
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold tracking-wide">REGISTRATION RECORDED</div>
                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        {confirmationNotice}
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div
                    id="auth-success-banner"
                    className="p-2.5 rounded bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-xs flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-tight">{successMessage}</div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      AUTHENTICATING WITH SUPABASE...
                    </span>
                  ) : mode === 'signin' ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>SIGN IN (OPERATIONAL ACCESS)</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>CREATE OPERATOR ACCOUNT</span>
                    </>
                  )}
                </button>

                {/* Mode Switcher Action Link */}
                <div className="text-center pt-2">
                  {mode === 'signin' ? (
                    <button
                      id="btn-switch-to-signup"
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Need operator credentials?</span>
                      <span className="text-cyan-400 font-bold underline underline-offset-2">
                        Switch to CREATE ACCOUNT
                      </span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ) : (
                    <button
                      id="btn-switch-to-signin"
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Already have an operator account?</span>
                      <span className="text-cyan-400 font-bold underline underline-offset-2">
                        Switch to SIGN IN
                      </span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  )}
                </div>
              </form>

              {/* Security & RLS Architectural Transparency */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>SECURITY ARCHITECTURE</span>
                  <span className="text-emerald-400/90 font-mono">SUPABASE RLS ACTIVE</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  PostgreSQL Row-Level Security ensures public inspection of FIRMS anomalies remains read-only. Tactical actions (Alert Dispatches & Field Investigations) require authenticated JWT validation.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
